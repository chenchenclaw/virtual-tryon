import { NextRequest } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { getCurrentUser } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils';
import { v4 as uuid } from 'uuid';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return apiError('未登录', 401);

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'body' | 'garment'

    if (!file) return apiError('请选择文件');

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return apiError('仅支持 JPG/PNG/WebP 格式');
    }

    // 验证文件大小（10MB）
    if (file.size > 10 * 1024 * 1024) {
      return apiError('文件大小不能超过 10MB');
    }

    // 创建上传目录
    const uploadDir = join(process.cwd(), 'public', 'uploads', type || 'general');
    await mkdir(uploadDir, { recursive: true });

    // 生成唯一文件名
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${uuid()}.${ext}`;
    const filePath = join(uploadDir, fileName);

    // 写入文件
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    // 返回可访问的 URL
    const url = `/uploads/${type || 'general'}/${fileName}`;

    return apiSuccess({ url, fileName, size: file.size });
  } catch (error) {
    console.error('Upload error:', error);
    return apiError('上传失败', 500);
  }
}
