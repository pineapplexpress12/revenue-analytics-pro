import { db } from "@/lib/db";
import { companies, members, payments, products, plans, memberships } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

async function seedTestData() {
  const companyId = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID;
  
  if (!companyId) {
    console.error("NEXT_PUBLIC_WHOP_COMPANY_ID not set");
    process.exit(1);
  }

  console.log("Seeding test data...");

  let company = await db.select().from(companies).where(eq(companies.whopCompanyId, companyId)).limit(1);

  if (company.length === 0) {
    company = await db.insert(companies).values({
      id: createId(),
      whopCompanyId: companyId,
      name: "Test Company",
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    console.log("✓ Created company:", company[0].name);
  } else {
    console.log("✓ Using existing company:", company[0].name);
  }

  const productRecords = [
    {
      id: createId(),
      companyId: company[0].id,
      whopProductId: "prod_test1",
      name: "Pro Membership",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: createId(),
      companyId: company[0].id,
      whopProductId: "prod_test2",
      name: "Enterprise Membership",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  await db.insert(products).values(productRecords);
  console.log("✓ Created 2 products");

  const planRecords = [
    {
      id: createId(),
      productId: productRecords[0].id,
      whopPlanId: "plan_test1",
      name: "Pro Plan",
      price: "49.00",
      billingPeriod: "monthly",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: createId(),
      productId: productRecords[1].id,
      whopPlanId: "plan_test2",
      name: "Enterprise Plan",
      price: "149.00",
      billingPeriod: "monthly",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  await db.insert(plans).values(planRecords);
  console.log("✓ Created 2 plans");

  const now = new Date();
  const memberRecords = [];
  const membershipRecords = [];
  const paymentRecords = [];

  for (let i = 0; i < 50; i++) {
    const daysAgo = Math.floor(Math.random() * 180);
    const joinDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const isActive = Math.random() > 0.2;
    const planRecord = Math.random() > 0.5 ? planRecords[0] : planRecords[1];
    const productRecord = planRecord.id === planRecords[0].id ? productRecords[0] : productRecords[1];
    const planPrice = parseFloat(planRecord.price);

    const memberId = createId();
    const membershipId = createId();

    memberRecords.push({
      id: memberId,
      companyId: company[0].id,
      whopUserId: `user_test${i}`,
      email: `user${i}@test.com`,
      username: `testuser${i}`,
      createdAt: joinDate,
      updatedAt: new Date(),
    });

    membershipRecords.push({
      id: membershipId,
      companyId: company[0].id,
      memberId: memberId,
      productId: productRecord.id,
      planId: planRecord.id,
      whopMembershipId: `membership_test${i}`,
      status: isActive ? "active" : "cancelled",
      startDate: joinDate,
      endDate: isActive ? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) : null,
      createdAt: joinDate,
      updatedAt: new Date(),
    });

    const monthsSinceJoin = Math.floor(daysAgo / 30);
    for (let month = 0; month <= monthsSinceJoin; month++) {
      const paymentDate = new Date(joinDate.getTime() + month * 30 * 24 * 60 * 60 * 1000);
      
      if (paymentDate <= now) {
        paymentRecords.push({
          id: createId(),
          companyId: company[0].id,
          membershipId: membershipId,
          memberId: memberId,
          whopPaymentId: `pay_test${i}_${month}`,
          amount: planPrice.toFixed(2),
          status: "succeeded",
          paymentDate: paymentDate,
          createdAt: paymentDate,
          updatedAt: paymentDate,
        });
      }
    }
  }

  await db.insert(members).values(memberRecords);
  console.log(`✓ Created ${memberRecords.length} members`);

  await db.insert(memberships).values(membershipRecords);
  console.log(`✓ Created ${membershipRecords.length} memberships`);

  await db.insert(payments).values(paymentRecords);
  console.log(`✓ Created ${paymentRecords.length} payments`);

  const totalRevenue = paymentRecords.reduce((sum, p) => sum + parseFloat(p.amount), 0);
  const activeCount = membershipRecords.filter(m => m.status === 'active').length;

  console.log("\n✅ Test data seeded successfully!");
  console.log(`Company: ${company[0].name} (${company[0].whopCompanyId})`);
  console.log(`Members: ${memberRecords.length} (${activeCount} active)`);
  console.log(`Total Revenue: $${totalRevenue.toFixed(2)}`);
}

seedTestData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error seeding data:", error);
    process.exit(1);
  });
