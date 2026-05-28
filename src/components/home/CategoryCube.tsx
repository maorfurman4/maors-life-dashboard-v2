import { Link } from "@tanstack/react-router";
import { Plus, type LucideIcon } from "lucide-react";
import { motion, type Variants } from "framer-motion";

interface CategoryCubeProps {
  title: string;
  icon: LucideIcon;
  to: string;
  imageUrl: string;
  onQuickAdd: (e: React.MouseEvent) => void;
  index?: number;
}

const cubeVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: {
      delay: i * 0.07,
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  }),
};

export function CategoryCube({ title, icon: Icon, to, imageUrl, onQuickAdd, index = 0 }: CategoryCubeProps) {
  return (
    <motion.div
      className="relative"
      custom={index}
      variants={cubeVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.93 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <Link
        to={to as any}
        className="block aspect-[4/5] rounded-3xl overflow-hidden relative"
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
      <motion.button
        onClick={onQuickAdd}
        aria-label={`הוסף ${title}`}
        className="absolute top-3 left-3 h-9 w-9 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/25"
        whileTap={{ scale: 0.85 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <Plus className="h-4 w-4 text-white" />
      </motion.button>
    </motion.div>
  );
}
