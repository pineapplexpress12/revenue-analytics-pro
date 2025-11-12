import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { benchmarkData, companies, products } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getRevenueRange, determineNiche } from '@/lib/benchmarking/utils';

export async function POST(request: NextRequest) {
  try {
    const { companyId: whopCompanyId } = await request.json();

    if (!whopCompanyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }

    const metricsResponse = await fetch(
      `${request.nextUrl.origin}/api/metrics/overview?companyId=${whopCompanyId}`
    );
    
    if (!metricsResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch company metrics' }, { status: 500 });
    }

    const metrics = await metricsResponse.json();

    const company = await db
      .select()
      .from(companies)
      .where(eq(companies.whopCompanyId, whopCompanyId))
      .limit(1);

    if (!company[0]) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const dbCompanyId = company[0].id;

    const companyProducts = await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.companyId, dbCompanyId),
          eq(products.isApp, false)
        )
      )
      .limit(10);

    const niche = determineNiche(companyProducts);
    const revenueRange = getRevenueRange(metrics.mrr);

    const existingBenchmark = await db
      .select()
      .from(benchmarkData)
      .where(
        and(
          eq(benchmarkData.niche, niche),
          eq(benchmarkData.revenueRange, revenueRange)
        )
      )
      .limit(1);

    if (existingBenchmark.length > 0) {
      const current = existingBenchmark[0];
      const contributingCompanies = (current.contributingCompanies as string[]) || [];
      
      if (contributingCompanies.includes(whopCompanyId)) {
        return NextResponse.json({ 
          success: true, 
          message: 'Already contributed',
          niche, 
          revenueRange 
        });
      }

      const currentSize = current.sampleSize;
      const newSize = currentSize + 1;
      const newContributingCompanies = [...contributingCompanies, whopCompanyId];

      const newAvgMrr = ((parseFloat(current.avgMrr) * currentSize) + metrics.mrr) / newSize;
      const newAvgChurnRate = ((parseFloat(current.avgChurnRate) * currentSize) + metrics.churnRate) / newSize;
      const newAvgLtv = ((parseFloat(current.avgLtv) * currentSize) + metrics.ltv) / newSize;
      const newAvgArpu = ((parseFloat(current.avgArpu) * currentSize) + metrics.arpu) / newSize;

      await db
        .update(benchmarkData)
        .set({
          avgMrr: newAvgMrr.toFixed(2),
          avgChurnRate: newAvgChurnRate.toFixed(2),
          avgLtv: newAvgLtv.toFixed(2),
          avgArpu: newAvgArpu.toFixed(2),
          sampleSize: newSize,
          contributingCompanies: newContributingCompanies,
          updatedAt: new Date(),
        })
        .where(eq(benchmarkData.id, current.id));
    } else {
      await db.insert(benchmarkData).values({
        niche,
        revenueRange,
        avgMrr: metrics.mrr.toFixed(2),
        avgChurnRate: metrics.churnRate.toFixed(2),
        avgLtv: metrics.ltv.toFixed(2),
        avgArpu: metrics.arpu.toFixed(2),
        sampleSize: 1,
        contributingCompanies: [whopCompanyId],
      });
    }

    return NextResponse.json({ success: true, niche, revenueRange });
  } catch (error) {
    console.error('Failed to contribute to benchmarks:', error);
    return NextResponse.json({ error: 'Failed to contribute to benchmarks' }, { status: 500 });
  }
}
