import { db } from "@/lib/db";
import { payments, companies, memberships } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

async function check() {
  const whopCompanyId = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID!;
  
  const company = await db.select().from(companies).where(eq(companies.whopCompanyId, whopCompanyId)).limit(1);
  console.log("Company ID:", company[0].id);
  
  const samplePayments = await db.select().from(payments).where(eq(payments.companyId, company[0].id)).limit(3);
  console.log("\nSample payments:", JSON.stringify(samplePayments, null, 2));
  
  const activeMemberships = await db.select().from(memberships).where(eq(memberships.companyId, company[0].id)).limit(3);
  console.log("\nSample memberships:", JSON.stringify(activeMemberships, null, 2));
  
  process.exit(0);
}

check();
