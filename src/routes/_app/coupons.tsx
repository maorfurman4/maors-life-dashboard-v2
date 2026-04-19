import { createFileRoute } from "@tanstack/react-router";
import { Tag, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CouponList } from "@/components/coupons/CouponList";
import { CouponAddDrawer } from "@/components/coupons/CouponAddDrawer";

export const Route = createFileRoute("/_app/coupons")({
  component: CouponsPage,
});

function CouponsPage() {
  const [addOpen, setAddOpen] = useState(false);
  return (
    <div className="space-y-5 pb-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-finance/10 flex items-center justify-center">
            <Tag className="h-5 w-5 text-finance" />
          </div>
          <div>
            <h1 className="text-xl font-bold">קופונים</h1>
            <p className="text-xs text-muted-foreground">ניהול קופונים והנחות</p>
          </div>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 ml-1" />הוסף
        </Button>
      </div>
      <CouponList />
      <CouponAddDrawer open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
