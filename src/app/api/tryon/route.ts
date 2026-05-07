import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils';

// POST: 创建试穿任务
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError('未登录', 401);

  try {
    const { bodyProfileId, garments, scene, pose, quality } = await req.json();

    if (!garments || !Array.isArray(garments) || garments.length === 0) {
      return apiError('请选择至少一件服装');
    }

    // 获取体型档案
    const bodyProfile = bodyProfileId
      ? await prisma.bodyProfile.findFirst({ where: { id: bodyProfileId, userId: user.id } })
      : await prisma.bodyProfile.findFirst({ where: { userId: user.id, isActive: true } });

    if (!bodyProfile) {
      return apiError('请先创建体型档案');
    }

    // 获取服装信息
    const garmentIds = garments.map((g: { garment_id?: string; garmentId?: string }) => g.garment_id || g.garmentId);
    const dbGarments = await prisma.garment.findMany({
      where: { id: { in: garmentIds }, userId: user.id },
      include: { sizeCharts: true },
    });

    if (dbGarments.length === 0) {
      return apiError('未找到指定服装');
    }

    // 创建试穿任务
    const task = await prisma.tryonTask.create({
      data: {
        userId: user.id,
        bodyProfileId: bodyProfile.id,
        garmentIds,
        scene: scene || 'studio',
        poseType: pose || 'front_standing',
        status: 'pending',
      },
    });

    // TODO: 将任务推入 BullMQ 队列，由 worker 调用 OpenAI API 生成试穿图
    // 暂时直接返回任务信息，后续实现 worker 时补充

    return apiSuccess({
      task_id: task.id,
      status: task.status,
      estimated_time_seconds: 20,
    });
  } catch (error) {
    console.error('Tryon error:', error);
    return apiError('创建试穿任务失败', 500);
  }
}

// GET: 获取试穿历史
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError('未登录', 401);

  const tasks = await prisma.tryonTask.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return apiSuccess(tasks);
}
