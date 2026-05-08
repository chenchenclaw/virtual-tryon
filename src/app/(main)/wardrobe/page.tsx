'use client';

import { useState, useRef, useEffect } from 'react';

const CATEGORIES = [
  { value: 'top', label: '上衣' }, { value: 'bottom', label: '裤装' }, { value: 'dress', label: '裙装' },
  { value: 'shoes', label: '鞋履' }, { value: 'accessory', label: '配饰' }, { value: 'bag', label: '包袋' },
];
const FIT_TYPES = ['修身', '标准', '宽松', '廓形', 'Oversize'];

interface Garment {
  id: string; name: string | null; category: string; fitType: string | null;
  colorPrimary: string | null; material: string | null; pattern: string | null; originalImage: string | null;
}

export default function WardrobePage() {
  const [category, setCategory] = useState('top');
  const [name, setName] = useState('');
  const [fitType, setFitType] = useState('标准');
  const [color, setColor] = useState('');
  const [material, setMaterial] = useState('');
  const [pattern, setPattern] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [garments, setGarments] = useState<Garment[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [recognizing, setRecognizing] = useState(false);
  const [message, setMessage] = useState('');
  const [aiDetails, setAiDetails] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchGarments(); }, []);

  const fetchGarments = async () => {
    try { const res = await fetch('/api/garments'); const data = await res.json(); if (data.success) setGarments(data.data); } catch { /* */ }
  };

  const handleUpload = async (file: File) => {
    setUploading(true); setMessage('');
    try {
      const fd = new FormData(); fd.append('file', file); fd.append('type', 'garment');
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) { setImageUrl(data.data.url); await recognizeImage(data.data.url); }
      else { setMessage(data.error || '上传失败'); }
    } catch { setMessage('上传失败'); } finally { setUploading(false); }
  };

  const recognizeImage = async (url: string) => {
    setRecognizing(true); setMessage('AI 正在识别服装属性...');
    try {
      const res = await fetch('/api/garments/recognize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageUrl: url }) });
      const data = await res.json();
      if (data.success) {
        const a = data.data;
        if (a.category) setCategory(a.category);
        if (a.name) setName(a.name);
        if (a.fitType) setFitType(a.fitType);
        if (a.colorPrimary) setColor(a.colorPrimary);
        if (a.material) setMaterial(a.material);
        if (a.pattern) setPattern(a.pattern);
        if (a.details) setAiDetails(a.details);
        setMessage('AI 识别完成，已自动填入属性信息，请确认后提交');
      } else { setMessage('AI 识别失败，请手动填写属性'); }
    } catch { setMessage('AI 识别失败，请手动填写属性'); } finally { setRecognizing(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setMessage('');
    try {
      const res = await fetch('/api/garments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, category, fitType, colorPrimary: color, material, pattern, originalImage: imageUrl }) });
      const result = await res.json();
      if (result.success) { setMessage('单品添加成功！'); setName(''); setColor(''); setMaterial(''); setPattern(''); setImageUrl(''); setAiDetails(''); fetchGarments(); }
      else { setMessage(result.error || '添加失败'); }
    } catch { setMessage('网络错误'); } finally { setSaving(false); }
  };

  const catLabel = (c: string) => CATEGORIES.find(x => x.value === c)?.label || c;

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-2 text-2xl font-bold">我的衣橱</h1>
      <p className="mb-6 text-sm text-muted-foreground">上传服装照片，AI 自动识别品类、颜色、材质等属性</p>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border p-6">
          <h2 className="mb-4 text-lg font-semibold">添加新单品</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">服装照片</label>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0])} />
              <div onClick={() => !uploading && !recognizing && fileInputRef.current?.click()} className={'cursor-pointer rounded-md border-2 border-dashed p-6 text-center text-sm hover:border-primary ' + (uploading || recognizing ? 'opacity-60 cursor-wait' : 'text-muted-foreground')}>
                {imageUrl ? <img src={imageUrl} alt="服装" className="mx-auto max-h-32 rounded object-contain" /> : <p>{uploading ? '上传中...' : '点击上传服装照片'}</p>}
              </div>
              {recognizing && <p className="mt-1 text-xs text-blue-600">AI 正在识别中...</p>}
            </div>
            {aiDetails && <div className="rounded-md bg-blue-50 p-3 text-xs text-blue-700"><span className="font-medium">AI 识别细节：</span>{aiDetails}</div>}
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="mb-1 block text-sm font-medium">分类</label><select value={category} onChange={e => setCategory(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm">{CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select></div>
              <div><label className="mb-1 block text-sm font-medium">名称</label><input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" placeholder="如：白色圆领T恤" /></div>
              <div><label className="mb-1 block text-sm font-medium">版型</label><select value={fitType} onChange={e => setFitType(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm">{FIT_TYPES.map(f => <option key={f} value={f}>{f}</option>)}</select></div>
              <div><label className="mb-1 block text-sm font-medium">主色</label><input type="text" value={color} onChange={e => setColor(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" placeholder="如：白色" /></div>
              <div><label className="mb-1 block text-sm font-medium">材质</label><input type="text" value={material} onChange={e => setMaterial(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" placeholder="如：纯棉" /></div>
              <div><label className="mb-1 block text-sm font-medium">图案</label><input type="text" value={pattern} onChange={e => setPattern(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" placeholder="如：纯色、条纹" /></div>
            </div>
            {message && <p className={'text-sm ' + (message.includes('成功') || message.includes('完成') ? 'text-green-600' : message.includes('失败') ? 'text-destructive' : 'text-blue-600')}>{message}</p>}
            <button type="submit" disabled={saving || !imageUrl} className="w-full rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">{saving ? '添加中...' : '添加到衣橱'}</button>
          </form>
        </div>
        <div>
          <h2 className="mb-4 text-lg font-semibold">我的单品 ({garments.length})</h2>
          {garments.length === 0 ? <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">暂无单品，添加你的第一件服装吧</div> : (
            <div className="space-y-3">
              {garments.map(g => (
                <div key={g.id} className="flex items-center gap-4 rounded-lg border p-3">
                  {g.originalImage ? <img src={g.originalImage} alt={g.name || ''} className="h-16 w-16 rounded object-cover" /> : <div className="flex h-16 w-16 items-center justify-center rounded bg-muted text-2xl">👔</div>}
                  <div className="flex-1">
                    <div className="font-medium">{g.name || '未命名'}</div>
                    <div className="text-xs text-muted-foreground">{catLabel(g.category)} · {g.fitType || '-'} · {g.colorPrimary || '-'}</div>
                    {(g.material || g.pattern) && <div className="text-xs text-muted-foreground">{[g.material, g.pattern].filter(Boolean).join(' · ')}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
