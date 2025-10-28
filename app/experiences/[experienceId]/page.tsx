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

	const [experience, user, access] = await Promise.all([
		whopsdk.experiences.retrieve(experienceId),
		whopsdk.users.retrieve(userId),
		whopsdk.users.checkAccess(experienceId, { id: userId }),
	]);

	return (
		<DashboardClient 
			companyId={experience.company.id}
			companyName={experience.company.title}
			userName={user.name || user.username}
			hasAccess={access.has_access}
		/>
	);
}
