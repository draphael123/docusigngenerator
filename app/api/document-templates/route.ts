import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const templates = await prisma.documentTemplate.findMany({
    where: { isArchived: false },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(templates);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, category, filePath, placeholders, anchors, defaultRoles, defaultTabMap } = body;

    const template = await prisma.documentTemplate.create({
      data: {
        name,
        category,
        filePath,
        placeholders: placeholders || [],
        anchors: anchors || [],
        defaultRoles: defaultRoles || [],
        defaultTabMap: defaultTabMap || {},
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error("Error creating document template:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
