import { db } from "@/lib/db";
import { companies, payments, memberships } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

async function check() {
  const whopCompanyId = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID!;
  
  const company = await db.select().from(companies).where(eq(companies.whopCompanyId, whopCompanyId)).limit(1);
  console.log("Company:", company[0]);
  
  if (company[0]) {
    const paymentsCount = await db.select().from(payments).where(eq(payments.companyId, company[0].id));
    console.log("Payments:", paymentsCount.length);
    
    const membershipsCount = await db.select().from(memberships).where(eq(memberships.companyId, company[0].id));
    console.log("Memberships:", membershipsCount.length);
  }
  
  process.exit(0);
}

check();
