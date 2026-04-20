import { ImageIcon, Upload, FolderOpen, X } from "lucide-react";
import { useRef, useState } from "react";
import { EmptyState } from "@/components/shared/EmptyState";

interface UploadedFile {
  name: string;
  url: string;
  type: string;
}

export function BodyProgressGallery() {
  const [photos, setPhotos] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const next: UploadedFile[] = [];
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      next.push({ name: file.name, url: URL.createObjectURL(file), type: file.type });
    });
    setPhotos((prev) => [...prev, ...next]);
  };

  const removePhoto = (idx: number) => {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[idx].url);
      return prev.filter((_, i) => i !== idx);
    });
  };

  return (
    <div className="rounded-2xl border border-sport/15 bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-sport" />
          <h3 className="text-sm font-bold">מעקב גוף</h3>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 text-[11px] text-sport font-semibold hover:underline min-h-[32px] px-2 py-1 rounded-lg hover:bg-sport/10 transition-colors"
        >
          <Upload className="h-3 w-3" />
          העלה תמונות
        </button>
      </div>

      {/* Hidden multi-file picker — no camera, gallery + image only */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        capture={undefined}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {photos.length === 0 ? (
        <div
          className="rounded-xl border-2 border-dashed border-border hover:border-sport/30 transition-colors cursor-pointer p-6"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center gap-2 text-center">
            <FolderOpen className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">בחר/י מהגלריה — ניתן לבחור כמה תמונות</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo, idx) => (
            <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-border group">
              <img
                src={photo.url}
                alt={photo.name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => removePhoto(idx)}
                className="absolute top-1 left-1 h-5 w-5 rounded-full bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-sport/30 flex items-center justify-center transition-colors"
          >
            <Upload className="h-5 w-5 text-muted-foreground/50" />
          </button>
        </div>
      )}
    </div>
  );
}
