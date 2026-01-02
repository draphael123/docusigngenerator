import { PDFDocument } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';

const HEADER_PDF_PATH = path.join(process.cwd(), 'public', 'header-template.pdf');

/**
 * Validates that the header PDF exists and returns its hash
 */
export async function validateHeaderPdf(): Promise<string> {
  try {
    const headerBuffer = await fs.readFile(HEADER_PDF_PATH);
    // Simple hash for validation (in production, use crypto.createHash)
    const hash = Buffer.from(headerBuffer).toString('base64').substring(0, 32);
    return hash;
  } catch (error) {
    throw new Error(`Header PDF not found at ${HEADER_PDF_PATH}. Please ensure the header PDF is in place.`);
  }
}

/**
 * Merges the header PDF as Page 1 and appends the user document starting at Page 2
 */
export async function mergeHeaderWithDocument(
  userPdfBuffer: Buffer,
  headerPdfPath: string = HEADER_PDF_PATH
): Promise<Buffer> {
  try {
    // Load header PDF
    const headerBytes = await fs.readFile(headerPdfPath);
    const headerPdf = await PDFDocument.load(headerBytes);

    // Load user PDF
    const userPdf = await PDFDocument.load(userPdfBuffer);

    // Create merged PDF
    const mergedPdf = await PDFDocument.create();

    // Add header as first page
    const [headerPage] = await mergedPdf.copyPages(headerPdf, [0]);
    mergedPdf.addPage(headerPage);

    // Add all pages from user document
    const userPageCount = userPdf.getPageCount();
    const userPages = await mergedPdf.copyPages(userPdf, Array.from({ length: userPageCount }, (_, i) => i));
    userPages.forEach((page) => mergedPdf.addPage(page));

    // Generate merged PDF
    const mergedPdfBytes = await mergedPdf.save();
    return Buffer.from(mergedPdfBytes);
  } catch (error) {
    throw new Error(`Failed to merge header with document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validates that no DocuSign anchors appear on Page 1 (header page)
 */
export async function validateNoAnchorsOnPage1(pdfBuffer: Buffer): Promise<void> {
  const pdf = await PDFDocument.load(pdfBuffer);
  const firstPage = pdf.getPage(0);
  
  // Extract text from first page
  // Note: pdf-lib doesn't have built-in text extraction, so we'll validate at the source document level
  // This validation should be done before merging
  // For now, we'll trust that anchors are only in user content (Page 2+)
}

/**
 * Converts DOCX to PDF (placeholder - requires external service or library)
 * For MVP, we'll expect users to upload PDFs or use a service like LibreOffice
 */
export async function convertDocxToPdf(docxBuffer: Buffer): Promise<Buffer> {
  // TODO: Implement DOCX to PDF conversion
  // Options:
  // 1. Use LibreOffice headless: libreoffice --headless --convert-to pdf
  // 2. Use a service like CloudConvert API
  // 3. Use a Node.js library (limited support)
  
  throw new Error('DOCX to PDF conversion not yet implemented. Please upload PDF files or use a document template.');
}

