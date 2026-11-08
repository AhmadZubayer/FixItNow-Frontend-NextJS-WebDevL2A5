import { backend } from "@/lib/backend";

export type Category = {
  id: string;
  name: string;
  slug: string;
};

export type Service = {
  id: string;
  title: string;
  description: string;
  price: string;
  durationMinutes: number;
  category: Category;
  technicianProfile: {
    id: string;
    location: string;
    user: { name: string };
    averageRating: number;
    reviewCount: number;
  };
};

export type Technician = {
  id: string;
  bio: string | null;
  skills: string[];
  experienceYears: number;
  location: string;
  profilePhoto: string | null;
  user: { name: string };
  services: Array<{
    id: string;
    title: string;
    description?: string;
    price: string;
    durationMinutes: number;
    category: Category;
  }>;
  availabilitySlots?: Array<{ id: string; startAt: string; endAt: string; isActive: boolean; bookings: Array<{ status: string }> }>;
  reviews?: Array<{
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    customer: { name: string };
  }>;
  averageRating: number;
  reviewCount: number;
};

type ApiResponse<T> = { data: T };

export const getCategories = async () => {
  const response = await backend.get<ApiResponse<Category[]>>("/api/categories");
  return response.data.data;
};

export const getServices = async (params?: Record<string, string>) => {
  const response = await backend.get<ApiResponse<Service[]>>("/api/services", { params });
  return response.data.data;
};

export const getTechnicians = async (params?: Record<string, string>) => {
  const response = await backend.get<ApiResponse<Technician[]>>("/api/technicians", { params });
  return response.data.data;
};

export const getTechniciansPage = async (params: Record<string, string>) => {
  const response = await backend.get<ApiResponse<Technician[]> & { meta: { page: number; limit: number; total: number } }>("/api/technicians", { params });
  return { technicians: response.data.data, meta: response.data.meta };
};

export const getTechnician = async (id: string) => {
  const response = await backend.get<ApiResponse<Technician>>(`/api/technicians/${id}`);
  return response.data.data;
};
