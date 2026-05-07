import { getCurrentUser } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return apiError('未登录', 401);
  }
  return apiSuccess(user);
}
