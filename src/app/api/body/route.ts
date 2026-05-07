import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils';

// GET: 获取当前用户的体型档案
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return apiError('未登录', 401);

  const profiles = await prisma.bodyProfile.findMany({
    where: { userId: user.id, isActive: true },
    orderBy: { createdAt: 'desc' },
  });

  return apiSuccess(profiles);
}

// POST: 创建/更新体型档案
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError('未登录', 401);

  try {
    const body = await req.json();
    const {
      heightCm, weightKg, shoulderWidth, chestCirc,
      waistCirc, hipCirc, armLength, legLength,
      bodyType, frontPhotoUrl, sidePhotoUrl, bodyDescription,
    } = body;

    // 将旧档案设为非活跃
    await prisma.bodyProfile.updateMany({
      where: { userId: user.id, isActive: true },
      data: { isActive: false },
    });

    const profile = await prisma.bodyProfile.create({
      data: {
        userId: user.id,
        heightCm, weightKg, shoulderWidth, chestCirc,
        waistCirc, hipCirc, armLength, legLength,
        bodyType, frontPhotoUrl, sidePhotoUrl, bodyDescription,
        isActive: true,
      },
    });

    return apiSuccess(profile);
  } catch (error) {
    console.error('Body profile error:', error);
    return apiError('保存体型档案失败', 500);
  }
}
