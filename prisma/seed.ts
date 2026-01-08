import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs/promises';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding document templates...');

  // Create templates directory if it doesn't exist
  const templatesDir = path.join(process.cwd(), 'templates');
  await fs.mkdir(templatesDir, { recursive: true });

  // Template 1: Letter of Recommendation
  const lorPath = path.join(templatesDir, 'letter-of-recommendation.docx');
  // Create a placeholder file (in production, these would be actual DOCX files)
  await fs.writeFile(lorPath, 'Placeholder DOCX content - replace with actual template');

  const lor = await prisma.documentTemplate.upsert({
    where: { id: 'lor-1' },
    update: {},
    create: {
      id: 'lor-1',
      name: 'Letter of Recommendation',
      category: 'Recommendation',
      filePath: lorPath,
      placeholders: [
        { name: 'FULL_NAME', label: 'Full Name', required: true, type: 'text' },
        { name: 'START_DATE', label: 'Start Date', required: true, type: 'date' },
        { name: 'END_DATE', label: 'End Date', required: false, type: 'date' },
        { name: 'POSITION', label: 'Position', required: true, type: 'text' },
        { name: 'RECOMMENDATION_TEXT', label: 'Recommendation Text', required: true, type: 'text' },
      ],
      anchors: [
        { name: 'SIGNATURE_RECOMMENDER', label: 'Recommender Signature', tabType: 'signature', required: true },
        { name: 'DATE_SIGNED', label: 'Date Signed', tabType: 'date', required: true },
      ],
      defaultRoles: [
        { roleName: 'Recommender', signingOrder: 1 },
      ],
      defaultTabMap: [
        { anchorName: 'SIGNATURE_RECOMMENDER', roleName: 'Recommender', tabType: 'signature' },
        { anchorName: 'DATE_SIGNED', roleName: 'Recommender', tabType: 'date' },
      ],
    },
  });

  // Template 2: Contractor Verification Letter
  const cvlPath = path.join(templatesDir, 'contractor-verification-letter.docx');
  await fs.writeFile(cvlPath, 'Placeholder DOCX content - replace with actual template');

  const cvl = await prisma.documentTemplate.upsert({
    where: { id: 'cvl-1' },
    update: {},
    create: {
      id: 'cvl-1',
      name: 'Contractor Verification Letter',
      category: 'Verification',
      filePath: cvlPath,
      placeholders: [
        { name: 'CONTRACTOR_NAME', label: 'Contractor Name', required: true, type: 'text' },
        { name: 'VERIFICATION_DATE', label: 'Verification Date', required: true, type: 'date' },
        { name: 'CONTRACT_DETAILS', label: 'Contract Details', required: true, type: 'text' },
      ],
      anchors: [
        { name: 'SIGNATURE_CONTRACTOR', label: 'Contractor Signature', tabType: 'signature', required: true },
        { name: 'SIGNATURE_CCOO', label: 'CCOO Signature', tabType: 'signature', required: true },
        { name: 'DATE_SIGNED', label: 'Date Signed', tabType: 'date', required: true },
      ],
      defaultRoles: [
        { roleName: 'Contractor', signingOrder: 1 },
        { roleName: 'CCOO', signingOrder: 2 },
      ],
      defaultTabMap: [
        { anchorName: 'SIGNATURE_CONTRACTOR', roleName: 'Contractor', tabType: 'signature' },
        { anchorName: 'SIGNATURE_CCOO', roleName: 'CCOO', tabType: 'signature' },
        { anchorName: 'DATE_SIGNED', roleName: 'CCOO', tabType: 'date' },
      ],
    },
  });

  // Template 3: Contractor End of Agreement
  const ceaPath = path.join(templatesDir, 'contractor-end-of-agreement.docx');
  await fs.writeFile(ceaPath, 'Placeholder DOCX content - replace with actual template');

  const cea = await prisma.documentTemplate.upsert({
    where: { id: 'cea-1' },
    update: {},
    create: {
      id: 'cea-1',
      name: 'Contractor End of Agreement',
      category: 'Agreement',
      filePath: ceaPath,
      placeholders: [
        { name: 'CONTRACTOR_NAME', label: 'Contractor Name', required: true, type: 'text' },
        { name: 'AGREEMENT_START_DATE', label: 'Agreement Start Date', required: true, type: 'date' },
        { name: 'AGREEMENT_END_DATE', label: 'Agreement End Date', required: true, type: 'date' },
        { name: 'TERMINATION_REASON', label: 'Termination Reason', required: false, type: 'text' },
      ],
      anchors: [
        { name: 'SIGNATURE_CONTRACTOR', label: 'Contractor Signature', tabType: 'signature', required: true },
        { name: 'SIGNATURE_ADMIN', label: 'Administrator Signature', tabType: 'signature', required: true },
        { name: 'DATE_SIGNED', label: 'Date Signed', tabType: 'date', required: true },
      ],
      defaultRoles: [
        { roleName: 'Contractor', signingOrder: 1 },
        { roleName: 'Administrator', signingOrder: 2 },
      ],
      defaultTabMap: [
        { anchorName: 'SIGNATURE_CONTRACTOR', roleName: 'Contractor', tabType: 'signature' },
        { anchorName: 'SIGNATURE_ADMIN', roleName: 'Administrator', tabType: 'signature' },
        { anchorName: 'DATE_SIGNED', roleName: 'Administrator', tabType: 'date' },
      ],
    },
  });

  console.log('Seeded templates:', { lor, cvl, cea });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });





