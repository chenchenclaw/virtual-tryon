import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils';

// GET: 获取单品列表
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError('未登录', 401);

  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');

  const where: Record<string, unknown> = { userId: user.id };
  if (category) where.category = category;

  const garments = await prisma.garment.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { sizeCharts: { orderBy: { sortOrder: 'asc' } } },
  });

  return apiSuccess(garments);
}

// POST: 上传新单品
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError('未登录', 401);

  try {
    const body = await req.json();
    const {
      name, category, subCategory, originalImage, processedImage,
      colorPrimary, colorSecondary, material, pattern, fitType,
      styleTags, seasonTags, brand, aiDescription, metadata,
    } = body;

    if (!category) return apiError('请选择单品分类');

    const garment = await prisma.garment.create({
      data: {
        userId: user.id,
        name, category, subCategory, originalImage, processedImage,
        colorPrimary, colorSecondary, material, pattern, fitType,
        styleTags: styleTags || [],
        seasonTags: seasonTags || [],
        brand, aiDescription, metadata,
      },
    });

    return apiSuccess(garment);
  } catch (error) {
    console.error('Create garment error:', error);
    return apiError('创建单品失败', 500);
  }
}
