import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer";
import { X } from "lucide-react";

interface AddItemDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  accentColor?: string;
  children: React.ReactNode;
}

export function AddItemDrawer({ open, onClose, title, children }: AddItemDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="flex items-center justify-between border-b border-border pb-3">
          <DrawerTitle className="text-base font-bold">{title}</DrawerTitle>
          <DrawerClose asChild>
            <button className="h-8 w-8 rounded-lg bg-secondary/60 flex items-center justify-center hover:bg-secondary transition-colors">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </DrawerClose>
        </DrawerHeader>
        <div className="px-4 pb-6 pt-4 overflow-y-auto space-y-4">
          {children}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
