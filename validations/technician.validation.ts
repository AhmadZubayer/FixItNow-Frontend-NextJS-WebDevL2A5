import { z } from "zod";

const yearInput = z.string().regex(/^\d+$/, "Enter a whole number of years").transform(Number).pipe(z.number().int().min(0, "Years cannot be negative"));
const durationInput = z.string().regex(/^\d+$/, "Enter a whole number of minutes").transform(Number).pipe(z.number().int().positive("Duration must be positive"));

export const technicianProfileSchema = z.object({
  bio: z.string().trim().optional(),
  skills: z.string().trim().transform((value) => value.split(",").map((skill) => skill.trim()).filter(Boolean)).pipe(z.array(z.string().min(1)).min(1, "Enter at least one skill")),
  experienceYears: yearInput,
  location: z.string().trim().min(2, "Location must contain at least 2 characters"),
  profilePhoto: z.union([z.literal(""), z.url("Enter a valid photo URL")]).transform((value) => value || undefined),
});

export const technicianServiceSchema = z.object({
  title: z.string().trim().min(2, "Title must contain at least 2 characters"),
  description: z.string().trim().min(1, "Description is required"),
  price: z.string().trim().regex(/^\d{1,8}(\.\d{1,2})?$/, "Enter a price with up to two decimal places").refine((value) => Number(value) > 0, "Price must be greater than zero"),
  durationMinutes: durationInput,
  categoryId: z.uuid("Choose a category"),
});

export const technicianServiceEditSchema = technicianServiceSchema.partial().extend({ isActive: z.boolean().optional() }).refine(
  (value) => Object.keys(value).length > 0,
  "Provide a service field to update",
);

export type TechnicianProfileValues = z.input<typeof technicianProfileSchema>;
export type TechnicianServiceValues = z.input<typeof technicianServiceSchema>;
