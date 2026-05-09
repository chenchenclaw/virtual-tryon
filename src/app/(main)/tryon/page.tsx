'use client';

import { useState, useEffect } from 'react';
import { garmentApi, tryonApi } from '@/lib/api';

const SCENES = [{ value: 'studio', label: '摄影棚', desc: '纯白背景，均匀柔光' }, { value: 'street', label: '街拍', desc: '城市街头，自然日光' }, { value: 'indoor', label: '室内', desc: '简约客厅，柔和灯光' }, { value: 'outdoor', label: '户外', desc: '花园绿地，阳光明媚' }];
const POSES = [{ value: 'front_standing', label: '正面站立' }, { value: 'side_45', label: '45度侧身' }, { value: 'walking', label: '行走中' }, { value: 'sitting', label: '坐姿' }];
const catLabel: Record<string, string> = { top: '上衣', bottom: '裤装', dress: '裙装', shoes: '鞋履', accessory: '配饰', bag: '包袋' };

interface Garment { id: string; name: string | null; category: string; fit_type: string | null; color_primary: string | null; original_image: string | null; }

export default function TryonPage() {
  const [garments, setGarments] = useState<Garment[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [scene, setScene] = useState('studio');
  const [pose, setPose] = useState('front_standing');
  const [generating, setGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState('');
  const [error, setError] = useState('');
  const [qualityScore, setQualityScore] = useState<number | null>(null);

  useEffect(() => { garmentApi.list().then(r => { if (r.success) setGarments((r.data as any)?.data || []); }); }, []);

  const toggle = (id: string) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const selected = garments.filter(g => selectedIds.includes(g.id));

  const handleGenerate = async () => {
    if (selected.length === 0) { setError('请至少选择一件服装'); return; }
    setGenerating(true); setError(''); setResultUrl('');
    const res = await tryonApi.create({ garmentIds: selectedIds, scene, pose });
    if (!res.success) { setError(res.error || '创建失败'); setGenerating(false); return; }
    const taskId = (res.data as any)?.data?.task_id;
    if (!taskId) { setError('未获取到任务ID'); setGenerating(false); return; }
    // 轮询
    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const statusRes = await tryonApi.getStatus(taskId);
      if (statusRes.success) {
        const d = (statusRes.data as any)?.data;
        if (d?.status === 'completed' && d?.result_urls?.length > 0) {
          setResultUrl(d.result_urls[0]); setQualityScore(d.quality_score); setGenerating(false); return;
        }
        if (d?.status === 'failed') { setError(d.error_message || '生成失败'); setGenerating(false); return; }
      }
    }
    setError('生成超时'); setGenerating(false);
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
                    <input type="checkbox" checked={selectedIds.includes(g.id)} onChange={() => toggle(g.id)} className="accent-primary" />
                    {g.original_image ? <img src={g.original_image} alt="" className="h-10 w-10 rounded object-cover" /> : <div className="flex h-10 w-10 items-center justify-center rounded bg-muted text-lg">👔</div>}
                    <div className="flex-1 text-sm"><div className="font-medium">{g.name || '未命名'}</div><div className="text-xs text-muted-foreground">{catLabel[g.category]} · {g.color_primary || '-'}</div></div>
                  </label>
                ))}
              </div>
            )}
          </div>
          <div className="rounded-lg border p-4"><h3 className="mb-3 font-semibold">选择场景</h3><div className="grid grid-cols-2 gap-2">{SCENES.map(s => <button key={s.value} onClick={() => setScene(s.value)} className={'rounded-md border p-3 text-left text-sm ' + (scene === s.value ? 'border-primary bg-primary/5' : 'hover:bg-accent')}><div className="font-medium">{s.label}</div><div className="text-xs text-muted-foreground">{s.desc}</div></button>)}</div></div>
          <div className="rounded-lg border p-4"><h3 className="mb-3 font-semibold">选择姿势</h3><div className="grid grid-cols-2 gap-2">{POSES.map(p => <button key={p.value} onClick={() => setPose(p.value)} className={'rounded-md border p-3 text-sm ' + (pose === p.value ? 'border-primary bg-primary/5' : 'hover:bg-accent')}>{p.label}</button>)}</div></div>
          <button onClick={handleGenerate} disabled={generating || selected.length === 0} className="w-full rounded-md bg-primary py-3 text-base font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">{generating ? 'AI 生成中...' : '开始试穿'}</button>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <div className="rounded-lg border p-4">
          <h3 className="mb-3 font-semibold">试穿效果</h3>
          {resultUrl ? (
            <div>
              <div className="overflow-hidden rounded-md bg-muted"><img src={resultUrl} alt="试穿效果" className="w-full object-contain" /></div>
              {qualityScore && <p className="mt-2 text-sm text-muted-foreground">质量评分: {qualityScore.toFixed(1)}/10</p>}
              <div className="mt-3 flex gap-2">
                <a href={resultUrl} download="tryon-result.png" className="flex-1 rounded-md border py-2 text-center text-sm hover:bg-accent">下载图片</a>
                <button onClick={() => { setResultUrl(''); setSelectedIds([]); }} className="flex-1 rounded-md border py-2 text-sm hover:bg-accent">重新试穿</button>
              </div>
            </div>
          ) : (
            <div className="flex aspect-[3/4] items-center justify-center rounded-md bg-muted text-sm text-muted-foreground">
              {generating ? <div className="text-center"><div className="mb-2 text-2xl">✨</div><p>AI 正在生成试穿效果...</p><p className="mt-1 text-xs">预计需要 15-30 秒</p></div> : <div className="text-center"><div className="mb-2 text-4xl">👔</div><p>选择服装后点击「开始试穿」</p></div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
