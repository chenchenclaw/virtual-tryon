/**
 * Prompt 组装引擎
 * 将用户身材数据、服装信息、场景/姿势组装为 GPT Image 所需的 Prompt
 */

interface BodyProfile {
  heightCm?: number | null;
  weightKg?: number | null;
  shoulderWidth?: number | null;
  chestCirc?: number | null;
  waistCirc?: number | null;
  hipCirc?: number | null;
  bodyType?: string | null;
  bodyDescription?: string | null;
}

interface GarmentInfo {
  category: string;
  name?: string | null;
  colorPrimary?: string | null;
  material?: string | null;
  fitType?: string | null;
  pattern?: string | null;
  aiDescription?: string | null;
  sizeLabel?: string;
  sizeMeasurements?: Record<string, number>;
}

interface TryonParams {
  bodyProfile: BodyProfile;
  garments: GarmentInfo[];
  scene: string;
  pose: string;
  quality?: 'standard' | 'high';
}

const SCENE_DESCRIPTIONS: Record<string, string> = {
  studio: '专业摄影棚，白色无缝背景，均匀柔和的灯光',
  street: '繁华都市街头，自然日光，背景有建筑和行人',
  indoor: '简约现代风格客厅，柔和的室内灯光',
  outdoor: '阳光明媚的户外花园，绿色植物背景',
};

const POSE_DESCRIPTIONS: Record<string, string> = {
  front_standing: '正面自然站立，双手自然下垂，目视镜头',
  side_45: '身体微侧45度，展示服装侧面轮廓',
  walking: '走路中的自然姿态，步伐轻盈',
  sitting: '优雅地坐在高脚椅上，双腿交叉',
};

/**
 * 组装 System Prompt
 */
export function buildSystemPrompt(): string {
  return `你是一个专业的虚拟试穿 AI。你的任务是根据用户的照片和服装信息，生成用户穿着指定服装的逼真效果图。

核心规则：
1. 必须保持用户的脸部特征、发型、肤色完全一致
2. 必须根据提供的身材数据调整体型比例，确保合身感
3. 服装的颜色、图案、材质必须忠实还原参考图
4. 光影和环境要自然协调
5. 输出为高质量摄影风格图片
6. 不要改变用户的体型，只更换服装`;
}

/**
 * 组装 User Prompt
 */
export function buildUserPrompt(params: TryonParams): string {
  const { bodyProfile, garments, scene, pose } = params;

  // 身材描述
  const bodySection = buildBodySection(bodyProfile);

  // 服装描述
  const garmentSection = garments.map((g, i) => buildGarmentSection(g, i + 1)).join('\n');

  // 场景和姿势
  const sceneDesc = SCENE_DESCRIPTIONS[scene] || SCENE_DESCRIPTIONS.studio;
  const poseDesc = POSE_DESCRIPTIONS[pose] || POSE_DESCRIPTIONS.front_standing;

  return `## 用户信息
${bodySection}

## 穿搭要求
请让图中人物穿上以下服装：
${garmentSection}

## 立体感与合身度要求
- 服装需根据版型和尺码数据呈现真实的合身效果
- 注意服装与身体之间的间隙：修身款贴合身体曲线，宽松款有自然垂坠感
- 服装的褶皱、垂坠、拉伸等细节需符合实际穿着状态

## 场景与姿势
- 背景场景：${sceneDesc}
- 模特姿势：${poseDesc}

## 质量要求
- 分辨率：${params.quality === 'high' ? '高清 1024x1536' : '标准 1024x1024'}
- 风格：专业时尚摄影风格
- 特别注意：保持面部特征完全一致，不要改变发型`;
}

function buildBodySection(body: BodyProfile): string {
  const parts: string[] = [];

  if (body.heightCm) parts.push(`- 身高：${body.heightCm}cm`);
  if (body.weightKg) parts.push(`- 体重：${body.weightKg}kg`);

  const measurements: string[] = [];
  if (body.shoulderWidth) measurements.push(`肩宽${body.shoulderWidth}cm`);
  if (body.chestCirc) measurements.push(`胸围${body.chestCirc}cm`);
  if (body.waistCirc) measurements.push(`腰围${body.waistCirc}cm`);
  if (body.hipCirc) measurements.push(`臀围${body.hipCirc}cm`);
  if (measurements.length) parts.push(`- 体型数据：${measurements.join('，')}`);

  if (body.bodyType) parts.push(`- 体型分类：${body.bodyType}`);
  if (body.bodyDescription) parts.push(`- 体型特征：${body.bodyDescription}`);

  return parts.join('\n') || '- （未提供身材数据）';
}

function buildGarmentSection(garment: GarmentInfo, index: number): string {
  const parts: string[] = [];

  const categoryNames: Record<string, string> = {
    top: '上衣',
    bottom: '裤装',
    dress: '连衣裙',
    shoes: '鞋履',
    accessory: '配饰',
    bag: '包袋',
  };

  parts.push(`- [附件${index}] ${categoryNames[garment.category] || garment.category}：${garment.name || '未命名'}`);

  const details: string[] = [];
  if (garment.colorPrimary) details.push(`颜色：${garment.colorPrimary}`);
  if (garment.material) details.push(`材质：${garment.material}`);
  if (garment.fitType) details.push(`版型：${garment.fitType}`);
  if (garment.pattern) details.push(`图案：${garment.pattern}`);
  if (details.length) parts.push(`  · ${details.join('，')}`);

  if (garment.sizeLabel) {
    parts.push(`  · 尺码：${garment.sizeLabel}`);
  }

  if (garment.sizeMeasurements) {
    const m = garment.sizeMeasurements;
    const sizeDetails: string[] = [];
    if (m.chest) sizeDetails.push(`胸围${m.chest}cm`);
    if (m.shoulder) sizeDetails.push(`肩宽${m.shoulder}cm`);
    if (m.waistCirc) sizeDetails.push(`腰围${m.waistCirc}cm`);
    if (sizeDetails.length) parts.push(`  · 尺寸：${sizeDetails.join('，')}`);
  }

  if (garment.aiDescription) {
    parts.push(`  · 描述：${garment.aiDescription}`);
  }

  return parts.join('\n');
}
