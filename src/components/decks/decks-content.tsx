import { Button } from "@/components/ui/button";
import { useState } from "react";
import { DeckCategoriesContent } from "../deck-categories/deck-categories-content";
import { Sheet, SheetContent } from "../ui/sheet";
import { CreateDeckDialog } from "./create-deck-dialog";
import { DeckList } from "./deck-list";
import { Layers } from "lucide-react";

export const DecksContent = () => {
  const [isManagingCategories, setIsManagingCategories] = useState(false);

  return (
    <>
      <div className="w-full flex flex-col gap-4 py-8 px-16 flex-1">
        <section className="w-full flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-3xl font-medium text-foreground">Decks</h1>
            <h2 className="text-muted-foreground text-base">
              Manage your decks and categories.
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setIsManagingCategories(true)}
            >
              <Layers className="size-4" />
              Manage categories
            </Button>
            <CreateDeckDialog />
          </div>
        </section>

        <DeckList />
      </div>
      <Sheet open={isManagingCategories} onOpenChange={setIsManagingCategories}>
        <SheetContent
          showCloseButton={false}
          className="data-[side=right]:w-full data-[side=right]:sm:max-w-lg"
        >
          <DeckCategoriesContent
            onClose={() => setIsManagingCategories(false)}
          />
        </SheetContent>
      </Sheet>
    </>
  );
};
