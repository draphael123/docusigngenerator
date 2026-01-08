import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mergeHeaderWithDocument, validateHeaderPdf, optimizeForDocuSign } from "@/lib/pdf-utils";
import { createDocuSignTemplate } from "@/lib/docusign";
import fs from "fs/promises";
import path from "path";

export async function GET(request: NextRequest) {
  const requests = await prisma.request.findMany({
    where: {},
    orderBy: { createdAt: "desc" },
    include: {
      documentTemplate: true,
    },
  });

  return NextResponse.json(requests);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      documentTemplateId,
      uploadedFileId,
      filledValues,
      roles,
      tabMap,
      docusignFriendly,
    } = body;

    // Validate header PDF exists
    await validateHeaderPdf();

    // Create request record (userId is optional now)
    const requestRecord = await prisma.request.create({
      data: {
        userId: "anonymous", // Use a default user ID for anonymous requests
        documentTemplateId: documentTemplateId || null,
        uploadedFileId: uploadedFileId || null,
        filledValues: filledValues || {},
        roles: roles || [],
        tabMap: tabMap || [],
        docusignFriendly: docusignFriendly || false,
        status: "pending",
      },
    });

    // Process the request asynchronously
    processRequest(requestRecord.id).catch((error) => {
      console.error(`Error processing request ${requestRecord.id}:`, error);
    });

    return NextResponse.json({ id: requestRecord.id, status: "pending" });
  } catch (error) {
    console.error("Error creating request:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

async function processRequest(requestId: string) {
  try {
    await prisma.request.update({
      where: { id: requestId },
      data: { status: "processing" },
    });

    const request = await prisma.request.findUnique({
      where: { id: requestId },
      include: { documentTemplate: true },
    });

    if (!request) {
      throw new Error("Request not found");
    }

    // Get DocuSign tokens from account (if available)
    const account = await prisma.account.findFirst({
      where: {
        provider: "docusign",
      },
    });

    if (!account || !account.access_token || !account.baseUrl) {
      throw new Error("DocuSign not connected. Please connect DocuSign first.");
    }

    // Generate PDF (simplified - in production, handle DOCX conversion, placeholder replacement, etc.)
    let pdfBuffer: Buffer;
    
    if (request.documentTemplateId && request.documentTemplate) {
      // Load template file
      const templatePath = path.join(process.cwd(), request.documentTemplate.filePath);
      // TODO: Replace placeholders and generate PDF
      pdfBuffer = await fs.readFile(templatePath);
    } else if (request.uploadedFileId) {
      // Load uploaded file
      const uploadPath = path.join(process.cwd(), "uploads", request.uploadedFileId);
      pdfBuffer = await fs.readFile(uploadPath);
    } else {
      throw new Error("No document source provided");
    }

    // Merge header
    let mergedPdf = await mergeHeaderWithDocument(pdfBuffer);

    // Optimize for DocuSign if requested
    if (request.docusignFriendly) {
      mergedPdf = await optimizeForDocuSign(mergedPdf);
    }

    // Save merged PDF
    const uploadsDir = path.join(process.cwd(), "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });
    const pdfPath = path.join(uploadsDir, `${requestId}.pdf`);
    await fs.writeFile(pdfPath, mergedPdf);

    // Create DocuSign template
    const templateName = `Template ${requestId}`;
    const templateId = await createDocuSignTemplate(
      account.access_token,
      account.providerAccountId, // accountId
      account.baseUrl, // baseUrl (guaranteed non-null by check above)
      templateName,
      mergedPdf,
      request.roles as Array<{ roleName: string; signingOrder: number }>,
      request.tabMap as Array<{ anchorName: string; roleName: string; tabType: string }>
    );

    // Update request
    await prisma.request.update({
      where: { id: requestId },
      data: {
        status: "completed",
        generatedPdfPath: pdfPath,
        docusignTemplateId: templateId,
      },
    });
  } catch (error) {
    await prisma.request.update({
      where: { id: requestId },
      data: {
        status: "failed",
      },
    });
    throw error;
  }
}
