import { openaiImage } from '@/lib/openai';
import { prisma } from '@/lib/prisma';
import { buildSystemPrompt, buildUserPrompt } from './prompt-builder';

interface TryonRequest {
  userId: string;
  bodyProfileId: string;
  garmentIds: string[];
  scene: string;
  pose: string;
  quality?: 'standard' | 'high';
}

interface TryonResult {
  taskId: string;
  status: string;
  resultUrls: string[];
  qualityScore?: number;
}

/**
 * 执行虚拟试穿生成
 * 利用 hfsyapi 的 reference_images 特性，直接传入用户照片和服装图作为参考
 */
export async function executeTryon(request: TryonRequest): Promise<TryonResult> {
  const startTime = Date.now();

  // 1. 获取体型档案
  const bodyProfile = await prisma.bodyProfile.findUnique({
    where: { id: request.bodyProfileId },
  });
  if (!bodyProfile) throw new Error('体型档案不存在');

  // 2. 获取服装信息（含尺码表）
  const garments = await prisma.garment.findMany({
    where: { id: { in: request.garmentIds } },
    include: { sizeCharts: { orderBy: { sortOrder: 'asc' } } },
  });
  if (garments.length === 0) throw new Error('未找到指定服装');

  // 3. 创建任务记录
  const task = await prisma.tryonTask.create({
    data: {
      userId: request.userId,
      bodyProfileId: request.bodyProfileId,
      garmentIds: request.garmentIds,
      scene: request.scene,
      poseType: request.pose,
      status: 'processing',
    },
  });

  try {
    // 4. 组装 Prompt（纯文字描述，不含图片）
    const userPrompt = buildUserPrompt({
      bodyProfile: {
        heightCm: bodyProfile.heightCm ? Number(bodyProfile.heightCm) : null,
        weightKg: bodyProfile.weightKg ? Number(bodyProfile.weightKg) : null,
        shoulderWidth: bodyProfile.shoulderWidth ? Number(bodyProfile.shoulderWidth) : null,
        chestCirc: bodyProfile.chestCirc ? Number(bodyProfile.chestCirc) : null,
        waistCirc: bodyProfile.waistCirc ? Number(bodyProfile.waistCirc) : null,
        hipCirc: bodyProfile.hipCirc ? Number(bodyProfile.hipCirc) : null,
        bodyType: bodyProfile.bodyType,
        bodyDescription: bodyProfile.bodyDescription,
      },
      garments: garments.map((g) => ({
        category: g.category,
        name: g.name,
        colorPrimary: g.colorPrimary,
        material: g.material,
        fitType: g.fitType,
        pattern: g.pattern,
        aiDescription: g.aiDescription,
        sizeLabel: g.sizeCharts[0]?.sizeLabel,
      })),
      scene: request.scene,
      pose: request.pose,
      quality: request.quality,
    });

    // 5. 收集参考图片（用户全身照 + 各服装图片）
    const referenceImages: string[] = [];

    // 用户正面照
    if (bodyProfile.frontPhotoUrl) {
      referenceImages.push(bodyProfile.frontPhotoUrl);
    }

    // 服装图片（最多凑到 4 张，含用户照共 4 张上限）
    for (const g of garments) {
      if (referenceImages.length >= 4) break;
      const imgUrl = g.processedImage || g.originalImage;
      if (imgUrl) referenceImages.push(imgUrl);
    }

    // 6. 调用 hfsyapi 生图 API
    // 使用自定义 fetch 调用，因为 hfsyapi 的参数格式（reference_images）
    // 与标准 OpenAI SDK 不完全兼容
    const model = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2pro';
    const size = request.quality === 'high' ? '2048x2048' : '1024x1024';

    const apiResponse = await fetch(
      `${process.env.OPENAI_IMAGE_BASE_URL}/images/generations`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_IMAGE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          n: 1,
          size,
          prompt: userPrompt,
          reference_images: referenceImages.length > 0 ? referenceImages : undefined,
          response_format: 'b64_json', // hfsyapi: 传 b64_json 返回 url
        }),
      }
    );

    if (!apiResponse.ok) {
      const errText = await apiResponse.text();
      throw new Error(`生图 API 错误 (${apiResponse.status}): ${errText}`);
    }

    const apiData = await apiResponse.json();
    const resultUrl = apiData.data?.[0]?.url || '';
    const processingTime = Date.now() - startTime;

    // 7. 更新任务状态
    await prisma.tryonTask.update({
      where: { id: task.id },
      data: {
        status: 'completed',
        resultUrls: resultUrl ? [resultUrl] : [],
        promptUsed: userPrompt,
        apiModel: model,
        apiCallsCount: 1,
        processingTimeMs: processingTime,
        completedAt: new Date(),
      },
    });

    return {
      taskId: task.id,
      status: 'completed',
      resultUrls: resultUrl ? [resultUrl] : [],
    };
  } catch (error) {
    await prisma.tryonTask.update({
      where: { id: task.id },
      data: {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : '未知错误',
        processingTimeMs: Date.now() - startTime,
      },
    });

    throw error;
  }
}

/**
 * 查询任务状态
 */
export async function getTaskStatus(taskId: string, userId: string) {
  const task = await prisma.tryonTask.findFirst({
    where: { id: taskId, userId },
  });

  if (!task) return null;

  return {
    taskId: task.id,
    status: task.status,
    resultUrls: task.resultUrls,
    qualityScore: task.qualityScore ? Number(task.qualityScore) : null,
    processingTimeMs: task.processingTimeMs,
    errorMessage: task.errorMessage,
    createdAt: task.createdAt,
    completedAt: task.completedAt,
  };
}
