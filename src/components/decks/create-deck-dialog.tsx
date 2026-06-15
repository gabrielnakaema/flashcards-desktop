import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { Button } from "../ui/button";
import { DeckFormDialog } from "./deck-form-dialog";

export const CreateDeckDialog = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="secondary" size="lg" onClick={() => setOpen(true)}>
        <PlusIcon className="size-4" />
        Create deck
      </Button>

      <DeckFormDialog mode="create" open={open} onOpenChange={setOpen} />
    </>
  );
};
