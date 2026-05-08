import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils';
import { recognizeGarment } from '@/services/garment-recognize';

// POST: AI 自动识别服装属性
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError('未登录', 401);

  try {
    const { imageUrl } = await req.json();

    if (!imageUrl) return apiError('请提供服装图片 URL');

    const attributes = await recognizeGarment(imageUrl);

    return apiSuccess(attributes);
  } catch (error) {
    console.error('Garment recognize error:', error);
    return apiError(
      error instanceof Error ? error.message : 'AI 识别失败，请手动填写',
      500
    );
  }
}
