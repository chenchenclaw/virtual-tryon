'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi } from '@/lib/admin-api';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    const res = await adminApi.login(username, password);
    if (res.success) { router.push('/admin'); } else { setError(res.error || '登录失败'); }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm rounded-lg border bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-center text-2xl font-bold">管理后台</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="mb-1 block text-sm font-medium">用户名</label><input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" required /></div>
          <div><label className="mb-1 block text-sm font-medium">密码</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" required /></div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="w-full rounded-md bg-gray-900 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50">{loading ? '登录中...' : '登录'}</button>
        </form>
      </div>
    </div>
  );
}
