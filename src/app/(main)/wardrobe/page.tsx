'use client';

import { useState } from 'react';

const CATEGORIES = [
  { value: 'top', label: '上衣' },
  { value: 'bottom', label: '裤装' },
  { value: 'dress', label: '裙装' },
  { value: 'shoes', label: '鞋履' },
  { value: 'accessory', label: '配饰' },
  { value: 'bag', label: '包袋' },
];

const FIT_TYPES = ['修身', '标准', '宽松', '廓形', 'Oversize'];

export default function WardrobePage() {
  const [category, setCategory] = useState('top');
  const [name, setName] = useState('');
  const [fitType, setFitType] = useState('标准');
  const [color, setColor] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const res = await fetch('/api/garments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          category,
          fitType,
          colorPrimary: color,
        }),
      });

      const result = await res.json();
      if (result.success) {
        setMessage('单品添加成功！');
        setName('');
        setColor('');
      } else {
        setMessage(result.error || '添加失败');
      }
    } catch {
      setMessage('网络错误');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-2 text-2xl font-bold">我的衣橱</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        上传你的服装单品，AI 会自动识别属性
      </p>

      {/* 添加单品表单 */}
      <div className="rounded-lg border p-6">
        <h2 className="mb-4 text-lg font-semibold">添加新单品</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">服装照片</label>
            <div className="rounded-md border-2 border-dashed p-6 text-center text-sm text-muted-foreground">
              <p>点击上传服装照片</p>
              <p className="mt-1 text-xs">建议平铺拍摄，纯色背景</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">分类</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">名称</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder="如：白色圆领T恤"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">版型</label>
              <select
                value={fitType}
                onChange={(e) => setFitType(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
              >
                {FIT_TYPES.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">主色</label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder="如：白色"
              />
            </div>
          </div>

          {message && (
            <p className={`text-sm ${message.includes('成功') ? 'text-green-600' : 'text-destructive'}`}>
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? '添加中...' : '添加到衣橱'}
          </button>
        </form>
      </div>

      {/* 单品列表占位 */}
      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold">我的单品</h2>
        <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
          暂无单品，添加你的第一件服装吧
        </div>
      </div>
    </div>
  );
}
