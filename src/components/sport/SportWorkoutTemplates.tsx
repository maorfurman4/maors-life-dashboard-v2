import { useState } from "react";
import { LayoutTemplate, Trash2, Pencil, Youtube } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { useWorkoutTemplates, useDeleteWorkoutTemplate } from "@/hooks/use-sport-data";
import { EditTemplateDrawer } from "@/components/sport/EditTemplateDrawer";
import { toast } from "sonner";
import { haptics } from "@/lib/haptics";

// Supabase returns exercises as Json (which includes null). We widen the type for local use.
interface TemplateRow {
  id: string;
  name: string;
  category: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  exercises: any;
  estimated_duration_minutes?: number | null;
  is_system?: boolean | null;
  user_id?: string | null;
  created_at?: string;
  updated_at?: string;
  estimated_calories?: number | null;
  notes?: string | null;
}

export function SportWorkoutTemplates() {
  const { data: templates, isLoading } = useWorkoutTemplates();
  const deleteTemplate = useDeleteWorkoutTemplate();
  const [editingTemplate, setEditingTemplate] = useState<TemplateRow | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const castTemplate = (t: any): TemplateRow => t as TemplateRow;

  const handleDelete = (id: string) => {
    haptics.heavy();
    deleteTemplate.mutate(id, {
      onSuccess: () => toast.success("תבנית נמחקה"),
      onError: (err) => toast.error("שגיאה: " + err.message),
    });
  };

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <LayoutTemplate className="h-4 w-4 text-sport" />
          <h3 className="text-sm font-bold">תבניות אימון</h3>
        </div>

        {isLoading && <div className="text-xs text-muted-foreground text-center py-3">טוען...</div>}

        {!isLoading && templates && templates.length > 0 ? (
          <div className="space-y-2">
            {templates.map((t) => {
              const exercises = Array.isArray(t.exercises) ? t.exercises : [];
              return (
                <div key={t.id} className="rounded-xl border border-border bg-card p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-bold">{t.name}</span>
                    <div className="flex items-center gap-1">
                      {!t.is_system && (
                        <>
                          <button
                            onClick={() => { haptics.tap(); setEditingTemplate(castTemplate(t)); }}
                            className="h-6 w-6 rounded flex items-center justify-center hover:bg-sport/10"
                          >
                            <Pencil className="h-3 w-3 text-sport/70" />
                          </button>
                          <button
                            onClick={() => handleDelete(t.id)}
                            className="h-6 w-6 rounded flex items-center justify-center hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </button>
                        </>
                      )}
                      {t.is_system && (
                        <span className="text-[9px] text-muted-foreground/50 px-1.5 py-0.5 rounded bg-secondary/20">מערכת</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {exercises.map((ex: any, i: number) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sport/10 text-[10px] text-sport font-medium">
                        {ex.name} {ex.sets}×{ex.reps}
                        {ex.youtube_link && (
                          <a
                            href={ex.youtube_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            title="צפה בסרטון הדרכה"
                            className="inline-flex items-center hover:opacity-80 transition-opacity"
                          >
                            <Youtube className="h-2.5 w-2.5 text-red-400/70" />
                          </a>
                        )}
                      </span>
                    ))}
                  </div>
                  {t.estimated_duration_minutes && (
                    <p className="text-[10px] text-muted-foreground mt-1">~{t.estimated_duration_minutes} דק׳</p>
                  )}
                </div>
              );
            })}
          </div>
        ) : !isLoading ? (
          <div className="rounded-xl border border-border bg-card">
            <EmptyState icon={LayoutTemplate} message="אין תבניות עדיין — שמור אימון כתבנית מטופס האימון" colorClass="text-sport" />
          </div>
        ) : null}

        <p className="text-[10px] text-muted-foreground/60 text-center">
          ⚠️ יש לך רגישות בכתפיים — תבניות מותאמות ללא עומסי כתף כבדים
        </p>
      </div>

      <EditTemplateDrawer
        open={!!editingTemplate}
        onClose={() => setEditingTemplate(null)}
        template={editingTemplate}
      />
    </>
  );
}
