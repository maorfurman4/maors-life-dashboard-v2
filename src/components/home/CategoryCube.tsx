import { Link } from "@tanstack/react-router";
import { Plus, type LucideIcon } from "lucide-react";

interface CategoryCubeProps {
  title: string;
  icon: LucideIcon;
  to: string;
  imageUrl: string;
  onQuickAdd: (e: React.MouseEvent) => void;
}

export function CategoryCube({ title, icon: Icon, to, imageUrl, onQuickAdd }: CategoryCubeProps) {
  return (
    <div className="relative">
      <Link
        to={to as any}
        className="block aspect-[4/5] rounded-3xl overflow-hidden relative transition-transform duration-200 active:scale-[0.97]"
        style={{ backgroundImage: `url(${imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }}
      >
        {/* Legibility overlay: heavier at bottom, very light at top */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/10" />

        {/* Bottom: icon + title */}
        <div className="absolute bottom-0 inset-x-0 p-4">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-white shrink-0" />
            <p className="text-white text-base font-bold leading-none tracking-tight">{title}</p>
          </div>
        </div>
      </Link>

      {/* Floating glass + button — top-left */}
      <button
        onClick={onQuickAdd}
        aria-label={`הוסף ${title}`}
        className="absolute top-3 left-3 h-9 w-9 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center transition-transform active:scale-90 hover:bg-white/25"
      >
        <Plus className="h-4 w-4 text-white" />
      </button>
    </div>
  );
}
