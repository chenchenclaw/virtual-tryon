import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/auth';

const prisma = new PrismaClient();

async function main() {
  const email = 'chenchenclaw@gmail.com';

  // 检查用户是否已存在
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('用户已存在，ID:', existing.id);
    // 删除旧数据
    await prisma.tryonTask.deleteMany({ where: { userId: existing.id } });
    await prisma.sizeRecommendation.deleteMany({ where: { userId: existing.id } });
    await prisma.outfit.deleteMany({ where: { userId: existing.id } });
    await prisma.post.deleteMany({ where: { userId: existing.id } });
    await prisma.garment.deleteMany({ where: { userId: existing.id } });
    await prisma.bodyProfile.deleteMany({ where: { userId: existing.id } });
    await prisma.user.delete({ where: { id: existing.id } });
    console.log('已清理旧数据');
  }

  // 1. 创建用户
  const passwordHash = await hashPassword('chenchen123');
  const user = await prisma.user.create({
    data: {
      email,
      nickname: '陈晨',
      gender: 'male',
      birthYear: 1995,
      passwordHash,
      stylePreferences: { casual: 0.7, formal: 0.3, street: 0.5, sport: 0.4 },
    },
  });
  console.log('用户创建成功:', user.id);

  // 2. 创建体型档案
  const bodyProfile = await prisma.bodyProfile.create({
    data: {
      userId: user.id,
      heightCm: 175,
      weightKg: 68,
      shoulderWidth: 44,
      chestCirc: 92,
      waistCirc: 76,
      hipCirc: 94,
      armLength: 62,
      legLength: 82,
      bodyType: '标准型',
      bodyDescription: '身高175cm，体重68kg，属于中等身材。肩宽44cm较为标准，胸围92cm适中，腰围76cm偏细，整体比例匀称。适合标准版型的服装，高腰款式可优化腰线。',
      isActive: true,
    },
  });
  console.log('体型档案创建成功:', bodyProfile.id);

  // 3. 创建衣橱单品
  const garments = await Promise.all([
    prisma.garment.create({
      data: {
        userId: user.id,
        name: '白色圆领纯棉T恤',
        category: 'top',
        subCategory: 't-shirt',
        colorPrimary: '白色',
        colorSecondary: '',
        material: '纯棉',
        pattern: '纯色',
        fitType: '标准',
        styleTags: ['休闲', '百搭'],
        seasonTags: ['春', '夏', '秋'],
        aiDescription: '经典白色圆领T恤，100%纯棉面料，舒适透气，标准版型，适合日常穿搭',
      },
    }),
    prisma.garment.create({
      data: {
        userId: user.id,
        name: '深蓝色修身牛仔裤',
        category: 'bottom',
        subCategory: 'jeans',
        colorPrimary: '深蓝色',
        colorSecondary: '',
        material: '牛仔',
        pattern: '纯色',
        fitType: '修身',
        styleTags: ['休闲', '街头'],
        seasonTags: ['春', '秋', '冬'],
        aiDescription: '深蓝色修身牛仔裤，经典五袋设计，微弹面料，修身但不紧绷',
      },
    }),
    prisma.garment.create({
      data: {
        userId: user.id,
        name: '黑色休闲西装外套',
        category: 'top',
        subCategory: 'blazer',
        colorPrimary: '黑色',
        colorSecondary: '',
        material: '混纺',
        pattern: '纯色',
        fitType: '修身',
        styleTags: ['商务', '正式'],
        seasonTags: ['春', '秋', '冬'],
        aiDescription: '黑色修身西装外套，单排扣设计，混纺面料挺括有型，适合通勤和正式场合',
      },
    }),
    prisma.garment.create({
      data: {
        userId: user.id,
        name: '灰色运动卫衣',
        category: 'top',
        subCategory: 'hoodie',
        colorPrimary: '灰色',
        colorSecondary: '',
        material: '棉涤混纺',
        pattern: '纯色',
        fitType: '宽松',
        styleTags: ['运动', '休闲'],
        seasonTags: ['春', '秋', '冬'],
        aiDescription: '灰色连帽卫衣，宽松版型，加绒内里，舒适保暖，适合运动和日常休闲',
      },
    }),
    prisma.garment.create({
      data: {
        userId: user.id,
        name: '卡其色休闲长裤',
        category: 'bottom',
        subCategory: 'chinos',
        colorPrimary: '卡其色',
        colorSecondary: '',
        material: '棉',
        pattern: '纯色',
        fitType: '标准',
        styleTags: ['休闲', '商务休闲'],
        seasonTags: ['春', '夏', '秋'],
        aiDescription: '卡其色直筒休闲裤，纯棉面料，标准版型，适合通勤和休闲场合',
      },
    }),
    prisma.garment.create({
      data: {
        userId: user.id,
        name: '白色低帮运动鞋',
        category: 'shoes',
        subCategory: 'sneakers',
        colorPrimary: '白色',
        colorSecondary: '灰色',
        material: '皮革+织物',
        pattern: '拼色',
        fitType: '标准',
        styleTags: ['运动', '休闲', '百搭'],
        seasonTags: ['春', '夏', '秋', '冬'],
        aiDescription: '白色低帮运动鞋，皮面拼接设计，缓震鞋底，百搭经典款',
      },
    }),
  ]);
  console.log('衣橱单品创建成功:', garments.length, '件');

  // 4. 为服装创建尺码表
  // 白色T恤尺码表
  await prisma.sizeChart.createMany({
    data: [
      { garmentId: garments[0].id, sizeSystem: 'asian', sizeLabel: 'S', chest: 92, shoulder: 42, sleeveLength: 19, totalLength: 66, sortOrder: 0 },
      { garmentId: garments[0].id, sizeSystem: 'asian', sizeLabel: 'M', chest: 96, shoulder: 44, sleeveLength: 20, totalLength: 68, sortOrder: 1 },
      { garmentId: garments[0].id, sizeSystem: 'asian', sizeLabel: 'L', chest: 100, shoulder: 46, sleeveLength: 21, totalLength: 70, sortOrder: 2 },
      { garmentId: garments[0].id, sizeSystem: 'asian', sizeLabel: 'XL', chest: 104, shoulder: 48, sleeveLength: 22, totalLength: 72, sortOrder: 3 },
    ],
  });

  // 牛仔裤尺码表
  await prisma.sizeChart.createMany({
    data: [
      { garmentId: garments[1].id, sizeSystem: 'asian', sizeLabel: 'S', waistCirc: 72, hipCirc: 90, inseam: 80, thighCirc: 52, frontRise: 25, sortOrder: 0 },
      { garmentId: garments[1].id, sizeSystem: 'asian', sizeLabel: 'M', waistCirc: 76, hipCirc: 94, inseam: 82, thighCirc: 54, frontRise: 26, sortOrder: 1 },
      { garmentId: garments[1].id, sizeSystem: 'asian', sizeLabel: 'L', waistCirc: 80, hipCirc: 98, inseam: 84, thighCirc: 56, frontRise: 27, sortOrder: 2 },
      { garmentId: garments[1].id, sizeSystem: 'asian', sizeLabel: 'XL', waistCirc: 84, hipCirc: 102, inseam: 86, thighCirc: 58, frontRise: 28, sortOrder: 3 },
    ],
  });

  // 西装外套尺码表
  await prisma.sizeChart.createMany({
    data: [
      { garmentId: garments[2].id, sizeSystem: 'asian', sizeLabel: 'S', chest: 88, shoulder: 42, sleeveLength: 60, totalLength: 70, sortOrder: 0 },
      { garmentId: garments[2].id, sizeSystem: 'asian', sizeLabel: 'M', chest: 92, shoulder: 44, sleeveLength: 62, totalLength: 72, sortOrder: 1 },
      { garmentId: garments[2].id, sizeSystem: 'asian', sizeLabel: 'L', chest: 96, shoulder: 46, sleeveLength: 64, totalLength: 74, sortOrder: 2 },
      { garmentId: garments[2].id, sizeSystem: 'asian', sizeLabel: 'XL', chest: 100, shoulder: 48, sleeveLength: 66, totalLength: 76, sortOrder: 3 },
    ],
  });

  // 卫衣尺码表
  await prisma.sizeChart.createMany({
    data: [
      { garmentId: garments[3].id, sizeSystem: 'asian', sizeLabel: 'S', chest: 100, shoulder: 46, sleeveLength: 60, totalLength: 65, sortOrder: 0 },
      { garmentId: garments[3].id, sizeSystem: 'asian', sizeLabel: 'M', chest: 104, shoulder: 48, sleeveLength: 62, totalLength: 67, sortOrder: 1 },
      { garmentId: garments[3].id, sizeSystem: 'asian', sizeLabel: 'L', chest: 108, shoulder: 50, sleeveLength: 64, totalLength: 69, sortOrder: 2 },
      { garmentId: garments[3].id, sizeSystem: 'asian', sizeLabel: 'XL', chest: 112, shoulder: 52, sleeveLength: 66, totalLength: 71, sortOrder: 3 },
    ],
  });

  // 卡其裤尺码表
  await prisma.sizeChart.createMany({
    data: [
      { garmentId: garments[4].id, sizeSystem: 'asian', sizeLabel: 'S', waistCirc: 72, hipCirc: 92, inseam: 80, sortOrder: 0 },
      { garmentId: garments[4].id, sizeSystem: 'asian', sizeLabel: 'M', waistCirc: 76, hipCirc: 96, inseam: 82, sortOrder: 1 },
      { garmentId: garments[4].id, sizeSystem: 'asian', sizeLabel: 'L', waistCirc: 80, hipCirc: 100, inseam: 84, sortOrder: 2 },
      { garmentId: garments[4].id, sizeSystem: 'asian', sizeLabel: 'XL', waistCirc: 84, hipCirc: 104, inseam: 86, sortOrder: 3 },
    ],
  });

  // 运动鞋尺码表
  await prisma.sizeChart.createMany({
    data: [
      { garmentId: garments[5].id, sizeSystem: 'asian', sizeLabel: '40', footLength: 25, footWidth: 9.5, sortOrder: 0 },
      { garmentId: garments[5].id, sizeSystem: 'asian', sizeLabel: '41', footLength: 25.5, footWidth: 9.7, sortOrder: 1 },
      { garmentId: garments[5].id, sizeSystem: 'asian', sizeLabel: '42', footLength: 26, footWidth: 10, sortOrder: 2 },
      { garmentId: garments[5].id, sizeSystem: 'asian', sizeLabel: '43', footLength: 26.5, footWidth: 10.2, sortOrder: 3 },
      { garmentId: garments[5].id, sizeSystem: 'asian', sizeLabel: '44', footLength: 27, footWidth: 10.5, sortOrder: 4 },
    ],
  });

  console.log('尺码表创建完成');
  console.log('\n=== 数据汇总 ===');
  console.log('用户:', user.email, '(' + user.nickname + ')');
  console.log('体型档案:', bodyProfile.heightCm + 'cm,', bodyProfile.weightKg + 'kg,', bodyProfile.bodyType);
  console.log('衣橱单品:', garments.length, '件');
  console.log('登录密码: chenchen123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
