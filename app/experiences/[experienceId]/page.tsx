import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";
import { DashboardClient } from "./DashboardClient";

export default async function ExperiencePage({
	params,
}: {
	params: Promise<{ experienceId: string }>;
}) {
	const { experienceId } = await params;
	const { userId } = await whopsdk.verifyUserToken(await headers());

	const [experience, user] = await Promise.all([
		whopsdk.experiences.retrieve(experienceId),
		whopsdk.users.retrieve(userId),
	]);

	const adminUserId = process.env.NEXT_PUBLIC_WHOP_AGENT_USER_ID;
	let hasAccess = userId === adminUserId;
	
	if (!hasAccess) {
		try {
			const premiumAccessPassId = process.env.NEXT_PUBLIC_PREMIUM_ACCESS_PASS_ID!;
			const accessResponse = await whopsdk.users.checkAccess(premiumAccessPassId, { id: userId });
			hasAccess = accessResponse.has_access;
		} catch (error) {
			console.error("Access check failed:", error);
			hasAccess = false;
		}
	}

	return (
		<DashboardClient 
			companyId={experience.company.id}
			companyName={experience.company.title}
			userName={user.name || user.username}
			hasAccess={hasAccess}
			isAdmin={userId === adminUserId}
		/>
	);
}
