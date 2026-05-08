'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface UserProfile {
  id: string;
  nickname: string | null;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  gender: string | null;
  createdAt: string;
}

interface UserStats {
  garmentCount: number;
  tryonCount: number;
  outfitCount: number;
}

interface TryonTask {
  id: string;
  status: string;
  resultUrls: string[];
  scene: string | null;
  qualityScore: number | null;
  processingTimeMs: number | null;
  createdAt: string;
  completedAt: string | null;
  errorMessage: string | null;
}

const sceneLabels: Record<string, string> = {
  studio: '摄影棚', street: '街拍', indoor: '室内', outdoor: '户外',
};

const statusLabels: Record<string, { text: string; color: string }> = {
  pending: { text: '排队中', color: 'text-yellow-600 bg-yellow-50' },
  processing: { text: '生成中', color: 'text-blue-600 bg-blue-50' },
  completed: { text: '已完成', color: 'text-green-600 bg-green-50' },
  failed: { text: '失败', color: 'text-red-600 bg-red-50' },
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats>({ garmentCount: 0, tryonCount: 0, outfitCount: 0 });
  const [recentTasks, setRecentTasks] = useState<TryonTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/user/stats');
      const data = await res.json();
      if (data.success) {
        setProfile(data.data.user);
        setStats(data.data.stats);
        setRecentTasks(data.data.recentTasks);
      }
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch { setLoggingOut(false); }
  };

  const fmtDate = (s: string) => {
    const d = new Date(s);
    return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
  };

  if (loading) return <div className="mx-auto max-w-2xl"><div className="flex h-40 items-center justify-center text-muted-foreground">加载中...</div></div>;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">个人中心</h1>
      <div className="space-y-6">
        <div className="rounded-lg border p-6">
          <h2 className="mb-4 text-lg font-semibold">基本信息</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">头像</span>
              {profile?.avatarUrl ? <img src={profile.avatarUrl} alt="" className="h-12 w-12 rounded-full object-cover" /> : <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">{profile?.nickname?.[0] || profile?.email?.[0] || '?'}</div>}
            </div>
            <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">昵称</span><span className="text-sm">{profile?.nickname || '-'}</span></div>
            <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">邮箱</span><span className="text-sm">{profile?.email || '-'}</span></div>
            <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">注册时间</span><span className="text-sm">{profile?.createdAt ? fmtDate(profile.createdAt) : '-'}</span></div>
          </div>
        </div>
        <div className="rounded-lg border p-6">
          <h2 className="mb-4 text-lg font-semibold">使用统计</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <a href="/tryon" className="group rounded-lg p-3 transition-colors hover:bg-accent"><div className="text-2xl font-bold group-hover:text-primary">{stats.tryonCount}</div><div className="text-xs text-muted-foreground">试穿次数</div></a>
            <a href="/wardrobe" className="group rounded-lg p-3 transition-colors hover:bg-accent"><div className="text-2xl font-bold group-hover:text-primary">{stats.garmentCount}</div><div className="text-xs text-muted-foreground">衣橱单品</div></a>
            <div className="rounded-lg p-3"><div className="text-2xl font-bold">{stats.outfitCount}</div><div className="text-xs text-muted-foreground">穿搭方案</div></div>
          </div>
        </div>
        <div className="rounded-lg border p-6">
          <h2 className="mb-4 text-lg font-semibold">试穿历史</h2>
          {recentTasks.length === 0 ? (
            <div className="rounded-md border-2 border-dashed p-6 text-center text-sm text-muted-foreground"><p>暂无试穿记录</p><a href="/tryon" className="mt-2 inline-block text-primary hover:underline">去试穿</a></div>
          ) : (
            <div className="space-y-3">
              {recentTasks.map(task => {
                const si = statusLabels[task.status] || { text: task.status, color: 'text-gray-600 bg-gray-50' };
                return (
                  <div key={task.id} className="flex items-center gap-4 rounded-lg border p-3">
                    {task.resultUrls?.[0] ? <img src={task.resultUrls[0]} alt="" className="h-16 w-16 rounded object-cover" /> : <div className="flex h-16 w-16 items-center justify-center rounded bg-muted text-2xl">👔</div>}
                    <div className="flex-1">
                      <div className="flex items-center gap-2"><span className={'rounded-full px-2 py-0.5 text-xs ' + si.color}>{si.text}</span><span className="text-xs text-muted-foreground">{task.scene ? sceneLabels[task.scene] || task.scene : '-'}</span></div>
                      <div className="mt-1 text-xs text-muted-foreground">{fmtDate(task.createdAt)}{task.processingTimeMs ? ' · 耗时 ' + Math.round(task.processingTimeMs / 1000) + 's' : ''}{task.qualityScore ? ' · 质量 ' + Number(task.qualityScore).toFixed(1) + '/10' : ''}</div>
                      {task.errorMessage && <div className="mt-1 text-xs text-destructive">{task.errorMessage}</div>}
                    </div>
                    {task.resultUrls?.[0] && <a href={task.resultUrls[0]} download={'tryon-' + task.id + '.png'} className="rounded-md border px-3 py-1.5 text-xs hover:bg-accent">下载</a>}
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
