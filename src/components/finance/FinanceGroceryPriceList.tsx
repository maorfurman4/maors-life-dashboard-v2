import { useState } from "react";
import { ShoppingCart, Plus, Check, Trash2, TrendingDown, TrendingUp, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useGroceryLists,
  useAddGroceryList,
  useAddGroceryItem,
  useToggleGroceryItem,
  useDeleteGroceryItem,
} from "@/hooks/use-grocery";
import { estimateItemPrice, ILS } from "@/lib/finance-utils";
import { toast } from "sonner";

interface PriceEstimate {
  min: number;
  max: number;
  unit: string;
}

function ItemRow({ item, onToggle, onDelete }: {
  item: any;
  onToggle: (id: string, current: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const est: PriceEstimate | null = estimateItemPrice(item.name);

  return (
    <div className={`flex items-center gap-2 py-2 rounded-xl px-2 transition-colors ${item.is_checked ? "opacity-50" : ""}`}>
      <button
        onClick={() => onToggle(item.id, item.is_checked)}
        className={`h-5 w-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${
          item.is_checked ? "bg-finance border-finance" : "border-border hover:border-finance/50"
        }`}
      >
        {item.is_checked && <Check className="h-3 w-3 text-white" />}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${item.is_checked ? "line-through text-muted-foreground" : ""}`}>
          {item.name}
          {item.quantity && (
            <span className="text-muted-foreground text-xs me-1"> ({item.quantity}{item.unit ? ` ${item.unit}` : ""})</span>
          )}
        </p>
        {est && (
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-emerald-400 font-semibold">{ILS(est.min)}</span>
            <span className="text-[9px] text-muted-foreground">—</span>
            <span className="text-[10px] text-rose-400 font-semibold">{ILS(est.max)}</span>
            <span className="text-[9px] text-muted-foreground">/{est.unit}</span>
          </div>
        )}
        {!est && (
          <p className="text-[10px] text-muted-foreground/40">אין מחיר מוערך</p>
        )}
      </div>

      <button
        onClick={() => onDelete(item.id)}
        className="h-6 w-6 rounded-lg flex items-center justify-center hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
      >
        <Trash2 className="h-3 w-3 text-destructive" />
      </button>
    </div>
  );
}

export function FinanceGroceryPriceList() {
  const { data: lists, isLoading } = useGroceryLists();
  const addList = useAddGroceryList();
  const addItem = useAddGroceryItem();
  const toggleItem = useToggleGroceryItem();
  const deleteItem = useDeleteGroceryItem();

  const [newListName, setNewListName] = useState("");
  const [expandedList, setExpandedList] = useState<string | null>(null);
  const [newItemNames, setNewItemNames] = useState<Record<string, string>>({});
  const [lastUpdated] = useState(new Date());

  const handleAddList = async () => {
    const name = newListName.trim();
    if (!name) return;
    await addList.mutateAsync(name);
    setNewListName("");
  };

  const handleAddItem = async (listId: string) => {
    const name = newItemNames[listId]?.trim();
    if (!name) return;
    await addItem.mutateAsync({ list_id: listId, name });
    setNewItemNames((prev) => ({ ...prev, [listId]: "" }));
  };

  const handleToggle = (id: string, current: boolean) => {
    toggleItem.mutate({ id, is_checked: !current });
  };

  const handleDelete = (id: string) => {
    deleteItem.mutate(id, { onSuccess: () => toast.success("פריט נמחק") });
  };

  const getTotals = (items: any[]) => {
    let minTotal = 0, maxTotal = 0;
    items.forEach((item) => {
      if (item.is_checked) return;
      const est = estimateItemPrice(item.name);
      if (est) { minTotal += est.min; maxTotal += est.max; }
    });
    return { minTotal, maxTotal };
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-finance/10 flex items-center justify-center">
            <ShoppingCart className="h-4 w-4 text-finance" />
          </div>
          <div>
            <h3 className="text-sm font-bold" style={{ letterSpacing: 0 }}>רשימות קניות חכמות</h3>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <RefreshCw className="h-2.5 w-2.5" />
              <span>מחירים: {lastUpdated.toLocaleDateString("he-IL")} (שקיפות מחירים)</span>
            </div>
          </div>
        </div>
      </div>

      {/* New list input */}
      <div className="flex gap-2">
        <input
          type="text" value={newListName}
          onChange={(e) => setNewListName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleAddList(); }}
          placeholder="שם רשימה חדשה..."
          className="flex-1 px-3 py-2 rounded-xl border border-border bg-secondary/30 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-finance min-h-[40px]"
        />
        <Button size="sm" onClick={handleAddList} disabled={addList.isPending || !newListName.trim()} className="px-3">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Price legend */}
      <div className="flex items-center gap-4 text-[10px]">
        <div className="flex items-center gap-1">
          <TrendingDown className="h-3 w-3 text-emerald-400" />
          <span className="text-muted-foreground">מחיר מינימלי</span>
        </div>
        <div className="flex items-center gap-1">
          <TrendingUp className="h-3 w-3 text-rose-400" />
          <span className="text-muted-foreground">מחיר מקסימלי</span>
        </div>
        <span className="text-muted-foreground/50 text-[9px]">מבוסס נתוני שקיפות מחירים</span>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => <div key={i} className="h-12 rounded-xl bg-secondary/30 animate-pulse" />)}
        </div>
      ) : !lists || lists.length === 0 ? (
        <div className="text-center py-6 text-sm text-muted-foreground">אין רשימות קניות עדיין</div>
      ) : (
        <div className="space-y-2">
          {lists.map((list: any) => {
            const items = list.grocery_items || [];
            const unchecked = items.filter((i: any) => !i.is_checked);
            const isExpanded = expandedList === list.id;
            const { minTotal, maxTotal } = getTotals(items);

            return (
              <div key={list.id} className="rounded-xl border border-border overflow-hidden">
                <button
                  onClick={() => setExpandedList(isExpanded ? null : list.id)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-secondary/20 hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-semibold truncate">{list.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-finance/10 text-finance font-medium shrink-0">
                      {items.filter((i: any) => i.is_checked).length}/{items.length}
                    </span>
                  </div>
                  {(minTotal > 0 || maxTotal > 0) && (
                    <div className="flex items-center gap-1 text-[11px] shrink-0 me-2">
                      <span className="text-emerald-400 font-semibold">{ILS(minTotal)}</span>
                      <span className="text-muted-foreground">–</span>
                      <span className="text-rose-400 font-semibold">{ILS(maxTotal)}</span>
                    </div>
                  )}
                </button>

                {isExpanded && (
                  <div className="px-3 py-3 space-y-1 group">
                    {items.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-2">אין פריטים — הוסף לרשימה</p>
                    ) : (
                      items.map((item: any) => (
                        <ItemRow key={item.id} item={item} onToggle={handleToggle} onDelete={handleDelete} />
                      ))
                    )}

                    {/* Estimated total */}
                    {(minTotal > 0 || maxTotal > 0) && (
                      <div className="flex items-center justify-between border-t border-border pt-2 mt-2">
                        <span className="text-xs font-bold text-muted-foreground">סה"כ משוער</span>
                        <div className="flex items-center gap-1.5 text-xs font-bold">
                          <span className="text-emerald-400">{ILS(minTotal)}</span>
                          <span className="text-muted-foreground">–</span>
                          <span className="text-rose-400">{ILS(maxTotal)}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2 border-t border-border">
                      <input
                        type="text"
                        value={newItemNames[list.id] || ""}
                        onChange={(e) => setNewItemNames((prev) => ({ ...prev, [list.id]: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === "Enter") handleAddItem(list.id); }}
                        placeholder="הוסף פריט (חלב, לחם, עוף...)"
                        className="flex-1 px-3 py-2 rounded-xl border border-border bg-secondary/30 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-finance min-h-[40px]"
                      />
                      <Button size="sm" variant="outline"
                        onClick={() => handleAddItem(list.id)}
                        disabled={addItem.isPending || !newItemNames[list.id]?.trim()}
                        className="px-3">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
