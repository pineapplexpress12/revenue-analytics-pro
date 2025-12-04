import { whopsdk } from "./whop-sdk";

// Helper to add delay between API calls for rate limiting
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Retry wrapper for API calls with exponential backoff
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Check if it's a rate limit error (429)
      const status = error?.status || error?.response?.status;
      if (status === 429) {
        // Rate limited - wait 60 seconds as per Whop docs
        console.warn(`[WHOP] Rate limited, waiting 60 seconds before retry...`);
        await delay(60000);
        continue;
      }

      // For other retryable errors, use exponential backoff
      if (status >= 500 || status === 408 || status === 409) {
        const waitTime = baseDelay * Math.pow(2, attempt);
        console.warn(`[WHOP] Retryable error (${status}), waiting ${waitTime}ms before retry ${attempt + 1}/${maxRetries}`);
        await delay(waitTime);
        continue;
      }

      // Non-retryable error, throw immediately
      throw error;
    }
  }

  throw lastError;
}

export async function fetchAllMemberships(companyId: string) {
  const allMemberships = [];

  try {
    // Include ALL membership statuses to ensure complete data sync
    // 'trialing' - trial period, 'active' - paying, 'completed' - one-time purchase fulfilled
    // 'past_due' - payment failed but still has access, 'canceled' - user canceled
    // 'expired' - subscription ended, 'unresolved' - payment issue, 'drafted' - pre-activated
    for await (const membership of whopsdk.memberships.list({
      company_id: companyId,
      statuses: ['active', 'completed', 'trialing', 'past_due', 'canceled', 'expired', 'unresolved', 'drafted']
    })) {
      allMemberships.push(membership);
    }
  } catch (error: any) {
    console.error(`[WHOP] Error fetching memberships for company ${companyId}:`, error?.message || error);
    // If it's a permission error, return empty array instead of failing completely
    if (error?.status === 403 || error?.status === 401) {
      console.warn(`[WHOP] Permission denied for memberships, returning empty array`);
      return [];
    }
    throw error;
  }

  return allMemberships;
}

export async function fetchAllPayments(companyId: string) {
  const allPayments = [];

  try {
    // Fetch all payments - we filter by status in our analytics
    for await (const payment of whopsdk.payments.list({
      company_id: companyId
    })) {
      allPayments.push(payment);
    }
  } catch (error: any) {
    console.error(`[WHOP] Error fetching payments for company ${companyId}:`, error?.message || error);
    // If it's a permission error, return empty array instead of failing completely
    if (error?.status === 403 || error?.status === 401) {
      console.warn(`[WHOP] Permission denied for payments, returning empty array`);
      return [];
    }
    throw error;
  }

  return allPayments;
}

export async function fetchAllProducts(companyId: string) {
  const products = [];

  try {
    // Use async iterator directly without awaiting list() first
    for await (const productListItem of whopsdk.products.list({
      company_id: companyId
    })) {
      try {
        const fullProduct = await withRetry(() => whopsdk.products.retrieve(productListItem.id));
        const productData = fullProduct as any;
        const hasExperiences = !!(productData.experiences && Array.isArray(productData.experiences) && productData.experiences.length > 0);

        if (!hasExperiences) {
          products.push(fullProduct);
        }

        // Small delay between product retrievals to avoid rate limiting
        await delay(50);
      } catch (retrieveError: any) {
        console.warn(`[WHOP] Failed to retrieve product ${productListItem.id}:`, retrieveError?.message);
        // Continue with other products even if one fails
      }
    }
  } catch (error: any) {
    console.error(`[WHOP] Error fetching products for company ${companyId}:`, error?.message || error);
    // If it's a permission error, return empty array instead of failing completely
    if (error?.status === 403 || error?.status === 401) {
      console.warn(`[WHOP] Permission denied for products, returning empty array`);
      return [];
    }
    throw error;
  }

  return products;
}

export async function fetchAllMembers(companyId: string) {
  const allMembers = [];

  try {
    // Fetch ALL members including those who haven't fully activated yet
    // 'joined' - currently active, 'left' - churned, 'drafted' - not yet fully activated
    // Including 'drafted' is important to avoid foreign key issues with memberships
    for await (const member of whopsdk.members.list({
      company_id: companyId,
      statuses: ['joined', 'left', 'drafted']
    })) {
      allMembers.push(member);
    }
  } catch (error: any) {
    console.error(`[WHOP] Error fetching members for company ${companyId}:`, error?.message || error);
    // If it's a permission error, return empty array instead of failing completely
    if (error?.status === 403 || error?.status === 401) {
      console.warn(`[WHOP] Permission denied for members, returning empty array`);
      return [];
    }
    throw error;
  }

  return allMembers;
}

export async function fetchMembershipsSince(companyId: string, since: Date) {
  const allMemberships = [];

  try {
    // created_after expects ISO string format according to SDK
    for await (const membership of whopsdk.memberships.list({
      company_id: companyId,
      created_after: since.toISOString()
    })) {
      allMemberships.push(membership);
    }
  } catch (error: any) {
    console.error(`[WHOP] Error fetching memberships since ${since.toISOString()} for company ${companyId}:`, error?.message || error);
    if (error?.status === 403 || error?.status === 401) {
      return [];
    }
    throw error;
  }

  return allMemberships;
}

export async function fetchPaymentsSince(companyId: string, since: Date) {
  const allPayments = [];

  try {
    // created_after expects ISO string format according to SDK
    for await (const payment of whopsdk.payments.list({
      company_id: companyId,
      created_after: since.toISOString()
    })) {
      allPayments.push(payment);
    }
  } catch (error: any) {
    console.error(`[WHOP] Error fetching payments since ${since.toISOString()} for company ${companyId}:`, error?.message || error);
    if (error?.status === 403 || error?.status === 401) {
      return [];
    }
    throw error;
  }

  return allPayments;
}
