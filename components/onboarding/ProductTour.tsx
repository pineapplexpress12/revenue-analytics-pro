'use client';

import { useState } from 'react';
import { X, BarChart3, Users, CreditCard } from 'lucide-react';
import Link from 'next/link';

interface ProductTourProps {
  experienceId: string;
  companyId?: string;
}

export function ProductTour({ experienceId, companyId }: ProductTourProps) {
  const [dismissed, setDismissed] = useState(false);
  const [currentTip, setCurrentTip] = useState(0);
  
  const handleDismiss = () => {
    setDismissed(true);
    if (companyId) {
      localStorage.setItem(`tour-seen-${companyId}`, 'true');
    }
  };
  
  const tips = [
    {
      icon: BarChart3,
      title: "Check Your Cohort Retention",
      description: "See which signup months have the best retention rates. Scroll down to find the Cohort Analysis table.",
      link: `/experiences/${experienceId}`,
      color: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    },
    {
      icon: Users,
      title: "Identify At-Risk Members",
      description: "View members with high churn risk scores and take action before they leave.",
      link: `/experiences/${experienceId}/members`,
      color: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    },
    {
      icon: CreditCard,
      title: "Recover Failed Payments",
      description: "Track failed payments and get recovery recommendations to maximize revenue.",
      link: `/experiences/${experienceId}/failed-payments`,
      color: 'bg-red-500/20 text-red-400 border-red-500/30'
    }
  ];
  
  if (dismissed) return null;
  
  const tip = tips[currentTip];
  const TipIcon = tip.icon;
  
  return (
    <div className={`whop-card border ${tip.color}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className={`p-2 rounded-lg ${tip.color} flex-shrink-0`}>
            <TipIcon className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-[var(--whop-text-primary)] mb-1">
              {tip.title}
            </h4>
            <p className="text-sm text-[var(--whop-text-secondary)] mb-3">
              {tip.description}
            </p>
            <div className="flex items-center gap-2">
              <Link
                href={tip.link}
                className="px-4 py-2 text-sm bg-[var(--whop-accent)] text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
              >
                View Now
              </Link>
              {currentTip < tips.length - 1 ? (
                <button
                  onClick={() => setCurrentTip(currentTip + 1)}
                  className="px-4 py-2 text-sm bg-[var(--whop-bg)] border border-[var(--whop-border)] text-[var(--whop-text-primary)] rounded-lg font-medium hover:border-gray-600 transition-colors"
                >
                  Next Tip ({currentTip + 2}/{tips.length})
                </button>
              ) : (
                <button
                  onClick={handleDismiss}
                  className="px-4 py-2 text-sm bg-[var(--whop-bg)] border border-[var(--whop-border)] text-[var(--whop-text-primary)] rounded-lg font-medium hover:border-gray-600 transition-colors"
                >
                  Got It
                </button>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="p-2 hover:bg-[var(--whop-bg)] rounded-lg transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4 text-[var(--whop-text-secondary)]" />
        </button>
      </div>
    </div>
  );
}
