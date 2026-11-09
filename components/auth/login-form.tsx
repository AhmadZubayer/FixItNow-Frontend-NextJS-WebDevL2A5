"use client";

import axios from "axios";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import PendingButton from "@/components/pending-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, type LoginValues } from "@/validations/auth.validation";

const LoginForm = () => {
  const router = useRouter();
  const [values, setValues] = useState<LoginValues>({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    const result = loginSchema.safeParse(values);
    if (!result.success) {
      setErrors(result.error.flatten().fieldErrors);
      return;
    }

    setErrors({});
    setPending(true);
    try {
      await axios.post("/api/session/login", result.data);
      const response = await axios.get<{ role: "CUSTOMER" | "TECHNICIAN" | "ADMIN" }>("/api/session/me");
      toast.success("You are logged in.");
      router.replace(`/dashboard/${response.data.role.toLowerCase()}`);
      router.refresh();
    } catch (error) {
      toast.error(axios.isAxiosError(error) ? error.response?.data?.message ?? "Login failed. Please try again." : "Login failed. Please try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="space-y-1"><Label htmlFor="email">Email</Label><Input id="email" type="email" autoComplete="email" value={values.email} onChange={(event) => setValues({ ...values, email: event.target.value })} aria-invalid={!!errors.email} aria-describedby={errors.email ? "email-error" : undefined} />{errors.email && <p id="email-error" className="text-xs text-destructive">{errors.email[0]}</p>}</div>
      <div className="space-y-1"><Label htmlFor="password">Password</Label><div className="relative"><Input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" className="pr-10" value={values.password} onChange={(event) => setValues({ ...values, password: event.target.value })} aria-invalid={!!errors.password} aria-describedby={errors.password ? "password-error" : undefined} /><Button type="button" variant="ghost" size="icon" className="absolute inset-y-0 right-1 my-auto" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}</Button></div>{errors.password && <p id="password-error" className="text-xs text-destructive">{errors.password[0]}</p>}</div>
      <PendingButton type="submit" pending={pending} pendingText="Logging in" className="w-full">Log in</PendingButton>
      <p className="text-center text-xs text-muted-foreground">New to FixItNow? <Link href="/auth/register" className="underline underline-offset-4">Create an account</Link></p>
    </form>
  );
};

export default LoginForm;
