import { FailedPaymentsClient } from './FailedPaymentsClient';
import { headers } from 'next/headers';
import { whopsdk } from '@/lib/whop-sdk';

export default async function FailedPaymentsPage({
  params,
}: {
  params: Promise<{ experienceId: string }>;
}) {
  const { experienceId } = await params;
  const { userId } = await whopsdk.verifyUserToken(await headers());

  const experience = await whopsdk.experiences.retrieve(experienceId);

  const adminUserId = process.env.NEXT_PUBLIC_WHOP_AGENT_USER_ID;
  let hasAccess = userId === adminUserId;
  
  if (!hasAccess) {
    try {
      const accessResponse = await whopsdk.users.checkAccess(experienceId, { id: userId });
      hasAccess = accessResponse.has_access;
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
            Failed payment recovery is available with Premium Access
          </p>
        </div>
      </div>
    );
  }

  return (
    <FailedPaymentsClient
      companyId={experience.company.id}
      experienceId={experienceId}
    />
  );
}
