export type BookingLabel = {
  service: { title: string };
  items?: Array<{ title: string }>;
};

export const bookingLabel = ({ items, service }: BookingLabel) =>
  items?.length ? items.map(({ title }) => title).join(", ") : service.title;
