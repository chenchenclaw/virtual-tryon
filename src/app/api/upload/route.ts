import { NextRequest } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import sharp from 'sharp';
import { getCurrentUser } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils';
import { v4 as uuid } from 'uuid';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError('未登录', 401);
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const type = (formData.get('type') as string) || 'general';
    if (!file) return apiError('请选择文件');
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) return apiError('仅支持 JPG/PNG/WebP 格式');
    if (file.size > 10 * 1024 * 1024) return apiError('文件大小不能超过 10MB');
    const uploadDir = join(process.cwd(), 'public', 'uploads', type);
    await mkdir(uploadDir, { recursive: true });
    const fileName = uuid() + '.webp';
    const filePath = join(uploadDir, fileName);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const processed = await sharp(buffer).resize(1024, 1024, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
    await writeFile(filePath, processed);
    const url = '/uploads/' + type + '/' + fileName;
    return apiSuccess({ url, fileName, size: processed.length });
  } catch (error) {
    console.error('Upload error:', error);
    return apiError('上传失败', 500);
  }
}
