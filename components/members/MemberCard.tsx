import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { getChurnRiskLabel } from '@/lib/analytics/member-scoring';
import { AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';
import { useState } from 'react';

interface MemberCardProps {
  member: {
    id: string;
    whopUserId: string;
    email: string | null;
    username: string | null;
    profilePictureUrl: string | null;
    createdAt: Date;
    analytics: {
      totalRevenue: number;
      churnRiskScore: number;
      engagementScore: number;
      lastPaymentAt: Date | null;
    } | null;
  };
  companyId: string;
}

export function MemberCard({ member, companyId }: MemberCardProps) {
  const [imageError, setImageError] = useState(false);
  const riskLevel = member.analytics 
    ? getChurnRiskLabel(member.analytics.churnRiskScore)
    : 'Low';
  
  const displayName = member.username || member.email || 'Unknown User';
  
  return (
    <Link href={`/experiences/${companyId}/members/${member.id}`}>
      <div className="whop-card hover:border-gray-600 transition-all cursor-pointer">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            {member.profilePictureUrl && !imageError ? (
              <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-700">
                <Image
                  src={member.profilePictureUrl}
                  alt={displayName}
                  fill
                  className="object-cover"
                  onError={() => setImageError(true)}
                  unoptimized
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            
            <div>
              <h3 className="font-semibold text-lg text-[var(--whop-text-primary)]">
                {displayName}
              </h3>
              {member.email && member.username && (
                <p className="text-sm text-[var(--whop-text-secondary)]">{member.email}</p>
              )}
              <p className="text-xs text-[var(--whop-text-tertiary)] mt-1">
                Member for {formatDistanceToNow(new Date(member.createdAt))}
              </p>
            </div>
          </div>
          
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-medium ${
            riskLevel === 'High' 
              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
              : riskLevel === 'Medium'
              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
              : 'bg-green-500/20 text-green-400 border border-green-500/30'
          }`}>
            {riskLevel === 'High' && <AlertCircle className="w-3.5 h-3.5" />}
            {riskLevel === 'Low' && <CheckCircle className="w-3.5 h-3.5" />}
            {riskLevel === 'Medium' && <TrendingUp className="w-3.5 h-3.5" />}
            {riskLevel} Risk
          </div>
        </div>
        
        {member.analytics && (
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[var(--whop-border)]">
            <div>
              <p className="text-xs text-[var(--whop-text-tertiary)] mb-1">Total Revenue</p>
              <p className="text-lg font-bold text-[var(--whop-text-primary)]">
                ${member.analytics.totalRevenue.toFixed(2)}
              </p>
            </div>
            
            <div>
              <p className="text-xs text-[var(--whop-text-tertiary)] mb-1">Engagement</p>
              <p className="text-lg font-bold text-[var(--whop-text-primary)]">
                {member.analytics.engagementScore}/100
              </p>
            </div>
            
            <div>
              <p className="text-xs text-[var(--whop-text-tertiary)] mb-1">Last Payment</p>
              <p className="text-sm font-medium text-[var(--whop-text-secondary)]">
                {member.analytics.lastPaymentAt 
                  ? formatDistanceToNow(new Date(member.analytics.lastPaymentAt), { addSuffix: true })
                  : 'Never'
                }
              </p>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
