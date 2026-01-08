import { NextRequest, NextResponse } from "next/server";
import { getDocuSignAuthUrl } from "@/lib/docusign";

export async function GET(request: NextRequest) {
  const authUrl = getDocuSignAuthUrl();
  return NextResponse.json({ authUrl });
}
