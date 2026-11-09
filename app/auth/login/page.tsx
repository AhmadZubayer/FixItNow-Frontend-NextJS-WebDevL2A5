import LoginForm from "@/components/auth/login-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const LoginPage = () => <main data-auth-page className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-10">
  <Card>
    <CardHeader><h1 className="text-2xl font-semibold tracking-tight">Log in</h1><p className="text-sm text-muted-foreground">Access your bookings and workspace.</p></CardHeader>
    <CardContent><LoginForm /></CardContent>
  </Card>
</main>;

export default LoginPage;
