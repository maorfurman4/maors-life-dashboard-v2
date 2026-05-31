import { motion } from "framer-motion";

const SHIMMER_ANIMATE = { opacity: [0.4, 0.8, 0.4] };
const SHIMMER_TRANSITION = { duration: 1.5, repeat: Infinity, ease: "easeInOut" } as const;

function SkeletonBox({ className }: { className?: string }) {
  return (
    <motion.div
      animate={SHIMMER_ANIMATE}
      transition={SHIMMER_TRANSITION}
      className={`rounded-xl bg-white/6 ${className ?? ""}`}
    />
  );
}

/** Skeleton for the 2-col cards grid (FinanceDashboardCards) */
export function FinanceCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={i}
          animate={SHIMMER_ANIMATE}
          transition={{ ...SHIMMER_TRANSITION, delay: i * 0.05 }}
          className="rounded-2xl bg-white/5 border border-white/6 p-3 space-y-2"
        >
          <SkeletonBox className="h-2.5 w-16" />
          <SkeletonBox className="h-5 w-20" />
        </motion.div>
      ))}
    </div>
  );
}

/** Skeleton for a transaction list row */
export function TransactionRowSkeleton() {
  return (
    <motion.div
      animate={SHIMMER_ANIMATE}
      transition={SHIMMER_TRANSITION}
      className="flex items-center justify-between px-3 py-2.5 rounded-2xl bg-white/4 border border-white/6"
    >
      <div className="flex items-center gap-2">
        <SkeletonBox className="h-4 w-4 rounded-full" />
        <div className="space-y-1.5">
          <SkeletonBox className="h-2.5 w-28" />
          <SkeletonBox className="h-2 w-16" />
        </div>
      </div>
      <SkeletonBox className="h-3.5 w-14" />
    </motion.div>
  );
}

/** Skeleton for the savings goals list */
export function SavingsGoalSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 2 }).map((_, i) => (
        <motion.div
          key={i}
          animate={SHIMMER_ANIMATE}
          transition={{ ...SHIMMER_TRANSITION, delay: i * 0.1 }}
          className="rounded-2xl bg-white/4 border border-white/6 p-4 space-y-3"
        >
          <div className="flex justify-between">
            <SkeletonBox className="h-3.5 w-24" />
            <SkeletonBox className="h-3.5 w-16" />
          </div>
          <SkeletonBox className="h-1.5 w-full rounded-full" />
        </motion.div>
      ))}
    </div>
  );
}

/** Skeleton for the weekly chart */
export function WeeklyChartSkeleton() {
  return (
    <motion.div
      animate={SHIMMER_ANIMATE}
      transition={SHIMMER_TRANSITION}
      className="rounded-2xl bg-white/4 border border-white/6 p-4"
    >
      <SkeletonBox className="h-3 w-24 mb-4" />
      <div className="flex items-end gap-2 h-24">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex-1 flex items-end">
            <motion.div
              animate={SHIMMER_ANIMATE}
              transition={{ ...SHIMMER_TRANSITION, delay: i * 0.06 }}
              className="w-full rounded-t-lg bg-white/8"
              style={{ height: `${30 + Math.sin(i) * 20 + 20}px` }}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2">
        {["א", "ב", "ג", "ד", "ה", "ו", "ש"].map((d) => (
          <SkeletonBox key={d} className="h-2 w-3" />
        ))}
      </div>
    </motion.div>
  );
}

/** Skeleton for fixed expenses / debt rows */
export function FixedExpenseSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <motion.div
          key={i}
          animate={SHIMMER_ANIMATE}
          transition={{ ...SHIMMER_TRANSITION, delay: i * 0.08 }}
          className="flex items-center justify-between px-3 py-3 rounded-2xl bg-white/4 border border-white/6"
        >
          <div className="flex items-center gap-2">
            <SkeletonBox className="h-7 w-7 rounded-xl" />
            <SkeletonBox className="h-3 w-24" />
          </div>
          <SkeletonBox className="h-3.5 w-14" />
        </motion.div>
      ))}
    </div>
  );
}
