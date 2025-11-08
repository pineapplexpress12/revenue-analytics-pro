import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { benchmarkData, products } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getRevenueRange, determineNiche, calculatePercentile, getStatus } from '@/lib/benchmarking/utils';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }

    const metricsResponse = await fetch(
      `${request.nextUrl.origin}/api/metrics/overview?companyId=${companyId}`
    );
    
    if (!metricsResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch company metrics' }, { status: 500 });
    }

    const myMetrics = await metricsResponse.json();

    const companyProducts = await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.companyId, companyId),
          eq(products.isApp, false)
        )
      )
      .limit(10);

    const niche = determineNiche(companyProducts);
    const revenueRange = getRevenueRange(myMetrics.mrr);

    const benchmarks = await db
      .select()
      .from(benchmarkData)
      .where(
        and(
          eq(benchmarkData.niche, niche),
          eq(benchmarkData.revenueRange, revenueRange)
        )
      )
      .limit(1);

    if (benchmarks.length === 0) {
      return NextResponse.json({
        noBenchmark: true,
        message: 'Not enough data yet for your niche and revenue range',
        niche,
        revenueRange,
        myMetrics,
      });
    }

    const benchmark = benchmarks[0];

    const actualSampleSize = (benchmark.contributingCompanies as string[] || []).length || benchmark.sampleSize;

    const comparison = {
      niche,
      revenueRange,
      mrr: {
        yours: myMetrics.mrr,
        average: parseFloat(benchmark.avgMrr),
        percentile: calculatePercentile(myMetrics.mrr, { avgMrr: benchmark.avgMrr }),
        status: getStatus(myMetrics.mrr, parseFloat(benchmark.avgMrr)),
      },
      churnRate: {
        yours: myMetrics.churnRate,
        average: parseFloat(benchmark.avgChurnRate),
        percentile: calculatePercentile(myMetrics.churnRate, { avgChurnRate: benchmark.avgChurnRate }, true),
        status: getStatus(myMetrics.churnRate, parseFloat(benchmark.avgChurnRate), true),
      },
      ltv: {
        yours: myMetrics.ltv,
        average: parseFloat(benchmark.avgLtv),
        percentile: calculatePercentile(myMetrics.ltv, { avgLtv: benchmark.avgLtv }),
        status: getStatus(myMetrics.ltv, parseFloat(benchmark.avgLtv)),
      },
      arpu: {
        yours: myMetrics.arpu,
        average: parseFloat(benchmark.avgArpu),
        percentile: calculatePercentile(myMetrics.arpu, { avgArpu: benchmark.avgArpu }),
        status: getStatus(myMetrics.arpu, parseFloat(benchmark.avgArpu)),
      },
      sampleSize: actualSampleSize,
    };

    return NextResponse.json(comparison);
  } catch (error) {
    console.error('Failed to compare benchmarks:', error);
    return NextResponse.json({ error: 'Failed to compare benchmarks' }, { status: 500 });
  }
}
