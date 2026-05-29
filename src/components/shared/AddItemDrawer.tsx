import { motion } from "framer-motion";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer";
import { X } from "lucide-react";

interface AddItemDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  accentColor?: string;       // "finance" | "sport" | "nutrition" | "work"
  children: React.ReactNode;
  footer?: React.ReactNode;   // sticky save button slot
}

export function AddItemDrawer({ open, onClose, title, children, footer }: AddItemDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="max-h-[92vh] bg-[#111114] border-t border-white/8 rounded-t-[20px] flex flex-col">
        {/* Native-style drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-9 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <DrawerHeader className="flex items-center justify-between px-5 pb-3 pt-1 flex-shrink-0">
          <DrawerTitle className="text-[17px] font-bold tracking-tight text-white/95">{title}</DrawerTitle>
          <DrawerClose asChild>
            <button className="h-7 w-7 rounded-full bg-white/8 flex items-center justify-center hover:bg-white/14 transition-colors active:scale-95">
              <X className="h-3.5 w-3.5 text-white/60" />
            </button>
          </DrawerClose>
        </DrawerHeader>

        {/* Animated content area */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 30, delay: 0.04 }}
          className={`px-5 pt-1 overflow-y-auto space-y-4 flex-1 ${footer ? "pb-3" : "pb-8"}`}
        >
          {children}
        </motion.div>

        {/* Sticky footer for save button */}
        {footer && (
          <div className="px-5 pb-8 pt-3 border-t border-white/6 bg-[#111114] flex-shrink-0">
            {footer}
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
