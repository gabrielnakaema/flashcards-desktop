import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";

interface GenerateCardsPageLayoutProps {
  children: ReactNode;
}

export const GenerateCardsPageLayout = ({
  children,
}: GenerateCardsPageLayoutProps) => (
  <div className="w-full flex-1 overflow-auto px-6 py-8 lg:px-16">
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <section className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-md bg-orange-400/15 text-orange-500">
            <Sparkles className="size-5" />
          </div>
          <div>
            <h1 className="text-3xl font-medium text-foreground">
              Generate flashcards
            </h1>
            <p className="text-base text-muted-foreground">
              Choose a deck, then generate draft cards with your LLM settings.
            </p>
          </div>
        </div>
      </section>

      {children}
    </main>
  </div>
);
