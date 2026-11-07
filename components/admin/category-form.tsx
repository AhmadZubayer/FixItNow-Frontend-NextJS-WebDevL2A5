"use client";

import axios from "axios";
import { useState } from "react";
import { toast } from "sonner";

import PendingButton from "@/components/pending-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AdminCategory } from "@/lib/admin-types";
import { categoryEditSchema, categorySchema, type CategoryValues } from "@/validations/admin.validation";

export default function CategoryForm({ category, onSaved }: { category?: AdminCategory; onSaved: () => void }) {
  const [values, setValues] = useState<CategoryValues>({ name: category?.name ?? "", slug: category?.slug ?? "", description: category?.description ?? "", isActive: category?.isActive ?? true });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const result = category ? categoryEditSchema.safeParse(values) : categorySchema.safeParse(values);
    if (!result.success) { setErrors(result.error.flatten().fieldErrors); return; }
    setErrors({});
    setPending(true);
    try {
      if (category) await axios.patch(`/api/admin/categories/${category.id}`, result.data);
      else await axios.post("/api/admin/categories", result.data);
      toast.success(category ? "Category updated." : "Category added.");
      if (!category) setValues({ name: "", slug: "", description: "", isActive: true });
      onSaved();
    } catch (failure) {
      toast.error(axios.isAxiosError(failure) ? failure.response?.data?.message ?? "Could not save category." : "Could not save category.");
    } finally { setPending(false); }
  }

  return <form onSubmit={submit} noValidate className="grid gap-3 sm:grid-cols-2"><div className="space-y-1"><Label htmlFor="category-name">Name</Label><Input id="category-name" value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} aria-invalid={!!errors.name} aria-describedby={errors.name ? "category-name-error" : undefined} />{errors.name && <p id="category-name-error" className="text-xs text-destructive">{errors.name[0]}</p>}</div><div className="space-y-1"><Label htmlFor="category-slug">Slug</Label><Input id="category-slug" value={values.slug} onChange={(event) => setValues({ ...values, slug: event.target.value })} aria-invalid={!!errors.slug} aria-describedby={errors.slug ? "category-slug-error" : undefined} />{errors.slug && <p id="category-slug-error" className="text-xs text-destructive">{errors.slug[0]}</p>}</div><div className="space-y-1 sm:col-span-2"><Label htmlFor="category-description">Description</Label><Textarea id="category-description" value={values.description} onChange={(event) => setValues({ ...values, description: event.target.value })} aria-invalid={!!errors.description} aria-describedby={errors.description ? "category-description-error" : undefined} />{errors.description && <p id="category-description-error" className="text-xs text-destructive">{errors.description[0]}</p>}</div>{category && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={values.isActive} onChange={(event) => setValues({ ...values, isActive: event.target.checked })} />Active</label>}<div className="sm:col-span-2"><PendingButton pending={pending} pendingText="Saving category" type="submit">{category ? "Update category" : "Add category"}</PendingButton></div></form>;
}
