import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils';
import { executeTryon, getTaskStatus } from '@/services/tryon.service';

// POST: 创建试穿任务
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError('未登录', 401);

  try {
    const { bodyProfileId, garmentIds, scene, pose, quality } = await req.json();

    if (!garmentIds || !Array.isArray(garmentIds) || garmentIds.length === 0) {
      return apiError('请选择至少一件服装');
    }

    // 获取体型档案
    const bodyProfile = bodyProfileId
      ? await prisma.bodyProfile.findFirst({ where: { id: bodyProfileId, userId: user.id } })
      : await prisma.bodyProfile.findFirst({ where: { userId: user.id, isActive: true } });

    if (!bodyProfile) {
      return apiError('请先创建体型档案');
    }

    // 调用试穿服务
    const result = await executeTryon({
      userId: user.id,
      bodyProfileId: bodyProfile.id,
      garmentIds,
      scene: scene || 'studio',
      pose: pose || 'front_standing',
      quality: quality || 'high',
    });

    return apiSuccess(result);
  } catch (error) {
    console.error('Tryon error:', error);
    return apiError(error instanceof Error ? error.message : '创建试穿任务失败', 500);
  }
}

// GET: 查询任务状态或获取试穿历史
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError('未登录', 401);

  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get('id');

  if (taskId) {
    // 查询单个任务状态
    const status = await getTaskStatus(taskId, user.id);
    if (!status) return apiError('任务不存在', 404);
    return apiSuccess(status);
  }

  // 获取试穿历史
  const tasks = await prisma.tryonTask.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return apiSuccess(tasks);
}
