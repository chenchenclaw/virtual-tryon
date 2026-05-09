'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, tryonApi } from '@/lib/api';

interface TryonTask { task_id: string; status: string; result_urls: string[]; scene: string | null; quality_score: number | null; processing_time_ms: number | null; created_at: string; error_message: string | null; }

const sceneLabels: Record<string, string> = { studio: '摄影棚', street: '街拍', indoor: '室内', outdoor: '户外' };
const statusLabels: Record<string, { text: string; color: string }> = { pending: { text: '排队中', color: 'text-yellow-600 bg-yellow-50' }, processing: { text: '生成中', color: 'text-blue-600 bg-blue-50' }, completed: { text: '已完成', color: 'text-green-600 bg-green-50' }, failed: { text: '失败', color: 'text-red-600 bg-red-50' } };

export default function ProfilePage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<TryonTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => { tryonApi.getHistory().then(r => { if (r.success) setTasks((r.data as any)?.data || []); }).finally(() => setLoading(false)); }, []);

  const handleLogout = async () => { setLoggingOut(true); await authApi.logout(); router.push('/login'); };

  const fmtDate = (s: string) => { const d = new Date(s); return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0'); };

  if (loading) return <div className="mx-auto max-w-2xl"><div className="flex h-40 items-center justify-center text-muted-foreground">加载中...</div></div>;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">个人中心</h1>
      <div className="space-y-6">
        <div className="rounded-lg border p-6">
          <h2 className="mb-4 text-lg font-semibold">试穿历史</h2>
          {tasks.length === 0 ? (
            <div className="rounded-md border-2 border-dashed p-6 text-center text-sm text-muted-foreground"><p>暂无试穿记录</p><a href="/tryon" className="mt-2 inline-block text-primary hover:underline">去试穿</a></div>
          ) : (
            <div className="space-y-3">
              {tasks.map(task => {
                const si = statusLabels[task.status] || { text: task.status, color: 'text-gray-600 bg-gray-50' };
                return (
                  <div key={task.task_id} className="flex items-center gap-4 rounded-lg border p-3">
                    {task.result_urls?.[0] ? <img src={task.result_urls[0]} alt="" className="h-16 w-16 rounded object-cover" /> : <div className="flex h-16 w-16 items-center justify-center rounded bg-muted text-2xl">👔</div>}
                    <div className="flex-1">
                      <div className="flex items-center gap-2"><span className={'rounded-full px-2 py-0.5 text-xs ' + si.color}>{si.text}</span><span className="text-xs text-muted-foreground">{task.scene ? sceneLabels[task.scene] || task.scene : '-'}</span></div>
                      <div className="mt-1 text-xs text-muted-foreground">{fmtDate(task.created_at)}{task.processing_time_ms ? ' · 耗时 ' + Math.round(task.processing_time_ms / 1000) + 's' : ''}{task.quality_score ? ' · 质量 ' + task.quality_score.toFixed(1) + '/10' : ''}</div>
                      {task.error_message && <div className="mt-1 text-xs text-destructive">{task.error_message}</div>}
                    </div>
                    {task.result_urls?.[0] && <a href={task.result_urls[0]} download={'tryon-' + task.task_id + '.png'} className="rounded-md border px-3 py-1.5 text-xs hover:bg-accent">下载</a>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="rounded-lg border p-6">
          <h2 className="mb-4 text-lg font-semibold">账号操作</h2>
          <button onClick={handleLogout} disabled={loggingOut} className="w-full rounded-md border py-2 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-50">{loggingOut ? '退出中...' : '退出登录'}</button>
        </div>
      </div>
    </div>
  );
}
