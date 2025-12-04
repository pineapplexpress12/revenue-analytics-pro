import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  companies,
  products,
  plans,
  members,
  memberships,
  payments,
  syncLogs,
} from "@/lib/db/schema";
import {
  fetchAllMemberships,
  fetchAllPayments,
  fetchAllProducts,
  fetchAllMembers,
} from "@/lib/whop-fetchers";
import { whopsdk } from "@/lib/whop-sdk";
import { eq } from "drizzle-orm";
import { invalidateMetricCache } from "@/lib/metrics-cache";
import { calculateAndStoreMemberAnalytics } from "@/lib/analytics/calculate-member-analytics";

// Helper to delay execution (for rate limiting)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Batch fetch profile pictures with rate limiting
async function fetchProfilePicturesInBatches(
  userIds: string[],
  batchSize = 10,
  delayMs = 100
): Promise<Map<string, string | null>> {
  const profilePictures = new Map<string, string | null>();

  for (let i = 0; i < userIds.length; i += batchSize) {
    const batch = userIds.slice(i, i + batchSize);

    const results = await Promise.allSettled(
      batch.map(async (userId) => {
        try {
          const userDetails = await whopsdk.users.retrieve(userId);
          return { userId, url: userDetails.profile_picture?.url || null };
        } catch (error) {
          console.warn(`[SYNC] Failed to fetch profile for user ${userId}:`, error);
          return { userId, url: null };
        }
      })
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        profilePictures.set(result.value.userId, result.value.url);
      }
    }

    // Add delay between batches to avoid rate limiting
    if (i + batchSize < userIds.length) {
      await delay(delayMs);
    }
  }

  return profilePictures;
}

