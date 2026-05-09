'use client';
import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/admin-api';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  useEffect(() => { adminApi.getStats().then(r => { if (r.success) setStats((r.data as any)?.data); }); }, []);

  if (!stats) return <div className="text-muted-foreground">加载中...</div>;

  const cards = [
    { label: '用户总数', value: stats.user_count, color: 'bg-blue-50 text-blue-700' },
    { label: '单品总数', value: stats.garment_count, color: 'bg-green-50 text-green-700' },
    { label: '成功试穿', value: stats.tryon_success, color: 'bg-purple-50 text-purple-700' },
    { label: '失败试穿', value: stats.tryon_failed, color: 'bg-red-50 text-red-700' },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">系统概览</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(c => (
          <div key={c.label} className={'rounded-lg border p-6 ' + c.color}>
            <div className="text-3xl font-bold">{c.value}</div>
            <div className="mt-1 text-sm">{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
