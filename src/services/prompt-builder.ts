export function buildSystemPrompt(): string {
  return '你是一个专业的虚拟试穿 AI。根据用户的照片和服装信息，生成用户穿着指定服装的逼真效果图。保持脸部特征、发型、肤色完全一致。根据身材数据调整体型比例。服装颜色、图案、材质忠实还原。光影环境自然协调。输出高质量摄影风格图片。';
}

interface BodyProfile { heightCm?: number | null; weightKg?: number | null; shoulderWidth?: number | null; chestCirc?: number | null; waistCirc?: number | null; hipCirc?: number | null; bodyType?: string | null; bodyDescription?: string | null; }
interface GarmentInfo { category: string; name?: string | null; colorPrimary?: string | null; material?: string | null; fitType?: string | null; pattern?: string | null; aiDescription?: string | null; sizeLabel?: string; sizeMeasurements?: { chest?: number; shoulder?: number; waistCirc?: number; hipCirc?: number; sleeveLength?: number; totalLength?: number; inseam?: number; [key: string]: number | undefined; }; }
interface TryonParams { bodyProfile: BodyProfile; garments: GarmentInfo[]; scene: string; pose: string; quality?: 'standard' | 'high'; }

const SCENE_DESC: Record<string, string> = { studio: '专业摄影棚，白色无缝背景，均匀柔和的灯光', street: '繁华都市街头，自然日光，背景有建筑和行人', indoor: '简约现代风格客厅，柔和的室内灯光', outdoor: '阳光明媚的户外花园，绿色植物背景' };
const POSE_DESC: Record<string, string> = { front_standing: '正面自然站立，双手自然下垂，目视镜头', side_45: '身体微侧45度，展示服装侧面轮廓', walking: '走路中的自然姿态，步伐轻盈', sitting: '优雅地坐在高脚椅上，双腿交叉' };

export function buildUserPrompt(params: TryonParams): string {
  const { bodyProfile, garments, scene, pose } = params;
  const bodyLines: string[] = [];
  if (bodyProfile.heightCm) bodyLines.push('- 身高：' + bodyProfile.heightCm + 'cm');
  if (bodyProfile.weightKg) bodyLines.push('- 体重：' + bodyProfile.weightKg + 'kg');
  const m: string[] = [];
  if (bodyProfile.shoulderWidth) m.push('肩宽' + bodyProfile.shoulderWidth + 'cm');
  if (bodyProfile.chestCirc) m.push('胸围' + bodyProfile.chestCirc + 'cm');
  if (bodyProfile.waistCirc) m.push('腰围' + bodyProfile.waistCirc + 'cm');
  if (bodyProfile.hipCirc) m.push('臀围' + bodyProfile.hipCirc + 'cm');
  if (m.length) bodyLines.push('- 体型数据：' + m.join('，'));
  if (bodyProfile.bodyType) bodyLines.push('- 体型分类：' + bodyProfile.bodyType);
  if (bodyProfile.bodyDescription) bodyLines.push('- 体型特征：' + bodyProfile.bodyDescription);
  const bodySection = bodyLines.join('\n') || '- （未提供身材数据）';

  const catNames: Record<string, string> = { top: '上衣', bottom: '裤装', dress: '连衣裙', shoes: '鞋履', accessory: '配饰', bag: '包袋' };
  const garmentSection = garments.map((g, i) => {
    const parts = ['- [附件' + (i + 1) + '] ' + (catNames[g.category] || g.category) + '：' + (g.name || '未命名')];
    const d: string[] = [];
    if (g.colorPrimary) d.push('颜色：' + g.colorPrimary);
    if (g.material) d.push('材质：' + g.material);
    if (g.fitType) d.push('版型：' + g.fitType);
    if (g.pattern) d.push('图案：' + g.pattern);
    if (d.length) parts.push('  · ' + d.join('，'));
    if (g.sizeLabel) parts.push('  · 尺码：' + g.sizeLabel);
    if (g.sizeMeasurements) {
      const sd: string[] = [];
      if (g.sizeMeasurements.chest) sd.push('胸围' + g.sizeMeasurements.chest + 'cm');
      if (g.sizeMeasurements.shoulder) sd.push('肩宽' + g.sizeMeasurements.shoulder + 'cm');
      if (g.sizeMeasurements.waistCirc) sd.push('腰围' + g.sizeMeasurements.waistCirc + 'cm');
      if (g.sizeMeasurements.hipCirc) sd.push('臀围' + g.sizeMeasurements.hipCirc + 'cm');
      if (g.sizeMeasurements.sleeveLength) sd.push('袖长' + g.sizeMeasurements.sleeveLength + 'cm');
      if (g.sizeMeasurements.totalLength) sd.push('衣长' + g.sizeMeasurements.totalLength + 'cm');
      if (g.sizeMeasurements.inseam) sd.push('内长' + g.sizeMeasurements.inseam + 'cm');
      if (sd.length) parts.push('  · 尺寸：' + sd.join('，'));
    }
    if (g.aiDescription) parts.push('  · 描述：' + g.aiDescription);
    return parts.join('\n');
  }).join('\n');

  const sceneDesc = SCENE_DESC[scene] || SCENE_DESC.studio;
  const poseDesc = POSE_DESC[pose] || POSE_DESC.front_standing;

  return '## 用户信息\n' + bodySection + '\n\n## 穿搭要求\n请让图中人物穿上以下服装：\n' + garmentSection + '\n\n## 立体感与合身度要求\n- 服装需根据版型和尺码数据呈现真实的合身效果\n- 注意服装与身体之间的间隙：修身款贴合身体曲线，宽松款有自然垂坠感\n- 服装的褶皱、垂坠、拉伸等细节需符合实际穿着状态\n\n## 场景与姿势\n- 背景场景：' + sceneDesc + '\n- 模特姿势：' + poseDesc + '\n\n## 质量要求\n- 分辨率：' + (params.quality === 'high' ? '高清 2048x2048' : '标准 1024x1024') + '\n- 风格：专业时尚摄影风格\n- 特别注意：保持面部特征完全一致，不要改变发型';
}
