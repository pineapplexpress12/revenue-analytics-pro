"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail } from "lucide-react";

interface EmailReportSettingsProps {
  companyId: string;
  companyName: string;
  userEmail: string;
}

export function EmailReportSettings({ companyId, companyName, userEmail }: EmailReportSettingsProps) {
  const [email, setEmail] = useState(userEmail);
  const [frequency, setFrequency] = useState<"weekly" | "monthly">("weekly");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  const handleSendReport = async () => {
    if (!email) {
      setMessage("Please enter an email address");
      return;
    }

    setSending(true);
    setMessage("");

    try {
      const url = '/api/email-reports/send';
      console.log('Attempting to send email to:', url, 'with companyId:', companyId);
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          recipientEmail: email,
          frequency,
        }),
      });

      if (response.ok) {
        setMessage(`${frequency === "weekly" ? "Weekly" : "Monthly"} report sent successfully to ${email}`);
        setEmail("");
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        console.error("Email send error:", response.status, errorData);
        setMessage(`Failed to send report: ${errorData.error || "Please try again"}`);
      }
    } catch (error) {
      console.error("Error sending report:", error);
      setMessage("Failed to send report. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="bg-gray-a2 border-gray-a4">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-purple-11" />
          <CardTitle>Email Reports</CardTitle>
        </div>
        <CardDescription>
          Send revenue analytics reports to your email
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-12 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-3 py-2 bg-gray-a3 border border-gray-a6 rounded-2 text-gray-12 placeholder-gray-a9 focus:outline-none focus:ring-2 focus:ring-purple-9"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-12 mb-2">
              Report Frequency
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setFrequency("weekly")}
                className={`flex-1 px-4 py-2 rounded-2 font-medium transition ${
                  frequency === "weekly"
                    ? "bg-purple-9 text-white"
                    : "bg-gray-a3 text-gray-11 hover:bg-gray-a4"
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setFrequency("monthly")}
                className={`flex-1 px-4 py-2 rounded-2 font-medium transition ${
                  frequency === "monthly"
                    ? "bg-purple-9 text-white"
                    : "bg-gray-a3 text-gray-11 hover:bg-gray-a4"
                }`}
              >
                Monthly
              </button>
            </div>
          </div>

          <button
            onClick={handleSendReport}
            disabled={sending}
            className="w-full bg-purple-9 text-white px-4 py-2 rounded-2 font-medium hover:bg-purple-10 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? "Sending..." : "Send Test Report"}
          </button>

          {message && (
            <div
              className={`text-sm p-3 rounded-2 ${
                message.includes("success")
                  ? "bg-green-a3 text-green-11 border border-green-a6"
                  : "bg-red-a3 text-red-11 border border-red-a6"
              }`}
            >
              {message}
            </div>
          )}

          <div className="text-xs text-gray-11 pt-2 border-t border-gray-a4">
            <p>📧 Reports include:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>MRR, revenue, and member metrics</li>
              <li>Churn rate and growth trends</li>
              <li>LTV and ARPU insights</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
