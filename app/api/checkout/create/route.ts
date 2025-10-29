import { NextRequest, NextResponse } from "next/server";
import { whopsdk } from "@/lib/whop-sdk";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await whopsdk.verifyUserToken(await headers());
    const body = await request.json();
    const { experienceId } = body;

    if (!experienceId) {
      return NextResponse.json(
        { error: "experienceId is required" },
        { status: 400 }
      );
    }

    const experience = await whopsdk.experiences.retrieve(experienceId);
    
    const checkoutConfiguration = await whopsdk.checkoutConfigurations.create({
      plan: {
        company_id: experience.company.id,
        initial_price: 4900,
        plan_type: "renewal",
        renewal_price: 4900,
        release_method: "buy_now",
      },
      metadata: {
        experienceId: experienceId,
        userId: userId,
      },
    });

    return NextResponse.json(checkoutConfiguration);
  } catch (error) {
    console.error("Failed to create checkout configuration:", error);
    return NextResponse.json(
      { error: "Failed to create checkout configuration" },
      { status: 500 }
    );
  }
}
