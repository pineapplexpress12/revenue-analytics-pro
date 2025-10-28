import { MemberProfileClient } from './MemberProfileClient';
import { headers } from 'next/headers';
import { whopsdk } from '@/lib/whop-sdk';

export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ experienceId: string; memberId: string }>;
}) {
  const { experienceId, memberId } = await params;
  const { userId } = await whopsdk.verifyUserToken(await headers());

  const experience = await whopsdk.experiences.retrieve(experienceId);

  // Check access
  const adminUserId = process.env.NEXT_PUBLIC_WHOP_AGENT_USER_ID;
  let hasAccess = userId === adminUserId;
  
  if (!hasAccess) {
    try {
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

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--whop-text-primary)] mb-2">
            Premium Feature
          </h1>
          <p className="text-[var(--whop-text-secondary)]">
            Member profiles are available with Premium Access
          </p>
        </div>
      </div>
    );
  }

  return (
    <MemberProfileClient
      companyId={experience.company.id}
      memberId={memberId}
      experienceId={experienceId}
    />
  );
}
