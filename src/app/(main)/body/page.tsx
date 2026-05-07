'use client';

import { useState } from 'react';

const FIELDS = [
  { key: 'heightCm', label: '身高', unit: 'cm', placeholder: '170' },
  { key: 'weightKg', label: '体重', unit: 'kg', placeholder: '60' },
  { key: 'shoulderWidth', label: '肩宽', unit: 'cm', placeholder: '40' },
  { key: 'chestCirc', label: '胸围', unit: 'cm', placeholder: '88' },
  { key: 'waistCirc', label: '腰围', unit: 'cm', placeholder: '70' },
  { key: 'hipCirc', label: '臀围', unit: 'cm', placeholder: '92' },
  { key: 'armLength', label: '臂长', unit: 'cm', placeholder: '58' },
  { key: 'legLength', label: '腿长', unit: 'cm', placeholder: '80' },
];

export default function BodyPage() {
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const data: Record<string, unknown> = {};
      FIELDS.forEach((f) => {
        if (form[f.key]) data[f.key] = parseFloat(form[f.key]);
      });

      const res = await fetch('/api/body', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (result.success) {
        setMessage('体型档案保存成功！');
      } else {
        setMessage(result.error || '保存失败');
      }
    } catch {
      setMessage('网络错误，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-2 text-2xl font-bold">体型档案</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        录入你的身材数据，AI 将根据这些数据生成更合身的试穿效果
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {FIELDS.map((field) => (
            <div key={field.key}>
              <label className="mb-1 block text-sm font-medium">
                {field.label}
                <span className="ml-1 text-xs text-muted-foreground">({field.unit})</span>
              </label>
              <input
                type="number"
                step="0.1"
                value={form[field.key] || ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={field.placeholder}
              />
            </div>
          ))}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">全身正面照</label>
          <div className="rounded-md border-2 border-dashed p-8 text-center text-sm text-muted-foreground">
            <p>点击或拖拽上传正面全身照</p>
            <p className="mt-1 text-xs">建议纯色背景、自然光线、双手自然下垂</p>
            <input type="file" accept="image/*" className="hidden" />
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
          {saving ? '保存中...' : '保存体型档案'}
        </button>
      </form>
    </div>
  );
}
