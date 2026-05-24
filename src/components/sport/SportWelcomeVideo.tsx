import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "sport_welcome_seen";
// TODO: Replace SPORT_VIDEO_PLACEHOLDER with actual YouTube video ID
const YOUTUBE_VIDEO_ID = "SPORT_VIDEO_PLACEHOLDER";
// Bug fix #4: don't render broken iframe when ID is still the placeholder
const VIDEO_READY = YOUTUBE_VIDEO_ID !== "SPORT_VIDEO_PLACEHOLDER";

export default function SportWelcomeVideo() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setOpen(false);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-2xl w-full bg-gray-900 border-white/10 text-white" dir="rtl">
        <DialogHeader className="text-right">
          <DialogTitle className="text-xl font-bold text-right">
            ברוך הבא למודול הספורט! 🏋️
          </DialogTitle>
          <DialogDescription className="text-white/60 text-right">
            צפה בסרטון הקצר שיסביר לך איך להשתמש בכל הפיצ'רים
          </DialogDescription>
        </DialogHeader>

        <div className="aspect-video w-full mt-2">
          {VIDEO_READY ? (
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}`}
              title="סרטון הדגמה - מודול ספורט"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="rounded-lg"
            />
          ) : (
            /* Bug fix #4: placeholder — show friendly message instead of broken iframe */
            <div className="w-full h-full rounded-lg bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-3">
              <span className="text-5xl">🏋️</span>
              <p className="text-white/60 text-sm text-center px-4">
                סרטון הדגמה יתווסף בקרוב!<br />
                <span className="text-white/30 text-xs">בינתיים — חקור את המודול וגלה את כל הפיצ'רים</span>
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-3 mt-2">
          <Button
            onClick={handleClose}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-base py-3"
          >
            הבנתי, בוא נתחיל! 💪
          </Button>
          <button
            onClick={handleClose}
            className="text-sm text-white/40 hover:text-white/60 transition-colors"
          >
            דלג
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
