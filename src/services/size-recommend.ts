import { prisma } from '@/lib/prisma';

interface BodyMeasurements {
  heightCm?: number | null;
  weightKg?: number | null;
  shoulderWidth?: number | null;
  chestCirc?: number | null;
  waistCirc?: number | null;
  hipCirc?: number | null;
  armLength?: number | null;
  legLength?: number | null;
}

interface SizeEntry {
  sizeLabel: string;
  chest?: number | null;
  shoulder?: number | null;
  waistCirc?: number | null;
  hipCirc?: number | null;
  inseam?: number | null;
  footLength?: number | null;
  [key: string]: unknown;
}

interface SizeScore {
  sizeLabel: string;
  score: number;
  fitAnalysis: Record<string, { status: string; marginCm: number }>;
}

/**
 * 根据用户身材数据推荐最佳尺码
 */
export function recommendSize(
  user: BodyMeasurements,
  sizes: SizeEntry[],
  category: string
): SizeScore[] {
  if (!sizes.length) return [];

  const scored = sizes.map((size) => {
    let totalWeight = 0;
    let matchPoints = 0;
    const fitAnalysis: Record<string, { status: string; marginCm: number }> = {};

    // 上衣：重点匹配胸围和肩宽
    if (category === 'top' || category === 'dress') {
      if (size.chest && user.chestCirc) {
        const weight = 3;
        totalWeight += weight;
        const diff = size.chest - user.chestCirc;
        const absDiff = Math.abs(diff);
        matchPoints += Math.max(0, weight - absDiff / 2);
        fitAnalysis.chest = {
          status: diff <= 2 ? '贴合' : diff <= 6 ? '适中' : '宽松',
          marginCm: Math.round(diff * 10) / 10,
        };
      }

      if (size.shoulder && user.shoulderWidth) {
        const weight = 2;
        totalWeight += weight;
        const diff = size.shoulder - user.shoulderWidth;
        const absDiff = Math.abs(diff);
        matchPoints += Math.max(0, weight - absDiff / 1.5);
        fitAnalysis.shoulder = {
          status: diff <= 1 ? '合身' : diff <= 3 ? '适中' : '偏宽',
          marginCm: Math.round(diff * 10) / 10,
        };
      }
    }

    // 裤装：重点匹配腰围和臀围
    if (category === 'bottom') {
      if (size.waistCirc && user.waistCirc) {
        const weight = 3;
        totalWeight += weight;
        const diff = size.waistCirc - user.waistCirc;
        const absDiff = Math.abs(diff);
        matchPoints += Math.max(0, weight - absDiff / 2);
        fitAnalysis.waist = {
          status: diff <= 2 ? '贴合' : diff <= 6 ? '适中' : '宽松',
          marginCm: Math.round(diff * 10) / 10,
        };
      }

      if (size.hipCirc && user.hipCirc) {
        const weight = 2;
        totalWeight += weight;
        const diff = size.hipCirc - user.hipCirc;
        const absDiff = Math.abs(diff);
        matchPoints += Math.max(0, weight - absDiff / 2);
        fitAnalysis.hip = {
          status: diff <= 2 ? '贴合' : diff <= 6 ? '适中' : '宽松',
          marginCm: Math.round(diff * 10) / 10,
        };
      }
    }

    // 鞋履：匹配脚长
    if (category === 'shoes') {
      if (size.footLength && user.heightCm) {
        const weight = 3;
        totalWeight += weight;
        // 通过身高估算脚长（简化公式）
        const estimatedFootLen = user.heightCm * 0.15;
        const diff = size.footLength - estimatedFootLen;
        const absDiff = Math.abs(diff);
        matchPoints += Math.max(0, weight - absDiff);
        fitAnalysis.foot = {
          status: absDiff <= 0.5 ? '合适' : absDiff <= 1 ? '适中' : diff > 0 ? '偏大' : '偏小',
          marginCm: Math.round(diff * 10) / 10,
        };
      }
    }

    const score = totalWeight > 0 ? matchPoints / totalWeight : 0;

    return {
      sizeLabel: size.sizeLabel,
      score: Math.round(score * 100) / 100,
      fitAnalysis,
    };
  });

  return scored.sort((a, b) => b.score - a.score);
}

/**
 * 生成尺码推荐文字说明
 */
export function generateSizeExplanation(topScore: SizeScore): string {
  const parts: string[] = [];

  for (const [zone, info] of Object.entries(topScore.fitAnalysis)) {
    const zoneNames: Record<string, string> = {
      chest: '胸部',
      shoulder: '肩部',
      waist: '腰部',
      hip: '臀部',
      foot: '鞋码',
    };
    const zoneName = zoneNames[zone] || zone;
    const marginText = info.marginCm > 0 ? `（余量约${info.marginCm}cm）` : info.marginCm < 0 ? `（略紧${Math.abs(info.marginCm)}cm）` : '';
    parts.push(`${zoneName}${info.status}${marginText}`);
  }

  return parts.join('，');
}
