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

interface Garment {
  id: string;
  name: string | null;
  category: string;
  fitType: string | null;
  colorPrimary: string | null;
  originalImage: string | null;
}

const categoryLabel: Record<string, string> = {
  top: '上衣', bottom: '裤装', dress: '裙装', shoes: '鞋履', accessory: '配饰', bag: '包袋',
};

export default function TryonPage() {
  const [garments, setGarments] = useState<Garment[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [scene, setScene] = useState('studio');
  const [pose, setPose] = useState('front_standing');
  const [generating, setGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState('');
  const [error, setError] = useState('');
  const [taskId, setTaskId] = useState('');

  useEffect(() => {
    fetch('/api/garments')
      .then((r) => r.json())
      .then((d) => { if (d.success) setGarments(d.data); })
      .catch(() => {});
  }, []);

  const toggleGarment = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectedGarments = garments.filter((g) => selectedIds.includes(g.id));
  // 按 category 分组，每类最多选一件
  const topSelected = selectedGarments.find((g) => g.category === 'top' || g.category === 'dress');
  const bottomSelected = selectedGarments.find((g) => g.category === 'bottom');
  const shoesSelected = selectedGarments.find((g) => g.category === 'shoes');

  const handleGenerate = async () => {
    if (selectedGarments.length === 0) {
      setError('请至少选择一件服装');
      return;
    }

    setGenerating(true);
    setError('');
    setResultUrl('');

    try {
      const res = await fetch('/api/tryon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          garmentIds: selectedIds,
          scene,
          pose,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error);
        return;
      }

      setTaskId(data.data.task_id);

      // 轮询任务状态
      pollTaskStatus(data.data.task_id);
    } catch {
      setError('生成失败，请稍后重试');
      setGenerating(false);
    }
  };

  const pollTaskStatus = async (id: string) => {
    const maxAttempts = 60; // 最多等 2 分钟
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((r) => setTimeout(r, 2000));

      try {
        const res = await fetch(`/api/tryon?id=${id}`);
        const data = await res.json();

        if (data.success) {
          if (data.data.status === 'completed' && data.data.resultUrls?.length > 0) {
            setResultUrl(data.data.resultUrls[0]);
            setGenerating(false);
            return;
          }
          if (data.data.status === 'failed') {
            setError(data.data.errorMessage || '生成失败');
            setGenerating(false);
            return;
          }
        }
      } catch { /* continue polling */ }
    }

    setError('生成超时，请稍后重试');
    setGenerating(false);
  };

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-2 text-2xl font-bold">虚拟试穿</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        选择服装和场景，AI 生成你的试穿效果图
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 左侧：选择面板 */}
        <div className="space-y-6">
          {/* 服装选择 */}
          <div className="rounded-lg border p-4">
            <h3 className="mb-3 font-semibold">选择服装</h3>
            {garments.length === 0 ? (
              <div className="rounded-md border-2 border-dashed p-6 text-center text-sm text-muted-foreground">
                <p>衣橱为空</p>
                <a href="/wardrobe" className="mt-2 inline-block text-primary hover:underline">去添加服装</a>
              </div>
            ) : (
              <div className="max-h-60 space-y-2 overflow-y-auto">
                {garments.map((g) => (
                  <label
                    key={g.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-md border p-2 transition-colors ${
                      selectedIds.includes(g.id) ? 'border-primary bg-primary/5' : 'hover:bg-accent'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(g.id)}
                      onChange={() => toggleGarment(g.id)}
                      className="accent-primary"
                    />
                    {g.originalImage ? (
                      <img src={g.originalImage} alt="" className="h-10 w-10 rounded object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded bg-muted text-lg">👔</div>
                    )}
                    <div className="flex-1 text-sm">
                      <div className="font-medium">{g.name || '未命名'}</div>
                      <div className="text-xs text-muted-foreground">
                        {categoryLabel[g.category]} · {g.colorPrimary || '-'}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
            {selectedGarments.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {topSelected && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">上衣: {topSelected.name}</span>}
                {bottomSelected && <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">裤装: {bottomSelected.name}</span>}
                {shoesSelected && <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700">鞋履: {shoesSelected.name}</span>}
              </div>
            )}
          </div>

          {/* 场景选择 */}
          <div className="rounded-lg border p-4">
            <h3 className="mb-3 font-semibold">选择场景</h3>
            <div className="grid grid-cols-2 gap-2">
              {SCENES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setScene(s.value)}
                  className={`rounded-md border p-3 text-left text-sm transition-colors ${
                    scene === s.value ? 'border-primary bg-primary/5' : 'hover:bg-accent'
                  }`}
                >
                  <div className="font-medium">{s.label}</div>
                  <div className="text-xs text-muted-foreground">{s.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 姿势选择 */}
          <div className="rounded-lg border p-4">
            <h3 className="mb-3 font-semibold">选择姿势</h3>
            <div className="grid grid-cols-2 gap-2">
              {POSES.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPose(p.value)}
                  className={`rounded-md border p-3 text-sm ${
                    pose === p.value ? 'border-primary bg-primary/5' : 'hover:bg-accent'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* 生成按钮 */}
          <button
            onClick={handleGenerate}
            disabled={generating || selectedGarments.length === 0}
            className="w-full rounded-md bg-primary py-3 text-base font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {generating ? 'AI 生成中...' : '开始试穿'}
          </button>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        {/* 右侧：结果预览 */}
        <div className="rounded-lg border p-4">
          <h3 className="mb-3 font-semibold">试穿效果</h3>
          {resultUrl ? (
            <div>
              <div className="overflow-hidden rounded-md bg-muted">
                <img src={resultUrl} alt="试穿效果" className="w-full object-contain" />
              </div>
              <div className="mt-3 flex gap-2">
                <a
                  href={resultUrl}
                  download="tryon-result.png"
                  className="flex-1 rounded-md border py-2 text-center text-sm hover:bg-accent"
                >
                  下载图片
                </a>
                <button
                  onClick={() => { setResultUrl(''); setSelectedIds([]); }}
                  className="flex-1 rounded-md border py-2 text-sm hover:bg-accent"
                >
                  重新试穿
                </button>
              </div>
            </div>
          ) : (
            <div className="flex aspect-[3/4] items-center justify-center rounded-md bg-muted text-sm text-muted-foreground">
              {generating ? (
                <div className="text-center">
                  <div className="mb-2 text-2xl">✨</div>
                  <p>AI 正在生成试穿效果...</p>
                  <p className="mt-1 text-xs">预计需要 15-30 秒</p>
                  {taskId && <p className="mt-2 text-xs text-muted-foreground">任务ID: {taskId}</p>}
                </div>
              ) : (
                <div className="text-center">
                  <div className="mb-2 text-4xl">👔</div>
                  <p>选择服装后点击「开始试穿」</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
