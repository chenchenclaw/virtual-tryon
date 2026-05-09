import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils';

const TEMPLATES: Record<string, Record<string, { sizeLabel: string; sortOrder: number; [key: string]: string | number }[]>> = {
  top: {
    asian_male: [
      { sizeLabel: 'S', chest: 92, shoulder: 42, sleeveLength: 59, totalLength: 66, sortOrder: 0 },
      { sizeLabel: 'M', chest: 96, shoulder: 44, sleeveLength: 61, totalLength: 68, sortOrder: 1 },
      { sizeLabel: 'L', chest: 100, shoulder: 46, sleeveLength: 63, totalLength: 70, sortOrder: 2 },
      { sizeLabel: 'XL', chest: 104, shoulder: 48, sleeveLength: 65, totalLength: 72, sortOrder: 3 },
      { sizeLabel: 'XXL', chest: 108, shoulder: 50, sleeveLength: 67, totalLength: 74, sortOrder: 4 },
    ],
    asian_female: [
      { sizeLabel: 'S', chest: 80, shoulder: 36, sleeveLength: 55, totalLength: 58, sortOrder: 0 },
      { sizeLabel: 'M', chest: 84, shoulder: 38, sleeveLength: 57, totalLength: 60, sortOrder: 1 },
      { sizeLabel: 'L', chest: 88, shoulder: 40, sleeveLength: 59, totalLength: 62, sortOrder: 2 },
      { sizeLabel: 'XL', chest: 92, shoulder: 42, sleeveLength: 61, totalLength: 64, sortOrder: 3 },
    ],
    eu_male: [
      { sizeLabel: 'S', chest: 88, shoulder: 43, sleeveLength: 62, totalLength: 69, sortOrder: 0 },
      { sizeLabel: 'M', chest: 94, shoulder: 45, sleeveLength: 64, totalLength: 71, sortOrder: 1 },
      { sizeLabel: 'L', chest: 100, shoulder: 47, sleeveLength: 66, totalLength: 73, sortOrder: 2 },
      { sizeLabel: 'XL', chest: 106, shoulder: 49, sleeveLength: 68, totalLength: 75, sortOrder: 3 },
    ],
  },
  bottom: {
    asian_male: [
      { sizeLabel: 'S', waistCirc: 72, hipCirc: 90, inseam: 78, thighCirc: 52, frontRise: 24, sortOrder: 0 },
      { sizeLabel: 'M', waistCirc: 76, hipCirc: 94, inseam: 80, thighCirc: 54, frontRise: 25, sortOrder: 1 },
      { sizeLabel: 'L', waistCirc: 80, hipCirc: 98, inseam: 82, thighCirc: 56, frontRise: 26, sortOrder: 2 },
      { sizeLabel: 'XL', waistCirc: 84, hipCirc: 102, inseam: 84, thighCirc: 58, frontRise: 27, sortOrder: 3 },
      { sizeLabel: 'XXL', waistCirc: 88, hipCirc: 106, inseam: 86, thighCirc: 60, frontRise: 28, sortOrder: 4 },
    ],
    asian_female: [
      { sizeLabel: 'S', waistCirc: 62, hipCirc: 86, inseam: 76, thighCirc: 48, frontRise: 23, sortOrder: 0 },
      { sizeLabel: 'M', waistCirc: 66, hipCirc: 90, inseam: 78, thighCirc: 50, frontRise: 24, sortOrder: 1 },
      { sizeLabel: 'L', waistCirc: 70, hipCirc: 94, inseam: 80, thighCirc: 52, frontRise: 25, sortOrder: 2 },
      { sizeLabel: 'XL', waistCirc: 74, hipCirc: 98, inseam: 82, thighCirc: 54, frontRise: 26, sortOrder: 3 },
    ],
    eu_male: [
      { sizeLabel: 'S', waistCirc: 74, hipCirc: 92, inseam: 80, thighCirc: 53, frontRise: 25, sortOrder: 0 },
      { sizeLabel: 'M', waistCirc: 80, hipCirc: 98, inseam: 82, thighCirc: 56, frontRise: 26, sortOrder: 1 },
      { sizeLabel: 'L', waistCirc: 86, hipCirc: 104, inseam: 84, thighCirc: 59, frontRise: 27, sortOrder: 2 },
      { sizeLabel: 'XL', waistCirc: 92, hipCirc: 110, inseam: 86, thighCirc: 62, frontRise: 28, sortOrder: 3 },
    ],
  },
  dress: {
    asian_female: [
      { sizeLabel: 'S', chest: 80, shoulder: 36, waistCirc: 62, hipCirc: 86, totalLength: 95, sortOrder: 0 },
      { sizeLabel: 'M', chest: 84, shoulder: 38, waistCirc: 66, hipCirc: 90, totalLength: 97, sortOrder: 1 },
      { sizeLabel: 'L', chest: 88, shoulder: 40, waistCirc: 70, hipCirc: 94, totalLength: 99, sortOrder: 2 },
      { sizeLabel: 'XL', chest: 92, shoulder: 42, waistCirc: 74, hipCirc: 98, totalLength: 101, sortOrder: 3 },
    ],
  },
  shoes: {
    asian_male: [
      { sizeLabel: '39', footLength: 24.5, footWidth: 9.3, sortOrder: 0 },
      { sizeLabel: '40', footLength: 25, footWidth: 9.5, sortOrder: 1 },
      { sizeLabel: '41', footLength: 25.5, footWidth: 9.7, sortOrder: 2 },
      { sizeLabel: '42', footLength: 26, footWidth: 10, sortOrder: 3 },
      { sizeLabel: '43', footLength: 26.5, footWidth: 10.2, sortOrder: 4 },
      { sizeLabel: '44', footLength: 27, footWidth: 10.5, sortOrder: 5 },
    ],
    asian_female: [
      { sizeLabel: '35', footLength: 22.5, footWidth: 8.5, sortOrder: 0 },
      { sizeLabel: '36', footLength: 23, footWidth: 8.7, sortOrder: 1 },
      { sizeLabel: '37', footLength: 23.5, footWidth: 8.9, sortOrder: 2 },
      { sizeLabel: '38', footLength: 24, footWidth: 9.1, sortOrder: 3 },
      { sizeLabel: '39', footLength: 24.5, footWidth: 9.3, sortOrder: 4 },
    ],
  },
};

const TEMPLATE_LABELS: Record<string, string> = {
  asian_male: '亚洲男装',
  asian_female: '亚洲女装',
  eu_male: '欧美男装',
  eu_female: '欧美女装',
};

export async function GET(req: NextRequest, { params }: { params: { category: string } }) {
  const user = await getCurrentUser();
  if (!user) return apiError('未登录', 401);

  const category = params.category;
  const templates = TEMPLATES[category];

  if (!templates) return apiSuccess({ templates: [] });

  const result = Object.entries(templates).map(([key, sizes]) => ({
    key,
    label: TEMPLATE_LABELS[key] || key,
    sizes,
  }));

  return apiSuccess({ templates: result });
}
