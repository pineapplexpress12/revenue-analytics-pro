import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { members, memberAnalytics, memberships, payments, products, plans } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { calculateChurnRisk, calculateEngagementScore } from '@/lib/analytics/member-scoring';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const memberId = searchParams.get('memberId');
    const companyId = searchParams.get('companyId');
    
    if (!memberId || !companyId) {
      return NextResponse.json(
        { error: 'Member ID and Company ID are required' },
        { status: 400 }
      );
    }

    // Get member data
    const memberData = await db
      .select()
      .from(members)
      .where(and(
        eq(members.id, memberId),
        eq(members.companyId, companyId)
      ))
      .limit(1);

    if (!memberData || memberData.length === 0) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    const member = memberData[0];

    // Get analytics
    const analyticsData = await db
      .select()
      .from(memberAnalytics)
      .where(eq(memberAnalytics.memberId, memberId))
      .limit(1);

    const analytics = analyticsData[0] || null;

    // Get memberships with product and plan details
    const memberMemberships = await db
      .select({
        membership: memberships,
        product: products,
        plan: plans,
      })
      .from(memberships)
      .leftJoin(products, eq(memberships.productId, products.id))
      .leftJoin(plans, eq(memberships.planId, plans.id))
      .where(eq(memberships.memberId, memberId))
      .orderBy(desc(memberships.startDate));

    // Get payment history
    const paymentHistory = await db
      .select()
      .from(payments)
      .where(eq(payments.memberId, memberId))
      .orderBy(desc(payments.paymentDate))
      .limit(20);

    // Calculate detailed stats
    const totalRevenue = paymentHistory
      .filter(p => p.status === 'succeeded')
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);

    const activeMemberships = memberMemberships.filter(
      m => m.membership.status === 'active'
    );

    // Build timeline events
    const timeline = [
      {
        type: 'joined',
        date: member.createdAt,
        description: 'Joined the community',
      },
      ...memberMemberships.map(m => ({
        type: 'membership',
        date: m.membership.startDate,
        description: `Started ${m.product?.name} subscription`,
        productName: m.product?.name,
        status: m.membership.status,
      })),
      ...paymentHistory.slice(0, 10).map(p => ({
        type: 'payment',
        date: p.paymentDate,
        description: `Payment ${p.status}`,
        amount: parseFloat(p.amount),
        status: p.status,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Format response
    const profile = {
      ...member,
      analytics: analytics ? {
        totalRevenue: parseFloat(analytics.totalRevenue),
        totalPayments: analytics.totalPayments,
        averagePayment: parseFloat(analytics.averagePayment),
        lifetimeMonths: analytics.lifetimeMonths,
        lastPaymentAt: analytics.lastPaymentAt,
        churnRiskScore: analytics.churnRiskScore,
        engagementScore: analytics.engagementScore,
        calculatedAt: analytics.calculatedAt,
      } : null,
      totalRevenue,
      lifetimeValue: analytics ? parseFloat(analytics.totalRevenue) : 0,
      activeMemberships: activeMemberships.map(m => ({
        id: m.membership.id,
        productName: m.product?.name,
        planName: m.plan?.name,
        status: m.membership.status,
        startDate: m.membership.startDate,
        endDate: m.membership.endDate,
        cancelAtPeriodEnd: m.membership.cancelAtPeriodEnd,
        price: m.plan ? parseFloat(m.plan.price) : 0,
        currency: m.plan?.currency,
      })),
      paymentHistory: paymentHistory.map(p => ({
        id: p.id,
        amount: parseFloat(p.amount),
        currency: p.currency,
        status: p.status,
        paymentDate: p.paymentDate,
        refundedAmount: parseFloat(p.refundedAmount),
      })),
      timeline,
    };

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching member profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch member profile' },
      { status: 500 }
    );
  }
}
