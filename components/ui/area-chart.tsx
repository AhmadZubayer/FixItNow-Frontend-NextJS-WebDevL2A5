"use client";

import { useId, type ReactNode } from "react";
import { Area, AreaChart as RechartsAreaChart, CartesianGrid, XAxis } from "recharts";
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { cn } from "@/lib/utils";

export type AreaChartDataPoint = {
  label: string;
  value: number;
};

export type AreaChartProps = {
  data: AreaChartDataPoint[];
  title: string;
  description?: string;
  seriesLabel: string;
  footer?: ReactNode;
  withCard?: boolean;
  className?: string;
  chartClassName?: string;
  tickFormatter?: (value: string) => string;
};

const AreaChart = ({ data, title, description, seriesLabel, footer, withCard = false, className, chartClassName, tickFormatter }: AreaChartProps) => {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const gradientId = `area-chart-green-${id}`;
  const headingId = `area-chart-heading-${id}`;
  const config = {
    value: { label: seriesLabel, color: "#9AE600" },
  } satisfies ChartConfig;

  const chart = data.length ? <ChartContainer config={config} className={cn("aspect-auto h-64 w-full", chartClassName)}>
    <RechartsAreaChart accessibilityLayer data={data} margin={{ left: 12, right: 12 }}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-value)" stopOpacity={0.45} />
          <stop offset="100%" stopColor="var(--color-value)" stopOpacity={0.05} />
        </linearGradient>
      </defs>
      <CartesianGrid vertical={false} />
      <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={tickFormatter} />
      <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
      <Area dataKey="value" name={seriesLabel} type="monotone" fill={`url(#${gradientId})`} stroke="var(--color-value)" strokeWidth={2} />
    </RechartsAreaChart>
  </ChartContainer> : <p className="flex h-64 items-center justify-center text-sm text-muted-foreground">No data available.</p>;

  if (withCard) return <Card className={className} aria-labelledby={headingId}>
    <CardHeader>
      <h2 id={headingId} className="text-sm font-medium">{title}</h2>
      {description && <CardDescription>{description}</CardDescription>}
    </CardHeader>
    <CardContent>{chart}</CardContent>
    {footer && <CardFooter className="text-sm">{footer}</CardFooter>}
  </Card>;

  return <section className={cn("min-w-0 space-y-4", className)} aria-labelledby={headingId}>
    <div className="space-y-1">
      <h2 id={headingId} className="text-lg font-semibold">{title}</h2>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
    {chart}
    {footer && <div className="text-sm">{footer}</div>}
  </section>;
};

export { AreaChart };
