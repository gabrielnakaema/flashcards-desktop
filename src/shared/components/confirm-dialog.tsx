import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  pendingLabel?: string;
  onConfirm: () => void | Promise<void>;
  isPending?: boolean;
  error?: string;
  variant?: "default" | "destructive";
}

export const ConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  pendingLabel,
  onConfirm,
  isPending = false,
  error,
  variant = "default",
}: ConfirmDialogProps) => {
  const confirmText = isPending && pendingLabel ? pendingLabel : confirmLabel;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground break-all">
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </DialogHeader>

        <DialogFooter className="mt-2 border-t-0 bg-transparent px-4 sm:justify-end">
          <Button
            variant="outline"
            size="lg"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            size="lg"
            disabled={isPending}
            onClick={() => void onConfirm()}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
