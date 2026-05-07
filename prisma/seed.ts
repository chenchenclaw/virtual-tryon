import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 创建演示用户
  const passwordHash = await bcrypt.hash('demo123456', 12);

  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      passwordHash,
      nickname: '演示用户',
      gender: 'female',
      birthYear: 1995,
      stylePreferences: { casual: 0.8, formal: 0.3, sporty: 0.5 },
    },
  });

  console.log(`Created user: ${user.email} (${user.id})`);

  // 创建体型档案
  const bodyProfile = await prisma.bodyProfile.create({
    data: {
      userId: user.id,
      heightCm: 168,
      weightKg: 55,
      shoulderWidth: 38,
      chestCirc: 84,
      waistCirc: 66,
      hipCirc: 92,
      armLength: 56,
      legLength: 78,
      bodyType: '梨形',
      bodyDescription: '中等身材偏瘦，肩窄腰细，臀部相对丰满。整体比例匀称，适合高腰款式以优化腰线。',
      isActive: true,
    },
  });

  console.log(`Created body profile: ${bodyProfile.id}`);

  // 创建示例服装
  const shirt = await prisma.garment.create({
    data: {
      userId: user.id,
      name: '白色圆领T恤',
      category: 'top',
      subCategory: 't-shirt',
      colorPrimary: '白色',
      material: '棉',
      fitType: '标准',
      pattern: '纯色',
      styleTags: ['休闲', '百搭'],
      seasonTags: ['春', '夏'],
      aiDescription: '经典白色圆领T恤，100%纯棉面料，标准版型，适合日常穿着',
    },
  });

  // 创建尺码表
  await prisma.sizeChart.createMany({
    data: [
      { garmentId: shirt.id, sizeLabel: 'S', chest: 92, shoulder: 40, totalLength: 64, sortOrder: 0 },
      { garmentId: shirt.id, sizeLabel: 'M', chest: 96, shoulder: 42, totalLength: 66, sortOrder: 1 },
      { garmentId: shirt.id, sizeLabel: 'L', chest: 100, shoulder: 44, totalLength: 68, sortOrder: 2 },
      { garmentId: shirt.id, sizeLabel: 'XL', chest: 104, shoulder: 46, totalLength: 70, sortOrder: 3 },
    ],
  });

  console.log(`Created garment: ${shirt.name} (${shirt.id}) with size chart`);

  const jeans = await prisma.garment.create({
    data: {
      userId: user.id,
      name: '蓝色直筒牛仔裤',
      category: 'bottom',
      subCategory: 'jeans',
      colorPrimary: '蓝色',
      material: '牛仔',
      fitType: '直筒',
      pattern: '纯色',
      styleTags: ['休闲', '百搭'],
      seasonTags: ['春', '秋', '冬'],
      aiDescription: '经典蓝色直筒牛仔裤，中腰设计，直筒裤型修饰腿型',
    },
  });

  await prisma.sizeChart.createMany({
    data: [
      { garmentId: jeans.id, sizeLabel: 'S', waistCirc: 64, hipCirc: 88, inseam: 78, sortOrder: 0 },
      { garmentId: jeans.id, sizeLabel: 'M', waistCirc: 68, hipCirc: 92, inseam: 80, sortOrder: 1 },
      { garmentId: jeans.id, sizeLabel: 'L', waistCirc: 72, hipCirc: 96, inseam: 82, sortOrder: 2 },
    ],
  });

  console.log(`Created garment: ${jeans.name} (${jeans.id}) with size chart`);

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
