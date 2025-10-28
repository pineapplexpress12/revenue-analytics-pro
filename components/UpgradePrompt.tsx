"use client";

import { Check } from "lucide-react";
import { useIframeSdk } from "@whop/react";
import { useState } from "react";
import Image from "next/image";

export function UpgradePrompt() {
  const iframeSdk = useIframeSdk();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState<string>();

  async function handlePurchase() {
    try {
      setIsPurchasing(true);
      setError(undefined);

      const res = await iframeSdk.inAppPurchase({ 
        planId: process.env.NEXT_PUBLIC_PREMIUM_PLAN_ID!
      });

      if (res.status === "ok") {
        window.location.reload();
      } else {
        setError(res.error || "Purchase was not completed");
        setIsPurchasing(false);
      }
    } catch (err) {
      console.error("Purchase failed:", err);
      setError("Purchase failed. Please try again.");
      setIsPurchasing(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6">
      <div className="max-w-6xl w-full">
        <div className="bg-[#111111] rounded-3xl border border-gray-800 overflow-hidden shadow-2xl">
          <div className="grid lg:grid-cols-2 gap-0">
            {/* Left side - Branding & Pricing */}
            <div className="bg-[#1A1A1A] p-12 flex flex-col justify-between border-r border-gray-800">
              <div>
                <div className="mb-8">
                  <Image 
                    src="/logo.png" 
                    alt="Revenue Analytics Pro" 
                    width={60}
                    height={60}
                    className="rounded-xl"
                  />
                </div>
                <h1 className="text-4xl font-bold text-white mb-3">
                  Revenue Analytics Pro
                </h1>
                <p className="text-gray-400 text-lg">
                  Know your numbers. Grow your business.
                </p>
              </div>

              <div className="mt-12">
                <div className="inline-block bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-semibold text-white mb-6">
                  7-Day Free Trial
                </div>
                <div className="text-7xl font-bold text-white mb-2">$49</div>
                <div className="text-xl text-gray-400">per month after trial</div>
                
                <button
                  onClick={handlePurchase}
                  disabled={isPurchasing}
                  className="mt-8 w-full bg-white text-black px-8 py-4 rounded-xl text-lg font-bold hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl"
                >
                  {isPurchasing ? "Opening checkout..." : "Start Free Trial →"}
                </button>
                
                {error && (
                  <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
                    {error}
                  </div>
                )}
                
                <p className="text-sm text-gray-500 mt-4 text-center">
                  Cancel anytime during trial • No charge until trial ends
                </p>
              </div>
            </div>

            {/* Right side - Features */}
            <div className="p-12 bg-[#111111]">
              <h2 className="text-2xl font-bold text-white mb-8">
                Everything you need to scale
              </h2>
              
              <div className="space-y-6">
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check className="h-3 w-3 text-green-400" strokeWidth={3} />
                  </div>
                  <div>
                    <div className="font-semibold text-white text-base">Real-time Analytics</div>
                    <div className="text-sm text-gray-400">MRR, churn, LTV, ARPU tracking</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check className="h-3 w-3 text-green-400" strokeWidth={3} />
                  </div>
                  <div>
                    <div className="font-semibold text-white text-base">Revenue Insights</div>
                    <div className="text-sm text-gray-400">Track revenue trends over time</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check className="h-3 w-3 text-green-400" strokeWidth={3} />
                  </div>
                  <div>
                    <div className="font-semibold text-white text-base">Member Analytics</div>
                    <div className="text-sm text-gray-400">Growth and retention metrics</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check className="h-3 w-3 text-green-400" strokeWidth={3} />
                  </div>
                  <div>
                    <div className="font-semibold text-white text-base">Cohort Analysis</div>
                    <div className="text-sm text-gray-400">Understand retention by cohort</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check className="h-3 w-3 text-green-400" strokeWidth={3} />
                  </div>
                  <div>
                    <div className="font-semibold text-white text-base">Product Performance</div>
                    <div className="text-sm text-gray-400">Compare all your products</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check className="h-3 w-3 text-green-400" strokeWidth={3} />
                  </div>
                  <div>
                    <div className="font-semibold text-white text-base">Custom Date Ranges</div>
                    <div className="text-sm text-gray-400">Analyze any time period</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check className="h-3 w-3 text-green-400" strokeWidth={3} />
                  </div>
                  <div>
                    <div className="font-semibold text-white text-base">CSV Exports</div>
                    <div className="text-sm text-gray-400">Download all your data</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check className="h-3 w-3 text-green-400" strokeWidth={3} />
                  </div>
                  <div>
                    <div className="font-semibold text-white text-base">Period Comparison</div>
                    <div className="text-sm text-gray-400">Compare vs previous periods</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
