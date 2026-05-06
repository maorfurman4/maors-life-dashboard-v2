import { Scale, Plus, Trash2, Pencil, Check, X } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { useState } from "react";
import { useWeightEntries, useAddWeight, useDeleteWeight, useUpdateWeight } from "@/hooks/use-sport-data";
import { toast } from "sonner";

export function WeightTracker() {
  const [showAdd, setShowAdd] = useState(false);
  const [newWeight, setNewWeight] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const { data: weights, isLoading } = useWeightEntries(10);
  const addWeight = useAddWeight();
  const deleteWeight = useDeleteWeight();
  const updateWeight = useUpdateWeight();

  const handleAdd = () => {
    const val = parseFloat(newWeight);
    if (!val || val <= 0) { toast.error("הזן משקל תקין"); return; }
    addWeight.mutate({ weight_kg: val }, {
      onSuccess: () => { toast.success("שקילה נשמרה!"); setNewWeight(""); setShowAdd(false); },
      onError: (err) => toast.error("שגיאה: " + err.message),
    });
  };

  const handleDelete = (id: string) => {
    deleteWeight.mutate(id, {
      onSuccess: () => toast.success("שקילה נמחקה"),
      onError: (err) => toast.error("שגיאה: " + err.message),
    });
  };

  const startEdit = (id: string, currentValue: number) => {
    setEditingId(id);
    setEditValue(String(currentValue));
  };

  const handleSaveEdit = () => {
    if (!editingId) return;
    const val = parseFloat(editValue);
    if (!val || val <= 0) { toast.error("הזן משקל תקין"); return; }
    updateWeight.mutate({ id: editingId, weight_kg: val }, {
      onSuccess: () => { toast.success("משקל עודכן"); setEditingId(null); },
      onError: (err) => toast.error("שגיאה: " + err.message),
    });
  };

  return (
    <div className="rounded-2xl border border-sport/15 bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-sport" />
          <h3 className="text-sm font-bold">מעקב משקל</h3>
        </div>
        <button onClick={() => setShowAdd(!showAdd)}
          className="text-[10px] text-sport font-semibold hover:underline min-h-[32px] flex items-center">
          {showAdd ? "סגור" : "הוסף שקילה"}
        </button>
      </div>

      {showAdd && (
        <div className="flex gap-2">
          <input type="number" step="0.1" placeholder="78.5" value={newWeight} onChange={(e) => setNewWeight(e.target.value)}
            className="flex-1 rounded-lg bg-secondary/40 border border-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sport min-h-[44px]" dir="ltr" />
          <button onClick={handleAdd} disabled={addWeight.isPending}
            className="px-4 rounded-lg bg-sport/15 text-sport text-sm font-semibold hover:bg-sport/25 transition-colors min-h-[44px] disabled:opacity-50">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      )}

      {isLoading && <div className="text-xs text-muted-foreground text-center py-3">טוען...</div>}

      {!isLoading && weights && weights.length > 0 && (
        <div className="space-y-1.5 max-h-40 overflow-y-auto">
          {weights.map((w) => (
            <div key={w.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-secondary/20">
              {editingId === w.id ? (
                <>
                  <input
                    type="number" step="0.1" value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-24 rounded-lg bg-secondary/40 border border-sport/40 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-sport"
                    dir="ltr" autoFocus
                  />
                  <div className="flex items-center gap-1">
                    <button onClick={handleSaveEdit} disabled={updateWeight.isPending}
                      className="h-7 w-7 rounded flex items-center justify-center bg-sport/15 hover:bg-sport/25 text-sport disabled:opacity-50">
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setEditingId(null)}
                      className="h-7 w-7 rounded flex items-center justify-center hover:bg-secondary/50 text-muted-foreground">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold" dir="ltr">{w.weight_kg} kg</span>
                    <span className="text-[10px] text-muted-foreground">{new Date(w.date).toLocaleDateString("he-IL")}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => startEdit(w.id, w.weight_kg)}
                      className="h-6 w-6 rounded flex items-center justify-center hover:bg-sport/10 text-muted-foreground hover:text-sport">
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button onClick={() => handleDelete(w.id)}
                      className="h-6 w-6 rounded flex items-center justify-center hover:bg-destructive/10">
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {!isLoading && (!weights || weights.length === 0) && !showAdd && (
        <EmptyState icon={Scale} message="אין שקילות עדיין — הוסף שקילה ראשונה"
          actionLabel="הוסף שקילה" onAction={() => setShowAdd(true)} colorClass="text-sport" />
      )}
    </div>
  );
}
