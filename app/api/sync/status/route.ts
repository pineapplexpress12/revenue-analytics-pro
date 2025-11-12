import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { syncLogs, companies } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const whopCompanyId = searchParams.get("companyId");

		if (!whopCompanyId) {
			return NextResponse.json(
				{ error: "companyId is required" },
				{ status: 400 }
			);
		}

		const company = await db
			.select()
			.from(companies)
			.where(eq(companies.whopCompanyId, whopCompanyId))
			.limit(1);

		if (!company[0]) {
			return NextResponse.json({ status: "not_started" });
		}

		const dbCompanyId = company[0].id;

		const recentSyncs = await db
			.select()
			.from(syncLogs)
			.where(
				and(
					eq(syncLogs.companyId, dbCompanyId),
					eq(syncLogs.syncType, "full")
				)
			)
			.orderBy(desc(syncLogs.startedAt))
			.limit(50);

		if (!recentSyncs || recentSyncs.length === 0) {
			return NextResponse.json({ status: "not_started" });
		}

		const latestSync = recentSyncs[0];
		const latestSyncStartTime = new Date(latestSync.startedAt).getTime();
		const syncWindow = 5 * 60 * 1000;

		const currentSyncLogs = recentSyncs.filter(sync => {
			const syncTime = new Date(sync.startedAt).getTime();
			return Math.abs(syncTime - latestSyncStartTime) < syncWindow;
		});

		const entityTypes = ["products", "plans", "members", "memberships", "payments"];
		const completedEntities = currentSyncLogs
			.filter(sync => sync.status === "completed")
			.map(sync => sync.entityType);

		const allCompleted = entityTypes.every(type => completedEntities.includes(type));

		const hasFailed = currentSyncLogs.some(sync => sync.status === "failed");

		if (hasFailed) {
			return NextResponse.json({
				status: "failed",
				error: recentSyncs.find(sync => sync.status === "failed")?.errorMessage || "Sync failed"
			});
		}

		if (allCompleted) {
			return NextResponse.json({
				status: "completed",
				completedAt: latestSync.completedAt
			});
		}

		const progress = Math.round((completedEntities.length / entityTypes.length) * 100);

		return NextResponse.json({
			status: "in_progress",
			progress,
			completedEntities
		});
	} catch (error) {
		console.error("Error checking sync status:", error);
		return NextResponse.json(
			{ error: "Failed to check sync status" },
			{ status: 500 }
		);
	}
}
