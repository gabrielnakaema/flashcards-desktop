import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/ui/dialog";
import { DeckForm } from "./deck-form";

export const CreateDeckDialog = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="secondary" size="lg" onClick={() => setOpen(true)}>
        <PlusIcon className="size-4" />
        Create deck
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>Create deck</DialogTitle>
          <DialogDescription>
            Add a new deck to organize your flashcards.
          </DialogDescription>
          <DeckForm
            onSuccess={() => setOpen(false)}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};
