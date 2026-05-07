import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, signToken, setAuthCookie } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const { email, phone, password, nickname } = await req.json();

    if (!password || (!email && !phone)) {
      return apiError('请提供邮箱或手机号以及密码');
    }

    // 检查是否已注册
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          ...(email ? [{ email }] : []),
          ...(phone ? [{ phone }] : []),
        ],
      },
    });

    if (existing) {
      return apiError('该邮箱或手机号已注册');
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        phone,
        passwordHash,
        nickname: nickname || `用户${Math.random().toString(36).slice(2, 8)}`,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        nickname: true,
        createdAt: true,
      },
    });

    const token = signToken({ userId: user.id, email: user.email ?? undefined, phone: user.phone ?? undefined });
    const headers = setAuthCookie(token);

    return new Response(
      JSON.stringify({ success: true, data: { user, token } }),
      { status: 201, headers: { 'Content-Type': 'application/json', ...headers } }
    );
  } catch (error) {
    console.error('Register error:', error);
    return apiError('注册失败，请稍后重试', 500);
  }
}
