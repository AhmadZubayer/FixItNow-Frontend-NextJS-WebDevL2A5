"use client";

import axios from "axios";
import BackLink from "@/components/back-link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import PendingButton from "@/components/pending-button";
import BookingDetailSkeleton from "@/components/booking-detail-skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { reviewSchema, type ReviewValues } from "@/validations/review.validation";

type Booking = { id: string; status: string; service: { title: string } };

const ReviewPage = () => {
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
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
  };

  return <div className="max-w-xl space-y-5"><BackLink href="/dashboard/customer" label="Back to bookings" /><h1 className="text-2xl font-semibold tracking-tight">Leave a review</h1>{error && <Alert variant="destructive"><AlertTitle>Booking unavailable</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}{!booking && !error && <BookingDetailSkeleton />}{booking && booking.status !== "COMPLETED" && <p className="text-sm text-muted-foreground">Reviews are available after the job is completed.</p>}{booking?.status === "COMPLETED" && <form onSubmit={handleSubmit} className="space-y-4" noValidate><p className="font-medium">{booking.service.title}</p><div className="space-y-1"><Label htmlFor="rating">Rating</Label><Select value={String(values.rating)} onValueChange={(rating) => { if (rating) setValues({ ...values, rating: Number(rating) }); }}><SelectTrigger id="rating" className="w-full" aria-invalid={!!errors.rating} aria-describedby={errors.rating ? "rating-error" : undefined}><SelectValue>{(rating: string) => `${rating} stars`}</SelectValue></SelectTrigger><SelectContent>{[5, 4, 3, 2, 1].map((rating) => <SelectItem key={rating} value={String(rating)}>{rating} stars</SelectItem>)}</SelectContent></Select>{errors.rating && <p id="rating-error" className="text-xs text-destructive">{errors.rating[0]}</p>}</div><div className="space-y-1"><Label htmlFor="comment">Comment (optional)</Label><Textarea id="comment" value={values.comment ?? ""} onChange={(event) => setValues({ ...values, comment: event.target.value })} aria-invalid={!!errors.comment} aria-describedby={errors.comment ? "comment-error" : undefined} />{errors.comment && <p id="comment-error" className="text-xs text-destructive">{errors.comment[0]}</p>}</div><PendingButton type="submit" pending={pending} pendingText="Submitting review">Submit review</PendingButton></form>}</div>;
};

export default ReviewPage;
