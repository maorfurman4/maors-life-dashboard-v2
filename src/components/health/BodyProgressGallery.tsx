import { Camera, ImageIcon } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";

export function BodyProgressGallery() {
  const photos: unknown[] = [];

  return (
    <div className="rounded-2xl border border-sport/15 bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="h-4 w-4 text-sport" />
          <h3 className="text-sm font-bold">מעקב גוף</h3>
        </div>
        <button className="flex items-center gap-1 text-[10px] text-sport font-semibold hover:underline min-h-[32px]">
          <Camera className="h-3 w-3" />
          צלם תמונה
        </button>
      </div>

      {photos.length === 0 ? (
        <EmptyState
          icon={Camera}
          message="אין תמונות גוף עדיין — צלם תמונה ראשונה לתיעוד ההתקדמות"
          colorClass="text-sport"
        />
      ) : null}
    </div>
  );
}
