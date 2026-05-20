import { createFileRoute } from "@tanstack/react-router";
import { FinanceGroceryList } from "../../components/finance/FinanceGroceryList";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const Route = (createFileRoute as any)("/_app/shopping")({
  component: ShoppingPage,
});

function ShoppingPage() {
  return (
    <div dir="rtl" className="container max-w-md mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold mb-6">🛒 רשימת קניות</h1>
      <FinanceGroceryList />
    </div>
  );
}
