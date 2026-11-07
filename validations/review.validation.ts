import { z } from "zod";

export const reviewSchema = z.object({
  bookingId: z.uuid("A valid completed booking is required"),
  rating: z.number().int().min(1, "Choose at least one star").max(5, "Choose up to five stars"),
  comment: z.string().trim().min(1, "Write a comment or leave it blank").optional(),
});

export type ReviewValues = z.infer<typeof reviewSchema>;
