'use client';

import { useState } from 'react';
import { X, Loader2, BarChart3, Users, CreditCard, TrendingUp } from 'lucide-react';

interface WelcomeModalProps {
  open: boolean;
  onClose: () => void;
  companyName: string;
}

function SyncingAnimation() {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <Loader2 className="h-16 w-16 animate-spin text-[var(--whop-accent)] mb-4" />
      <p className="text-lg font-semibold text-[var(--whop-text-primary)] mb-2">
        Syncing Your Data...
      </p>
      <p className="text-sm text-[var(--whop-text-secondary)]">
        This usually takes 2-3 minutes
      </p>
      <div className="mt-8 w-full max-w-md">
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm text-[var(--whop-text-secondary)]">
            <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-green-400" />
            </div>
            Fetching members data
          </div>
          <div className="flex items-center gap-3 text-sm text-[var(--whop-text-secondary)]">
            <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-green-400" />
            </div>
            Analyzing payment history
          </div>
          <div className="flex items-center gap-3 text-sm text-[var(--whop-text-secondary)]">
            <Loader2 className="w-5 h-5 animate-spin text-[var(--whop-accent)]" />
            Calculating analytics
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureHighlights() {
  const features = [
    { 
      icon: BarChart3, 
      title: 'Cohort Retention', 
      description: 'See which months perform best',
      color: 'bg-blue-500/20 text-blue-400'
    },
    { 
      icon: Users, 
      title: 'Member Profiles', 
      description: 'Individual churn risk scoring',
      color: 'bg-purple-500/20 text-purple-400'
    },
    { 
      icon: CreditCard, 
      title: 'Failed Payments', 
      description: 'Track recovery opportunities',
      color: 'bg-red-500/20 text-red-400'
    },
    { 
      icon: TrendingUp, 
      title: 'Benchmarking', 
      description: 'Compare vs similar communities',
      color: 'bg-green-500/20 text-green-400'
    },
  ];
  
  return (
    <div className="grid grid-cols-2 gap-4">
      {features.map((feature) => {
        const Icon = feature.icon;
        return (
          <div key={feature.title} className="p-4 bg-[var(--whop-bg)] rounded-lg border border-[var(--whop-border)]">
            <div className={`w-10 h-10 rounded-lg ${feature.color} flex items-center justify-center mb-3`}>
              <Icon className="w-5 h-5" />
            </div>
            <h4 className="font-semibold text-[var(--whop-text-primary)] mb-1">{feature.title}</h4>
            <p className="text-sm text-[var(--whop-text-secondary)]">{feature.description}</p>
          </div>
        );
      })}
    </div>
  );
}

function TrialFeatures() {
  return (
    <div className="space-y-4">
      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <h4 className="font-semibold text-blue-400 mb-2">✨ Your 7-Day Trial Includes:</h4>
        <ul className="space-y-2 text-sm text-[var(--whop-text-secondary)]">
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5">✓</span>
            <span>Full access to all premium features</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5">✓</span>
            <span>Member-level churn risk scoring</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5">✓</span>
            <span>Failed payment recovery tracking</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5">✓</span>
            <span>Benchmarking vs similar communities</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5">✓</span>
            <span>Unlimited data exports</span>
          </li>
        </ul>
      </div>
      <div className="p-4 bg-[var(--whop-bg)] border border-[var(--whop-border)] rounded-lg">
        <p className="text-sm text-[var(--whop-text-secondary)]">
          💡 <strong className="text-[var(--whop-text-primary)]">Cancel anytime during trial</strong> — 
          Try everything for 7 days, then $49/month. Cancel before trial ends and pay nothing.
        </p>
      </div>
    </div>
  );
}

export function WelcomeModal({ open, onClose, companyName }: WelcomeModalProps) {
  const [step, setStep] = useState(1);
  
  const steps = [
    {
      title: "Welcome to Revenue Analytics Pro!",
      description: `Your ${companyName} data is ready! Let's explore what you can do.`,
      content: <FeatureHighlights />
    },
    {
      title: "Your Trial Includes Everything",
      description: "Full access to all features for 7 days",
      content: <TrialFeatures />
    }
  ];
  
  if (!open) return null;
  
  const currentStep = steps[step - 1];
  const progress = (step / steps.length) * 100;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl mx-4 bg-[var(--whop-card-bg)] border border-[var(--whop-border)] rounded-xl shadow-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-[var(--whop-text-primary)]">
              {currentStep.title}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--whop-bg)] rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-[var(--whop-text-secondary)]" />
            </button>
          </div>
          
          <div className="mb-6">
            <div className="h-2 bg-[var(--whop-bg)] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[var(--whop-accent)] transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          
          <div className="mb-6">
            <p className="text-[var(--whop-text-secondary)] mb-6">
              {currentStep.description}
            </p>
            {currentStep.content}
          </div>
          
          <div className="flex justify-between items-center">
            {step > 1 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 text-sm font-medium text-[var(--whop-text-secondary)] hover:text-[var(--whop-text-primary)] transition-colors"
              >
                Back
              </button>
            ) : (
              <div />
            )}
            
            <div className="flex items-center gap-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index + 1 <= step 
                      ? 'bg-[var(--whop-accent)]' 
                      : 'bg-[var(--whop-border)]'
                  }`}
                />
              ))}
            </div>
            
            {step < steps.length ? (
              <button
                onClick={() => setStep(step + 1)}
                className="px-6 py-2 bg-[var(--whop-accent)] text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-6 py-2 bg-[var(--whop-accent)] text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
              >
                Get Started
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
