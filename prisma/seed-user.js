const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'chenchenclaw@gmail.com';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('用户已存在，清理旧数据...');
    await prisma.tryonTask.deleteMany({ where: { userId: existing.id } });
    await prisma.sizeRecommendation.deleteMany({ where: { userId: existing.id } });
    await prisma.sizeChart.deleteMany({ where: { garment: { userId: existing.id } } });
    await prisma.outfit.deleteMany({ where: { userId: existing.id } });
    await prisma.post.deleteMany({ where: { userId: existing.id } });
    await prisma.garment.deleteMany({ where: { userId: existing.id } });
    await prisma.bodyProfile.deleteMany({ where: { userId: existing.id } });
    await prisma.user.delete({ where: { id: existing.id } });
  }

  const passwordHash = await bcrypt.hash('chenchen123', 12);
  const user = await prisma.user.create({
    data: { email, nickname: '陈晨', gender: 'male', birthYear: 1995, passwordHash, stylePreferences: { casual: 0.7, formal: 0.3, street: 0.5, sport: 0.4 } },
  });
  console.log('用户创建成功:', user.id, user.nickname);

  const bp = await prisma.bodyProfile.create({
    data: {
      userId: user.id, heightCm: 175, weightKg: 68, shoulderWidth: 44, chestCirc: 92,
      waistCirc: 76, hipCirc: 94, armLength: 62, legLength: 82, bodyType: '标准型',
      bodyDescription: '身高175cm，体重68kg，中等身材。肩宽44cm标准，胸围92cm适中，腰围76cm偏细，整体比例匀称。适合标准版型，高腰款式可优化腰线。',
      isActive: true,
    },
  });
  console.log('体型档案创建成功');

  const g = [];
  g[0] = await prisma.garment.create({ data: { userId: user.id, name: '白色圆领纯棉T恤', category: 'top', colorPrimary: '白色', material: '纯棉', pattern: '纯色', fitType: '标准', styleTags: ['休闲','百搭'], seasonTags: ['春','夏','秋'], aiDescription: '经典白色圆领T恤，纯棉面料，舒适透气' } });
  g[1] = await prisma.garment.create({ data: { userId: user.id, name: '深蓝色修身牛仔裤', category: 'bottom', colorPrimary: '深蓝色', material: '牛仔', pattern: '纯色', fitType: '修身', styleTags: ['休闲','街头'], seasonTags: ['春','秋','冬'], aiDescription: '深蓝色修身牛仔裤，微弹面料，修身不紧绷' } });
  g[2] = await prisma.garment.create({ data: { userId: user.id, name: '黑色休闲西装外套', category: 'top', colorPrimary: '黑色', material: '混纺', pattern: '纯色', fitType: '修身', styleTags: ['商务','正式'], seasonTags: ['春','秋','冬'], aiDescription: '黑色修身西装外套，单排扣，挺括有型' } });
  g[3] = await prisma.garment.create({ data: { userId: user.id, name: '灰色运动卫衣', category: 'top', colorPrimary: '灰色', material: '棉涤混纺', pattern: '纯色', fitType: '宽松', styleTags: ['运动','休闲'], seasonTags: ['春','秋','冬'], aiDescription: '灰色连帽卫衣，宽松版型，加绒保暖' } });
  g[4] = await prisma.garment.create({ data: { userId: user.id, name: '卡其色休闲长裤', category: 'bottom', colorPrimary: '卡其色', material: '棉', pattern: '纯色', fitType: '标准', styleTags: ['休闲','商务休闲'], seasonTags: ['春','夏','秋'], aiDescription: '卡其色直筒休闲裤，纯棉面料，通勤休闲皆宜' } });
  g[5] = await prisma.garment.create({ data: { userId: user.id, name: '白色低帮运动鞋', category: 'shoes', colorPrimary: '白色', material: '皮革+织物', pattern: '拼色', fitType: '标准', styleTags: ['运动','休闲','百搭'], seasonTags: ['春','夏','秋','冬'], aiDescription: '白色低帮运动鞋，皮面拼接，缓震鞋底' } });
  console.log('衣橱单品创建成功: 6件');

  await prisma.sizeChart.createMany({ data: [
    { garmentId: g[0].id, sizeSystem: 'asian', sizeLabel: 'S', chest: 92, shoulder: 42, sleeveLength: 19, totalLength: 66, sortOrder: 0 },
    { garmentId: g[0].id, sizeSystem: 'asian', sizeLabel: 'M', chest: 96, shoulder: 44, sleeveLength: 20, totalLength: 68, sortOrder: 1 },
    { garmentId: g[0].id, sizeSystem: 'asian', sizeLabel: 'L', chest: 100, shoulder: 46, sleeveLength: 21, totalLength: 70, sortOrder: 2 },
    { garmentId: g[0].id, sizeSystem: 'asian', sizeLabel: 'XL', chest: 104, shoulder: 48, sleeveLength: 22, totalLength: 72, sortOrder: 3 },
  ]});
  await prisma.sizeChart.createMany({ data: [
    { garmentId: g[1].id, sizeSystem: 'asian', sizeLabel: 'S', waistCirc: 72, hipCirc: 90, inseam: 80, thighCirc: 52, frontRise: 25, sortOrder: 0 },
    { garmentId: g[1].id, sizeSystem: 'asian', sizeLabel: 'M', waistCirc: 76, hipCirc: 94, inseam: 82, thighCirc: 54, frontRise: 26, sortOrder: 1 },
    { garmentId: g[1].id, sizeSystem: 'asian', sizeLabel: 'L', waistCirc: 80, hipCirc: 98, inseam: 84, thighCirc: 56, frontRise: 27, sortOrder: 2 },
    { garmentId: g[1].id, sizeSystem: 'asian', sizeLabel: 'XL', waistCirc: 84, hipCirc: 102, inseam: 86, thighCirc: 58, frontRise: 28, sortOrder: 3 },
  ]});
  await prisma.sizeChart.createMany({ data: [
    { garmentId: g[2].id, sizeSystem: 'asian', sizeLabel: 'S', chest: 88, shoulder: 42, sleeveLength: 60, totalLength: 70, sortOrder: 0 },
    { garmentId: g[2].id, sizeSystem: 'asian', sizeLabel: 'M', chest: 92, shoulder: 44, sleeveLength: 62, totalLength: 72, sortOrder: 1 },
    { garmentId: g[2].id, sizeSystem: 'asian', sizeLabel: 'L', chest: 96, shoulder: 46, sleeveLength: 64, totalLength: 74, sortOrder: 2 },
    { garmentId: g[2].id, sizeSystem: 'asian', sizeLabel: 'XL', chest: 100, shoulder: 48, sleeveLength: 66, totalLength: 76, sortOrder: 3 },
  ]});
  await prisma.sizeChart.createMany({ data: [
    { garmentId: g[3].id, sizeSystem: 'asian', sizeLabel: 'S', chest: 100, shoulder: 46, sleeveLength: 60, totalLength: 65, sortOrder: 0 },
    { garmentId: g[3].id, sizeSystem: 'asian', sizeLabel: 'M', chest: 104, shoulder: 48, sleeveLength: 62, totalLength: 67, sortOrder: 1 },
    { garmentId: g[3].id, sizeSystem: 'asian', sizeLabel: 'L', chest: 108, shoulder: 50, sleeveLength: 64, totalLength: 69, sortOrder: 2 },
    { garmentId: g[3].id, sizeSystem: 'asian', sizeLabel: 'XL', chest: 112, shoulder: 52, sleeveLength: 66, totalLength: 71, sortOrder: 3 },
  ]});
  await prisma.sizeChart.createMany({ data: [
    { garmentId: g[4].id, sizeSystem: 'asian', sizeLabel: 'S', waistCirc: 72, hipCirc: 92, inseam: 80, sortOrder: 0 },
    { garmentId: g[4].id, sizeSystem: 'asian', sizeLabel: 'M', waistCirc: 76, hipCirc: 96, inseam: 82, sortOrder: 1 },
    { garmentId: g[4].id, sizeSystem: 'asian', sizeLabel: 'L', waistCirc: 80, hipCirc: 100, inseam: 84, sortOrder: 2 },
    { garmentId: g[4].id, sizeSystem: 'asian', sizeLabel: 'XL', waistCirc: 84, hipCirc: 104, inseam: 86, sortOrder: 3 },
  ]});
  await prisma.sizeChart.createMany({ data: [
    { garmentId: g[5].id, sizeSystem: 'asian', sizeLabel: '40', footLength: 25, footWidth: 9.5, sortOrder: 0 },
    { garmentId: g[5].id, sizeSystem: 'asian', sizeLabel: '41', footLength: 25.5, footWidth: 9.7, sortOrder: 1 },
    { garmentId: g[5].id, sizeSystem: 'asian', sizeLabel: '42', footLength: 26, footWidth: 10, sortOrder: 2 },
    { garmentId: g[5].id, sizeSystem: 'asian', sizeLabel: '43', footLength: 26.5, footWidth: 10.2, sortOrder: 3 },
    { garmentId: g[5].id, sizeSystem: 'asian', sizeLabel: '44', footLength: 27, footWidth: 10.5, sortOrder: 4 },
  ]});
  console.log('尺码表创建完成');

  console.log('\n=== 数据汇总 ===');
  console.log('邮箱:', email);
  console.log('昵称: 陈晨');
  console.log('密码: chenchen123');
  console.log('体型: 175cm / 68kg / 标准型');
  console.log('衣橱: 6件单品（含尺码表）');
}

main().catch(console.error).finally(() => prisma.$disconnect());
