import OpenAI from 'openai';

const globalForOpenAI = globalThis as unknown as {
  openai: OpenAI | undefined;
  openaiImage: OpenAI | undefined;
};

/** 语言模型客户端（gpt-4o 等：服装识别、体型描述、质量自检） */
export const openai =
  globalForOpenAI.openai ??
  new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL,
  });

/** 生图模型客户端（gpt-image-1：生成试穿效果图） */
export const openaiImage =
  globalForOpenAI.openaiImage ??
  new OpenAI({
    apiKey: process.env.OPENAI_IMAGE_API_KEY || process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_IMAGE_BASE_URL || process.env.OPENAI_BASE_URL,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForOpenAI.openai = openai;
  globalForOpenAI.openaiImage = openaiImage;
}
