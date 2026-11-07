export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: "CUSTOMER" | "TECHNICIAN" | "ADMIN";
  activeStatus: "ACTIVE" | "BLOCKED";
  createdAt: string;
};

export type AdminBooking = {
  id: string;
  status: string;
  priceAtBooking: string;
  createdAt: string;
  customer: { name: string };
  service: { title: string; technicianProfile: { user: { name: string } } };
};

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
};
