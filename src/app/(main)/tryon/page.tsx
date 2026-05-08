'use client';

import { useState, useEffect } from 'react';

const SCENES = [
  { value: 'studio', label: '摄影棚', desc: '纯白背景，均匀柔光' },
  { value: 'street', label: '街拍', desc: '城市街头，自然日光' },
  { value: 'indoor', label: '室内', desc: '简约客厅，柔和灯光' },
  { value: 'outdoor', label: '户外', desc: '花园绿地，阳光明媚' },
];
const POSES = [
  { value: 'front_standing', label: '正面站立' },
  { value: 'side_45', label: '45度侧身' },
  { value: 'walking', label: '行走中' },
  { value: 'sitting', label: '坐姿' },
];

interface Garment { id: string; name: string | null; category: string; fitType: string | null; colorPrimary: string | null; originalImage: string | null; }
interface SizeRec { recommended: { sizeLabel: string; score: number; fitAnalysis: Record<string, { status: string; marginCm: number }>; explanation: string } | null; alternatives: { sizeLabel: string; score: number; fitAnalysis: Record<string, { status: string; marginCm: number }>; explanation: string }[]; }

const catLabel: Record<string, string> = { top: '上衣', bottom: '裤装', dress: '裙装', shoes: '鞋履', accessory: '配饰', bag: '包袋' };

