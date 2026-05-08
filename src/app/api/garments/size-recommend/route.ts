import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils';
import { recommendSize, generateSizeExplanation } from '@/services/size-recommend';

// GET: 根据用户身材数据推荐尺码
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError('未登录', 401);

  const { searchParams } = new URL(req.url);
  const garmentId = searchParams.get('garmentId');
  if (!garmentId) return apiError('请提供 garmentId');

  try {
    // 获取用户的活跃体型档案
    const bodyProfile = await prisma.bodyProfile.findFirst({
      where: { userId: user.id, isActive: true },
    });
    if (!bodyProfile) return apiError('请先创建体型档案');

    // 获取服装及其尺码表
    const garment = await prisma.garment.findFirst({
      where: { id: garmentId, userId: user.id },
      include: { sizeCharts: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!garment) return apiError('服装不存在');

    if (garment.sizeCharts.length === 0) {
      return apiSuccess({ recommended: null, alternatives: [], message: '该单品暂无尺码表数据' });
    }

    // 调用尺码推荐算法
    const scores = recommendSize(
      {
        heightCm: bodyProfile.heightCm ? Number(bodyProfile.heightCm) : null,
        weightKg: bodyProfile.weightKg ? Number(bodyProfile.weightKg) : null,
        shoulderWidth: bodyProfile.shoulderWidth ? Number(bodyProfile.shoulderWidth) : null,
        chestCirc: bodyProfile.chestCirc ? Number(bodyProfile.chestCirc) : null,
        waistCirc: bodyProfile.waistCirc ? Number(bodyProfile.waistCirc) : null,
        hipCirc: bodyProfile.hipCirc ? Number(bodyProfile.hipCirc) : null,
        armLength: bodyProfile.armLength ? Number(bodyProfile.armLength) : null,
        legLength: bodyProfile.legLength ? Number(bodyProfile.legLength) : null,
      },
      garment.sizeCharts.map((s) => ({
        sizeLabel: s.sizeLabel,
        chest: s.chest ? Number(s.chest) : null,
        shoulder: s.shoulder ? Number(s.shoulder) : null,
        waistCirc: s.waistCirc ? Number(s.waistCirc) : null,
        hipCirc: s.hipCirc ? Number(s.hipCirc) : null,
        inseam: s.inseam ? Number(s.inseam) : null,
        footLength: s.footLength ? Number(s.footLength) : null,
      })),
      garment.category
    );

    if (scores.length === 0) {
      return apiSuccess({ recommended: null, alternatives: [] });
    }

    const recommended = scores[0];
    const alternatives = scores.slice(1, 3);

    return apiSuccess({
      recommended: {
        sizeLabel: recommended.sizeLabel,
        score: recommended.score,
        fitAnalysis: recommended.fitAnalysis,
        explanation: generateSizeExplanation(recommended),
      },
      alternatives: alternatives.map((a) => ({
        sizeLabel: a.sizeLabel,
        score: a.score,
        fitAnalysis: a.fitAnalysis,
        explanation: generateSizeExplanation(a),
      })),
    });
  } catch (error) {
    console.error('Size recommend error:', error);
    return apiError('尺码推荐失败', 500);
  }
}
