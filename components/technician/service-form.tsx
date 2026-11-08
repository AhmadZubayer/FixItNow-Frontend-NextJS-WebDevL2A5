"use client";

import axios from "axios";
import { useState } from "react";
import { toast } from "sonner";

import PendingButton from "@/components/pending-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Category } from "@/lib/public-api";
import type { TechnicianService } from "@/lib/technician-types";
import { technicianServiceEditSchema, technicianServiceSchema, type TechnicianServiceValues } from "@/validations/technician.validation";

const ServiceForm = ({ categories, service, onSaved }: { categories: Category[]; service?: TechnicianService; onSaved: () => void }) => {
  const [values, setValues] = useState<TechnicianServiceValues>({ title: service?.title ?? "", description: service?.description ?? "", price: service?.price ?? "", durationMinutes: String(service?.durationMinutes ?? 60), categoryId: service?.categoryId ?? "" });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    const result = service ? technicianServiceEditSchema.safeParse({ ...values, isActive: service.isActive }) : technicianServiceSchema.safeParse(values);
    if (!result.success) { setErrors(result.error.flatten().fieldErrors); return; }
    setErrors({});
    setPending(true);
    try {
      if (service) await axios.patch(`/api/technician/services/${service.id}`, { ...values, isActive: service.isActive });
      else await axios.post("/api/technician/services", values);
      toast.success(service ? "Service updated." : "Service created.");
      onSaved();
      if (!service) setValues({ title: "", description: "", price: "", durationMinutes: "60", categoryId: "" });
    } catch (failure) {
      toast.error(axios.isAxiosError(failure) ? failure.response?.data?.message ?? "Could not save service." : "Could not save service.");
    } finally {
      setPending(false);
    }
  };

  return <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2" noValidate><div className="space-y-1"><Label htmlFor="service-title">Title</Label><Input id="service-title" value={values.title} onChange={(event) => setValues({ ...values, title: event.target.value })} aria-invalid={!!errors.title} aria-describedby={errors.title ? "service-title-error" : undefined} />{errors.title && <p id="service-title-error" className="text-xs text-destructive">{errors.title[0]}</p>}</div><div className="space-y-1"><Label htmlFor="service-category">Category</Label><Select value={values.categoryId || null} onValueChange={(categoryId) => setValues({ ...values, categoryId: categoryId ?? "" })}><SelectTrigger id="service-category" className="w-full" aria-invalid={!!errors.categoryId} aria-describedby={errors.categoryId ? "service-category-error" : undefined}><SelectValue placeholder="Choose a category">{(categoryId: string) => categories.find((category) => category.id === categoryId)?.name ?? "Choose a category"}</SelectValue></SelectTrigger><SelectContent>{categories.map((category) => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}</SelectContent></Select>{errors.categoryId && <p id="service-category-error" className="text-xs text-destructive">{errors.categoryId[0]}</p>}</div><div className="space-y-1 sm:col-span-2"><Label htmlFor="service-description">Description</Label><Textarea id="service-description" value={values.description} onChange={(event) => setValues({ ...values, description: event.target.value })} aria-invalid={!!errors.description} aria-describedby={errors.description ? "service-description-error" : undefined} />{errors.description && <p id="service-description-error" className="text-xs text-destructive">{errors.description[0]}</p>}</div><div className="space-y-1"><Label htmlFor="service-price">Price (BDT)</Label><Input id="service-price" inputMode="decimal" value={values.price} onChange={(event) => setValues({ ...values, price: event.target.value })} aria-invalid={!!errors.price} aria-describedby={errors.price ? "service-price-error" : undefined} />{errors.price && <p id="service-price-error" className="text-xs text-destructive">{errors.price[0]}</p>}</div><div className="space-y-1"><Label htmlFor="service-duration">Duration (minutes)</Label><Input id="service-duration" inputMode="numeric" value={values.durationMinutes} onChange={(event) => setValues({ ...values, durationMinutes: event.target.value })} aria-invalid={!!errors.durationMinutes} aria-describedby={errors.durationMinutes ? "service-duration-error" : undefined} />{errors.durationMinutes && <p id="service-duration-error" className="text-xs text-destructive">{errors.durationMinutes[0]}</p>}</div><div className="sm:col-span-2"><PendingButton type="submit" pending={pending} pendingText="Saving service">{service ? "Update service" : "Add service"}</PendingButton></div></form>;
};

export default ServiceForm;
