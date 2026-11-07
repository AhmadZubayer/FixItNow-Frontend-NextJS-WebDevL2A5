import { z } from "zod";

export const bookingSchema = z.object({
  serviceId: z.uuid("Choose a service"),
  availabilitySlotId: z.uuid("Choose an available time"),
});

export type BookingValues = z.infer<typeof bookingSchema>;
