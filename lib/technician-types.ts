export type TechnicianService = {
  id: string;
  title: string;
  description: string;
  price: string;
  durationMinutes: number;
  categoryId: string;
  isActive: boolean;
};

export type AvailabilitySlot = {
  id: string;
  startAt: string;
  endAt: string;
  isActive: boolean;
  bookings: Array<{ status: string }>;
};

export type TechnicianProfile = {
  id: string;
  bio: string | null;
  skills: string[];
  experienceYears: number;
  location: string;
  profilePhoto: string | null;
  services: TechnicianService[];
  availabilitySlots: AvailabilitySlot[];
};

export type TechnicianBooking = {
  id: string;
  status: "REQUESTED" | "ACCEPTED" | "DECLINED" | "PAID" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  startAt: string;
  priceAtBooking: string;
  customer: { name: string };
  service: { title: string };
};