export async function POST(request: NextRequest) {
  const startedAt = new Date();
  let companyId: string | null = null;
  let dbCompanyId: string | null = null;
  const syncResults = {
    products: { count: 0, status: "pending" as string, error: null as string | null },
    plans: { count: 0, status: "pending" as string, error: null as string | null },
    members: { count: 0, status: "pending" as string, error: null as string | null },
    memberships: { count: 0, status: "pending" as string, error: null as string | null },
    payments: { count: 0, status: "pending" as string, error: null as string | null },
  };

  // Debug log storage
  const debugLogs: string[] = [];

  try {
    debugLogs.push(`[INIT] Starting initial sync at ${startedAt.toISOString()}`);

    const body = await request.json();
    companyId = body.companyId;
    const companyName = body.companyName || "Unknown Company";

    debugLogs.push(`[INIT] Company ID: ${companyId}, Name: ${companyName}`);

    if (!companyId) {
      return NextResponse.json(
        { error: "companyId is required" },
        { status: 400 }
      );
    }

    debugLogs.push(`[DB] Checking for existing company in database...`);
    const existingCompany = await db
      .select()
      .from(companies)
      .where(eq(companies.whopCompanyId, companyId))
      .limit(1);

    if (existingCompany.length === 0) {
      debugLogs.push(`[DB] Creating new company record...`);
      const [newCompany] = await db
        .insert(companies)
        .values({
          whopCompanyId: companyId,
          name: companyName,
        })
        .returning();
      dbCompanyId = newCompany.id;
      debugLogs.push(`[DB] Created new company with DB ID: ${dbCompanyId}`);
    } else {
      dbCompanyId = existingCompany[0].id;
      debugLogs.push(`[DB] Found existing company with DB ID: ${dbCompanyId}`);
    }

    const logSync = async (
      entityType: string,
      status: string,
      recordsProcessed: number,
      errorMessage?: string
    ) => {
      await db.insert(syncLogs).values({
        companyId: dbCompanyId,
        syncType: "full",
        entityType,
        status,
        recordsProcessed,
        errorMessage,
        startedAt,
        completedAt: new Date(),
      });
    };

    // 1. Sync Products
    try {
      debugLogs.push(`[PRODUCTS] Starting product sync for company ${companyId}`);
      const whopProducts = await fetchAllProducts(companyId);
      debugLogs.push(`[PRODUCTS] Fetched ${whopProducts.length} products from Whop API`);

      // It's OK for a company to have 0 products - this is a valid state
      for (const product of whopProducts) {
        await db
          .insert(products)
          .values({
            companyId: dbCompanyId,
            whopProductId: product.id,
            name: product.title,
            description: product.description,
            isApp: false,
            metadata: product,
          })
          .onConflictDoUpdate({
            target: products.whopProductId,
            set: {
              name: product.title,
              description: product.description,
              isApp: false,
              metadata: product,
            },
          });
      }
      syncResults.products = { count: whopProducts.length, status: "completed", error: null };
      await logSync("products", "completed", whopProducts.length);
      debugLogs.push(`[PRODUCTS] Successfully synced ${whopProducts.length} products`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error syncing products";
      syncResults.products = { count: 0, status: "failed", error: errorMsg };
      await logSync("products", "failed", 0, errorMsg);
      console.error("Products sync failed:", error);
      debugLogs.push(`[PRODUCTS] FAILED: ${errorMsg}`);
    }

    // 2. Sync Plans
    try {
      debugLogs.push(`[PLANS] Starting plans sync for company ${companyId}`);
      const whopPlans = [];
      for await (const plan of whopsdk.plans.list({ company_id: companyId })) {
        whopPlans.push(plan);
      }
      debugLogs.push(`[PLANS] Fetched ${whopPlans.length} plans from Whop API`);

      const dbProducts = await db
        .select()
        .from(products)
        .where(eq(products.companyId, dbCompanyId));

      const productMap = new Map(dbProducts.map(p => [p.whopProductId, p.id]));
      let plansLinked = 0;
      let plansSkipped = 0;

      for (const plan of whopPlans) {
        if (!plan.product?.id) {
          plansSkipped++;
          continue;
        }

        const productId = productMap.get(plan.product.id);
        if (!productId) {
          plansSkipped++;
          continue;
        }

        await db
          .insert(plans)
          .values({
            productId: productId,
            whopPlanId: plan.id,
            name: plan.description || "Default Plan",
            price: String(plan.initial_price || 0),
            currency: plan.currency || "usd",
            billingPeriod: plan.billing_period ? String(plan.billing_period) : "monthly",
            metadata: plan,
          })
          .onConflictDoUpdate({
            target: plans.whopPlanId,
            set: {
              name: plan.description || "Default Plan",
              price: String(plan.initial_price || 0),
              metadata: plan,
            },
          });
        plansLinked++;
      }
      syncResults.plans = { count: whopPlans.length, status: "completed", error: null };
      await logSync("plans", "completed", whopPlans.length);
      debugLogs.push(`[PLANS] Successfully synced ${plansLinked} plans (${plansSkipped} skipped - no matching product)`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error syncing plans";
      syncResults.plans = { count: 0, status: "failed", error: errorMsg };
      await logSync("plans", "failed", 0, errorMsg);
      console.error("Plans sync failed:", error);
      debugLogs.push(`[PLANS] FAILED: ${errorMsg}`);
    }

    // 3. Sync Members with profile pictures from Users API
    try {
      console.log(`[SYNC] Starting member sync for company ${companyId}`);
      debugLogs.push(`[MEMBERS] Starting fetch for company ${companyId}`);

      const whopMembers = await fetchAllMembers(companyId);
      debugLogs.push(`[MEMBERS] Fetched ${whopMembers.length} members from Whop API`);
      console.log(`[SYNC] Fetched ${whopMembers.length} members`);

      // Log sample member data for debugging
      if (whopMembers.length > 0) {
        const sampleMember = whopMembers[0];
        debugLogs.push(`[MEMBERS] Sample member data: id=${sampleMember.id}, user_id=${sampleMember.user?.id}, joined_at=${sampleMember.joined_at}, status=${sampleMember.status}`);
        console.log(`[SYNC] Sample member:`, JSON.stringify(sampleMember, null, 2));
      }

      const whopMemberships = await fetchAllMemberships(companyId);
      debugLogs.push(`[MEMBERSHIPS] Fetched ${whopMemberships.length} memberships from Whop API`);
      console.log(`[SYNC] Fetched ${whopMemberships.length} memberships`);

      // Log sample membership data for debugging
      if (whopMemberships.length > 0) {
        const sampleMembership = whopMemberships[0];
        debugLogs.push(`[MEMBERSHIPS] Sample membership: id=${sampleMembership.id}, status=${sampleMembership.status}, created_at=${sampleMembership.created_at}`);
        console.log(`[SYNC] Sample membership:`, JSON.stringify(sampleMembership, null, 2));
      }

      // Batch fetch profile pictures to avoid rate limiting
      const userIds = whopMembers
        .filter(m => m.user?.id)
        .map(m => m.user!.id);

      debugLogs.push(`[PROFILE_PICS] Fetching profile pictures for ${userIds.length} users in batches`);
      console.log(`[SYNC] Fetching profile pictures for ${userIds.length} users`);

      const profilePictures = await fetchProfilePicturesInBatches(userIds);
      const profilePicsFound = Array.from(profilePictures.values()).filter(url => url !== null).length;
      debugLogs.push(`[PROFILE_PICS] Found ${profilePicsFound}/${userIds.length} profile pictures`);
      console.log(`[SYNC] Found ${profilePicsFound} profile pictures`);

      for (const member of whopMembers) {
        if (!member.user?.id) continue;

        const email = member.user?.email || "";
        const username = member.user?.username || "";
        const name = member.user?.name || "";

        // Use joined_at from Members API (ISO string format)
        let memberJoinedAt = new Date();
        if (member.joined_at) {
          const parsedDate = new Date(member.joined_at);
          if (!isNaN(parsedDate.getTime())) {
            memberJoinedAt = parsedDate;
          }
        }

        // Get profile picture from pre-fetched batch
        const profilePictureUrl = profilePictures.get(member.user.id) || null;

        await db
          .insert(members)
          .values({
            companyId: dbCompanyId,
            whopUserId: member.user.id,
            email: email,
            username: username || name || email,
            profilePictureUrl: profilePictureUrl,
            metadata: member,
            createdAt: memberJoinedAt,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: members.whopUserId,
            set: {
              email: email,
              username: username || name || email,
              profilePictureUrl: profilePictureUrl,
              metadata: member,
              updatedAt: new Date(),
            },
          });
      }
      syncResults.members = { count: whopMembers.length, status: "completed", error: null };
      await logSync("members", "completed", whopMembers.length);
      debugLogs.push(`[MEMBERS] Successfully synced ${whopMembers.length} members`);

      // 4. Sync Memberships
      try {
        const dbMembers = await db
          .select()
          .from(members)
          .where(eq(members.companyId, dbCompanyId));

        const dbPlans = await db
          .select()
          .from(plans)
          .innerJoin(products, eq(products.id, plans.productId))
          .where(eq(products.companyId, dbCompanyId));

        const memberMap = new Map(dbMembers.map(m => [m.whopUserId, m.id]));
        const planMap = new Map(dbPlans.map(p => [p.plans.whopPlanId, { planId: p.plans.id, productId: p.plans.productId }]));

        for (const membership of whopMemberships) {
          const userId = membership.user?.id;
          const planId = membership.plan?.id;

          if (!userId || !planId) continue;

          const memberId = memberMap.get(userId);
          const planInfo = planMap.get(planId);

          if (!memberId || !planInfo) continue;

          // created_at is ISO string in SDK, parse directly
          let startDate = new Date();
          if (membership.created_at) {
            const parsedDate = new Date(membership.created_at);
            if (!isNaN(parsedDate.getTime())) {
              startDate = parsedDate;
            }
          }

          let endDate: Date | null = null;
          if (membership.renewal_period_end) {
            const parsedEnd = new Date(membership.renewal_period_end);
            if (!isNaN(parsedEnd.getTime())) {
              endDate = parsedEnd;
            }
          }

          await db
            .insert(memberships)
            .values({
              companyId: dbCompanyId,
              memberId: memberId,
              productId: planInfo.productId,
              planId: planInfo.planId,
              whopMembershipId: membership.id,
              status: membership.status,
              startDate: startDate,
              endDate: endDate,
              metadata: membership,
            })
            .onConflictDoUpdate({
              target: memberships.whopMembershipId,
              set: {
                status: membership.status,
                endDate: endDate,
                metadata: membership,
              },
            });
        }
        syncResults.memberships = { count: whopMemberships.length, status: "completed", error: null };
        await logSync("memberships", "completed", whopMemberships.length);

        // 5. Sync Payments
        try {
          debugLogs.push(`[PAYMENTS] Starting payment sync`);
          const whopPayments = await fetchAllPayments(companyId);
          debugLogs.push(`[PAYMENTS] Fetched ${whopPayments.length} payments from Whop API`);
          console.log(`[SYNC] Fetched ${whopPayments.length} payments`);

          // Log sample payment data for debugging
          if (whopPayments.length > 0) {
            const samplePayment = whopPayments[0];
            debugLogs.push(`[PAYMENTS] Sample payment: id=${samplePayment.id}, status=${samplePayment.status}, substatus=${samplePayment.substatus}, total=${samplePayment.total}, subtotal=${samplePayment.subtotal}, currency=${samplePayment.currency}`);
            console.log(`[SYNC] Sample payment:`, JSON.stringify(samplePayment, null, 2));
          }

          // Track payment stats
          let paymentsProcessed = 0;
          let paymentsSkipped = 0;
          let totalRevenue = 0;
          const statusCounts: Record<string, number> = {};

          for (const payment of whopPayments) {
            const userId = payment.user?.id;
            if (!userId) {
              paymentsSkipped++;
              continue;
            }

            const memberId = memberMap.get(userId);
            if (!memberId) {
              paymentsSkipped++;
              continue;
            }

            // created_at is ISO string in SDK
            let paymentDate = new Date();
            if (payment.created_at) {
              const parsedDate = new Date(payment.created_at);
              if (!isNaN(parsedDate.getTime())) {
                paymentDate = parsedDate;
              }
            }

            // Use total or subtotal - these are already in dollars (not cents!)
            // According to SDK: total, subtotal, usd_total are all number type representing dollars
            const paymentAmount = payment.total ?? payment.subtotal ?? 0;

            // Map SDK status to our internal status
            // SDK ReceiptStatus: 'draft' | 'open' | 'paid' | 'pending' | 'uncollectible' | 'unresolved' | 'void'
            // We normalize to 'succeeded' or 'failed' for our analytics
            let normalizedStatus: string = payment.status || "pending";
            if (payment.status === "paid") {
              normalizedStatus = "succeeded";
            } else if (payment.substatus === "succeeded") {
              normalizedStatus = "succeeded";
            } else if (payment.substatus === "failed" || payment.status === "void") {
              normalizedStatus = "failed";
            }

            // Track stats
            statusCounts[normalizedStatus] = (statusCounts[normalizedStatus] || 0) + 1;
            if (normalizedStatus === "succeeded") {
              totalRevenue += paymentAmount;
            }
            paymentsProcessed++;

            await db
              .insert(payments)
              .values({
                companyId: dbCompanyId,
                memberId: memberId,
                whopPaymentId: payment.id,
                amount: String(paymentAmount),
                currency: payment.currency || "usd",
                status: normalizedStatus,
                paymentDate: paymentDate,
                metadata: payment,
              })
              .onConflictDoUpdate({
                target: payments.whopPaymentId,
                set: {
                  amount: String(paymentAmount),
                  status: normalizedStatus,
                  metadata: payment,
                },
              });
          }

          debugLogs.push(`[PAYMENTS] Processed: ${paymentsProcessed}, Skipped: ${paymentsSkipped}, Total Revenue: $${totalRevenue.toFixed(2)}`);
          debugLogs.push(`[PAYMENTS] Status breakdown: ${JSON.stringify(statusCounts)}`);
          console.log(`[SYNC] Payments - Processed: ${paymentsProcessed}, Skipped: ${paymentsSkipped}, Revenue: $${totalRevenue.toFixed(2)}`);
          console.log(`[SYNC] Payment statuses:`, statusCounts);

          syncResults.payments = { count: whopPayments.length, status: "completed", error: null };
          await logSync("payments", "completed", whopPayments.length);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : "Unknown error syncing payments";
          syncResults.payments = { count: 0, status: "failed", error: errorMsg };
          await logSync("payments", "failed", 0, errorMsg);
          console.error("Payments sync failed:", error);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error syncing memberships";
        syncResults.memberships = { count: 0, status: "failed", error: errorMsg };
        await logSync("memberships", "failed", 0, errorMsg);
        console.error("Memberships sync failed:", error);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error syncing members";
      syncResults.members = { count: 0, status: "failed", error: errorMsg };
      await logSync("members", "failed", 0, errorMsg);
      console.error("Members sync failed:", error);
    }

    await db
      .update(companies)
      .set({ updatedAt: new Date() })
      .where(eq(companies.id, dbCompanyId));

    // Calculate analytics only if we have member data
    if (syncResults.members.status === "completed") {
      try {
        await calculateAndStoreMemberAnalytics(dbCompanyId);
      } catch (error) {
        console.error("Member analytics calculation failed:", error);
      }
    }

    await invalidateMetricCache(dbCompanyId);

    // Check if any sync failed
    const hasFailures = Object.values(syncResults).some(r => r.status === "failed");
    const allFailed = Object.values(syncResults).every(r => r.status === "failed");

    if (allFailed) {
      return NextResponse.json(
        {
          error: "Sync failed",
          message: "All sync operations failed. Check individual errors.",
          details: syncResults,
          debugLogs: debugLogs,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: !hasFailures,
      partial: hasFailures,
      synced: {
        products: syncResults.products.count,
        members: syncResults.members.count,
        memberships: syncResults.memberships.count,
        payments: syncResults.payments.count,
      },
      details: syncResults,
      debugLogs: debugLogs,
    });
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error("Initial sync failed:", error);
    debugLogs.push(`[ERROR] Sync failed with error: ${errorMessage}`);
    if (errorStack) {
      debugLogs.push(`[ERROR] Stack: ${errorStack.substring(0, 500)}`);
    }

    // Determine error type for better user messaging
    let userFriendlyMessage = errorMessage;
    const errorStatus = error?.status || error?.response?.status;

    if (errorStatus === 401) {
      userFriendlyMessage = "Authentication failed. Please check your Whop API key configuration.";
    } else if (errorStatus === 403) {
      userFriendlyMessage = "Permission denied. Please ensure your app has the required permissions in Whop.";
    } else if (errorStatus === 429) {
      userFriendlyMessage = "Rate limited by Whop API. Please wait a minute and try again.";
    } else if (errorStatus >= 500) {
      userFriendlyMessage = "Whop API is temporarily unavailable. Please try again later.";
    } else if (errorMessage.includes("ECONNREFUSED") || errorMessage.includes("ENOTFOUND")) {
      userFriendlyMessage = "Network error. Please check your internet connection and try again.";
    } else if (errorMessage.includes("database") || errorMessage.includes("postgres") || errorMessage.includes("POSTGRES")) {
      userFriendlyMessage = "Database connection error. Please try again later.";
    }

    if (dbCompanyId) {
      try {
        await db.insert(syncLogs).values({
          companyId: dbCompanyId,
          syncType: "full",
          entityType: "all",
          status: "failed",
          recordsProcessed: 0,
          errorMessage: errorMessage,
          startedAt,
          completedAt: new Date(),
        });
      } catch (logError) {
        console.error("Failed to log sync error:", logError);
      }
    }

    return NextResponse.json(
      {
        error: "Sync failed",
        message: userFriendlyMessage,
        technicalDetails: errorMessage,
        details: syncResults,
        debugLogs: debugLogs,
      },
      { status: 500 }
    );
  }
}
