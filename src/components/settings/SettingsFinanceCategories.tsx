import { Tags, Plus, Trash2, Pencil, Check, X } from "lucide-react";
import { useState } from "react";
import {
  useExpenseCategories,
  useUpsertCategory,
  useDeleteCategory,
  DEFAULT_EXPENSE_CATEGORIES,
} from "@/hooks/use-finance-data";
import { toast } from "sonner";

export function SettingsFinanceCategories() {
  const { data: categories } = useExpenseCategories();
  const upsert = useUpsertCategory();
  const del = useDeleteCategory();

  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("📦");
  const [newBudget, setNewBudget] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editIcon, setEditIcon] = useState("");
  const [editBudget, setEditBudget] = useState("");

  const handleAdd = () => {
    if (!newName.trim()) {
      toast.error("הזן שם קטגוריה");
      return;
    }
    upsert.mutate(
      {
        name: newName.trim(),
        icon: newIcon || "📦",
        budget_limit: newBudget ? parseFloat(newBudget) : null,
        sort_order: (categories?.length ?? 0) + 1,
      },
      {
        onSuccess: () => {
          toast.success("קטגוריה נוספה");
          setNewName("");
          setNewIcon("📦");
          setNewBudget("");
        },
        onError: (e) => toast.error("שגיאה: " + e.message),
      }
    );
  };

  const seedDefaults = () => {
    DEFAULT_EXPENSE_CATEGORIES.forEach((c, i) => {
      upsert.mutate({ name: c.name, icon: c.icon, sort_order: i });
    });
    toast.success("קטגוריות ברירת מחדל נוספו");
  };

  const startEdit = (c: any) => {
    setEditingId(c.id);
    setEditName(c.name);
    setEditIcon(c.icon || "📦");
    setEditBudget(c.budget_limit?.toString() || "");
  };

  const saveEdit = () => {
    if (!editingId) return;
    upsert.mutate(
      {
        id: editingId,
        name: editName,
        icon: editIcon,
        budget_limit: editBudget ? parseFloat(editBudget) : null,
      },
      {
        onSuccess: () => {
          toast.success("עודכן");
          setEditingId(null);
        },
      }
    );
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`למחוק את "${name}"?`)) return;
    del.mutate(id, { onSuccess: () => toast.success("נמחק") });
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-4 md:p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tags className="h-4 w-4 text-finance" />
          <h3 className="text-sm font-semibold">קטגוריות הוצאה ותקציב</h3>
        </div>
        {(!categories || categories.length === 0) && (
          <button onClick={seedDefaults} className="text-[11px] text-finance font-semibold hover:underline">
            טען ברירת מחדל
          </button>
        )}
      </div>

      <div className="space-y-2">
        {(categories || []).map((c: any) => (
          <div key={c.id} className="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-secondary/20">
            {editingId === c.id ? (
              <>
                <input value={editIcon} onChange={(e) => setEditIcon(e.target.value)} maxLength={2}
                  className="w-10 px-1 py-1.5 rounded-lg bg-card border border-border text-center text-sm" />
                <input value={editName} onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 px-2 py-1.5 rounded-lg bg-card border border-border text-sm" />
                <input value={editBudget} onChange={(e) => setEditBudget(e.target.value)} type="number" placeholder="תקציב"
                  className="w-20 px-2 py-1.5 rounded-lg bg-card border border-border text-xs text-center" dir="ltr" />
                <button onClick={saveEdit} className="h-8 w-8 rounded flex items-center justify-center bg-finance/15">
                  <Check className="h-4 w-4 text-finance" />
                </button>
                <button onClick={() => setEditingId(null)} className="h-8 w-8 rounded flex items-center justify-center hover:bg-secondary">
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </>
            ) : (
              <>
                <span className="text-lg">{c.icon || "📦"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.name}</p>
                  {c.budget_limit && (
                    <p className="text-[10px] text-muted-foreground">תקציב: ₪{Number(c.budget_limit).toLocaleString("he-IL")}</p>
                  )}
                </div>
                <button onClick={() => startEdit(c)} className="h-8 w-8 rounded flex items-center justify-center hover:bg-secondary">
                  <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                <button onClick={() => handleDelete(c.id, c.name)} className="h-8 w-8 rounded flex items-center justify-center hover:bg-destructive/10">
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </button>
              </>
            )}
          </div>
        ))}
        {(!categories || categories.length === 0) && (
          <p className="text-xs text-muted-foreground text-center py-3">אין קטגוריות עדיין</p>
        )}
      </div>

      <div className="border-t border-border pt-3 space-y-2">
        <p className="text-xs font-medium text-muted-foreground">הוסף קטגוריה</p>
        <div className="flex gap-2">
          <input value={newIcon} onChange={(e) => setNewIcon(e.target.value)} maxLength={2}
            className="w-10 px-1 py-2 rounded-lg bg-secondary/30 border border-border text-center text-sm" placeholder="📦" />
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="שם הקטגוריה"
            className="flex-1 px-3 py-2 rounded-lg bg-secondary/30 border border-border text-sm" />
          <input value={newBudget} onChange={(e) => setNewBudget(e.target.value)} type="number" placeholder="תקציב"
            className="w-20 px-2 py-2 rounded-lg bg-secondary/30 border border-border text-xs text-center" dir="ltr" />
          <button onClick={handleAdd} disabled={upsert.isPending}
            className="px-3 rounded-lg bg-finance/15 text-finance font-medium text-sm hover:bg-finance/25 disabled:opacity-50">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
