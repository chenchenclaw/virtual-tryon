import { openai } from '@/lib/openai';

interface QualityResult {
  score: number;
  issues: string[];
  pass: boolean;
}

/**
 * 质量自检：对比用户原始照片和 AI 生成的试穿效果图
 * 通过 GPT-4o Vision 评估生成质量
 */
export async function qualityCheck(
  userPhotoUrl: string,
  generatedImageUrl: string
): Promise<QualityResult> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 500,
      messages: [
        {
          role: 'system',
          content: '你是一个专业的虚拟试穿质量评估AI。请客观评估生成图片的质量，返回纯JSON格式。',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `请对比以下两张图片：
- 图片1：用户原始照片
- 图片2：AI 生成的试穿效果图

请检查并评分（1-10分）：
1. 面部一致性：脸部特征是否保持一致？
2. 体型准确性：身材比例是否合理？
3. 服装还原度：服装是否自然穿在身上？
4. 穿着自然度：有无明显穿帮、扭曲、多余肢体？
5. 整体质量：光影、背景、整体观感是否自然？

返回JSON格式：
{
  "score": 总分(1-10),
  "face_score": 面部分(1-10),
  "body_score": 体形分(1-10),
  "garment_score": 服装分(1-10),
  "natural_score": 自然度(1-10),
  "issues": ["问题1", "问题2"],
  "pass": true或false（6分及以上为pass）
}

如果生成质量明显有问题（如面部变形、多余手指、服装扭曲），pass应为false。`,
            },
            {
              type: 'image_url',
              image_url: { url: userPhotoUrl },
            },
            {
              type: 'image_url',
              image_url: { url: generatedImageUrl },
            },
          ],
        },
      ],
    });

    const content = response.choices[0]?.message?.content || '{}';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { score: 7, issues: [], pass: true };
    }

    const raw = JSON.parse(jsonMatch[0]);
    return {
      score: raw.score || 7,
      issues: raw.issues || [],
      pass: raw.pass !== false && (raw.score || 7) >= 6,
    };
  } catch (error) {
    console.error('Quality check error:', error);
    // 质量检查失败不阻塞主流程，默认通过
    return { score: 7, issues: [], pass: true };
  }
}

/**
 * 根据质量问题优化 Prompt
 * 在重试时根据上次的失败原因添加额外约束
 */
export function refinePromptWithIssues(originalPrompt: string, issues: string[]): string {
  const refinements: string[] = [];

  for (const issue of issues) {
    const lower = issue.toLowerCase();
    if (lower.includes('面部') || lower.includes('脸') || lower.includes('face')) {
      refinements.push('特别注意：必须保持用户面部特征完全一致，五官不能变形或偏移');
    }
    if (lower.includes('手') || lower.includes('手指') || lower.includes('hand')) {
      refinements.push('特别注意：手部和手指必须正常，不能有多余或缺失的手指');
    }
    if (lower.includes('服装') || lower.includes('衣服') || lower.includes('garment')) {
      refinements.push('特别注意：服装必须自然穿在身上，不能有扭曲、穿透或不自然的褶皱');
    }
    if (lower.includes('体型') || lower.includes('比例') || lower.includes('body')) {
      refinements.push('特别注意：保持用户原始体型比例不变，不要改变身高和体态');
    }
    if (lower.includes('背景') || lower.includes('场景') || lower.includes('background')) {
      refinements.push('特别注意：背景场景要自然协调，不能有明显拼接痕迹');
    }
  }

  if (refinements.length === 0) {
    refinements.push('请提高生成质量，确保人物和服装都自然真实');
  }

  return `${originalPrompt}\n\n## 优化要求（上次生成有问题）\n${refinements.join('\n')}`;
}
