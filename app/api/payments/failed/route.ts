import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { payments, members } from '@/lib/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }

    const failedPaymentsList = await db
      .select({
        payment: payments,
        member: {
          id: members.id,
          whopUserId: members.whopUserId,
          email: members.email,
          username: members.username,
          profilePictureUrl: members.profilePictureUrl,
        }
      })
      .from(payments)
      .leftJoin(members, eq(payments.memberId, members.id))
      .where(
        and(
          eq(payments.companyId, companyId),
          eq(payments.status, 'failed')
        )
      )
      .orderBy(desc(payments.paymentDate))
      .limit(100);

    const failedPayments = failedPaymentsList.map(({ payment, member }) => ({
      id: payment.id,
      amount: parseFloat(payment.amount),
      currency: payment.currency,
      paymentDate: payment.paymentDate,
      status: payment.status,
      whopPaymentId: payment.whopPaymentId,
      member: member ? {
        id: member.id,
        whopUserId: member.whopUserId,
        email: member.email,
        username: member.username,
        profilePictureUrl: member.profilePictureUrl,
      } : null,
    }));

    const stats = await db
      .select({
        totalFailed: sql<number>`COUNT(*)::int`,
        totalAmount: sql<number>`SUM(${payments.amount})::numeric`,
        uniqueMembers: sql<number>`COUNT(DISTINCT ${payments.memberId})::int`,
      })
      .from(payments)
      .where(
        and(
          eq(payments.companyId, companyId),
          eq(payments.status, 'failed')
        )
      )
      .execute();

    const recentFailures = await db
      .select({
        count: sql<number>`COUNT(*)::int`,
      })
      .from(payments)
      .where(
        and(
          eq(payments.companyId, companyId),
          eq(payments.status, 'failed'),
          sql`${payments.paymentDate} >= NOW() - INTERVAL '30 days'`
        )
      )
      .execute();

    return NextResponse.json({
      payments: failedPayments,
      stats: {
        totalFailed: stats[0]?.totalFailed || 0,
        totalAmount: parseFloat(stats[0]?.totalAmount?.toString() || '0'),
        uniqueMembers: stats[0]?.uniqueMembers || 0,
        recentFailures: recentFailures[0]?.count || 0,
      }
    });
  } catch (error) {
    console.error('Failed to fetch failed payments:', error);
    return NextResponse.json({ error: 'Failed to fetch failed payments' }, { status: 500 });
  }
}
