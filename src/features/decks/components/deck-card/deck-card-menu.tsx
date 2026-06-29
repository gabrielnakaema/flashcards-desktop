import { useDeleteDeck } from "@/features/decks/hooks/use-delete-deck";
import { DeckWithStats } from "@/features/decks/types";
import { Link } from "@tanstack/react-router";
import { Layers, MenuIcon, PencilIcon, TrashIcon } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "@/shared/components/confirm-dialog";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

interface DeckCardMenuProps {
  deck: DeckWithStats;
}

export const DeckCardMenu = ({ deck }: DeckCardMenuProps) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    remove,
    isPending: isDeletePending,
    error: deleteError,
  } = useDeleteDeck({
    onSuccess: () => {
      setIsDeleting(false);
    },
  });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="sm" className="rounded-sm p-2">
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
          <DropdownMenuItem asChild>
            <Link to="/decks/$deckId/edit" params={{ deckId: deck.id }}>
              <PencilIcon />
              Edit
            </Link>
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
