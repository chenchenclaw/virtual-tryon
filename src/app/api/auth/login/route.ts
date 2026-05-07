import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, signToken, setAuthCookie } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const { email, phone, password } = await req.json();

    if (!password || (!email && !phone)) {
      return apiError('请提供邮箱或手机号以及密码');
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          ...(email ? [{ email }] : []),
          ...(phone ? [{ phone }] : []),
        ],
      },
    });

    if (!user || !user.passwordHash) {
      return apiError('账号或密码错误');
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return apiError('账号或密码错误');
    }

    const token = signToken({ userId: user.id, email: user.email ?? undefined, phone: user.phone ?? undefined });
    const headers = setAuthCookie(token);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            phone: user.phone,
            nickname: user.nickname,
            avatarUrl: user.avatarUrl,
          },
          token,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...headers } }
    );
  } catch (error) {
    console.error('Login error:', error);
    return apiError('登录失败，请稍后重试', 500);
  }
}
