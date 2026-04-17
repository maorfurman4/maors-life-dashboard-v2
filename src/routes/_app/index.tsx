import { createFileRoute } from "@tanstack/react-router";
import { GreetingHeader } from "@/components/home/GreetingHeader";
import { BalanceCard } from "@/components/home/BalanceCard";
import { DailyOverview } from "@/components/home/DailyOverview";
import { QuickActions } from "@/components/home/QuickActions";
import { ModuleSummaryCards } from "@/components/home/ModuleSummaryCards";
import { DailyReminders } from "@/components/home/DailyReminders";
import { WeatherWidget } from "@/components/home/WeatherWidget";

export const Route = createFileRoute("/_app/")({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <GreetingHeader />
      <DailyReminders />
      <WeatherWidget />
      <BalanceCard />
      <QuickActions />
      <DailyOverview />
      <ModuleSummaryCards />
    </div>
  );
}
