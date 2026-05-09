'use client';

import { useState, useRef, useEffect } from 'react';

const CATEGORIES = [
  { value: 'top', label: '上衣' }, { value: 'bottom', label: '裤装' }, { value: 'dress', label: '裙装' },
  { value: 'shoes', label: '鞋履' }, { value: 'accessory', label: '配饰' }, { value: 'bag', label: '包袋' },
];
const FIT_TYPES = ['修身', '标准', '宽松', '廓形', 'Oversize'];

interface SizeEntry { sizeLabel: string; chest?: number; shoulder?: number; sleeveLength?: number; totalLength?: number; waistCirc?: number; hipCirc?: number; inseam?: number; thighCirc?: number; footLength?: number; footWidth?: number; sortOrder?: number; }
interface Garment { id: string; name: string | null; category: string; fitType: string | null; colorPrimary: string | null; material: string | null; pattern: string | null; originalImage: string | null; sizeCharts?: SizeEntry[]; }

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

  // 尺码表相关状态
  const [editingSizeGid, setEditingSizeGid] = useState('');
  const [sizeEntries, setSizeEntries] = useState<SizeEntry[]>([]);
  const [templates, setTemplates] = useState<{ key: string; label: string; sizes: SizeEntry[] }[]>([]);
  const [savingSize, setSavingSize] = useState(false);

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

  // 打开尺码表编辑
  const openSizeChart = async (gid: string, cat: string) => {
    setEditingSizeGid(gid);
    // 加载已有尺码表
    try {
      const res = await fetch('/api/garments/size-chart?garmentId=' + gid);
      const data = await res.json();
      if (data.success && data.data.length > 0) { setSizeEntries(data.data); } else { setSizeEntries([]); }
    } catch { setSizeEntries([]); }
    // 加载模板
    try {
      const res = await fetch('/api/size-templates/' + cat);
      const data = await res.json();
      if (data.success) setTemplates(data.data.templates);
    } catch { setTemplates([]); }
  };

  const applyTemplate = (sizes: SizeEntry[]) => { setSizeEntries(sizes); };

  const updateEntry = (idx: number, field: string, val: string) => {
    const updated = [...sizeEntries];
    const numVal = val === '' ? undefined : Number(val);
    (updated[idx] as any)[field] = numVal ?? val;
    if (field === 'sizeLabel') (updated[idx] as any)[field] = val;
    if (!updated[idx].sortOrder && updated[idx].sortOrder !== 0) updated[idx].sortOrder = idx;
    setSizeEntries(updated);
  };

  const addEntry = () => { setSizeEntries([...sizeEntries, { sizeLabel: '', sortOrder: sizeEntries.length }]); };
  const removeEntry = (idx: number) => { setSizeEntries(sizeEntries.filter((_, i) => i !== idx)); };

  const saveSizeChart = async () => {
    if (!editingSizeGid) return;
    setSavingSize(true);
    try {
      const valid = sizeEntries.filter(s => s.sizeLabel);
      const res = await fetch('/api/garments/size-chart', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ garmentId: editingSizeGid, sizes: valid }) });
      const data = await res.json();
      if (data.success) { setEditingSizeGid(''); fetchGarments(); }
    } catch { /* */ } finally { setSavingSize(false); }
  };

  const cat = garments.find(g => g.id === editingSizeGid)?.category || 'top';
  const sizeFields = cat === 'shoes' ? ['sizeLabel','footLength','footWidth'] : cat === 'bottom' ? ['sizeLabel','waistCirc','hipCirc','inseam','thighCirc'] : ['sizeLabel','chest','shoulder','sleeveLength','totalLength'];
  const fieldLabels: Record<string,string> = { sizeLabel: '尺码', chest: '胸围', shoulder: '肩宽', sleeveLength: '袖长', totalLength: '衣长', waistCirc: '腰围', hipCirc: '臀围', inseam: '内长', thighCirc: '大腿围', footLength: '脚长', footWidth: '脚宽' };

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
                <div key={g.id} className="rounded-lg border p-3">
                  <div className="flex items-center gap-4">
                    {g.originalImage ? <img src={g.originalImage} alt={g.name || ''} className="h-16 w-16 rounded object-cover" /> : <div className="flex h-16 w-16 items-center justify-center rounded bg-muted text-2xl">👔</div>}
                    <div className="flex-1">
                      <div className="font-medium">{g.name || '未命名'}</div>
                      <div className="text-xs text-muted-foreground">{catLabel(g.category)} · {g.fitType || '-'} · {g.colorPrimary || '-'}</div>
                      {(g.material || g.pattern) && <div className="text-xs text-muted-foreground">{[g.material, g.pattern].filter(Boolean).join(' · ')}</div>}
                    </div>
                    <button onClick={() => openSizeChart(g.id, g.category)} className="rounded-md border px-3 py-1.5 text-xs hover:bg-accent">{g.sizeCharts?.length ? '编辑尺码' : '添加尺码'}</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 尺码表编辑弹窗 */}
      {editingSizeGid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setEditingSizeGid('')}>
          <div className="mx-4 max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-background p-6" onClick={e => e.stopPropagation()}>
            <h3 className="mb-4 text-lg font-semibold">尺码表管理</h3>

            {/* 模板快速填充 */}
            {templates.length > 0 && (
              <div className="mb-4 rounded-md border p-3">
                <div className="mb-2 text-sm font-medium">快速填充模板</div>
                <div className="flex flex-wrap gap-2">
                  {templates.map(t => <button key={t.key} onClick={() => applyTemplate(t.sizes)} className="rounded-md border px-3 py-1.5 text-xs hover:bg-accent">{t.label}</button>)}
                </div>
              </div>
            )}

            {/* 尺码表 */}
            <div className="mb-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b">
                  {sizeFields.map(f => <th key={f} className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">{fieldLabels[f]}</th>)}
                  <th className="px-2 py-2"></th>
                </tr></thead>
                <tbody>
                  {sizeEntries.map((entry, idx) => (
                    <tr key={idx} className="border-b">
                      {sizeFields.map(f => (
                        <td key={f} className="px-1 py-1">
                          <input type={f === 'sizeLabel' ? 'text' : 'number'} value={String((entry as any)[f] ?? '')} onChange={e => updateEntry(idx, f, e.target.value)} className="w-full rounded border px-2 py-1 text-xs" placeholder={fieldLabels[f]} />
                        </td>
                      ))}
                      <td className="px-1 py-1"><button onClick={() => removeEntry(idx)} className="text-xs text-destructive hover:underline">删除</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-2">
              <button onClick={addEntry} className="rounded-md border px-4 py-2 text-sm hover:bg-accent">+ 添加尺码</button>
              <div className="flex-1" />
              <button onClick={() => setEditingSizeGid('')} className="rounded-md border px-4 py-2 text-sm hover:bg-accent">取消</button>
              <button onClick={saveSizeChart} disabled={savingSize} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50">{savingSize ? '保存中...' : '保存'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
