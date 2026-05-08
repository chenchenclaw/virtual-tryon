import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return apiError('未登录', 401);

  try {
    const [garmentCount, tryonCount, outfitCount, recentTasks] = await Promise.all([
      prisma.garment.count({ where: { userId: user.id } }),
      prisma.tryonTask.count({ where: { userId: user.id, status: 'completed' } }),
      prisma.outfit.count({ where: { userId: user.id } }),
      prisma.tryonTask.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          status: true,
          resultUrls: true,
          scene: true,
          garmentIds: true,
          qualityScore: true,
          processingTimeMs: true,
          createdAt: true,
          completedAt: true,
          errorMessage: true,
        },
      }),
    ]);

    return apiSuccess({
      user: {
        id: user.id,
        nickname: user.nickname,
        email: user.email,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        gender: user.gender,
        createdAt: user.createdAt,
      },
      stats: {
        garmentCount,
        tryonCount,
        outfitCount,
      },
      recentTasks,
    });
  } catch (error) {
    console.error('User stats error:', error);
    return apiError('获取用户信息失败', 500);
  }
}
