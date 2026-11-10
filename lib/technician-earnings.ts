export type TechnicianPayment = {
  id: string; amount: string; technicianShare: string; status: string; provider: string;
  createdAt: string; updatedAt?: string; paidAt: string | null;
  booking: { id: string; items?: Array<{ title: string }>; customer: { name: string }; service: { title: string } };
};
const dhakaDay = (date: Date) => {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Dhaka", year: "numeric", month: "numeric", day: "numeric" }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find(item => item.type === type)?.value);
  return new Date(Date.UTC(part("year"), part("month") - 1, part("day")));
};
export const technicianEarnings = (payments: TechnicianPayment[], now = new Date()) => {
  const today = dhakaDay(now);
  const month = today.getUTCMonth();
  const year = today.getUTCFullYear();
  const monday = today.getTime() - ((today.getUTCDay() + 6) % 7) * 86400000;
  const daily = Array.from({ length: new Date(Date.UTC(year, month + 1, 0)).getUTCDate() }, (_, index) => ({ label: String(index + 1), value: 0 }));
  let dayCents = 0, weekCents = 0, monthCents = 0;
  for (const payment of payments) {
    const paid = new Date(payment.paidAt ?? payment.createdAt);
    if (payment.status !== "COMPLETED" || !Number.isFinite(paid.getTime()) || paid > now) continue;
    const cents = Math.round(Number(payment.technicianShare) * 100);
    if (!Number.isFinite(cents)) continue;
    const day = dhakaDay(paid);
    if (+day === +today) dayCents += cents;
    if (+day >= monday && +day <= +today) weekCents += cents;
    if (day.getUTCFullYear() === year && day.getUTCMonth() === month) { monthCents += cents; daily[day.getUTCDate() - 1].value += cents; }
  }
  return { today: dayCents / 100, week: weekCents / 100, month: monthCents / 100, daily: daily.map(point => ({ ...point, value: point.value / 100 })) };
};
