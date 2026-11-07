import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Enter a valid email address").transform((value) => value.toLowerCase()),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must contain at least 2 characters"),
  email: z.email("Enter a valid email address").transform((value) => value.toLowerCase()),
  password: z.string().min(8, "Password must contain at least 8 characters"),
  role: z.enum(["CUSTOMER", "TECHNICIAN"], "Choose a role"),
});

export type LoginValues = z.input<typeof loginSchema>;
export type RegisterValues = z.input<typeof registerSchema>;
