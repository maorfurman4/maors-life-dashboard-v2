import { Scale, Plus, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { useState } from "react";
import { useWeightEntries, useAddWeight, useDeleteWeight } from "@/hooks/use-sport-data";
import { toast } from "sonner";

export function WeightTracker() {
  const [showAdd, setShowAdd] = useState(false);
  const [newWeight, setNewWeight] = useState("");
  const { data: weights, isLoading } = useWeightEntries(10);
  const addWeight = useAddWeight();
  const deleteWeight = useDeleteWeight();

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
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold" dir="ltr">{w.weight_kg} kg</span>
                <span className="text-[10px] text-muted-foreground">{new Date(w.date).toLocaleDateString("he-IL")}</span>
              </div>
              <button onClick={() => handleDelete(w.id)} className="h-6 w-6 rounded flex items-center justify-center hover:bg-destructive/10">
                <Trash2 className="h-3 w-3 text-destructive" />
              </button>
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
