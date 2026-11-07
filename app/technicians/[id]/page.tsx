import axios from "axios";
import { notFound } from "next/navigation";
import Link from "next/link";
import { connection } from "next/server";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getTechnician } from "@/lib/public-api";

export default async function TechnicianPage({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  let technician;

  try {
    technician = await getTechnician(id);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) notFound();
    throw error;
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 space-y-8 px-4 py-8 sm:px-6">
      <div className="space-y-3"><Link href="/services" className="text-xs text-muted-foreground underline underline-offset-4">Back to services</Link><h1 className="text-2xl font-semibold tracking-tight">{technician.user.name}</h1><p className="text-sm text-muted-foreground">{technician.location} · {technician.experienceYears} years of experience · {technician.averageRating.toFixed(1)} rating from {technician.reviewCount} reviews</p><p className="max-w-2xl text-sm">{technician.bio}</p><div className="flex flex-wrap gap-1">{technician.skills.map((skill) => <Badge key={skill} variant="secondary">{skill}</Badge>)}</div></div>
      <section className="space-y-3"><h2 className="text-lg font-semibold">Services and prices</h2><div className="grid gap-3 sm:grid-cols-2">{technician.services.map((service) => <div key={service.id} className="flex items-center justify-between gap-3 rounded-lg border p-4"><div><h3 className="font-medium">{service.title}</h3><p className="text-xs text-muted-foreground">{service.category.name}</p></div><span className="font-medium">৳{service.price}</span></div>)}</div></section>
      <section className="space-y-3"><h2 className="text-lg font-semibold">Available times</h2>{technician.availabilitySlots?.length ? <div className="flex flex-wrap gap-2">{technician.availabilitySlots.map((slot) => <div key={slot.id} className="rounded-md border px-3 py-2 text-xs">{new Date(slot.startAt).toLocaleString("en-BD", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dhaka" })}</div>)}</div> : <p className="text-sm text-muted-foreground">No time slots are available right now.</p>}<Button render={<Link href="/auth/login" />}>Log in to book</Button></section>
      <section className="space-y-3"><h2 className="text-lg font-semibold">Customer reviews</h2>{technician.reviews?.length ? <div className="space-y-3">{technician.reviews.map((review) => <div key={review.id} className="rounded-lg border p-4"><p className="text-xs font-medium">{review.customer.name} · {review.rating}/5</p><p className="mt-2 text-sm">{review.comment}</p></div>)}</div> : <p className="text-sm text-muted-foreground">No reviews yet.</p>}</section>
    </main>
  );
}
