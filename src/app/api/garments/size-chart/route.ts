import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils';

// POST: 录入/批量录入尺码表
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError('未登录', 401);

  try {
    const { garmentId, sizes } = await req.json();

    if (!garmentId || !sizes || !Array.isArray(sizes)) {
      return apiError('请提供单品ID和尺码数据');
    }

    // 验证单品归属
    const garment = await prisma.garment.findFirst({
      where: { id: garmentId, userId: user.id },
    });
    if (!garment) return apiError('单品不存在', 404);

    // 删除旧尺码表，重新录入
    await prisma.sizeChart.deleteMany({ where: { garmentId } });

    const created = await prisma.sizeChart.createMany({
      data: sizes.map((s: Record<string, unknown>, i: number) => ({
        garmentId,
        sizeSystem: s.sizeSystem as string,
        sizeLabel: s.sizeLabel as string,
        chest: s.chest as number,
        shoulder: s.shoulder as number,
        sleeveLength: s.sleeveLength as number,
        totalLength: s.totalLength as number,
        waistCirc: s.waistCirc as number,
        hipCirc: s.hipCirc as number,
        inseam: s.inseam as number,
        thighCirc: s.thighCirc as number,
        frontRise: s.frontRise as number,
        footLength: s.footLength as number,
        footWidth: s.footWidth as number,
        customMeasurements: s.customMeasurements,
        sortOrder: i,
      })),
    });

    return apiSuccess({ count: created.count });
  } catch (error) {
    console.error('Size chart error:', error);
    return apiError('录入尺码表失败', 500);
  }
}
