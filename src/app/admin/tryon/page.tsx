'use client';
import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/admin-api';

interface Task { id: string; user_id: string; status: string; scene: string; quality_score: number | null; processing_time_ms: number | null; error_message: string | null; created_at: string; }

export default function AdminTryonPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchTasks = async (p = 1) => {
    const res = await adminApi.getTryonTasks(p, 20, statusFilter);
    if (res.success) { const d = (res.data as any)?.data; setTasks(d?.items || []); setTotal(d?.total || 0); setPage(p); }
  };

  useEffect(() => { fetchTasks(); }, [statusFilter]);

  const statusColor: Record<string, string> = { completed: 'text-green-600 bg-green-50', failed: 'text-red-600 bg-red-50', processing: 'text-blue-600 bg-blue-50', pending: 'text-yellow-600 bg-yellow-50' };

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">试穿监控</h1>
      <div className="mb-4 flex gap-2">
        {['', 'completed', 'failed', 'processing'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} className={'rounded-md border px-3 py-1.5 text-sm ' + (statusFilter === s ? 'bg-gray-900 text-white' : 'hover:bg-accent')}>{s === '' ? '全部' : s === 'completed' ? '成功' : s === 'failed' ? '失败' : '处理中'}</button>
        ))}
      </div>
      <div className="rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead><tr className="border-b bg-gray-50 text-left"><th className="px-4 py-3 font-medium">任务ID</th><th className="px-4 py-3 font-medium">用户ID</th><th className="px-4 py-3 font-medium">场景</th><th className="px-4 py-3 font-medium">状态</th><th className="px-4 py-3 font-medium">质量分</th><th className="px-4 py-3 font-medium">耗时</th><th className="px-4 py-3 font-medium">时间</th></tr></thead>
          <tbody>
            {tasks.map(t => (
              <tr key={t.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs">{t.id.slice(0, 8)}...</td>
                <td className="px-4 py-3 font-mono text-xs">{t.user_id.slice(0, 8)}...</td>
                <td className="px-4 py-3">{t.scene || '-'}</td>
                <td className="px-4 py-3"><span className={'rounded-full px-2 py-0.5 text-xs ' + (statusColor[t.status] || '')}>{t.status}</span></td>
                <td className="px-4 py-3">{t.quality_score ? t.quality_score.toFixed(1) : '-'}</td>
                <td className="px-4 py-3">{t.processing_time_ms ? Math.round(t.processing_time_ms / 1000) + 's' : '-'}</td>
                <td className="px-4 py-3">{t.created_at ? new Date(t.created_at).toLocaleString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
          <span>共 {total} 条</span>
          <div className="flex gap-2">
            <button onClick={() => page > 1 && fetchTasks(page - 1)} disabled={page <= 1} className="rounded border px-3 py-1 disabled:opacity-50">上一页</button>
            <span className="px-3 py-1">第 {page} 页</span>
            <button onClick={() => fetchTasks(page + 1)} disabled={tasks.length < 20} className="rounded border px-3 py-1 disabled:opacity-50">下一页</button>
          </div>
        </div>
      </div>
    </div>
  );
}
