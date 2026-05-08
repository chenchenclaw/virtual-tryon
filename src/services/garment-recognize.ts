import { openai } from '@/lib/openai';

interface RecognizedAttributes {
  category: string;
  subCategory: string;
  colorPrimary: string;
  colorSecondary: string;
  material: string;
  pattern: string;
  style: string;
  fitType: string;
  details: string;
  name: string;
}

const CATEGORY_MAP: Record<string, string> = {
  '上衣': 'top',
  'T恤': 'top',
  '衬衫': 'top',
  '外套': 'top',
  '卫衣': 'top',
  '毛衣': 'top',
  '裤装': 'bottom',
  '裤子': 'bottom',
  '牛仔裤': 'bottom',
  '短裤': 'bottom',
  '裙装': 'dress',
  '连衣裙': 'dress',
  '半身裙': 'dress',
  '鞋履': 'shoes',
  '鞋子': 'shoes',
  '运动鞋': 'shoes',
  '皮鞋': 'shoes',
  '靴子': 'shoes',
  '配饰': 'accessory',
  '帽子': 'accessory',
  '围巾': 'accessory',
  '包袋': 'bag',
  '背包': 'bag',
  '手提包': 'bag',
};

const FIT_MAP: Record<string, string> = {
  '修身': '修身',
  '紧身': '修身',
  '合身': '修身',
  '标准': '标准',
  '常规': '标准',
  '直筒': '标准',
  '宽松': '宽松',
  'oversize': 'Oversize',
  '廓形': '廓形',
};

/**
 * 调用语言模型 Vision 识别服装图片属性
 */
export async function recognizeGarment(imageUrl: string): Promise<RecognizedAttributes> {
  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'mimo-v2.5-pro',
    max_tokens: 800,
    messages: [
      {
        role: 'system',
        content: `你是一个专业的服装识别AI。请分析服装图片，返回结构化的服装属性信息。
必须返回纯JSON格式，不要包含任何其他文字。`,
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `请分析这张服装图片，返回以下JSON格式信息：
{
  "category": "上衣/裤装/裙装/鞋履/配饰/包袋",
  "sub_category": "具体品类，如T恤、衬衫、牛仔裤、运动鞋等",
  "color_primary": "主色",
  "color_secondary": "副色或无",
  "material": "材质，如棉、丝、牛仔、皮革、涤纶等",
  "pattern": "图案，如纯色、条纹、格子、印花等",
  "style": "风格，如休闲、商务、运动、街头、复古等",
  "fit_type": "版型，修身/标准/宽松/廓形/Oversize",
  "details": "关键设计细节描述（领口、袖型、口袋等）",
  "name": "建议名称，如'白色圆领纯棉T恤'，简洁明了"
}`,
          },
          {
            type: 'image_url',
            image_url: { url: imageUrl },
          },
        ],
      },
    ],
  });

  const content = response.choices[0]?.message?.content || '{}';

  // 提取 JSON（可能被 ```json ``` 包裹）
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('AI 无法识别该服装图片');
  }

  const raw = JSON.parse(jsonMatch[0]);

  // 映射到标准值
  return {
    category: CATEGORY_MAP[raw.category] || CATEGORY_MAP[raw.sub_category] || 'top',
    subCategory: raw.sub_category || '',
    colorPrimary: raw.color_primary || '',
    colorSecondary: raw.color_secondary || '',
    material: raw.material || '',
    pattern: raw.pattern || '',
    style: raw.style || '',
    fitType: FIT_MAP[raw.fit_type] || raw.fit_type || '标准',
    details: raw.details || '',
    name: raw.name || '',
  };
}
