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

	// Check if user has premium access by checking their memberships
	// Admin users bypass payment check
	const adminUserId = process.env.NEXT_PUBLIC_WHOP_AGENT_USER_ID;
	let hasAccess = userId === adminUserId;
	
	console.log('Access Check:', { userId, adminUserId, hasAccess });
	
	if (!hasAccess) {
		try {
			// Fetch user's valid memberships
			const membershipsResponse = await fetch(
				`https://api.whop.com/api/v5/memberships?valid=true&user_id=${userId}`,
				{
					headers: {
						Authorization: `Bearer ${process.env.WHOP_API_KEY}`,
					},
				}
			);
			
			if (membershipsResponse.ok) {
				const membershipsData = await membershipsResponse.json();
				const premiumAccessPassId = process.env.NEXT_PUBLIC_PREMIUM_ACCESS_PASS_ID!;
				
				// Check if user has membership with our premium access pass
				hasAccess = membershipsData.data?.some(
					(membership: any) => 
						membership.access_pass?.id === premiumAccessPassId && 
						membership.valid === true
				) || false;
			}
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
