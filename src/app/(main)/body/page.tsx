'use client';

import { useState, useEffect, useRef } from 'react';
import { bodyApi } from '@/lib/api';

export default function BodyPage() {
  const [form, setForm] = useState({ height_cm: '', weight_kg: '', shoulder_width: '', chest_circ: '', waist_circ: '', hip_circ: '', arm_length: '', leg_length: '', body_type: '' });
  const [frontPhoto, setFrontPhoto] = useState('');
  const [sidePhoto, setSidePhoto] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const frontRef = useRef<HTMLInputElement>(null);
  const sideRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    const res = await bodyApi.get();
    if (res.success && res.data) {
      const d = (res.data as any)?.data;
      if (d) {
        setForm({ height_cm: d.height_cm || '', weight_kg: d.weight_kg || '', shoulder_width: d.shoulder_width || '', chest_circ: d.chest_circ || '', waist_circ: d.waist_circ || '', hip_circ: d.hip_circ || '', arm_length: d.arm_length || '', leg_length: d.leg_length || '', body_type: d.body_type || '' });
        if (d.front_photo_url) setFrontPhoto(d.front_photo_url);
        if (d.side_photo_url) setSidePhoto(d.side_photo_url);
      }
    }
  };

  const handlePhotoUpload = async (file: File, side: 'front' | 'side') => {
    const res = await bodyApi.uploadPhoto(file, side);
    if (res.success) {
      const url = (res.data as any)?.data?.url;
      if (side === 'front') setFrontPhoto(url); else setSidePhoto(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setMessage('');
    const data: Record<string, unknown> = {};
    Object.entries(form).forEach(([k, v]) => { if (v !== '') data[k] = Number(v) || v; });
    const res = await bodyApi.create(data);
    if (res.success) setMessage('保存成功！'); else setMessage(res.error || '保存失败');
    setSaving(false);
  };

  const update = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">体型档案</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg border p-6">
          <h2 className="mb-4 text-lg font-semibold">身材数据</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="mb-1 block text-sm font-medium">身高 (cm)</label><input type="number" value={form.height_cm} onChange={e => update('height_cm', e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" placeholder="175" /></div>
            <div><label className="mb-1 block text-sm font-medium">体重 (kg)</label><input type="number" value={form.weight_kg} onChange={e => update('weight_kg', e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" placeholder="68" /></div>
            <div><label className="mb-1 block text-sm font-medium">肩宽 (cm)</label><input type="number" value={form.shoulder_width} onChange={e => update('shoulder_width', e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" placeholder="44" /></div>
            <div><label className="mb-1 block text-sm font-medium">胸围 (cm)</label><input type="number" value={form.chest_circ} onChange={e => update('chest_circ', e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" placeholder="92" /></div>
            <div><label className="mb-1 block text-sm font-medium">腰围 (cm)</label><input type="number" value={form.waist_circ} onChange={e => update('waist_circ', e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" placeholder="76" /></div>
            <div><label className="mb-1 block text-sm font-medium">臀围 (cm)</label><input type="number" value={form.hip_circ} onChange={e => update('hip_circ', e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" placeholder="94" /></div>
            <div><label className="mb-1 block text-sm font-medium">臂长 (cm)</label><input type="number" value={form.arm_length} onChange={e => update('arm_length', e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" placeholder="62" /></div>
            <div><label className="mb-1 block text-sm font-medium">腿长 (cm)</label><input type="number" value={form.leg_length} onChange={e => update('leg_length', e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" placeholder="82" /></div>
          </div>
        </div>
        <div className="rounded-lg border p-6">
          <h2 className="mb-4 text-lg font-semibold">体型照片</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">正面照</label>
              <input ref={frontRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handlePhotoUpload(e.target.files[0], 'front')} />
              <div onClick={() => frontRef.current?.click()} className="cursor-pointer rounded-md border-2 border-dashed p-4 text-center text-sm text-muted-foreground hover:border-primary">
                {frontPhoto ? <img src={frontPhoto} alt="正面照" className="mx-auto max-h-40 rounded object-contain" /> : <p>点击上传正面照</p>}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">侧面照</label>
              <input ref={sideRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handlePhotoUpload(e.target.files[0], 'side')} />
              <div onClick={() => sideRef.current?.click()} className="cursor-pointer rounded-md border-2 border-dashed p-4 text-center text-sm text-muted-foreground hover:border-primary">
                {sidePhoto ? <img src={sidePhoto} alt="侧面照" className="mx-auto max-h-40 rounded object-contain" /> : <p>点击上传侧面照</p>}
              </div>
            </div>
          </div>
        </div>
        {message && <p className={'text-sm ' + (message.includes('成功') ? 'text-green-600' : 'text-destructive')}>{message}</p>}
        <button type="submit" disabled={saving} className="w-full rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">{saving ? '保存中...' : '保存体型档案'}</button>
      </form>
    </div>
  );
}
