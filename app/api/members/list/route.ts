import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { members, memberAnalytics, memberships } from '@/lib/db/schema';
import { eq, and, desc, asc, ilike, gte, lte, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get('companyId');
    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'totalRevenue'; // totalRevenue, churnRisk, recent
    const filterRisk = searchParams.get('filterRisk') || 'all'; // all, high, medium, low
    
    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    // Build where conditions
    const conditions = [eq(members.companyId, companyId)];
    
    // Add search filter
    if (search) {
      conditions.push(
        sql`(${members.email} ILIKE ${`%${search}%`} OR ${members.username} ILIKE ${`%${search}%`})`
      );
    }
    
    // Add risk filter
    if (filterRisk !== 'all') {
      if (filterRisk === 'high') {
        conditions.push(gte(memberAnalytics.churnRiskScore, 60));
      } else if (filterRisk === 'medium') {
        conditions.push(and(
          gte(memberAnalytics.churnRiskScore, 30),
          lte(memberAnalytics.churnRiskScore, 59)
        )!);
      } else if (filterRisk === 'low') {
        conditions.push(lte(memberAnalytics.churnRiskScore, 29));
      }
    }

    // Determine sort order
    let orderByClause;
    if (sortBy === 'totalRevenue') {
      orderByClause = desc(memberAnalytics.totalRevenue);
    } else if (sortBy === 'churnRisk') {
      orderByClause = desc(memberAnalytics.churnRiskScore);
    } else if (sortBy === 'recent') {
      orderByClause = desc(members.createdAt);
    } else {
      orderByClause = desc(memberAnalytics.totalRevenue);
    }

    // Get total count for pagination
    const totalCountResult = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(members)
      .leftJoin(memberAnalytics, eq(members.id, memberAnalytics.memberId))
      .where(and(...conditions));
    
    const totalCount = totalCountResult[0]?.count || 0;

    // Fetch members with analytics
    const membersList = await db
      .select({
        member: members,
        analytics: memberAnalytics,
      })
      .from(members)
      .leftJoin(memberAnalytics, eq(members.id, memberAnalytics.memberId))
      .where(and(...conditions))
      .orderBy(orderByClause)
      .limit(50)
      .offset((page - 1) * 50);

    // Format response
    const formattedMembers = membersList.map(({ member, analytics }) => ({
      id: member.id,
      whopUserId: member.whopUserId,
      email: member.email,
      username: member.username,
      profilePictureUrl: member.profilePictureUrl,
      createdAt: member.createdAt,
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
    }));

    return NextResponse.json({
      members: formattedMembers,
      pagination: {
        page,
        totalPages: Math.ceil(totalCount / 50),
        totalCount,
      },
    });
  } catch (error) {
    console.error('Error fetching members list:', error);
    return NextResponse.json(
      { error: 'Failed to fetch members list' },
      { status: 500 }
    );
  }
}
