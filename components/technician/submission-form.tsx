"use client";
import axios from "axios";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import PendingButton from "@/components/pending-button";
import { Command, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Category } from "@/lib/public-api";
import { technicianServiceSchema, type TechnicianServiceValues } from "@/validations/technician.validation";

type Suggestion = { title: string; categoryId: string };
const SubmissionForm = ({ categories, onSaved }: { categories: Category[]; onSaved: () => void }) => {
  const [values, setValues] = useState<TechnicianServiceValues>({ title: "", categoryId: "", description: "", price: "", durationMinutes: "60" });
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [chosen, setChosen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [pending, setPending] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    const query = values.title.trim();
    if (chosen || query.length < 2) return;
    const timer = window.setTimeout(() => {
      setSearching(true); setSearchError("");
      axios.get<Suggestion[]>("/api/technician/services/suggestions", { params: { q: query }, signal: controller.signal })
        .then(({ data }) => { if (!controller.signal.aborted) setSuggestions(data); })
        .catch(() => { if (!controller.signal.aborted) setSearchError("Could not load suggestions. You can still enter a service title."); })
        .finally(() => { if (!controller.signal.aborted) setSearching(false); });
    }, 250);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [values.title, chosen]);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (pending) return;
    const result = technicianServiceSchema.safeParse(values);
    if (!result.success) { setErrors(result.error.flatten().fieldErrors); return; }
    setErrors({}); setPending(true);
    try { await axios.post("/api/technician/services", values); toast.success("Service sent for admin approval."); onSaved(); }
    catch (error) { toast.error(axios.isAxiosError(error) ? error.response?.data?.message ?? "Could not submit service." : "Could not submit service."); }
    finally { setPending(false); }
  };
  return <form onSubmit={submit} className="space-y-4" noValidate>
    <div className="space-y-1"><Label htmlFor="new-service-title">Service title</Label>
      <Command shouldFilter={false} className="rounded-md border">
        <CommandInput id="new-service-title" placeholder="Search or add a service" value={values.title} maxLength={100} onValueChange={(title) => { setValues(current => ({ ...current, title })); setChosen(false); setSuggestions([]); setSearching(title.trim().length >= 2); setSearchError(""); }} aria-invalid={!!errors.title} />
        {!chosen && values.title.trim().length >= 2 && <CommandList className="max-h-40">
          {searching ? <p role="status" className="p-3 text-xs text-muted-foreground">Searching services…</p> : suggestions.map((suggestion) => <CommandItem key={`${suggestion.title}-${suggestion.categoryId}`} value={`${suggestion.title}-${suggestion.categoryId}`} onSelect={() => { setValues(current => ({ ...current, title: suggestion.title, categoryId: suggestion.categoryId })); setChosen(true); }}>{suggestion.title}<span className="ml-auto text-xs text-muted-foreground">{categories.find(category => category.id === suggestion.categoryId)?.name}</span></CommandItem>)}
          {!searching && !searchError && !suggestions.some(item => item.title.toLowerCase() === values.title.trim().toLowerCase()) && <CommandItem value="add-new" onSelect={() => setChosen(true)}>Add new: “{values.title.trim()}”</CommandItem>}
        </CommandList>}
      </Command>{searchError && <p role="status" className="text-xs text-muted-foreground">{searchError}</p>}{errors.title && <p className="text-xs text-destructive">{errors.title[0]}</p>}
    </div>
    <div className="space-y-1"><Label htmlFor="new-service-category">Category</Label><Select value={values.categoryId || null} onValueChange={categoryId => setValues(current => ({ ...current, categoryId: categoryId ?? "" }))}><SelectTrigger id="new-service-category" className="w-full"><SelectValue placeholder="Choose a category">{(id: string) => categories.find(category => category.id === id)?.name ?? "Choose a category"}</SelectValue></SelectTrigger><SelectContent>{categories.map(category => <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>)}</SelectContent></Select>{errors.categoryId && <p className="text-xs text-destructive">{errors.categoryId[0]}</p>}</div>
    <div className="space-y-1"><Label htmlFor="new-service-description">Description</Label><Textarea id="new-service-description" value={values.description} onChange={event => setValues({ ...values, description: event.target.value })} aria-invalid={!!errors.description} />{errors.description && <p className="text-xs text-destructive">{errors.description[0]}</p>}</div>
    <div className="grid gap-3 sm:grid-cols-2">{([['price', 'Price (BDT)'], ['durationMinutes', 'Duration (minutes)']] as const).map(([field, label]) => <div key={field} className="space-y-1"><Label htmlFor={`new-service-${field}`}>{label}</Label><Input id={`new-service-${field}`} inputMode={field === "price" ? "decimal" : "numeric"} value={values[field]} onChange={event => setValues({ ...values, [field]: event.target.value })} aria-invalid={!!errors[field]} />{errors[field] && <p className="text-xs text-destructive">{errors[field][0]}</p>}</div>)}</div>
    <div className="flex justify-end"><PendingButton type="submit" pending={pending} pendingText="Submitting">Send For Approval</PendingButton></div>
  </form>;
};
export default SubmissionForm;
