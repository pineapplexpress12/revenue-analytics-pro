import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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
    <Card className="bg-gray-a2 border-gray-a4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-3 font-medium text-gray-11">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-gray-11" />}
      </CardHeader>
      <CardContent>
        <div className="text-7 font-bold text-gray-12">
          {prefix}{value}{suffix}
        </div>
        {change !== undefined && (
          <div className="flex items-center mt-2 text-2">
            {trend === 'up' && (
              <>
                <ArrowUpRight className="h-4 w-4 text-green-11 mr-1" />
                <span className="text-green-11">+{change.toFixed(1)}%</span>
              </>
            )}
            {trend === 'down' && (
              <>
                <ArrowDownRight className="h-4 w-4 text-red-11 mr-1" />
                <span className="text-red-11">{change.toFixed(1)}%</span>
              </>
            )}
            {trend === 'neutral' && (
              <span className="text-gray-11">No change</span>
            )}
            <span className="text-gray-11 ml-1">from last month</span>
          </div>
        )}
        {description && (
          <p className="text-2 text-gray-11 mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
