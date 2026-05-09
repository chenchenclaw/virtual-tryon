'use client';
import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/admin-api';

interface User { id: string; email: string; nickname: string; gender: string; created_at: string; }

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchUsers = async (p = 1) => {
    setLoading(true);
    const res = await adminApi.getUsers(p, 20, search);
    if (res.success) {
      const d = (res.data as any)?.data;
      setUsers(d?.items || []);
      setTotal(d?.total || 0);
      setPage(p);
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除该用户？所有关联数据将被清除。')) return;
    await adminApi.deleteUser(id);
    fetchUsers(page);
  };

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">用户管理</h1>
      <div className="mb-4 flex gap-2">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索邮箱或昵称..." className="w-64 rounded-md border px-3 py-2 text-sm" onKeyDown={e => e.key === 'Enter' && fetchUsers(1)} />
        <button onClick={() => fetchUsers(1)} className="rounded-md border px-4 py-2 text-sm hover:bg-accent">搜索</button>
      </div>
      {loading ? <p className="text-muted-foreground">加载中...</p> : (
        <div className="rounded-lg border bg-white">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-gray-50 text-left"><th className="px-4 py-3 font-medium">邮箱</th><th className="px-4 py-3 font-medium">昵称</th><th className="px-4 py-3 font-medium">性别</th><th className="px-4 py-3 font-medium">注册时间</th><th className="px-4 py-3 font-medium">操作</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">{u.nickname || '-'}</td>
                  <td className="px-4 py-3">{u.gender === 'male' ? '男' : u.gender === 'female' ? '女' : '-'}</td>
                  <td className="px-4 py-3">{u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-3"><button onClick={() => handleDelete(u.id)} className="text-xs text-red-600 hover:underline">删除</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-muted-foreground">
            <span>共 {total} 条</span>
            <div className="flex gap-2">
              <button onClick={() => page > 1 && fetchUsers(page - 1)} disabled={page <= 1} className="rounded border px-3 py-1 disabled:opacity-50">上一页</button>
              <span className="px-3 py-1">第 {page} 页</span>
              <button onClick={() => fetchUsers(page + 1)} disabled={users.length < 20} className="rounded border px-3 py-1 disabled:opacity-50">下一页</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
