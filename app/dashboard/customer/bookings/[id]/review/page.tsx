"use client";

import axios from "axios";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import PendingButton from "@/components/pending-button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { reviewSchema, type ReviewValues } from "@/validations/review.validation";

type Booking = { id: string; status: string; service: { title: string } };

export default function ReviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState("");
  const [values, setValues] = useState<ReviewValues>({ bookingId: id, rating: 5, comment: "" });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let active = true;
    axios.get<Booking>(`/api/customer/bookings/${id}`).then((response) => {
      if (active) setBooking(response.data);
    }).catch((failure) => {
      if (!active) return;
      if (axios.isAxiosError(failure) && failure.response?.status === 401) router.replace("/auth/login");
      else setError("We could not load this booking.");
    });
    return () => { active = false; };
  }, [id, router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const result = reviewSchema.safeParse({ ...values, comment: values.comment?.trim() || undefined });
    if (!result.success) {
      setErrors(result.error.flatten().fieldErrors);
      return;
    }

    setErrors({});
    setPending(true);
    try {
      await axios.post("/api/customer/reviews", result.data);
      toast.success("Review submitted.");
      router.push("/dashboard/customer");
    } catch (failure) {
      toast.error(axios.isAxiosError(failure) ? failure.response?.data?.message ?? "Could not submit your review." : "Could not submit your review.");
    } finally {
      setPending(false);
    }
  }

  return <main className="mx-auto w-full max-w-xl flex-1 space-y-5 px-4 py-8 sm:px-6"><Link href="/dashboard/customer" className="text-xs underline underline-offset-4">Back to bookings</Link><h1 className="text-2xl font-semibold tracking-tight">Leave a review</h1>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}{!booking && !error && <p className="text-sm text-muted-foreground">Loading booking…</p>}{booking && booking.status !== "COMPLETED" && <p className="text-sm text-muted-foreground">Reviews are available after the job is completed.</p>}{booking?.status === "COMPLETED" && <form onSubmit={handleSubmit} className="space-y-4" noValidate><p className="font-medium">{booking.service.title}</p><div className="space-y-1"><Label htmlFor="rating">Rating</Label><select id="rating" value={values.rating} onChange={(event) => setValues({ ...values, rating: Number(event.target.value) })} aria-invalid={!!errors.rating} aria-describedby={errors.rating ? "rating-error" : undefined} className="flex h-7 w-full rounded-md border bg-background px-2 text-xs">{[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} stars</option>)}</select>{errors.rating && <p id="rating-error" className="text-xs text-destructive">{errors.rating[0]}</p>}</div><div className="space-y-1"><Label htmlFor="comment">Comment (optional)</Label><Textarea id="comment" value={values.comment ?? ""} onChange={(event) => setValues({ ...values, comment: event.target.value })} aria-invalid={!!errors.comment} aria-describedby={errors.comment ? "comment-error" : undefined} />{errors.comment && <p id="comment-error" className="text-xs text-destructive">{errors.comment[0]}</p>}</div><PendingButton type="submit" pending={pending} pendingText="Submitting review">Submit review</PendingButton></form>}</main>;
}
