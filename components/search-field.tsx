import type { ComponentProps } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SearchFieldProps = ComponentProps<typeof Input> & {
  id: string;
  label: string;
  error?: string;
};

export default function SearchField({ id, label, error, ...props }: SearchFieldProps) {
  return <div className="space-y-1"><Label htmlFor={id}>{label}</Label><Input id={id} {...props} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} />{error && <p id={`${id}-error`} className="text-xs text-destructive">{error}</p>}</div>;
}
