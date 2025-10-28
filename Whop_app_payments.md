Payments and payouts
Use the API to collect payment from users or payout users.

​
Collecting Payments
First, create the charge on the server using the Whop API. Then you can either:
Open a modal in your app using the iframe SDK (recommended)
Redirect the user to Whop’s checkout page
​
1. Create the charge on the server
This step will create a charge on the server and return the inAppPurchase object required for the next step.
On the server, use the chargeUser method to create a charge:
app/api/charge/route.ts

Copy

Ask AI
import { whopSdk } from "@/lib/whop-sdk";

export async function POST(request: Request) {
  try {
    const { userId, experienceId } = await request.json();

    const result = await whopSdk.payments.chargeUser({
      amount: 100,
      currency: "usd",
      userId: userId,
      // metadata is information that you'd like to receive later about the payment.
      metadata: {
        creditsToPurchase: 1,
        experienceId: experienceId,
      },
    });

    if (!result?.inAppPurchase) {
      throw new Error("Failed to create charge");
    }

    return Response.json(result.inAppPurchase);
  } catch (error) {
    console.error("Error creating charge:", error);
    return Response.json({ error: "Failed to create charge" }, { status: 500 });
  }
}
​
2. Confirm the payment on the client
In this step the user will be prompted to confirm the previously created charge in a modal.
This function requires the iFrame SDK to be initialized. See iFrame Overview for more information.
Use the iframe SDK to open a payment modal:

React

Vanilla JS

Copy

Ask AI
"use client";
import { useIframeSdk } from "@whop/react";

export default function PaymentButton({
  userId,
  experienceId,
}: {
  userId: string;
  experienceId: string;
}) {
  const iframeSdk = useIframeSdk();
  
  const [receiptId, setReceiptId] = useState<string>();
  const [error, setError] = useState<string>();
  
  async function handlePurchase() {
    try {
      // 1. Create charge on server
      const response = await fetch("/api/charge", {
        method: "POST",
        body: JSON.stringify({ userId, experienceId }),
      });
      
      if (response.ok) {
        const inAppPurchase = await response.json();
        // 2. Open payment modal
        const res = await iframeSdk.inAppPurchase(inAppPurchase);
        
        if (res.status === "ok") {
          setReceiptId(res.data.receipt_id);
          setError(undefined);
        } else {
          setReceiptId(undefined);
          setError(res.error);
        }
      } else {
        throw new Error("Failed to create charge");
      }
    } catch (error) {
      console.error("Purchase failed:", error);
      setError("Purchase failed");
    }
  }
  
  return <button onClick={handlePurchase}>Purchase Plan</button>;
}
​
3. Validate the payment
After a payment is processed, you should validate it on your server using webhooks to ensure the payment was successful and update your application accordingly.
Set up a webhook route to handle payment events:
app/api/webhook/route.ts

Copy

Ask AI
import { makeWebhookValidator, type PaymentWebhookData } from "@whop/api";
import { after } from "next/server";

const validateWebhook = makeWebhookValidator({
  webhookSecret: process.env.WHOP_WEBHOOK_SECRET,
});

export async function POST(request: Request) {
  // Validate the webhook to ensure it's from Whop
  const webhook = await validateWebhook(request);

  // Handle the webhook event
  if (webhook.action === "payment.succeeded") {
    after(handlePaymentSucceededWebhook(webhook.data));
  }

  // Make sure to return a 2xx status code quickly. Otherwise the webhook will be retried.
  return new Response("OK", { status: 200 });
}

async function handlePaymentSucceededWebhook(data: PaymentWebhookData) {
  const { id, user_id, subtotal, amount_after_fees, metadata, ... } = data;

  // ...
}
See Webhooks for more information.
Make sure to create a webhook in your dashboard app settings and set your WHOP_WEBHOOK_SECRET environment variable.
Webhook Configuration
​
Sending Payouts
You can send payouts to any user using their Whop username. The funds will be transferred from your company’s ledger account.
​
Transfer Funds

Copy

Ask AI
import { whopSdk } from "@/lib/whop-sdk";

async function sendPayout(
  companyId: string,
  recipientUsername: string,
  amount: number
) {
  // 1. Get your company's ledger account
  const experience = await whopSdk.experiences.getExperience({ experienceId });
  const companyId = experience.company.id;
  const ledgerAccount = await whopSdk.companies.getCompanyLedgerAccount({
    companyId,
  });

  // 2. Pay the recipient
  await whopSdk.payments.payUser({
    amount: amount,
    currency: "usd",
    // Username or ID or ledger account ID of the recipient user
    destinationId: recipientUsername,
    // Your company's ledger account ID that can be retrieve from whopSdk.companies.getCompanyLedgerAccount()
    ledgerAccountId: ledgerAccount.company?.ledgerAccount.id!,
    // Optional transfer fee in percentage
    transferFee: ledgerAccount.company?.ledgerAccount.transferFee,
  });
}


