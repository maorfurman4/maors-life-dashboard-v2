import { LayoutTemplate, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { useWorkoutTemplates, useDeleteWorkoutTemplate } from "@/hooks/use-sport-data";
import { toast } from "sonner";

export function SportWorkoutTemplates() {
  const { data: templates, isLoading } = useWorkoutTemplates();
  const deleteTemplate = useDeleteWorkoutTemplate();

  const handleDelete = (id: string) => {
    deleteTemplate.mutate(id, {
      onSuccess: () => toast.success("תבנית נמחקה"),
      onError: (err) => toast.error("שגיאה: " + err.message),
    });
  };

  return (
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
                  <button onClick={() => handleDelete(t.id)} className="h-6 w-6 rounded flex items-center justify-center hover:bg-destructive/10">
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {exercises.map((ex: any, i: number) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-sport/10 text-[10px] text-sport font-medium">
                      {ex.name} {ex.sets}×{ex.reps}
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
  );
}
