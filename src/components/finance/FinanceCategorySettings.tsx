import { useState } from "react";
import { X, Tags, Plus, Trash2, Pencil, Check } from "lucide-react";
import { useExpenseCategories, useUpsertCategory, useDeleteCategory, DEFAULT_EXPENSE_CATEGORIES } from "@/hooks/use-finance-data";
import { FT } from "@/lib/finance-theme";
import { toast } from "sonner";

interface FinanceCategorySettingsProps {
  open: boolean;
  onClose: () => void;
}

export function FinanceCategorySettings({ open, onClose }: FinanceCategorySettingsProps) {
  const { data: categories } = useExpenseCategories();
  const upsert = useUpsertCategory();
  const del = useDeleteCategory();

  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("📦");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editIcon, setEditIcon] = useState("");

  if (!open) return null;

  const inputStyle = { background: "rgba(255,255,255,0.06)", border: `1px solid ${FT.goldBorder}`, color: "#fff" };

  const handleAdd = () => {
    if (!newName.trim()) { toast.error("הזן שם קטגוריה"); return; }
    upsert.mutate(
      { name: newName.trim(), icon: newIcon || "📦", sort_order: (categories?.length ?? 0) + 1 },
      {
        onSuccess: () => { toast.success("קטגוריה נוספה"); setNewName(""); setNewIcon("📦"); },
        onError: (e) => toast.error("שגיאה: " + e.message),
      }
    );
  };

  const seedDefaults = () => {
    DEFAULT_EXPENSE_CATEGORIES.forEach((c, i) => { upsert.mutate({ name: c.name, icon: c.icon, sort_order: i }); });
    toast.success("קטגוריות ברירת מחדל נוספו");
  };

  const startEdit = (c: any) => { setEditingId(c.id); setEditName(c.name); setEditIcon(c.icon || "📦"); };

  const saveEdit = () => {
    if (!editingId) return;
    upsert.mutate(
      { id: editingId, name: editName, icon: editIcon },
      { onSuccess: () => { toast.success("עודכן"); setEditingId(null); } }
    );
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`למחוק את "${name}"?`)) return;
    del.mutate(id, { onSuccess: () => toast.success("נמחק") });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" dir="rtl">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-lg rounded-t-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto"
        style={{ background: FT.card, border: `1px solid ${FT.goldBorder}`, borderBottom: "none" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tags className="h-4 w-4" style={{ color: FT.gold }} />
            <h3 className="text-sm font-black text-white" style={{ letterSpacing: 0 }}>ניהול קטגוריות</h3>
          </div>
          <div className="flex items-center gap-2">
            {(!categories || categories.length === 0) && (
              <button onClick={seedDefaults} className="text-[11px] font-bold" style={{ color: FT.gold }}>
                טען ברירת מחדל
              </button>
            )}
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-full flex items-center justify-center transition-all"
              style={{ background: "rgba(255,255,255,0.08)" }}
            >
              <X className="h-4 w-4 text-white/60" />
            </button>
          </div>
        </div>

        {/* Category list */}
        <div className="space-y-2">
          {(categories || []).map((c: any) => (
            <div key={c.id} className="flex items-center gap-2 p-3 rounded-2xl" style={{ background: FT.cardLight, border: `1px solid ${FT.brownBorder}` }}>
              {editingId === c.id ? (
                <>
                  <input value={editIcon} onChange={(e) => setEditIcon(e.target.value)} maxLength={2}
                    className="w-10 text-center px-1 py-1.5 rounded-xl text-sm focus:outline-none"
                    style={inputStyle} />
                  <input value={editName} onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 px-2 py-1.5 rounded-xl text-sm focus:outline-none"
                    style={inputStyle} />
                  <button onClick={saveEdit} className="h-8 w-8 flex items-center justify-center rounded-xl transition-all"
                    style={{ background: FT.goldDim, border: `1px solid ${FT.goldBorder}` }}>
                    <Check className="h-3.5 w-3.5" style={{ color: FT.gold }} />
                  </button>
                  <button onClick={() => setEditingId(null)} className="h-8 w-8 flex items-center justify-center rounded-xl"
                    style={{ background: "rgba(255,255,255,0.05)" }}>
                    <X className="h-3.5 w-3.5 text-white/40" />
                  </button>
                </>
              ) : (
                <>
                  <span className="text-lg">{c.icon || "📦"}</span>
                  <p className="flex-1 text-sm font-bold text-white truncate" style={{ letterSpacing: 0 }}>{c.name}</p>
                  <button onClick={() => startEdit(c)} className="h-8 w-8 flex items-center justify-center rounded-xl transition-all"
                    style={{ background: "rgba(255,255,255,0.05)" }}>
                    <Pencil className="h-3.5 w-3.5 text-white/40" />
                  </button>
                  <button onClick={() => handleDelete(c.id, c.name)} className="h-8 w-8 flex items-center justify-center rounded-xl transition-all hover:bg-red-500/20">
                    <Trash2 className="h-3.5 w-3.5 text-red-400/60" />
                  </button>
                </>
              )}
            </div>
          ))}
          {(!categories || categories.length === 0) && (
            <p className="text-xs text-center py-4" style={{ color: FT.textFaint }}>אין קטגוריות · לחץ "טען ברירת מחדל" להתחלה</p>
          )}
        </div>

        {/* Add form */}
        <div className="border-t pt-3 space-y-2" style={{ borderColor: FT.goldBorder }}>
          <p className="text-[11px] font-black" style={{ color: FT.textMuted, letterSpacing: 0 }}>הוסף קטגוריה</p>
          <div className="flex gap-2">
            <input value={newIcon} onChange={(e) => setNewIcon(e.target.value)} maxLength={2}
              className="w-12 text-center px-1 py-2.5 rounded-xl text-sm focus:outline-none"
              style={inputStyle} placeholder="📦" />
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="שם הקטגוריה"
              className="flex-1 px-3 py-2.5 rounded-xl text-sm focus:outline-none"
              style={inputStyle} />
            <button onClick={handleAdd} disabled={upsert.isPending}
              className="px-4 rounded-xl font-black text-sm transition-all disabled:opacity-50 active:scale-95"
              style={{ background: FT.gold, color: FT.bg, letterSpacing: 0 }}>
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
