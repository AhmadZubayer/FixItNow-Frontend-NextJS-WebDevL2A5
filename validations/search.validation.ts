import { z } from "zod";

const price = z.string().regex(/^\d{1,8}(\.\d{1,2})?$/, "Enter a valid price with up to two decimal places");

export const searchSchema = z.object({
  q: z.string().trim().max(100, "Search must be 100 characters or fewer").optional().transform((value) => value || undefined),
  categoryId: z.uuid("Choose a valid category").optional(),
  serviceId: z.uuid("Choose a valid service").optional(),
  serviceTitle: z.string().trim().min(1).optional(),
  location: z.string().trim().min(2, "Enter at least 2 characters").optional(),
  minPrice: price.optional(),
  maxPrice: price.optional(),
  minRating: z.coerce.number<number>().min(0).max(5).optional(),
  priceSort: z.enum(["asc", "desc"]).optional(),
  ratingSort: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number<number>().int().min(1).optional(),
}).refine(
  (value) => !value.minPrice || !value.maxPrice || Number(value.minPrice) <= Number(value.maxPrice),
  { path: ["maxPrice"], message: "Maximum price must be at least the minimum price" },
);

export type SearchValues = z.infer<typeof searchSchema>;
