import { z } from "zod";

export const adminSearchSchema = z.object({
  q: z.string().trim().max(100, "Search must be 100 characters or fewer"),
});

export const adminStatusSchema = z.object({
  activeStatus: z.enum(["ACTIVE", "BLOCKED"]),
});

export const categorySchema = z.object({
  name: z.string().trim().min(2, "Enter at least 2 characters"),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and single hyphens"),
  description: z.string().trim(),
});

export const categoryEditSchema = categorySchema.extend({ isActive: z.boolean() });

export type CategoryValues = z.infer<typeof categoryEditSchema>;
