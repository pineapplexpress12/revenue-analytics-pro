import { ArrowUpRight, ArrowDownRight, LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon?: LucideIcon;
  prefix?: string;
  suffix?: string;
  description?: string;
}

export function MetricCard({
  title,
  value,
  change,
  trend = 'neutral',
  icon: Icon,
  prefix = '',
  suffix = '',
  description,
}: MetricCardProps) {
  return (
    <div className="whop-card">
      <div className="flex flex-row items-center justify-between mb-3">
        <div className="text-sm font-medium text-[var(--whop-text-secondary)]">{title}</div>
        {Icon && <Icon className="h-4 w-4 text-[var(--whop-text-tertiary)]" />}
      </div>
      
      <div className="text-3xl font-semibold text-[var(--whop-text-primary)] mb-2">
        {prefix}{value}{suffix}
      </div>
      
      {change !== undefined && (
        <div className="flex items-center text-sm">
          {trend === 'up' && (
            <>
              <ArrowUpRight className="h-4 w-4 text-[var(--whop-success)] mr-1" />
              <span className="text-[var(--whop-success)] font-medium">+{change.toFixed(1)}%</span>
            </>
          )}
          {trend === 'down' && (
            <>
              <ArrowDownRight className="h-4 w-4 text-[var(--whop-danger)] mr-1" />
              <span className="text-[var(--whop-danger)] font-medium">{change.toFixed(1)}%</span>
            </>
          )}
          {trend === 'neutral' && (
            <span className="text-[var(--whop-text-secondary)]">No change</span>
          )}
          <span className="text-[var(--whop-text-tertiary)] ml-2">from last month</span>
        </div>
      )}
      
      {description && (
        <p className="text-sm text-[var(--whop-text-secondary)] mt-2">{description}</p>
      )}
    </div>
  );
}