Subscriptions
Gate your app behind a subscription or one-time purchase

​
Setup your access pass on the dashboard.
Go to the your app’s dashboard.
Select the access passes tab and create an access pass. Give it a name like “My App Premium”
Create a pricing plan for the access pass by clicking the “Add Pricing” button from the table row.
After creating the pricing plan, copy the plan id from the 3 dot menu in the pricing plan card.
Also copy the access pass id from the 3 dot menu in the access pass table row.
We recommend storing the access pass id and plan id in environment variables for your app. Eg:

Copy

Ask AI
NEXT_PUBLIC_PREMIUM_ACCESS_PASS_ID="prod_XXXXXXXX"
NEXT_PUBLIC_PREMIUM_PLAN_ID="plan_XXXXXXXX"
​
Check if users have access
When a user makes a request to your app, you can easily check if they have access using the whop api.

Copy

Ask AI
const hasAccess = await whopSdk.access.checkIfUserHasAccessToAccessPass({
  accessPassId: process.env.NEXT_PUBLIC_PREMIUM_ACCESS_PASS_ID, // from step 5 above.
  userId: userId,
});
If a user does not have access, you can prompt them to purchase or show a lite “free” version of the app to upsell them.
​
Collect payment from users
This function requires the iFrame SDK to be initialized. See iFrame Overview for more information.
Use the iframe sdk to collect payment from users. This will show a whop native payment modal in which the user can confirm their purchase.

React

Vanilla JS

Copy

Ask AI
"use client";
import { useIframeSdk } from "@whop/react";

export default function GetAccessButton() {
  const iframeSdk = useIframeSdk();
  
  const [receiptId, setReceiptId] = useState<string>();
  const [error, setError] = useState<string>();
  
  async function handlePurchase() {
    try {
		const res = await iframeSdk.inAppPurchase({ planId: process.env.NEXT_PUBLIC_PREMIUM_PLAN_ID });
		
		if (res.status === "ok") {
			setReceiptId(res.data.receipt_id);
			setError(undefined);
		} else {
			setReceiptId(undefined);
			setError(res.error);
		}
    } catch (error) {
      console.error("Purchase failed:", error);
      setError("Purchase failed");
    }
  }
  
  return <button onClick={handlePurchase}>Get Access</button>;
}
​
Attaching custom metadata to a subscription
You can attach custom metadata to a subscription by using the createCheckoutSession mutation.
For example, you can use this to associate a subscription with an experience or company that it was created for. Using this you can attribute the source of the subscription and build powerful revenue sharing features into your app.
Before using the iframeSdk.inAppPurchase function, you need to create a checkout session, and pass it to the function.
​
Create the checkout session in a server action.
Use the whopSdk to create a checkout session on your backend, pass the experienceId to this function.

Copy

Ask AI
import { whopSdk } from "@/lib/whop-sdk";
import { headers } from "next/headers";

export async function createSubscription(experienceId: string) {
  const { userId } = await whopSdk.verifyUserToken(await headers());

  // Check to make sure the current user has access to the experience.
  const hasAccess = await whopSdk.access.checkIfUserHasAccessToExperience({
    userId,
    experienceId,
  });

  const checkoutSession = await whopSdk.payments.createCheckoutSession({
    planId: process.env.NEXT_PUBLIC_PREMIUM_PLAN_ID,
    metadata: {
      experienceId,
    },
  });

  return checkoutSession;
}
​
Pass the checkout session to the iframeSdk.inAppPurchase function.
React

Copy

Ask AI
"use client";

import { useIframeSdk } from "@whop/react";
import { createSubscription } from "@/lib/actions/create-subscription";

export default function GetAccessButton({
  experienceId,
}: {
  experienceId: string;
}) {
  const iframeSdk = useIframeSdk();

  const [receiptId, setReceiptId] = useState<string>();
  const [error, setError] = useState<string>();

  async function handlePurchase() {
    try {
      const inAppPurchase = await createSubscription(experienceId);
      const res = await iframeSdk.inAppPurchase(inAppPurchase);

      if (res.status === "ok") {
        setReceiptId(res.data.receipt_id);
        setError(undefined);
      } else {
        setReceiptId(undefined);
        setError(res.error);
      }
    } catch (error) {
      console.error("Purchase failed:", error);
      setError("Purchase failed");
    }
  }

  return <button onClick={handlePurchase}>Get Access</button>;
}
This custom metadata will be available in the webhook payloads sent to your server (if enabled).
You can use the payUser mutation to share your subscription revenue with the creator of the experience.
