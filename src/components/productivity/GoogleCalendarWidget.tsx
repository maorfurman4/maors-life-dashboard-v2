import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function GoogleCalendarWidget() {
  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">גוגל קלנדר</h3>
      </div>
      <div className="text-center py-4 space-y-2">
        <p className="text-sm text-muted-foreground">חבר את גוגל קלנדר שלך כדי לראות אירועים</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            // TODO: implement OAuth - requires Google Cloud Console setup
            toast.info("חיבור גוגל קלנדר יהיה זמין בקרוב");
          }}
        >
          <Calendar className="h-3.5 w-3.5 ml-1.5" />
          חבר גוגל קלנדר
        </Button>
      </div>
    </div>
  );
}
