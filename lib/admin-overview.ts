import type { AreaChartDataPoint } from "@/components/ui/area-chart";

type DatedValue = { date: string; value: number };

const dateParts = (date: Date) => {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Dhaka", year: "numeric", month: "numeric", day: "numeric" }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((item) => item.type === type)?.value);
  return { year: part("year"), month: part("month"), day: part("day") };
};

export const summarizeMonth = (records: DatedValue[], now = new Date()) => {
  const current = dateParts(now);
  const previous = current.month === 1 ? { year: current.year - 1, month: 12 } : { year: current.year, month: current.month - 1 };
  const daysInMonth = new Date(Date.UTC(current.year, current.month, 0)).getUTCDate();
  const weeks: AreaChartDataPoint[] = [
    { label: "Days 1–7", value: 0 },
    { label: "Days 8–14", value: 0 },
    { label: "Days 15–21", value: 0 },
    { label: `Days 22–${daysInMonth}`, value: 0 },
  ];
  let total = 0;
  let today = 0;
  let thisMonth = 0;
  let lastMonth = 0;

  for (const record of records) {
    const date = new Date(record.date);
    if (!Number.isFinite(date.getTime()) || !Number.isFinite(record.value) || date > now) continue;
    const parts = dateParts(date);
    total += record.value;
    if (parts.year === current.year && parts.month === current.month) {
      thisMonth += record.value;
      weeks[Math.min(3, Math.floor((parts.day - 1) / 7))].value += record.value;
      if (parts.day === current.day) today += record.value;
    } else if (parts.year === previous.year && parts.month === previous.month) {
      lastMonth += record.value;
    }
  }

  return { total, today, thisMonth, lastMonth, weeks };
};

export const monthChange = (current: number, previous: number, format = (value: number) => String(value)) => {
  const difference = current - previous;
  const signed = `${difference > 0 ? "+" : difference < 0 ? "−" : ""}${format(Math.abs(difference))}`;
  const percentage = previous > 0 ? ` (${difference > 0 ? "+" : difference < 0 ? "−" : ""}${Math.abs(difference / previous * 100).toFixed(1)}%)` : "";
  return `${signed}${percentage} vs last month`;
};
