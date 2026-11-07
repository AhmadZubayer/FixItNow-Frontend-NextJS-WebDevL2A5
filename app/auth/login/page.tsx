import LoginForm from "@/components/auth/login-form";

export default function LoginPage() {
  return <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-10"><div className="mb-6 space-y-1"><h1 className="text-2xl font-semibold tracking-tight">Log in</h1><p className="text-sm text-muted-foreground">Access your bookings and workspace.</p></div><LoginForm /></main>;
}
