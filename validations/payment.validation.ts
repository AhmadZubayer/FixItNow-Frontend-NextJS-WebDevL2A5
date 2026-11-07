import { z } from "zod";

export const paymentSchema = z.object({
  bookingId: z.uuid("A valid booking is required"),
  provider: z.literal("STRIPE").default("STRIPE"),
});
