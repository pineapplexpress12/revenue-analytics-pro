import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";

export async function POST(request: NextRequest) {
  try {
    await whopsdk.verifyUserToken(await headers());
    const body = await request.json();
    const { experienceId } = body;

    if (!experienceId) {
      return NextResponse.json(
        { error: "experienceId is required" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      planId: process.env.NEXT_PUBLIC_PREMIUM_PLAN_ID,
    });
  } catch (error) {
    console.error("Failed to create checkout:", error);
    return NextResponse.json(
      { error: "Failed to create checkout" },
      { status: 500 }
    );
  }
}
