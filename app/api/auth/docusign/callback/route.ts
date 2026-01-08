import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { exchangeCodeForToken } from "@/lib/docusign";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/dashboard?error=${encodeURIComponent(error)}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/dashboard?error=missing_code", request.url)
    );
  }

  try {
    const tokens = await exchangeCodeForToken(code);
    
    // Store tokens in session or database (for MVP, we'll store in session)
    // In production, store securely in database with encryption
    
    // Update user account with DocuSign connection info
    await prisma.account.upsert({
      where: {
        provider_providerAccountId: {
          provider: "docusign",
          providerAccountId: tokens.accountId,
        },
      },
      update: {
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        expires_at: Math.floor(Date.now() / 1000) + tokens.expiresIn,
        baseUrl: tokens.baseUrl,
      },
      create: {
        userId: session.user.id,
        type: "oauth",
        provider: "docusign",
        providerAccountId: tokens.accountId,
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        expires_at: Math.floor(Date.now() / 1000) + tokens.expiresIn,
        baseUrl: tokens.baseUrl,
      },
    });

    return NextResponse.redirect(
      new URL("/dashboard?connected=docusign", request.url)
    );
  } catch (error) {
    console.error("DocuSign OAuth error:", error);
    return NextResponse.redirect(
      new URL(
        `/dashboard?error=${encodeURIComponent(error instanceof Error ? error.message : "oauth_failed")}`,
        request.url
      )
    );
  }
}

