import { openai } from '@/lib/openai';
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
    // 4. 组装 Prompt
    const systemPrompt = buildSystemPrompt();
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

    // 5. 调用 OpenAI API 生成图片
    // 注意：GPT Image API 实际调用方式需要根据最新 API 文档调整
    // 这里使用 images.generate 作为示例
    const response = await openai.images.generate({
      model: 'gpt-image-1',
      prompt: `${systemPrompt}\n\n${userPrompt}`,
      n: 1,
      size: request.quality === 'high' ? '1024x1536' : '1024x1024',
      quality: request.quality === 'high' ? 'high' : 'standard',
    });

    const resultUrl = response.data?.[0]?.url || '';
    const processingTime = Date.now() - startTime;

    // 6. 更新任务状态
    await prisma.tryonTask.update({
      where: { id: task.id },
      data: {
        status: 'completed',
        resultUrls: resultUrl ? [resultUrl] : [],
        promptUsed: userPrompt,
        apiModel: 'gpt-image-1',
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
    // 更新任务为失败状态
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
