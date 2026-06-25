import { cn } from "@/shared/lib/utils";

type BannerSectionProps = {
  className?: string;
  children: React.ReactNode;
};

export const BannerSection = ({ className, children }: BannerSectionProps) => (
  <section
    className={cn(
      "w-full border border-border rounded-sm p-8 flex items-center justify-between bg-zinc-900",
      className
    )}
  >
    {children}
  </section>
);