export default function TryonPage() {
  const [garments, setGarments] = useState<Garment[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [scene, setScene] = useState('studio');
  const [pose, setPose] = useState('front_standing');
  const [generating, setGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState('');
  const [error, setError] = useState('');
  const [sizeRecs, setSizeRecs] = useState<Record<string, SizeRec>>({});
  const [compareMode, setCompareMode] = useState(false);
  const [compareGid, setCompareGid] = useState('');
  const [compareSize, setCompareSize] = useState('');
  const [compareUrl, setCompareUrl] = useState('');
  const [compareGen, setCompareGen] = useState(false);

  useEffect(() => { fetch('/api/garments').then(r => r.json()).then(d => { if (d.success) setGarments(d.data); }).catch(() => {}); }, []);

  const toggleGarment = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    if (!selectedIds.includes(id)) fetchSizeRec(id);
  };

  const fetchSizeRec = async (gid: string) => {
    try { const res = await fetch('/api/garments/size-recommend?garmentId=' + gid); const data = await res.json(); if (data.success && data.data.recommended) setSizeRecs(prev => ({ ...prev, [gid]: data.data })); } catch { /* */ }
  };

  const selected = garments.filter(g => selectedIds.includes(g.id));
  const withSizes = selected.filter(g => sizeRecs[g.id]?.recommended);

  const pollTask = async (id: string, type: 'main' | 'compare') => {
    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 2000));
      try {
        const res = await fetch('/api/tryon?id=' + id); const data = await res.json();
        if (data.success) {
          if (data.data.status === 'completed' && data.data.resultUrls?.length > 0) {
            if (type === 'main') { setResultUrl(data.data.resultUrls[0]); setGenerating(false); } else { setCompareUrl(data.data.resultUrls[0]); setCompareGen(false); }
            return;
          }
          if (data.data.status === 'failed') { if (type === 'main') { setError(data.data.errorMessage || '生成失败'); setGenerating(false); } else { setCompareGen(false); } return; }
        }
      } catch { /* */ }
    }
    if (type === 'main') { setError('生成超时'); setGenerating(false); } else { setCompareGen(false); }
  };

  const handleGenerate = async () => {
    if (selected.length === 0) { setError('请至少选择一件服装'); return; }
    setGenerating(true); setError(''); setResultUrl(''); setCompareUrl('');
    try {
      const res = await fetch('/api/tryon', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ garmentIds: selectedIds, scene, pose }) });
      const data = await res.json();
      if (!data.success) { setError(data.error); setGenerating(false); return; }
      pollTask(data.data.taskId || data.data.task_id, 'main');
      if (compareMode && compareGid && compareSize) {
        setCompareGen(true);
        const res2 = await fetch('/api/tryon', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ garmentIds: selectedIds, scene, pose, sizeOverrides: { [compareGid]: compareSize } }) });
        const data2 = await res2.json();
        if (data2.success) pollTask(data2.data.taskId || data2.data.task_id, 'compare'); else setCompareGen(false);
      }
    } catch { setError('生成失败'); setGenerating(false); }
  };

  const getCompareSizes = () => {
    if (!compareGid || !sizeRecs[compareGid]) return [];
    return [sizeRecs[compareGid].recommended, ...sizeRecs[compareGid].alternatives].filter(Boolean) as NonNullable<SizeRec['recommended']>[];
  };

  const fitColor = (s: string) => s === '贴合' || s === '合身' || s === '合适' ? 'text-green-600' : s === '适中' ? 'text-blue-600' : 'text-orange-600';
  const zoneName = (z: string) => ({ chest: '胸部', shoulder: '肩部', waist: '腰部', hip: '臀部' } as Record<string, string>)[z] || z;

  const renderFitComparison = () => {
    if (!compareGid || !sizeRecs[compareGid]) return null;
    const rec = sizeRecs[compareGid]; const rs = rec.recommended; const as = [rs, ...rec.alternatives].filter(Boolean).find(s => s && s.sizeLabel === compareSize);
    if (!rs || !as) return null;
    const re = (fa: Record<string, { status: string; marginCm: number }>) => Object.entries(fa).map(([z, info]) => <div key={z} className={fitColor(info.status)}>{zoneName(z)}: {info.status}</div>);
    return (<div className="mt-3 grid grid-cols-2 gap-3 text-xs"><div className="rounded-md bg-green-50 p-2"><div className="mb-1 font-medium text-green-700">推荐: {rs.sizeLabel}</div>{re(rs.fitAnalysis)}</div><div className="rounded-md bg-orange-50 p-2"><div className="mb-1 font-medium text-orange-700">对比: {as.sizeLabel}</div>{re(as.fitAnalysis)}</div></div>);
  };

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-2 text-2xl font-bold">虚拟试穿</h1>
      <p className="mb-6 text-sm text-muted-foreground">选择服装和场景，AI 生成你的试穿效果图</p>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-lg border p-4">
            <h3 className="mb-3 font-semibold">选择服装</h3>
            {garments.length === 0 ? (
              <div className="rounded-md border-2 border-dashed p-6 text-center text-sm text-muted-foreground"><p>衣橱为空</p><a href="/wardrobe" className="mt-2 inline-block text-primary hover:underline">去添加服装</a></div>
            ) : (
              <div className="max-h-60 space-y-2 overflow-y-auto">
                {garments.map(g => (
                  <label key={g.id} className={'flex cursor-pointer items-center gap-3 rounded-md border p-2 transition-colors ' + (selectedIds.includes(g.id) ? 'border-primary bg-primary/5' : 'hover:bg-accent')}>
                    <input type="checkbox" checked={selectedIds.includes(g.id)} onChange={() => toggleGarment(g.id)} className="accent-primary" />
                    {g.originalImage ? <img src={g.originalImage} alt="" className="h-10 w-10 rounded object-cover" /> : <div className="flex h-10 w-10 items-center justify-center rounded bg-muted text-lg">👔</div>}
                    <div className="flex-1 text-sm"><div className="font-medium">{g.name || '未命名'}</div><div className="text-xs text-muted-foreground">{catLabel[g.category]} · {g.colorPrimary || '-'}</div></div>
                  </label>
                ))}
              </div>
            )}
          </div>
          {withSizes.length > 0 && (
            <div className="rounded-lg border p-4">
              <h3 className="mb-3 font-semibold">尺码信息</h3>
              {withSizes.map(g => { const rec = sizeRecs[g.id]; if (!rec?.recommended) return null; return (
                <div key={g.id} className="mb-3 rounded-md bg-muted/50 p-3 text-sm">
                  <div className="mb-1 font-medium">{g.name}</div>
                  <div className="text-xs">推荐尺码: <span className="font-semibold text-primary">{rec.recommended.sizeLabel}</span> <span className="text-muted-foreground">(匹配度 {Math.round(rec.recommended.score * 100)}%)</span></div>
                  <div className="mt-1 text-xs text-muted-foreground">{rec.recommended.explanation}</div>
                  {rec.alternatives.length > 0 && <div className="mt-1 text-xs text-muted-foreground">备选: {rec.alternatives.map(a => a.sizeLabel + '(' + Math.round(a.score * 100) + '%)').join('、')}</div>}
                </div>); })}
              <div className="mt-3 border-t pt-3">
                <label className="flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" checked={compareMode} onChange={e => { setCompareMode(e.target.checked); if (e.target.checked && withSizes.length > 0) { setCompareGid(withSizes[0].id); const r = sizeRecs[withSizes[0].id]; if (r?.alternatives[0]) setCompareSize(r.alternatives[0].sizeLabel); } }} className="accent-primary" />开启尺码对比</label>
                {compareMode && (
                  <div className="mt-3 space-y-2 rounded-md border bg-background p-3">
                    <div><label className="mb-1 block text-xs font-medium">对比单品</label><select value={compareGid} onChange={e => { setCompareGid(e.target.value); const r = sizeRecs[e.target.value]; if (r?.alternatives[0]) setCompareSize(r.alternatives[0].sizeLabel); }} className="w-full rounded-md border px-2 py-1.5 text-sm">{withSizes.map(g => <option key={g.id} value={g.id}>{g.name || '未命名'}</option>)}</select></div>
                    <div><label className="mb-1 block text-xs font-medium">对比尺码</label><div className="flex gap-2">{getCompareSizes().map(s => <button key={s.sizeLabel} onClick={() => setCompareSize(s.sizeLabel)} className={'rounded-md border px-3 py-1.5 text-xs ' + (compareSize === s.sizeLabel ? 'border-primary bg-primary/10 font-medium' : 'hover:bg-accent')}>{s.sizeLabel}{s.sizeLabel === sizeRecs[compareGid]?.recommended?.sizeLabel && <span className="ml-1 text-primary">(推荐)</span>}</button>)}</div></div>
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="rounded-lg border p-4"><h3 className="mb-3 font-semibold">选择场景</h3><div className="grid grid-cols-2 gap-2">{SCENES.map(s => <button key={s.value} onClick={() => setScene(s.value)} className={'rounded-md border p-3 text-left text-sm ' + (scene === s.value ? 'border-primary bg-primary/5' : 'hover:bg-accent')}><div className="font-medium">{s.label}</div><div className="text-xs text-muted-foreground">{s.desc}</div></button>)}</div></div>
          <div className="rounded-lg border p-4"><h3 className="mb-3 font-semibold">选择姿势</h3><div className="grid grid-cols-2 gap-2">{POSES.map(p => <button key={p.value} onClick={() => setPose(p.value)} className={'rounded-md border p-3 text-sm ' + (pose === p.value ? 'border-primary bg-primary/5' : 'hover:bg-accent')}>{p.label}</button>)}</div></div>
          <button onClick={handleGenerate} disabled={generating || selected.length === 0} className="w-full rounded-md bg-primary py-3 text-base font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">{generating ? 'AI 生成中...' : compareMode ? '开始对比试穿' : '开始试穿'}</button>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <h3 className="mb-3 font-semibold">{compareMode ? '推荐尺码效果' : '试穿效果'}</h3>
            {resultUrl ? (
              <div>
                <div className="overflow-hidden rounded-md bg-muted"><img src={resultUrl} alt="试穿效果" className="w-full object-contain" /></div>
                <div className="mt-3 flex gap-2"><a href={resultUrl} download="tryon-result.png" className="flex-1 rounded-md border py-2 text-center text-sm hover:bg-accent">下载图片</a><button onClick={() => { setResultUrl(''); setCompareUrl(''); setSelectedIds([]); setCompareMode(false); }} className="flex-1 rounded-md border py-2 text-sm hover:bg-accent">重新试穿</button></div>
              </div>
            ) : (
              <div className="flex aspect-[3/4] items-center justify-center rounded-md bg-muted text-sm text-muted-foreground">{generating ? <div className="text-center"><div className="mb-2 text-2xl">✨</div><p>AI 正在生成试穿效果...</p><p className="mt-1 text-xs">预计需要 15-30 秒</p></div> : <div className="text-center"><div className="mb-2 text-4xl">👔</div><p>选择服装后点击「开始试穿」</p></div>}</div>
            )}
          </div>
          {compareMode && (
            <div className="rounded-lg border p-4">
              <h3 className="mb-3 font-semibold">对比尺码效果</h3>
              {compareUrl ? (<div><div className="overflow-hidden rounded-md bg-muted"><img src={compareUrl} alt="对比效果" className="w-full object-contain" /></div>{renderFitComparison()}</div>) : (
                <div className="flex aspect-[3/4] items-center justify-center rounded-md bg-muted text-sm text-muted-foreground">{compareGen ? <div className="text-center"><div className="mb-2 text-2xl">✨</div><p>正在生成对比效果图...</p></div> : <div className="text-center"><div className="mb-2 text-4xl">📐</div><p>点击「开始对比试穿」生成</p></div>}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
