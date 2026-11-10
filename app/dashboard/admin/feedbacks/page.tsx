"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import AdminDataList from "@/components/admin/data-list";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Feedback = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  customer: { name: string };
  technicianProfile: { user: { name: string } };
  booking: { service: { title: string }; items: { title: string }[] };
};

const FeedbacksPage = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    axios.get<Feedback[]>("/api/admin/feedbacks").then(({ data }) => {
      if (active) { setFeedbacks(data); setError(""); }
    }).catch(() => {
      if (active) setError("Could not load feedbacks. Please try again.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [retry]);

  return <AdminDataList title="Feedbacks" items={feedbacks} searchText={(feedback) => `${feedback.customer.name} ${feedback.technicianProfile.user.name} ${feedback.booking.items.map((item) => item.title).join(" ")} ${feedback.booking.service.title} ${feedback.comment ?? ""} ${feedback.rating}`} loading={loading} error={error} onRetry={() => { setLoading(true); setRetry((value) => value + 1); }}>
    {(rows) => <div className="overflow-x-auto"><Table>
      <TableHeader><TableRow><TableHead>Customer</TableHead><TableHead>Technician</TableHead><TableHead>Service</TableHead><TableHead>Rating</TableHead><TableHead>Feedback</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
      <TableBody>{rows.map((feedback) => <TableRow key={feedback.id}>
        <TableCell>{feedback.customer.name}</TableCell>
        <TableCell>{feedback.technicianProfile.user.name}</TableCell>
        <TableCell className="min-w-40 whitespace-normal">{feedback.booking.items.length ? feedback.booking.items.map((item) => item.title).join(", ") : feedback.booking.service.title}</TableCell>
        <TableCell>{feedback.rating} / 5</TableCell>
        <TableCell className="min-w-60 max-w-md whitespace-normal break-words">{feedback.comment || "No comment"}</TableCell>
        <TableCell>{new Date(feedback.createdAt).toLocaleDateString("en-BD", { timeZone: "Asia/Dhaka" })}</TableCell>
      </TableRow>)}</TableBody>
    </Table></div>}
  </AdminDataList>;
};

export default FeedbacksPage;
