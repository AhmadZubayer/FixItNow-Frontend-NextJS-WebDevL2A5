"use client";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const ErrorPage = ({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) => {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <Alert variant="destructive">
        <AlertTitle>We could not load this page</AlertTitle>
        <AlertDescription className="mt-2 text-sm leading-relaxed">
          {error?.message ||
            "Try again in a moment. If the problem continues, return to the home page."}
        </AlertDescription>
      </Alert>
      <Button className="mt-4" onClick={reset}>
        Try again
      </Button>
    </div>
  );
};

export default ErrorPage;
