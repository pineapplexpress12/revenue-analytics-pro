export function getRevenueRange(mrr: number): string {
  if (mrr < 5000) return '0-5k';
  if (mrr < 20000) return '5k-20k';
  if (mrr < 50000) return '20k-50k';
  if (mrr < 100000) return '50k-100k';
  return '100k+';
}

export function determineNiche(products: any[]): string {
  if (!products || products.length === 0) return 'general';
  
  const firstProductName = products[0]?.name?.toLowerCase() || '';
  
  if (firstProductName.includes('fitness') || firstProductName.includes('workout') || firstProductName.includes('health')) {
    return 'fitness';
  }
  if (firstProductName.includes('trading') || firstProductName.includes('stock') || firstProductName.includes('crypto')) {
    return 'trading';
  }
  if (firstProductName.includes('education') || firstProductName.includes('course') || firstProductName.includes('learn')) {
    return 'education';
  }
  if (firstProductName.includes('gaming') || firstProductName.includes('game')) {
    return 'gaming';
  }
  if (firstProductName.includes('creator') || firstProductName.includes('content')) {
    return 'creator';
  }
  
  return 'general';
}

export function calculatePercentile(yourValue: number, benchmark: any, lowerIsBetter = false): number {
  const average = parseFloat(benchmark.avgMrr || benchmark.avgChurnRate || benchmark.avgLtv || benchmark.avgArpu || '0');
  
  if (average === 0) return 50;
  
  const diff = yourValue - average;
  const percentDiff = (diff / average) * 100;
  
  if (lowerIsBetter) {
    if (percentDiff <= -20) return 90;
    if (percentDiff <= -10) return 75;
    if (percentDiff <= 0) return 60;
    if (percentDiff <= 10) return 40;
    if (percentDiff <= 20) return 25;
    return 10;
  } else {
    if (percentDiff >= 20) return 90;
    if (percentDiff >= 10) return 75;
    if (percentDiff >= 0) return 60;
    if (percentDiff >= -10) return 40;
    if (percentDiff >= -20) return 25;
    return 10;
  }
}

export function getStatus(yours: number, average: number, lowerIsBetter = false): 'above' | 'below' | 'average' {
  const diff = yours - average;
  const threshold = average * 0.1;
  
  if (lowerIsBetter) {
    if (diff < -threshold) return 'above';
    if (diff > threshold) return 'below';
  } else {
    if (diff > threshold) return 'above';
    if (diff < -threshold) return 'below';
  }
  
  return 'average';
}
