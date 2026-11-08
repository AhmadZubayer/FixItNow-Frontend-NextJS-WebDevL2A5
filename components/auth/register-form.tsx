"use client";

import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import PendingButton from "@/components/pending-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { registerSchema, type RegisterValues } from "@/validations/auth.validation";

const RegisterForm = () => {
  const router = useRouter();
  const [values, setValues] = useState<RegisterValues>({ name: "", email: "", password: "", role: "CUSTOMER" });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    const result = registerSchema.safeParse(values);
    if (!result.success) {
      setErrors(result.error.flatten().fieldErrors);
      return;
    }

    setErrors({});
    setPending(true);
    try {
      await axios.post("/api/session/register", result.data);
      toast.success("Account created. Log in to continue.");
      router.push("/auth/login");
    } catch (error) {
      toast.error(axios.isAxiosError(error) ? error.response?.data?.message ?? "Registration failed. Please try again." : "Registration failed. Please try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="space-y-1"><Label htmlFor="name">Name</Label><Input id="name" autoComplete="name" value={values.name} onChange={(event) => setValues({ ...values, name: event.target.value })} aria-invalid={!!errors.name} aria-describedby={errors.name ? "name-error" : undefined} />{errors.name && <p id="name-error" className="text-xs text-destructive">{errors.name[0]}</p>}</div>
      <div className="space-y-1"><Label htmlFor="email">Email</Label><Input id="email" type="email" autoComplete="email" value={values.email} onChange={(event) => setValues({ ...values, email: event.target.value })} aria-invalid={!!errors.email} aria-describedby={errors.email ? "email-error" : undefined} />{errors.email && <p id="email-error" className="text-xs text-destructive">{errors.email[0]}</p>}</div>
      <div className="space-y-1"><Label htmlFor="password">Password</Label><Input id="password" type="password" autoComplete="new-password" value={values.password} onChange={(event) => setValues({ ...values, password: event.target.value })} aria-invalid={!!errors.password} aria-describedby={errors.password ? "password-error" : undefined} />{errors.password && <p id="password-error" className="text-xs text-destructive">{errors.password[0]}</p>}</div>
      <div className="space-y-1"><Label htmlFor="role">Account type</Label><Select value={values.role} onValueChange={(role) => { if (role) setValues({ ...values, role: role as RegisterValues["role"] }); }}><SelectTrigger id="role" className="w-full" aria-invalid={!!errors.role} aria-describedby={errors.role ? "role-error" : undefined}><SelectValue>{(role: string) => role === "TECHNICIAN" ? "Technician" : "Customer"}</SelectValue></SelectTrigger><SelectContent><SelectItem value="CUSTOMER">Customer</SelectItem><SelectItem value="TECHNICIAN">Technician</SelectItem></SelectContent></Select>{errors.role && <p id="role-error" className="text-xs text-destructive">{errors.role[0]}</p>}</div>
      <PendingButton type="submit" pending={pending} pendingText="Creating account" className="w-full">Create account</PendingButton>
      <p className="text-center text-xs text-muted-foreground">Already have an account? <Link href="/auth/login" className="underline underline-offset-4">Log in</Link></p>
    </form>
  );
};

export default RegisterForm;
