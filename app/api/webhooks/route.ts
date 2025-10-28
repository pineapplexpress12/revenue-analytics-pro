import { waitUntil } from "@vercel/functions";
import type { NextRequest } from "next/server";
import { whopsdk } from "@/lib/whop-sdk";
import { db } from "@/lib/db";
import { memberships, payments, members, companies } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { invalidateMetricCache } from "@/lib/metrics-cache";

export async function POST(request: NextRequest): Promise<Response> {
	const requestBodyText = await request.text();
	const headers = Object.fromEntries(request.headers);
	const webhookData = whopsdk.webhooks.unwrap(requestBodyText, { headers });

	console.log("Webhook received:", webhookData.type);

	if (webhookData.type === "membership.activated") {
		waitUntil(handleMembershipValid(webhookData.data));
	}

	if (webhookData.type === "membership.deactivated") {
		waitUntil(handleMembershipInvalid(webhookData.data));
	}

	if (webhookData.type === "payment.succeeded") {
		waitUntil(handlePaymentSucceeded(webhookData.data));
	}

	if (webhookData.type === "payment.failed") {
		waitUntil(handlePaymentFailed(webhookData.data));
	}

	return new Response("OK", { status: 200 });
}

async function handleMembershipValid(membership: any) {
	try {
		const company = await db
			.select()
			.from(companies)
			.where(eq(companies.whopCompanyId, membership.company_id))
			.limit(1);

		if (!company[0]) {
			console.error("Company not found:", membership.company_id);
			return;
		}

		const dbMember = await db
			.select()
			.from(members)
			.where(eq(members.whopUserId, membership.user_id))
			.limit(1);

		if (dbMember[0]) {
			await db
				.insert(memberships)
				.values({
					companyId: company[0].id,
					memberId: dbMember[0].id,
					productId: membership.product_id,
					planId: membership.plan_id,
					whopMembershipId: membership.id,
					status: "active",
					startDate: new Date(membership.created_at * 1000),
					endDate: membership.expires_at
						? new Date(membership.expires_at * 1000)
						: null,
					metadata: membership,
				})
				.onConflictDoUpdate({
					target: memberships.whopMembershipId,
					set: {
						status: "active",
						endDate: membership.expires_at
							? new Date(membership.expires_at * 1000)
							: null,
						metadata: membership,
					},
				});

			console.log("Membership activated:", membership.id);
			
			await invalidateMetricCache(company[0].id);
		}
	} catch (error) {
		console.error("Error handling membership.went_valid:", error);
	}
}

async function handleMembershipInvalid(membership: any) {
	try {
		await db
			.update(memberships)
			.set({
				status: "cancelled",
				metadata: membership,
			})
			.where(eq(memberships.whopMembershipId, membership.id));

		console.log("Membership cancelled:", membership.id);
		
		const company = await db
			.select()
			.from(companies)
			.where(eq(companies.whopCompanyId, membership.company_id))
			.limit(1);
		
		if (company[0]) {
			await invalidateMetricCache(company[0].id);
		}
	} catch (error) {
		console.error("Error handling membership.went_invalid:", error);
	}
}

async function handlePaymentSucceeded(payment: any) {
	try {
		const company = await db
			.select()
			.from(companies)
			.where(eq(companies.whopCompanyId, payment.company_id))
			.limit(1);

		if (!company[0]) {
			console.error("Company not found:", payment.company_id);
			return;
		}

		const dbMember = await db
			.select()
			.from(members)
			.where(eq(members.whopUserId, payment.user_id))
			.limit(1);

		if (dbMember[0]) {
			await db
				.insert(payments)
				.values({
					companyId: company[0].id,
					memberId: dbMember[0].id,
					whopPaymentId: payment.id,
					amount: String(payment.final_amount / 100),
					currency: payment.currency || "USD",
					status: "succeeded",
					paymentDate: new Date(payment.created_at * 1000),
					metadata: payment,
				})
				.onConflictDoUpdate({
					target: payments.whopPaymentId,
					set: {
						status: "succeeded",
						metadata: payment,
					},
				});

			console.log("Payment succeeded:", payment.id);
			
			await invalidateMetricCache(company[0].id);
		}
	} catch (error) {
		console.error("Error handling payment.succeeded:", error);
	}
}

async function handlePaymentFailed(payment: any) {
	try {
		await db
			.update(payments)
			.set({
				status: "failed",
				metadata: payment,
			})
			.where(eq(payments.whopPaymentId, payment.id));

		console.log("Payment failed:", payment.id);
		
		const company = await db
			.select()
			.from(companies)
			.where(eq(companies.whopCompanyId, payment.company_id))
			.limit(1);
		
		if (company[0]) {
			await invalidateMetricCache(company[0].id);
		}
	} catch (error) {
		console.error("Error handling payment.failed:", error);
	}
}
