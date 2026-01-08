import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const templates = await prisma.documentTemplate.findMany({
    where: { isArchived: false },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(templates);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

