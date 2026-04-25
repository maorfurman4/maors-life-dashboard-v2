import { createFileRoute } from "@tanstack/react-router";
import { ModernHome } from "@/components/home/ModernHome";

export const Route = createFileRoute("/_app/")({
  component: HomePage,
});

function HomePage() {
  return <ModernHome />;
}
