'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await authApi.login(email, password);
      if (!result.success) { setError(result.error || '登录失败'); return; }
      router.push('/body');
    } catch { setError('网络错误，请稍后重试'); } finally { setLoading(false); }
  };

  return (
    <div className="rounded-lg border bg-background p-8 shadow-sm">
      <h1 className="mb-6 text-2xl font-bold">登录</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">邮箱</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="your@email.com" required />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">密码</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="请输入密码" required />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button type="submit" disabled={loading} className="w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">{loading ? '登录中...' : '登录'}</button>
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground">还没有账号？ <Link href="/register" className="text-primary hover:underline">免费注册</Link></p>
    </div>
  );
}
