export type CustomerReview = { id: string; rating: number; comment: string | null; createdAt: string };

export type CustomerBooking = {
  id: string;
  status: "REQUESTED" | "ACCEPTED" | "DECLINED" | "PAID" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  createdAt: string;
  updatedAt?: string;
  startAt: string;
  endAt?: string;
  priceAtBooking: string;
  items?: Array<{ title: string; price?: string; durationMinutes?: number }>;
  service: { title: string; technicianProfile: { id: string; user: { name: string } } };
  review?: CustomerReview | null;
};

export type CustomerPayment = {
  id: string;
  bookingId: string;
  amount: string;
  status: string;
  provider: string;
  transactionId?: string | null;
  createdAt: string;
  paidAt?: string | null;
  updatedAt?: string;
  booking: { status?: string; items?: Array<{ title: string }>; service: { title: string } };
};

export const activityViews = ["All", "Bookings", "Payments", "Reviews"] as const;
export type ActivityView = typeof activityViews[number];

export type CustomerActivity =
  | { id: string; kind: "Booking"; date: string; status: string; successful: boolean; booking: CustomerBooking }
  | { id: string; kind: "Payment"; date: string; status: string; successful: boolean; payment: CustomerPayment }
  | { id: string; kind: "Review"; date: string; status: "SUBMITTED"; successful: true; booking: CustomerBooking; review: CustomerReview };

export const customerActivities = (bookings: CustomerBooking[], payments: CustomerPayment[], view: ActivityView = "All"): CustomerActivity[] => {
  const activities: CustomerActivity[] = [
    ...bookings.map((booking): CustomerActivity => ({
      id: `booking-${booking.id}`, kind: "Booking", date: booking.updatedAt ?? booking.createdAt,
      status: booking.status, successful: ["ACCEPTED", "PAID", "IN_PROGRESS", "COMPLETED"].includes(booking.status), booking,
    })),
    ...payments.map((payment): CustomerActivity => ({
      id: `payment-${payment.id}`, kind: "Payment", date: payment.updatedAt ?? payment.paidAt ?? payment.createdAt,
      status: payment.status, successful: payment.status === "COMPLETED" || payment.status === "REFUNDED", payment,
    })),
    ...bookings.flatMap((booking): CustomerActivity[] => booking.review ? [{
      id: `review-${booking.review.id}`, kind: "Review", date: booking.review.createdAt,
      status: "SUBMITTED", successful: true, booking, review: booking.review,
    }] : []),
  ];
  const timestamp = (value: string) => Number.isFinite(Date.parse(value)) ? Date.parse(value) : 0;
  return activities.filter((activity) => view === "All" || `${activity.kind}s` === view)
    .sort((a, b) => timestamp(b.date) - timestamp(a.date) || a.id.localeCompare(b.id));
};
