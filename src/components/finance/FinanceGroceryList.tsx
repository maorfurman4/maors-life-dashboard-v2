import { useState } from "react";
import { ShoppingCart, Plus, ChevronDown, ChevronUp, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useGroceryLists,
  useAddGroceryList,
  useAddGroceryItem,
  useToggleGroceryItem,
} from "@/hooks/use-grocery";

export function FinanceGroceryList() {
  const { data: lists, isLoading } = useGroceryLists();
  const addList = useAddGroceryList();
  const addItem = useAddGroceryItem();
  const toggleItem = useToggleGroceryItem();

  const [newListName, setNewListName] = useState("");
  const [expandedList, setExpandedList] = useState<string | null>(null);
  const [newItemNames, setNewItemNames] = useState<Record<string, string>>({});

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

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-finance/10 flex items-center justify-center">
          <ShoppingCart className="h-4 w-4 text-finance" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">רשימות קניות</h3>
          <p className="text-xs text-muted-foreground">נהל את רשימות הקניות שלך</p>
        </div>
      </div>

      {/* New list input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newListName}
          onChange={(e) => setNewListName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleAddList(); }}
          placeholder="שם רשימה חדשה..."
          className="flex-1 px-3 py-2 rounded-xl border border-border bg-secondary/30 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-finance"
        />
        <Button
          size="sm"
          onClick={handleAddList}
          disabled={addList.isPending || !newListName.trim()}
          className="px-3"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Lists */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-12 rounded-xl bg-secondary/30 animate-pulse" />
          ))}
        </div>
      ) : !lists || lists.length === 0 ? (
        <div className="text-center py-6 text-sm text-muted-foreground">
          אין רשימות קניות עדיין
        </div>
      ) : (
        <div className="space-y-2">
          {lists.map((list: any) => {
            const items = list.grocery_items || [];
            const checkedCount = items.filter((i: any) => i.is_checked).length;
            const isExpanded = expandedList === list.id;

            return (
              <div key={list.id} className="rounded-xl border border-border overflow-hidden">
                {/* List header */}
                <button
                  onClick={() => setExpandedList(isExpanded ? null : list.id)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-secondary/20 hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{list.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-finance/10 text-finance font-medium">
                      {checkedCount}/{items.length}
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>

                {/* Items */}
                {isExpanded && (
                  <div className="px-4 py-3 space-y-2">
                    {items.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-2">אין פריטים ברשימה</p>
                    ) : (
                      items.map((item: any) => (
                        <button
                          key={item.id}
                          onClick={() => handleToggle(item.id, item.is_checked)}
                          className="w-full flex items-center gap-3 py-1.5 group"
                        >
                          <div
                            className={`h-5 w-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${
                              item.is_checked
                                ? "bg-finance border-finance"
                                : "border-border group-hover:border-finance/50"
                            }`}
                          >
                            {item.is_checked && <Check className="h-3 w-3 text-white" />}
                          </div>
                          <span
                            className={`text-sm flex-1 text-right transition-colors ${
                              item.is_checked ? "line-through text-muted-foreground" : "text-foreground"
                            }`}
                          >
                            {item.name}
                            {item.quantity && (
                              <span className="text-muted-foreground text-xs mr-1">
                                ({item.quantity}{item.unit ? ` ${item.unit}` : ""})
                              </span>
                            )}
                          </span>
                        </button>
                      ))
                    )}

                    {/* Add item input */}
                    <div className="flex gap-2 pt-2 border-t border-border">
                      <input
                        type="text"
                        value={newItemNames[list.id] || ""}
                        onChange={(e) =>
                          setNewItemNames((prev) => ({ ...prev, [list.id]: e.target.value }))
                        }
                        onKeyDown={(e) => { if (e.key === "Enter") handleAddItem(list.id); }}
                        placeholder="הוסף פריט..."
                        className="flex-1 px-3 py-2 rounded-xl border border-border bg-secondary/30 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-finance"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAddItem(list.id)}
                        disabled={addItem.isPending || !newItemNames[list.id]?.trim()}
                        className="px-3"
                      >
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
