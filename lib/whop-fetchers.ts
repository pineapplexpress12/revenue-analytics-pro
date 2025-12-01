import { whopsdk } from "./whop-sdk";

export async function fetchAllMemberships(companyId: string) {
  const allMemberships = [];

  // Include all membership statuses that represent valid/active memberships
  // 'trialing' - trial period, 'active' - paying, 'completed' - one-time purchase fulfilled
  // 'past_due' - payment failed but still has access, useful for churn risk
  for await (const membership of whopsdk.memberships.list({
    company_id: companyId,
    statuses: ['active', 'completed', 'trialing', 'past_due', 'canceled', 'expired']
  })) {
    allMemberships.push(membership);
  }

  return allMemberships;
}

export async function fetchAllPayments(companyId: string) {
  const allPayments = [];

  // Fetch all payments - we filter by status in our analytics
  for await (const payment of whopsdk.payments.list({
    company_id: companyId
  })) {
    allPayments.push(payment);
  }

  return allPayments;
}

export async function fetchAllProducts(companyId: string) {
  const listResponse = await whopsdk.products.list({
    company_id: companyId
  });

  const products = [];
  for await (const productListItem of listResponse) {
    const fullProduct = await whopsdk.products.retrieve(productListItem.id);
    const productData = fullProduct as any;
    const hasExperiences = !!(productData.experiences && Array.isArray(productData.experiences) && productData.experiences.length > 0);

    if (!hasExperiences) {
      products.push(fullProduct);
    }
  }

  return products;
}

export async function fetchAllMembers(companyId: string) {
  const allMembers = [];

  // Fetch all members including those who have left (for historical analytics)
  // 'joined' - currently active, 'left' - churned, 'drafted' - not yet active
  for await (const member of whopsdk.members.list({
    company_id: companyId,
    statuses: ['joined', 'left']
  })) {
    allMembers.push(member);
  }

  return allMembers;
}

export async function fetchMembershipsSince(companyId: string, since: Date) {
  const allMemberships = [];

  // created_after expects ISO string format according to SDK
  for await (const membership of whopsdk.memberships.list({
    company_id: companyId,
    created_after: since.toISOString()
  })) {
    allMemberships.push(membership);
  }

  return allMemberships;
}

export async function fetchPaymentsSince(companyId: string, since: Date) {
  const allPayments = [];

  // created_after expects ISO string format according to SDK
  for await (const payment of whopsdk.payments.list({
    company_id: companyId,
    created_after: since.toISOString()
  })) {
    allPayments.push(payment);
  }

  return allPayments;
}
