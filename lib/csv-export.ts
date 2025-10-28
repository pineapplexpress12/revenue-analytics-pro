export function downloadCSV(data: any[], filename: string) {
  if (!data || data.length === 0) {
    alert("No data available to export");
    return;
  }

  const headers = Object.keys(data[0]);
  
  const csvContent = [
    headers.join(","),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return "";
        if (typeof value === "string" && value.includes(",")) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(",")
    )
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export function formatMetricsForExport(metrics: any) {
  return [{
    metric: "Monthly Recurring Revenue",
    value: `$${metrics.mrr.toFixed(2)}`,
    growth: `${metrics.mrrGrowth.toFixed(1)}%`
  }, {
    metric: "Total Revenue",
    value: `$${metrics.totalRevenue.toFixed(2)}`,
    growth: "-"
  }, {
    metric: "Active Members",
    value: metrics.activeMembers,
    growth: `${metrics.memberGrowth}%`
  }, {
    metric: "Churn Rate",
    value: `${metrics.churnRate.toFixed(1)}%`,
    change: `${metrics.churnChange.toFixed(1)}%`
  }, {
    metric: "Lifetime Value",
    value: `$${metrics.ltv.toFixed(2)}`,
    growth: "-"
  }, {
    metric: "ARPU",
    value: `$${metrics.arpu.toFixed(2)}`,
    growth: "-"
  }];
}
