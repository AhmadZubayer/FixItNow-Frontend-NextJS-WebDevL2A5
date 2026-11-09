import RegisterForm from "@/components/auth/register-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const RegisterPage = () => <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-10">
  <Card>
    <CardHeader><h1 className="text-2xl font-semibold tracking-tight">Create an account</h1><p className="text-sm text-muted-foreground">Join as a customer or technician.</p></CardHeader>
    <CardContent><RegisterForm /></CardContent>
  </Card>
</main>;

export default RegisterPage;
