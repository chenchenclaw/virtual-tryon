'use client';

import { useState } from 'react';

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

export default function TryonPage() {
  const [scene, setScene] = useState('studio');
  const [pose, setPose] = useState('front_standing');
  const [generating, setGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState('');
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setGenerating(true);
    setError('');
    setResultUrl('');

    try {
      const res = await fetch('/api/tryon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          garments: [],  // TODO: 从衣橱选择
          scene,
          pose,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error);
        return;
      }

      // TODO: 轮询任务状态直到完成
      setResultUrl('/placeholder-result.png');
    } catch {
      setError('生成失败，请稍后重试');
    } finally {
      setGenerating(false);
    }
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
            <div className="rounded-md border-2 border-dashed p-6 text-center text-sm text-muted-foreground">
              <p>从衣橱中选择要试穿的单品</p>
              <button className="mt-2 text-primary hover:underline">打开衣橱</button>
            </div>
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
            disabled={generating}
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
            <div className="aspect-[3/4] overflow-hidden rounded-md bg-muted">
              <img src={resultUrl} alt="试穿效果" className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="flex aspect-[3/4] items-center justify-center rounded-md bg-muted text-sm text-muted-foreground">
              {generating ? (
                <div className="text-center">
                  <div className="mb-2 text-2xl">✨</div>
                  <p>AI 正在生成试穿效果...</p>
                  <p className="mt-1 text-xs">预计需要 15-30 秒</p>
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
