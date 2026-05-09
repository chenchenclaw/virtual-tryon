const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

async function adminRequest<T = unknown>(path: string, options: { method?: string; body?: unknown } = {}): Promise<{ success: boolean; data?: T; error?: string }> {
  const { method = 'GET', body } = options;
  const headers: Record<string, string> = {};
  const fetchOptions: RequestInit = { method, credentials: 'include' };
  if (body) { headers['Content-Type'] = 'application/json'; fetchOptions.body = JSON.stringify(body); }
  fetchOptions.headers = headers;
  try {
    const res = await fetch(API_BASE + '/admin' + path, fetchOptions);
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.detail || '请求失败' };
    return { success: true, data };
  } catch { return { success: false, error: '网络错误' }; }
}

export const adminApi = {
  login: (username: string, password: string) => adminRequest('/login?username=' + encodeURIComponent(username) + '&password=' + encodeURIComponent(password), { method: 'POST' }),
  getStats: () => adminRequest('/stats'),
  getUsers: (page = 1, size = 20, search = '') => adminRequest('/users?page=' + page + '&size=' + size + (search ? '&search=' + search : '')),
  getUserDetail: (id: string) => adminRequest('/users/' + id),
  deleteUser: (id: string) => adminRequest('/users/' + id, { method: 'DELETE' }),
  getTryonTasks: (page = 1, size = 20, status = '') => adminRequest('/tryon-tasks?page=' + page + '&size=' + size + (status ? '&status=' + status : '')),
};
