import { prisma } from '@/lib/prisma';
import { buildUserPrompt } from './prompt-builder';
import { qualityCheck, refinePromptWithIssues } from './quality-check';

interface TryonRequest { userId: string; bodyProfileId: string; garmentIds: string[]; scene: string; pose: string; quality?: 'standard' | 'high'; sizeOverrides?: Record<string, string>; }
interface TryonResult { taskId: string; status: string; resultUrls: string[]; qualityScore?: number; }

const MAX_RETRIES = 2;

async function callImageApi(prompt: string, referenceImages: string[], quality: string): Promise<string> {
  const model = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2pro';
  const size = quality === 'high' ? '2048x2048' : '1024x1024';
  const res = await fetch(process.env.OPENAI_IMAGE_BASE_URL + '/images/generations', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + process.env.OPENAI_IMAGE_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, n: 1, size, prompt, reference_images: referenceImages.length > 0 ? referenceImages : undefined, response_format: 'b64_json' }),
  });
  if (!res.ok) throw new Error('生图 API 错误 (' + res.status + '): ' + await res.text());
  const data = await res.json();
  return data.data?.[0]?.url || '';
}

export async function executeTryon(request: TryonRequest): Promise<TryonResult> {
  const startTime = Date.now();
  const bodyProfile = await prisma.bodyProfile.findUnique({ where: { id: request.bodyProfileId } });
  if (!bodyProfile) throw new Error('体型档案不存在');
  const garments = await prisma.garment.findMany({ where: { id: { in: request.garmentIds } }, include: { sizeCharts: { orderBy: { sortOrder: 'asc' } } } });
  if (garments.length === 0) throw new Error('未找到指定服装');
  const task = await prisma.tryonTask.create({ data: { userId: request.userId, bodyProfileId: request.bodyProfileId, garmentIds: request.garmentIds, scene: request.scene, poseType: request.pose, status: 'processing' } });
  try {
    const refImages: string[] = [];
    if (bodyProfile.frontPhotoUrl) refImages.push(bodyProfile.frontPhotoUrl);
    for (const g of garments) { if (refImages.length >= 4) break; const img = g.processedImage || g.originalImage; if (img) refImages.push(img); }

    let currentPrompt = buildUserPrompt({
      bodyProfile: { heightCm: bodyProfile.heightCm ? Number(bodyProfile.heightCm) : null, weightKg: bodyProfile.weightKg ? Number(bodyProfile.weightKg) : null, shoulderWidth: bodyProfile.shoulderWidth ? Number(bodyProfile.shoulderWidth) : null, chestCirc: bodyProfile.chestCirc ? Number(bodyProfile.chestCirc) : null, waistCirc: bodyProfile.waistCirc ? Number(bodyProfile.waistCirc) : null, hipCirc: bodyProfile.hipCirc ? Number(bodyProfile.hipCirc) : null, bodyType: bodyProfile.bodyType, bodyDescription: bodyProfile.bodyDescription },
      garments: garments.map(g => {
        const ov = request.sizeOverrides?.[g.id];
        let sl = g.sizeCharts[0]?.sizeLabel;
        let sm: Record<string, number> | undefined;
        if (ov && g.sizeCharts.length > 0) {
          const t = g.sizeCharts.find(s => s.sizeLabel === ov);
          if (t) { sl = t.sizeLabel; sm = {}; if (t.chest) sm.chest = Number(t.chest); if (t.shoulder) sm.shoulder = Number(t.shoulder); if (t.waistCirc) sm.waistCirc = Number(t.waistCirc); if (t.hipCirc) sm.hipCirc = Number(t.hipCirc); if (t.sleeveLength) sm.sleeveLength = Number(t.sleeveLength); if (t.totalLength) sm.totalLength = Number(t.totalLength); if (t.inseam) sm.inseam = Number(t.inseam); }
        }
        return { category: g.category, name: g.name, colorPrimary: g.colorPrimary, material: g.material, fitType: g.fitType, pattern: g.pattern, aiDescription: g.aiDescription, sizeLabel: sl, sizeMeasurements: sm };
      }),
      scene: request.scene, pose: request.pose, quality: request.quality,
    });

    let resultUrl = ''; let qualityScore = 7; let retryCount = 0;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      resultUrl = await callImageApi(currentPrompt, refImages, request.quality || 'standard');
      if (!resultUrl) throw new Error('生图 API 未返回结果');
      if (bodyProfile.frontPhotoUrl) {
        const check = await qualityCheck(bodyProfile.frontPhotoUrl, resultUrl);
        qualityScore = check.score;
        if (check.pass || attempt === MAX_RETRIES) { retryCount = attempt; break; }
        currentPrompt = refinePromptWithIssues(currentPrompt, check.issues);
        retryCount = attempt + 1;
      } else { break; }
    }

    const pt = Date.now() - startTime;
    await prisma.tryonTask.update({ where: { id: task.id }, data: { status: 'completed', resultUrls: resultUrl ? [resultUrl] : [], promptUsed: currentPrompt, apiModel: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2pro', apiCallsCount: retryCount + 1, processingTimeMs: pt, qualityScore, retryCount, completedAt: new Date() } });
    return { taskId: task.id, status: 'completed', resultUrls: resultUrl ? [resultUrl] : [], qualityScore };
  } catch (error) {
    await prisma.tryonTask.update({ where: { id: task.id }, data: { status: 'failed', errorMessage: error instanceof Error ? error.message : '未知错误', processingTimeMs: Date.now() - startTime } });
    throw error;
  }
}

export async function getTaskStatus(taskId: string, userId: string) {
  const task = await prisma.tryonTask.findFirst({ where: { id: taskId, userId } });
  if (!task) return null;
  return { taskId: task.id, status: task.status, resultUrls: task.resultUrls, qualityScore: task.qualityScore ? Number(task.qualityScore) : null, retryCount: task.retryCount, processingTimeMs: task.processingTimeMs, errorMessage: task.errorMessage, createdAt: task.createdAt, completedAt: task.completedAt };
}
