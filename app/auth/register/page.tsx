import RegisterForm from "@/components/auth/register-form";

export default function RegisterPage() {
  return <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-10"><div className="mb-6 space-y-1"><h1 className="text-2xl font-semibold tracking-tight">Create an account</h1><p className="text-sm text-muted-foreground">Join as a customer or technician.</p></div><RegisterForm /></main>;
}
