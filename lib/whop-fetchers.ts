import { whopsdk } from "./whop-sdk";

export async function fetchAllMemberships(companyId: string) {
  const allMemberships = [];
  
  for await (const membership of whopsdk.memberships.list({
    company_id: companyId
  })) {
    allMemberships.push(membership);
  }
  
  return allMemberships;
}

export async function fetchAllPayments(companyId: string) {
  const allPayments = [];
  
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
    products.push(fullProduct);
  }
  
  return products;
}

export async function fetchAllMembers(companyId: string) {
  const allMembers = [];
  
  for await (const member of whopsdk.members.list({
    company_id: companyId
  })) {
    allMembers.push(member);
  }
  
  return allMembers;
}

export async function fetchMembershipsSince(companyId: string, since: Date) {
  const allMemberships = [];
  
  for await (const membership of whopsdk.memberships.list({
    company_id: companyId,
    created_after: String(Math.floor(since.getTime() / 1000))
  })) {
    allMemberships.push(membership);
  }
  
  return allMemberships;
}

export async function fetchPaymentsSince(companyId: string, since: Date) {
  const allPayments = [];
  
  for await (const payment of whopsdk.payments.list({
    company_id: companyId,
    created_after: String(Math.floor(since.getTime() / 1000))
  })) {
    allPayments.push(payment);
  }
  
  return allPayments;
}
