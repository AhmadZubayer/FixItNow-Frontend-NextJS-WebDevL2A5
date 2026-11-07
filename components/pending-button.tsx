import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

type PendingButtonProps = React.ComponentProps<typeof Button> & {
  pending: boolean;
  pendingText?: string;
};

export default function PendingButton({ pending, pendingText, children, disabled, ...props }: PendingButtonProps) {
  return (
    <Button disabled={pending || disabled} aria-busy={pending} {...props}>
      {pending && <Spinner className="size-3" />}
      {pending ? pendingText ?? children : children}
    </Button>
  );
}
