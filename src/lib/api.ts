const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

interface ApiOptions {
  method?: string;
  body?: unknown;
  formData?: FormData;
}

async function apiRequest<T = unknown>(path: string, options: ApiOptions = {}): Promise<{ success: boolean; data?: T; error?: string }> {
  const { method = 'GET', body, formData } = options;
  const headers: Record<string, string> = {};
  const fetchOptions: RequestInit = { method, credentials: 'include' };

  if (formData) {
    fetchOptions.body = formData;
  } else if (body) {
    headers['Content-Type'] = 'application/json';
    fetchOptions.body = JSON.stringify(body);
  }
  fetchOptions.headers = headers;

  try {
    const res = await fetch(API_BASE + path, fetchOptions);
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.detail || data.error || '请求失败' };
    }
    return { success: true, data };
  } catch (err) {
    return { success: false, error: '网络错误' };
  }
}

// Auth API
export const authApi = {
  register: (email: string, password: string, nickname?: string) =>
    apiRequest('/auth/register', { method: 'POST', body: { email, password, nickname } }),
  login: (email: string, password: string) =>
    apiRequest('/auth/login', { method: 'POST', body: { email, password } }),
  logout: () => apiRequest('/auth/logout', { method: 'POST' }),
};

// Body Profile API
export const bodyApi = {
  get: () => apiRequest('/body/profile'),
  create: (data: Record<string, unknown>) => apiRequest('/body/profile', { method: 'POST', body: data }),
  uploadPhoto: (file: File, side: 'front' | 'side') => {
    const fd = new FormData();
    fd.append('file', file);
    return apiRequest('/body/upload-photo?side=' + side, { method: 'POST', formData: fd });
  },
};

// Garments API
export const garmentApi = {
  list: (category?: string) => apiRequest('/garments' + (category ? '?category=' + category : '')),
  get: (id: string) => apiRequest('/garments/' + id),
  create: (data: Record<string, unknown>) => apiRequest('/garments', { method: 'POST', body: data }),
  delete: (id: string) => apiRequest('/garments/' + id, { method: 'DELETE' }),
  saveSizeChart: (garmentId: string, sizes: Record<string, unknown>[]) =>
    apiRequest('/garments/size-chart', { method: 'POST', body: { garment_id: garmentId, sizes } }),
  getSizeChart: (garmentId: string) => apiRequest('/garments/size-chart/' + garmentId),
  recognize: (imageUrl: string) => apiRequest('/garments/recognize', { method: 'POST', body: { image_url: imageUrl } }),
};

// Tryon API
export const tryonApi = {
  create: (data: { garmentIds: string[]; scene?: string; pose?: string; quality?: string; sizeOverrides?: Record<string, string> }) =>
    apiRequest('/tryon', { method: 'POST', body: { garment_ids: data.garmentIds, scene: data.scene, pose: data.pose, quality: data.quality, size_overrides: data.sizeOverrides } }),
  getStatus: (taskId: string) => apiRequest('/tryon/' + taskId),
  getHistory: () => apiRequest('/tryon/history'),
};

// Upload API
export const uploadApi = {
  upload: (file: File, type: string = 'general') => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('type', type);
    return apiRequest('/upload?type=' + type, { method: 'POST', formData: fd });
  },
};

// User API
export const userApi = {
  getStats: () => apiRequest('/users/me/stats'),
};
