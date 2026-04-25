import { useState } from "react";
import { Dumbbell, Apple, Wallet, Briefcase } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { CategoryCube } from "./CategoryCube";
import { WeatherMini } from "./WeatherMini";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { AddWorkoutDrawer } from "@/components/sport/AddWorkoutDrawer";
import { AddMealDrawer } from "@/components/nutrition/AddMealDrawer";
import { AddExpenseDrawer } from "@/components/finance/AddExpenseDrawer";
import { AddShiftDrawer } from "@/components/work/AddShiftDrawer";

const BG_IMAGE =
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1400&q=80";

const cubes = [
  {
    key: "sport",
    title: "ספורט",
    icon: Dumbbell,
    to: "/sport",
    imageUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80",
  },
  {
    key: "nutrition",
    title: "תזונה",
    icon: Apple,
    to: "/nutrition",
    imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80",
  },
  {
    key: "finance",
    title: "כלכלה",
    icon: Wallet,
    to: "/finance",
    imageUrl: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80",
  },
  {
    key: "work",
    title: "עבודה",
    icon: Briefcase,
    to: "/work",
    imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
  },
] as const;

export function ModernHome() {
  const { user } = useAuth();
  const [openDrawer, setOpenDrawer] = useState<string | null>(null);

  const hour = new Date().getHours();
  const greeting =
    hour < 5 ? "לילה טוב" :
    hour < 12 ? "בוקר טוב" :
    hour < 17 ? "צהריים טובים" :
    hour < 21 ? "ערב טוב" : "לילה טוב";

  const name =
    user?.user_metadata?.full_name?.split(" ")[0] ??
    user?.email?.split("@")[0] ??
    "";

  return (
    <div
      className="-mx-3 -mt-3 md:-mx-6 md:-mt-6 relative min-h-screen px-4 pt-10 pb-28 md:px-8"
      style={{ backgroundImage: `url(${BG_IMAGE})`, backgroundSize: "cover", backgroundPosition: "center" }}
      dir="rtl"
    >
      {/* Dark legibility overlay */}
      <div className="absolute inset-0 bg-black/55 pointer-events-none" />

      {/* Ambient color glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-sport/25 blur-[90px]" />
        <div className="absolute bottom-16 -left-16 h-64 w-64 rounded-full bg-finance/20 blur-[80px]" />
      </div>

      {/* Content sits above overlays */}
      <div className="relative">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-widest text-white/50">
              {greeting}
            </p>
            <h1 className="text-2xl font-black tracking-tight text-white">
              {name || "ברוך הבא"}
            </h1>
          </div>
          <div className="flex flex-col items-end gap-2">
            <WeatherMini />
            {/* Brand mark */}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-bold tracking-widest text-white/30 uppercase">Smart Helix</span>
              <div className="rounded-xl shadow-[0_0_18px_rgba(37,99,235,0.4)]">
                <BrandLogo size={36} />
              </div>
            </div>
          </div>
        </div>

        {/* 2×2 category grid */}
        <div className="grid grid-cols-2 gap-3">
          {cubes.map((cube) => (
            <CategoryCube
              key={cube.key}
              title={cube.title}
              icon={cube.icon}
              to={cube.to}
              imageUrl={cube.imageUrl}
              onQuickAdd={(e) => {
                e.preventDefault();
                setOpenDrawer(cube.key);
              }}
            />
          ))}
        </div>
      </div>

      {/* Drawers */}
      <AddWorkoutDrawer open={openDrawer === "sport"}     onClose={() => setOpenDrawer(null)} />
      <AddMealDrawer    open={openDrawer === "nutrition"}  onClose={() => setOpenDrawer(null)} />
      <AddExpenseDrawer open={openDrawer === "finance"}    onClose={() => setOpenDrawer(null)} />
      <AddShiftDrawer   open={openDrawer === "work"}       onClose={() => setOpenDrawer(null)} />
    </div>
  );
}
