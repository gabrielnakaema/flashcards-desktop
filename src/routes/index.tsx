import { HomePageContent } from "@/components/home/home-page-content";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return <HomePageContent />;
}
