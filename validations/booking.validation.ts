import { z } from "zod";

const availabilitySlotId = z.uuid("Choose an available time");
const serviceId = z.uuid("Choose a service").transform(id => id.toLowerCase());
export const bookingSchema = z.strictObject({
  serviceIds: z.array(serviceId).min(1, "Choose at least one service").max(50)
    .refine(ids => new Set(ids).size === ids.length, "Select each service only once"),
  availabilitySlotId,
});
export const bookingRequestSchema = z.union([bookingSchema, z.strictObject({ serviceId, availabilitySlotId })]);

export type BookingValues = z.infer<typeof bookingSchema>;

export const bookingStatusSchema = z.object({
  status: z.enum(["ACCEPTED", "DECLINED", "IN_PROGRESS", "COMPLETED"]),
});
