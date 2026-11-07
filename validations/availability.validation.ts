import { z } from "zod";

const localTime = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Choose a valid date and time");

export const availabilitySchema = z.object({
  startAt: localTime,
  endAt: localTime,
}).refine((value) => Date.parse(`${value.startAt}:00+06:00`) > Date.now(), {
  path: ["startAt"], message: "Start time must be in the future",
}).refine((value) => Date.parse(`${value.endAt}:00+06:00`) > Date.parse(`${value.startAt}:00+06:00`), {
  path: ["endAt"], message: "End time must be after the start time",
});

export function availabilityPayload(value: z.infer<typeof availabilitySchema>) {
  return { slots: [{ startAt: `${value.startAt}:00+06:00`, endAt: `${value.endAt}:00+06:00` }] };
}

export type AvailabilityValues = z.infer<typeof availabilitySchema>;
