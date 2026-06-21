import { useDeleteDeck } from "@/hooks/decks/use-delete-deck";
import { DeckWithStats } from "@/types/deck";
import { Link } from "@tanstack/react-router";
import { Layers, MenuIcon, PencilIcon, TrashIcon } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "../shared/confirm-dialog";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { DeckFormDialog } from "./deck-form-dialog";

interface DeckCardMenuProps {
  deck: DeckWithStats;
}

export const DeckCardMenu = ({ deck }: DeckCardMenuProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    remove,
    isPending: isDeletePending,
    error: deleteError,
  } = useDeleteDeck({
    onSuccess: () => {
      setIsEditing(false);
      setIsDeleting(false);
    },
  });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="lg">
            <MenuIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuItem className="whitespace-nowrap" asChild>
            <Link to="/decks/$deckId/cards" params={{ deckId: deck.id }}>
              <Layers />
              Manage cards
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsEditing(true)}>
            <PencilIcon />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setIsDeleting(true);
            }}
          >
            <TrashIcon />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeckFormDialog
        mode="edit"
        deck={deck}
        open={isEditing}
        onOpenChange={setIsEditing}
      />

      <ConfirmDialog
        open={isDeleting}
        onOpenChange={(open) => {
          if (!open) {
            setIsDeleting(false);
          }
        }}
        title={`Delete "${deck.title}"?`}
        description="This action cannot be undone."
        confirmLabel="Delete"
        pendingLabel="Deleting..."
        cancelLabel="Cancel"
        variant="destructive"
        isPending={isDeletePending}
        error={deleteError?.message ?? undefined}
        onConfirm={() => remove(deck.id)}
      />
    </>
  );
};
