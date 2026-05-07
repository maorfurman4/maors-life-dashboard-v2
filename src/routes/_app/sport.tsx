import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect, useMemo } from "react";
import {
  Dumbbell, Play, CheckCircle2, Trophy, Flame, Clock,
  Target, Zap, ChevronRight, Plus, RotateCcw, Minus,
  ChevronDown, ChevronUp, Loader2, Star, X, BookOpen,
  TrendingUp, Scale, Medal, BarChart3, Camera,
  Pencil, Check, Trash2, Heart, EyeOff, Eye,
  Share2, MapPin, Timer, Download,
} from "lucide-react";
import {
  usePersonalRecords, useAddPersonalRecord,
  useWorkoutTemplates, useAddWorkoutTemplate, useDeleteWorkoutTemplate,
  useWeekWorkouts, useAddWorkout, useWorkoutStreak,
  useWeightEntries, useAddWeight, useDeleteWeight, useUpdateWeight,
  useUserSettings, useUpdateUserSettings,
  useRunHistory, useBodyProgress, useAddBodyProgress, useDeleteBodyProgress,
} from "@/hooks/use-sport-data";
import { generateWorkoutPlan, type WorkoutPlan } from "@/lib/ai-service";
import { toast } from "sonner";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/_app/sport")({
  component: SportPage,
});

// ─── types ───────────────────────────────────────────────────────────────────
type Tab = "dashboard" | "builder" | "library" | "progress";

const TABS: { key: Tab; label: string }[] = [
  { key: "dashboard", label: "בית"        },
  { key: "builder",   label: "אימונים"    },
  { key: "library",   label: "ספרייה"     },
  { key: "progress",  label: "התקדמות"    },
];

// ─── Quick-Add workout definitions ───────────────────────────────────────────
const QUICK_WORKOUTS = [
  { key: "cardio",    label: "ריצה / קרדיו",  dbCategory: "running"      as const, emoji: "🏃", color: "#f97316", image: "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=400&q=80", durations: [20, 30, 45] },
  { key: "strength",  label: "כוח",            dbCategory: "weights"      as const, emoji: "🏋️", color: "#10b981", image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80", durations: [45, 60, 75] },
  { key: "hiit",      label: "HIIT",           dbCategory: "mixed"        as const, emoji: "⚡", color: "#eab308", image: "https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?w=400&q=80", durations: [15, 20, 30] },
  { key: "chest",     label: "חזה / כתפיים",  dbCategory: "weights"      as const, emoji: "💪", color: "#3b82f6", image: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&q=80", durations: [45, 60, 75] },
  { key: "back",      label: "גב / מתח",      dbCategory: "weights"      as const, emoji: "🦾", color: "#8b5cf6", image: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&q=80", durations: [45, 60, 75] },
  { key: "legs",      label: "רגליים",         dbCategory: "weights"      as const, emoji: "🦵", color: "#ec4899", image: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400&q=80", durations: [50, 60, 80] },
  { key: "core",      label: "ליבה / בטן",    dbCategory: "mixed"        as const, emoji: "🎯", color: "#06b6d4", image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&q=80", durations: [15, 25, 40] },
  { key: "yoga",      label: "יוגה / גמישות", dbCategory: "calisthenics" as const, emoji: "🧘", color: "#a78bfa", image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&q=80", durations: [20, 45, 60] },
];

// ─── Exercise Library data ────────────────────────────────────────────────────
interface LibraryExercise {
  name: string;
  muscles: string;
  tips: string[];
  defaultSets: number;
  defaultReps: string;
  equipment: string;
  youtubeQuery: string;
}
interface MuscleGroup {
  key: string;
  label: string;
  emoji: string;
  color: string;
  exercises: LibraryExercise[];
}

const MUSCLE_GROUPS: MuscleGroup[] = [
  {
    key: "chest", label: "חזה", emoji: "💪", color: "#3b82f6",
    exercises: [
      { name: "לחיצת חזה שכיבה", muscles: "חזה, כתפיים קדמיות, טריצפס", tips: ["שמור על גב שטוח", "הורד לאיטיות — 3 שניות", "נשוף בלחיצה"], defaultSets: 4, defaultReps: "8-10", equipment: "מוט", youtubeQuery: "bench+press+form+tutorial" },
      { name: "פרפר (Fly)", muscles: "חזה פנימי וחיצוני", tips: ["קשת עדינה במרפקים", "מרגיש מתיחה בפתיחה", "אל תכניס עמוד שדרה"], defaultSets: 3, defaultReps: "12", equipment: "דמבלים", youtubeQuery: "dumbbell+fly+chest+form" },
      { name: "שכיבות סמיכה", muscles: "חזה, טריצפס, ליבה", tips: ["גוף ישר כמו קרש", "מרפקים 45° לגוף", "ירידה עד הרצפה"], defaultSets: 3, defaultReps: "12-15", equipment: "ללא", youtubeQuery: "push+up+perfect+form" },
      { name: "לחיצת חזה במכונה", muscles: "חזה, כתפיים קדמיות", tips: ["כוונן את הגובה לחזה", "אל תחסום המרפק בסוף", "בקרה בחזרה"], defaultSets: 3, defaultReps: "10-12", equipment: "מכונה", youtubeQuery: "chest+press+machine+form" },
      { name: "קרוסאובר (כבלים)", muscles: "חזה פנימי, חלק תחתון", tips: ["צלב את הידיים בסיום", "גב ישר, לא כפוף", "קנה מידה שלם"], defaultSets: 3, defaultReps: "12-15", equipment: "כבלים", youtubeQuery: "cable+crossover+chest+form" },
    ],
  },
  {
    key: "back", label: "גב", emoji: "🦾", color: "#8b5cf6",
    exercises: [
      { name: "מתח (Pull-up)", muscles: "גב רחב, ביצפס, ליבה", tips: ["תלייה מלאה בתחתית", "הוצא חזה אל הבר", "אל תתנועע"], defaultSets: 4, defaultReps: "6-10", equipment: "מוט מתח", youtubeQuery: "pull+up+perfect+form" },
      { name: "חתירה (Barbell Row)", muscles: "גב אמצע, ביצפס, כתף אחורית", tips: ["גב ישר 45°", "משוך לבטן", "אל ת'שדרה עגול"], defaultSets: 4, defaultReps: "8-10", equipment: "מוט", youtubeQuery: "barbell+row+form+tutorial" },
      { name: "חתירה כבלים ישיבה", muscles: "גב אמצע, ליפ, ביצפס", tips: ["שב זקוף", "משוך לבטן תחתונה", "אל תתנועע"], defaultSets: 3, defaultReps: "12", equipment: "כבלים", youtubeQuery: "seated+cable+row+form" },
      { name: "לט פולדאון", muscles: "גב רחב, ביצפס", tips: ["אל תמשוך מאחורי הראש", "הישען קצת אחורה", "הוצא חזה"], defaultSets: 3, defaultReps: "10-12", equipment: "מכונה", youtubeQuery: "lat+pulldown+form+tutorial" },
      { name: "דדליפט", muscles: "גב תחתון, רגליים, ישבן, כל הגוף", tips: ["ברים קרוב לגוף", "גב ישר — חיוני!", "לחץ עקבים ברצפה"], defaultSets: 4, defaultReps: "5-6", equipment: "מוט", youtubeQuery: "deadlift+perfect+form+beginners" },
    ],
  },
  {
    key: "shoulders", label: "כתפיים", emoji: "🏋️", color: "#f97316",
    exercises: [
      { name: "לחיצת כתפיים (OHP)", muscles: "דלטואיד קדמי ואמצע, טריצפס", tips: ["עמוד יציב", "נסגר בראש", "אל תרכין גב"], defaultSets: 4, defaultReps: "8-10", equipment: "מוט / דמבלים", youtubeQuery: "overhead+press+form+tutorial" },
      { name: "הרמות צד (Lateral Raise)", muscles: "דלטואיד אמצעי", tips: ["קצת קדימה — לא בצד מוחלט", "מרפק קצת כפוף", "הורד לאיטיות"], defaultSets: 3, defaultReps: "12-15", equipment: "דמבלים", youtubeQuery: "lateral+raise+form+tutorial" },
      { name: "הרמות קדמיות (Front Raise)", muscles: "דלטואיד קדמי", tips: ["לא מעל גובה הכתף", "בקרה בחזרה", "גו ישר"], defaultSets: 3, defaultReps: "12", equipment: "דמבלים", youtubeQuery: "front+raise+form" },
      { name: "Face Pull", muscles: "דלטואיד אחורי, שרוול מסובב", tips: ["כיוון כבל לגובה עיניים", "פרוס כ-W בסיום", "תנועה מבוקרת"], defaultSets: 3, defaultReps: "15-20", equipment: "כבלים", youtubeQuery: "face+pull+form+tutorial" },
    ],
  },
  {
    key: "arms", label: "ידיים", emoji: "💪", color: "#ec4899",
    exercises: [
      { name: "כפיפות מרפק (Bicep Curl)", muscles: "ביצפס, ברכיאליס", tips: ["אל תנופף", "סיום מלא בפסגה", "בקרה בירידה"], defaultSets: 3, defaultReps: "10-12", equipment: "דמבלים / מוט", youtubeQuery: "bicep+curl+form+tutorial" },
      { name: "פשיטת מרפק (Tricep Extension)", muscles: "טריצפס", tips: ["מרפקים קרוב לראש", "נעל מרפקים", "הרחב עד סוף"], defaultSets: 3, defaultReps: "12", equipment: "דמבלים", youtubeQuery: "tricep+extension+form" },
      { name: "מקבילים (Dips)", muscles: "טריצפס, חזה תחתון", tips: ["קצת קדימה לחזה", "ישר לטריצפס", "אל תנמיך מדי"], defaultSets: 3, defaultReps: "10-12", equipment: "מקבילים", youtubeQuery: "tricep+dips+form+tutorial" },
      { name: "Hammer Curl", muscles: "ברכיאליס, ביצפס", tips: ["אחיזה ניטרלית — כפות ידיים פנים מול פנים", "ללא נופף", "זוהי תנועה מלאה"], defaultSets: 3, defaultReps: "10-12", equipment: "דמבלים", youtubeQuery: "hammer+curl+form" },
    ],
  },
  {
    key: "legs", label: "רגליים", emoji: "🦵", color: "#eab308",
    exercises: [
      { name: "סקוואט (Squat)", muscles: "קוואדריצפס, ישבן, גב תחתון", tips: ["ברכיים מעל אצבעות", "ירד עד מקביל לפחות", "גב ישר — חובה"], defaultSets: 4, defaultReps: "8-10", equipment: "מוט", youtubeQuery: "squat+form+tutorial+beginners" },
      { name: "לאנג' (Lunges)", muscles: "קוואדריצפס, ישבן, המסטרינג", tips: ["ברך קדמית לא תחצה את האצבע", "פסיעה ארוכה", "גב ישר"], defaultSets: 3, defaultReps: "10 כל צד", equipment: "דמבלים / ללא", youtubeQuery: "lunges+form+tutorial" },
      { name: "לג פרס (Leg Press)", muscles: "קוואדריצפס, ישבן, המסטרינג", tips: ["רגליים בגובה אמצע הלוח", "אל תחסום ברך", "גב מלא ללוח"], defaultSets: 4, defaultReps: "10-12", equipment: "מכונה", youtubeQuery: "leg+press+form+tutorial" },
      { name: "כפיפות ברכיים (Hamstring Curl)", muscles: "המסטרינג", tips: ["כפות רגליים מורמות", "תנועה מלאה", "הורד לאיטיות"], defaultSets: 3, defaultReps: "12", equipment: "מכונה", youtubeQuery: "hamstring+curl+form" },
      { name: "הרמות עקב (Calf Raise)", muscles: "שוקיים (Gastrocnemius, Soleus)", tips: ["מלוא הטווח — עלה עד הקצה", "החזק שנייה בפסגה", "הורד לאיטיות"], defaultSets: 4, defaultReps: "15-20", equipment: "ללא / מכונה", youtubeQuery: "calf+raise+form" },
    ],
  },
  {
    key: "core", label: "ליבה", emoji: "🎯", color: "#06b6d4",
    exercises: [
      { name: "פלנק (Plank)", muscles: "ליבה, כתפיים, ישבן", tips: ["גוף קרש ישר", "אל תרים ישבן", "נשום בשלווה"], defaultSets: 3, defaultReps: "45-60 שניות", equipment: "ללא", youtubeQuery: "plank+form+tutorial" },
      { name: "סיט אפ (Sit-up)", muscles: "בטן עליונה, Hip Flexors", tips: ["אל תמשוך צוואר", "הורד לאיטיות", "מרפקים בצד"], defaultSets: 3, defaultReps: "20", equipment: "ללא", youtubeQuery: "proper+situp+form" },
      { name: "רוסיאן טוויסט", muscles: "אלכסוני, בטן", tips: ["רגליים מורמות = קשה יותר", "סובב עד המקצה", "בקרה בתנועה"], defaultSets: 3, defaultReps: "20 כל צד", equipment: "ללא / משקולת", youtubeQuery: "russian+twist+form" },
      { name: "ברכיים לחזה (Knee Tucks)", muscles: "בטן תחתונה", tips: ["גוף ישר בנקודת פתיחה", "קרב ברכיים לחזה", "הורד שלוט"], defaultSets: 3, defaultReps: "15", equipment: "ללא", youtubeQuery: "knee+tucks+abs+form" },
      { name: "Dead Bug", muscles: "ליבה עמוק, גב תחתון", tips: ["גב תחתון צמוד לרצפה", "תנועה מנוגדת — יד ורגל", "נשום החוצה"], defaultSets: 3, defaultReps: "10 כל צד", equipment: "ללא", youtubeQuery: "dead+bug+exercise+form" },
    ],
  },
];

const CALISTHENICS_MUSCLE_GROUPS: MuscleGroup[] = [
  {
    key: "chest", label: "חזה", emoji: "💪", color: "#3b82f6",
    exercises: [
      { name: "שכיבות סמיכה", muscles: "חזה, טריצפס, ליבה", tips: ["גוף קרש ישר", "מרפקים 45° מהגוף", "ירידה עד הרצפה"], defaultSets: 4, defaultReps: "12-15", equipment: "ללא", youtubeQuery: "push+up+perfect+form" },
      { name: "שכיבות יהלום", muscles: "טריצפס, חזה פנימי", tips: ["ידיים בצורת יהלום מתחת לחזה", "מרפקים צמודים לגוף", "גוף ישר"], defaultSets: 3, defaultReps: "8-12", equipment: "ללא", youtubeQuery: "diamond+push+up+form" },
      { name: "שכיבות רחבות", muscles: "חזה חיצוני, כתפיים", tips: ["ידיים רחבות מהכתפיים", "ירידה עמוקה", "בקרה בעלייה"], defaultSets: 3, defaultReps: "12-15", equipment: "ללא", youtubeQuery: "wide+push+up+form" },
      { name: "שכיבות ארצ'ר", muscles: "חזה, טריצפס, כתפיים", tips: ["הרחב יד אחת לצד", "שמור על יד ישרה", "מתקדמות לשכיבת יד אחת"], defaultSets: 3, defaultReps: "6-8 כל צד", equipment: "ללא", youtubeQuery: "archer+push+up+form" },
      { name: "שכיבות פייק", muscles: "כתפיים, טריצפס, חזה עליון", tips: ["ישבן גבוה בצורת V", "ירידה לכיוון הראש", "הכנה להנדסטנד"], defaultSets: 3, defaultReps: "10-12", equipment: "ללא", youtubeQuery: "pike+push+up+form" },
    ],
  },
  {
    key: "back", label: "גב", emoji: "🦾", color: "#8b5cf6",
    exercises: [
      { name: "מתח (Pull-up)", muscles: "גב רחב, ביצפס, ליבה", tips: ["תלייה מלאה בתחתית", "הוצא חזה אל הבר", "אל תתנועע"], defaultSets: 4, defaultReps: "5-10", equipment: "מוט מתח", youtubeQuery: "pull+up+perfect+form" },
      { name: "מתח אחיזה הפוכה (Chin-up)", muscles: "ביצפס, גב רחב", tips: ["כפות ידיים כלפיך", "משוך מרפקים לצלעות", "תלייה מלאה"], defaultSets: 3, defaultReps: "5-8", equipment: "מוט מתח", youtubeQuery: "chin+up+form+tutorial" },
      { name: "מתח אוסטרלי (Row)", muscles: "גב אמצע, ביצפס, כתף אחורית", tips: ["גוף קרש ישר", "משוך חזה לבר", "שמור על תנוחת גוף"], defaultSets: 3, defaultReps: "10-15", equipment: "מוט נמוך / שולחן", youtubeQuery: "australian+pull+up+form" },
      { name: "L-Sit Pull-up", muscles: "גב, ליבה, ביצפס", tips: ["שמור רגליים ישרות קדמה", "מתקדם — בנה קודם L-sit", "כוח ליבה קריטי"], defaultSets: 3, defaultReps: "3-6", equipment: "מוט מתח", youtubeQuery: "l+sit+pull+up+form" },
    ],
  },
  {
    key: "shoulders", label: "כתפיים", emoji: "🏋️", color: "#f97316",
    exercises: [
      { name: "שכיבות פייק", muscles: "דלטואיד קדמי ואמצע, טריצפס", tips: ["ישבן גבוה — V הפוך", "ירידה לכיוון הראש", "בסיס להנדסטנד"], defaultSets: 3, defaultReps: "10-12", equipment: "ללא", youtubeQuery: "pike+push+up+form" },
      { name: "הנדסטנד Push-up (בקיר)", muscles: "כתפיים, טריצפס, ליבה", tips: ["גב לקיר", "ירידה מבוקרת", "פתח מרפקים כלפי חוץ"], defaultSets: 3, defaultReps: "5-8", equipment: "קיר", youtubeQuery: "handstand+push+up+wall+form" },
      { name: "כפפות כתפיים (Shoulder Taps)", muscles: "כתפיים, ליבה, יציבות", tips: ["גוף ישר בפלנק", "הרם יד לכתף שנייה", "הימנע מנדנוד"], defaultSets: 3, defaultReps: "10 כל צד", equipment: "ללא", youtubeQuery: "shoulder+tap+push+up+form" },
      { name: "שכיבות ארצ'ר", muscles: "כתפיים, חזה, יציבות", tips: ["רחב יד אחת לצד", "שמור יד ישרה", "בקרה בתנועה"], defaultSets: 3, defaultReps: "6-8 כל צד", equipment: "ללא", youtubeQuery: "archer+push+up+form" },
    ],
  },
  {
    key: "arms", label: "ידיים", emoji: "💪", color: "#ec4899",
    exercises: [
      { name: "מקבילים (Dips)", muscles: "טריצפס, חזה תחתון", tips: ["כסא / מקבילים", "הורד עד מרפק 90°", "עלה בלחיצת טריצפס"], defaultSets: 3, defaultReps: "10-15", equipment: "כסא / מקבילים", youtubeQuery: "tricep+dips+bench+form" },
      { name: "שכיבות יהלום", muscles: "טריצפס, חזה פנימי", tips: ["ידיים בצורת יהלום", "מרפקים צמודים", "גוף ישר"], defaultSets: 3, defaultReps: "8-12", equipment: "ללא", youtubeQuery: "diamond+push+up+form" },
      { name: "מתח אחיזה הפוכה", muscles: "ביצפס, גב", tips: ["כפות ידיים כלפיך", "תנועה מבוקרת", "תלייה מלאה"], defaultSets: 3, defaultReps: "6-10", equipment: "מוט מתח", youtubeQuery: "chin+up+form+tutorial" },
      { name: "Tricep Push-up", muscles: "טריצפס בעיקר", tips: ["מרפקים צמודים לגוף", "לא פתוחים לצד", "ירידה עמוקה"], defaultSets: 3, defaultReps: "10-12", equipment: "ללא", youtubeQuery: "tricep+pushup+close+grip+form" },
    ],
  },
  {
    key: "legs", label: "רגליים", emoji: "🦵", color: "#eab308",
    exercises: [
      { name: "סקוואט משקל גוף", muscles: "קוואדריצפס, ישבן, המסטרינג", tips: ["ברכיים מעל אצבעות", "ירד עד מקביל", "גב ישר — חובה"], defaultSets: 4, defaultReps: "15-20", equipment: "ללא", youtubeQuery: "bodyweight+squat+form" },
      { name: "לאנג' (Lunges)", muscles: "קוואדריצפס, ישבן, המסטרינג", tips: ["פסיעה ארוכה", "ברך קדמית לא תחצה", "גב ישר"], defaultSets: 3, defaultReps: "12 כל צד", equipment: "ללא", youtubeQuery: "lunges+form+tutorial" },
      { name: "סקוואט קפיצה (Jump Squat)", muscles: "כל הרגל, סיבולת", tips: ["נחת בעדינות", "ירד ל-90° לפני הקפיצה", "ברכיים לא פנימה"], defaultSets: 3, defaultReps: "10-12", equipment: "ללא", youtubeQuery: "jump+squat+form" },
      { name: "ישיבת קיר (Wall Sit)", muscles: "קוואדריצפס, יציבות", tips: ["גב שטוח לקיר", "ברכיים 90°", "החזק כמה שיותר"], defaultSets: 3, defaultReps: "30-60 שניות", equipment: "קיר", youtubeQuery: "wall+sit+exercise+form" },
      { name: "Bulgarian Split Squat", muscles: "קוואדריצפס, ישבן, יציבות", tips: ["רגל אחורית על כסא", "ירד ישר למטה", "גוף זקוף"], defaultSets: 3, defaultReps: "10 כל צד", equipment: "כסא", youtubeQuery: "bulgarian+split+squat+form" },
    ],
  },
  {
    key: "core", label: "ליבה", emoji: "🎯", color: "#06b6d4",
    exercises: [
      { name: "פלנק (Plank)", muscles: "ליבה, כתפיים, ישבן", tips: ["גוף קרש ישר", "אל תרים ישבן", "נשום בשלווה"], defaultSets: 3, defaultReps: "45-60 שניות", equipment: "ללא", youtubeQuery: "plank+form+tutorial" },
      { name: "Hollow Body Hold", muscles: "ליבה עמוק, בטן", tips: ["גב תחתון מרוסק לרצפה", "ידיים ורגליים מורמות", "בסיס לכל תרגיל גימנסטיקה"], defaultSets: 3, defaultReps: "20-30 שניות", equipment: "ללא", youtubeQuery: "hollow+body+hold+form" },
      { name: "L-Sit (בין כסאות)", muscles: "ליבה, טריצפס, כתפיים", tips: ["רגליים ישרות קדימה", "הרם גוף בלחיצת ידיים", "בנה הדרגתית"], defaultSets: 3, defaultReps: "5-15 שניות", equipment: "2 כסאות / מקבילים", youtubeQuery: "l+sit+between+chairs+form" },
      { name: "הרמות ברכיים תלויות", muscles: "בטן תחתונה, Hip Flexors", tips: ["תלה ממוט", "הרם ברכיים לחזה", "אל תנועע"], defaultSets: 3, defaultReps: "10-15", equipment: "מוט מתח", youtubeQuery: "hanging+knee+raise+form" },
      { name: "Dead Bug", muscles: "ליבה עמוק, גב תחתון", tips: ["גב תחתון צמוד לרצפה", "תנועה מנוגדת — יד ורגל", "נשום החוצה"], defaultSets: 3, defaultReps: "10 כל צד", equipment: "ללא", youtubeQuery: "dead+bug+exercise+form" },
    ],
  },
];

const WARMUP_GROUPS: MuscleGroup[] = [
  {
    key: "dynamic", label: "חימום דינמי", emoji: "🔥", color: "#f97316",
    exercises: [
      { name: "ג'אמפינג ג'קס", muscles: "כל הגוף, קרדיו", tips: ["קצב עקבי", "נחת בעדינות", "ידיים עד מעל הראש"], defaultSets: 3, defaultReps: "30 שניות", equipment: "ללא", youtubeQuery: "jumping+jacks+warm+up" },
      { name: "High Knees", muscles: "ירכיים, קרדיו, ליבה", tips: ["ברכיים עד גובה הירך", "קצב מהיר", "ידיים נוגעות בברכיים"], defaultSets: 3, defaultReps: "30 שניות", equipment: "ללא", youtubeQuery: "high+knees+warm+up" },
      { name: "מעגלי כתפיים", muscles: "כתפיים, גב עליון", tips: ["מעגלים קטנים לגדולים", "קדימה ואחורה", "קצב איטי"], defaultSets: 2, defaultReps: "10 כל כיוון", equipment: "ללא", youtubeQuery: "shoulder+circles+warm+up" },
      { name: "Inchworm", muscles: "גב, ליבה, כתפיים", tips: ["הרחב ידיים קדימה", "גב ישר", "תנועה מבוקרת"], defaultSets: 2, defaultReps: "8", equipment: "ללא", youtubeQuery: "inchworm+exercise+warm+up" },
      { name: "לאנג' + סיבוב (Lunge Twist)", muscles: "ירכיים, ליבה, קואורדינציה", tips: ["פסיעה קדימה", "סיבוב לכיוון הרגל הקדמית", "גב ישר"], defaultSets: 2, defaultReps: "8 כל צד", equipment: "ללא", youtubeQuery: "lunge+twist+warm+up" },
    ],
  },
  {
    key: "static", label: "מתיחות סטטיות", emoji: "🧘", color: "#8b5cf6",
    exercises: [
      { name: "מתיחת חזה (קיר)", muscles: "חזה, כתפיים קדמיות", tips: ["יד על קיר בגובה כתף", "סובב גוף הצידה", "החזק 30 שניות"], defaultSets: 2, defaultReps: "30 שניות כל צד", equipment: "קיר", youtubeQuery: "chest+stretch+wall" },
      { name: "מתיחת Hip Flexor", muscles: "ירכיים, גב תחתון", tips: ["ברך אחת על הרצפה", "הרחק הירך קדימה", "גב ישר"], defaultSets: 2, defaultReps: "30 שניות כל צד", equipment: "ללא", youtubeQuery: "hip+flexor+stretch" },
      { name: "מתיחת המסטרינג", muscles: "המסטרינג, גב תחתון", tips: ["שב ורגל ישרה", "כופף לכיוון האצבעות", "אל תעגל גב"], defaultSets: 2, defaultReps: "30 שניות כל צד", equipment: "ללא", youtubeQuery: "hamstring+stretch+seated" },
      { name: "מתיחת שוקיים (קיר)", muscles: "שוקיים", tips: ["יד על קיר", "רגל אחורית ישרה", "עקב בקרקע"], defaultSets: 2, defaultReps: "30 שניות כל צד", equipment: "קיר", youtubeQuery: "calf+stretch+wall" },
    ],
  },
  {
    key: "cooldown", label: "סיום ושחרור", emoji: "❄️", color: "#06b6d4",
    exercises: [
      { name: "Child's Pose", muscles: "גב תחתון, ירכיים, כתפיים", tips: ["ברכיים פתוחות", "ידיים מוארכות", "נשום עמוק"], defaultSets: 1, defaultReps: "60 שניות", equipment: "ללא", youtubeQuery: "child's+pose+yoga" },
      { name: "Savasana", muscles: "שחרור כולל, מנוחה", tips: ["שכב שטוח", "עצום עיניים", "נשום עמוק 10 פעמים"], defaultSets: 1, defaultReps: "2-3 דקות", equipment: "ללא", youtubeQuery: "savasana+yoga+relaxation" },
      { name: "Spinal Twist שכוב", muscles: "גב, ירכיים, ליבה", tips: ["שכב, ברך אחת לצד", "כתפיים נשארות על הרצפה", "הרגע"], defaultSets: 2, defaultReps: "30 שניות כל צד", equipment: "ללא", youtubeQuery: "supine+spinal+twist" },
      { name: "Figure 4 Stretch", muscles: "ישבן, ירכיים, אגן", tips: ["שכב, רגל אחת על השנייה", "משוך ברך לחזה", "מתיחה עמוקה"], defaultSets: 2, defaultReps: "30 שניות כל צד", equipment: "ללא", youtubeQuery: "figure+4+stretch+glutes" },
    ],
  },
];

// ─── Equipment helpers ────────────────────────────────────────────────────────
type EquipmentCategory = "free_weights" | "machine" | "cables" | "mat" | "bar" | "equipment";

function getEquipCat(equipment: string): EquipmentCategory {
  if (equipment.includes("מכונה")) return "machine";
  if (equipment.includes("כבלים")) return "cables";
  if (equipment.includes("מוט מתח")) return "bar";
  if (equipment.includes("מקבילים") || (equipment.includes("כסא") && !equipment.includes("כסא / מקבילים"))) return "equipment";
  if (equipment.includes("ללא")) return "mat";
  return "free_weights";
}

const EQUIP_META: Record<EquipmentCategory, { label: string; emoji: string; color: string }> = {
  free_weights: { label: "משקולות חופשיות", emoji: "🏋️", color: "#10b981" },
  machine:      { label: "מכונות",           emoji: "⚙️",  color: "#3b82f6" },
  cables:       { label: "כבלים",            emoji: "🔗",  color: "#8b5cf6" },
  mat:          { label: "מזרן / ללא ציוד",  emoji: "🧘",  color: "#06b6d4" },
  bar:          { label: "מוט מתח",          emoji: "⬆️",  color: "#f59e0b" },
  equipment:    { label: "ציוד עזר",         emoji: "🪑",  color: "#ec4899" },
};

// ─── Body icon ────────────────────────────────────────────────────────────────
const BODY_DOTS: Record<string, { cx: number; cy: number }> = {
  chest:     { cx: 14, cy: 15 },
  back:      { cx: 14, cy: 18 },
  shoulders: { cx: 9,  cy: 12 },
  arms:      { cx: 6,  cy: 18 },
  legs:      { cx: 14, cy: 36 },
  core:      { cx: 14, cy: 23 },
};

function MuscleBodyIcon({ muscleKey, size = 26 }: { muscleKey: string; size?: number }) {
  const dot = BODY_DOTS[muscleKey];
  const h = Math.round(size * 52 / 28);
  return (
    <svg width={size} height={h} viewBox="0 0 28 52" fill="none">
      <ellipse cx="14" cy="4" rx="3.5" ry="4" fill="rgba(255,255,255,0.18)" />
      <rect x="9" y="9" width="10" height="16" rx="2" fill="rgba(255,255,255,0.14)" />
      <rect x="4" y="9" width="4" height="13" rx="2" fill="rgba(255,255,255,0.14)" />
      <rect x="20" y="9" width="4" height="13" rx="2" fill="rgba(255,255,255,0.14)" />
      <rect x="9" y="26" width="4.5" height="18" rx="2" fill="rgba(255,255,255,0.14)" />
      <rect x="14.5" y="26" width="4.5" height="18" rx="2" fill="rgba(255,255,255,0.14)" />
      {dot && <circle cx={dot.cx} cy={dot.cy} r="3" fill="#ef4444" fillOpacity="0.88" />}
    </svg>
  );
}

// ─── Builder helpers ──────────────────────────────────────────────────────────
const TIME_KEYWORDS_LC = [
  "פלנק", "plank", "wall sit", "ישיבת קיר", "hollow body", "l-sit",
  "מתיחת", "מתיחה", "stretch", "savasana", "child", "spinal",
  "figure 4", "hold", "שחרור", "inchworm",
];
function detectTimeBased(name: string): boolean {
  const lc = name.toLowerCase();
  return TIME_KEYWORDS_LC.some((k) => lc.includes(k));
}
// Accent colors cycled per exercise group block (zebra striping)
const GROUP_ACCENT_COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f97316", "#ec4899", "#06b6d4"];

// ─── Weekly day strip ─────────────────────────────────────────────────────────
const DAYS = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];
const TODAY_IDX = new Date().getDay();
const TODAY_NAME = new Date().toLocaleDateString("he-IL", { weekday: "long" });

// TODAY_PLAN removed — Task 1: TodayPlanCard replaced by TemplatesSection

// ═══════════════════════════════════════════════════════════════════════
//  TAB 1 — DASHBOARD sub-components
// ═══════════════════════════════════════════════════════════════════════

function DayStatusBanner({ isTraining, onToggle }: { isTraining: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border backdrop-blur-xl transition-all duration-300 text-right ${
        isTraining ? "border-emerald-500/40 bg-emerald-500/10" : "border-white/10 bg-white/5"
      }`}
    >
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isTraining ? "bg-emerald-500/25" : "bg-white/10"}`}>
        {isTraining ? <Flame className="h-5 w-5 text-emerald-400" /> : <RotateCcw className="h-5 w-5 text-white/40" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-black text-white leading-tight">{isTraining ? "🔥 יום אימון" : "😴 יום מנוחה"}</p>
        <p className="text-[11px] text-white/40 mt-0.5">{isTraining ? "כל הכבוד — לכו על זה!" : "מנוחה = התאוששות = גדילה"}</p>
      </div>
      <div className={`relative w-12 h-6 rounded-full overflow-hidden shrink-0 transition-colors duration-300 ${isTraining ? "bg-emerald-500" : "bg-white/15"}`}>
        <div className={`absolute top-[2px] left-[2px] w-5 h-5 bg-white rounded-full shadow-lg transition-transform duration-300 ${isTraining ? "translate-x-[22px]" : "translate-x-0"}`} />
      </div>
    </button>
  );
}

function QuickWorkoutCard({ workout, onQuickLog }: { workout: (typeof QUICK_WORKOUTS)[number]; onQuickLog: (dbCategory: string, label: string, duration: number) => void }) {
  const [selDuration, setSelDuration] = useState<number>(workout.durations[1]);
  return (
    <div className="relative flex-shrink-0 w-36 h-48 rounded-2xl overflow-hidden cursor-pointer select-none" style={{ backgroundImage: `url('${workout.image}')`, backgroundSize: "cover", backgroundPosition: "center" }}>
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
      <span className="absolute top-2.5 right-2.5 text-2xl leading-none drop-shadow-lg">{workout.emoji}</span>
      <p className="absolute bottom-16 right-0 left-0 px-3 text-sm font-black text-white leading-tight text-right">{workout.label}</p>
      <div className="absolute bottom-8 left-0 right-0 flex gap-1 px-2.5 justify-end">
        {workout.durations.map((d) => (
          <button key={d} onClick={(e) => { e.stopPropagation(); setSelDuration(d); }}
            className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold transition-all ${selDuration === d ? "text-white border" : "text-white/50"}`}
            style={selDuration === d ? { borderColor: workout.color, color: workout.color, background: workout.color + "28" } : {}}>
            {d}′
          </button>
        ))}
      </div>
      <button onClick={() => onQuickLog(workout.dbCategory, workout.label, selDuration)}
        className="absolute bottom-2 left-2 right-2 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-[11px] font-black text-white transition-all active:scale-95"
        style={{ background: workout.color + "cc", backdropFilter: "blur(8px)" }}>
        <Plus className="h-3 w-3" />הוסף
      </button>
    </div>
  );
}

function QuickAddRow() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const addWorkout = useAddWorkout();
  const handleQuickLog = async (dbCategory: string, label: string, duration: number) => {
    try {
      await addWorkout.mutateAsync({ category: dbCategory, duration_minutes: duration, notes: label });
      toast.success(`✅ ${label} — ${duration} דקות נרשם!`, { duration: 2500 });
    } catch { toast.error("שגיאה בשמירת האימון"); }
  };
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-0.5">
        <p className="text-sm font-black text-white">הוסף מהיר</p>
        <button className="flex items-center gap-1 text-[11px] text-white/40 hover:text-white/70 transition-colors">
          <span>כל האימונים</span><ChevronRight className="h-3 w-3" />
        </button>
      </div>
      <div ref={scrollRef} className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-0.5 px-0.5" style={{ scrollSnapType: "x mandatory" }}>
        {QUICK_WORKOUTS.map((w) => (
          <div key={w.key} style={{ scrollSnapAlign: "start" }}>
            <QuickWorkoutCard workout={w} onQuickLog={handleQuickLog} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── StreakBanner ─────────────────────────────────────────────────────────────
function StreakBanner() {
  const { data: streak = 0 } = useWorkoutStreak();
  if (!streak) return null;

  const milestones = [3, 7, 14, 30, 60, 90];
  const next = milestones.find((m) => m > streak) ?? 100;
  const pct  = Math.min(100, (streak / next) * 100);

  return (
    <div className="rounded-2xl border border-amber-500/25 bg-amber-500/8 backdrop-blur-xl px-4 py-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl leading-none">🔥</span>
          <div>
            <p className="text-sm font-black text-white">
              {streak} {streak === 1 ? "יום" : "ימים"} ברצף!
            </p>
            <p className="text-[11px] text-white/40">
              {next - streak} ימים לאבן הדרך הבאה ({next})
            </p>
          </div>
        </div>
        <span className="text-2xl font-black text-amber-400 tabular-nums">{streak}</span>
      </div>
      <div className="h-1 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-amber-400 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── QuickTemplatesRow ────────────────────────────────────────────────────────
const CATEGORY_META: Record<string, { emoji: string; color: string }> = {
  weights:      { emoji: "🏋️", color: "#10b981" },
  calisthenics: { emoji: "🤸", color: "#8b5cf6" },
  running:      { emoji: "🏃", color: "#f97316" },
  mixed:        { emoji: "⚡", color: "#eab308" },
};

function QuickTemplatesRow({ onLoadTemplate }: { onLoadTemplate: (t: any) => void }) {
  const { data: templates, isLoading } = useWorkoutTemplates();

  if (isLoading) return null;
  if (!templates?.length) {
    return (
      <div className="rounded-2xl border border-dashed border-white/12 bg-white/3 p-6 text-center space-y-2">
        <span className="text-4xl">💪</span>
        <p className="text-sm font-black text-white">בוא נתחיל!</p>
        <p className="text-[11px] text-white/35 leading-relaxed">
          הוסף אימון ראשון או בנה תבנית משלך — הכל מתחיל כאן
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between px-0.5">
        <p className="text-sm font-black text-white">תבניות</p>
        <span className="text-[10px] text-white/30">{templates.length} תבניות</span>
      </div>
      <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
        {templates.map((t: any) => {
          const meta = CATEGORY_META[t.category] ?? { emoji: "💪", color: "#10b981" };
          const exCount = Array.isArray(t.exercises) ? t.exercises.length : 0;
          return (
            <button
              key={t.id}
              onClick={() => onLoadTemplate(t)}
              className="flex-shrink-0 flex flex-col gap-2 w-36 p-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl text-right active:scale-95 transition-all hover:border-white/20"
            >
              <div className="flex items-center justify-between">
                <div
                  className="h-8 w-8 rounded-xl flex items-center justify-center text-base"
                  style={{ background: meta.color + "22" }}
                >
                  <span>{meta.emoji}</span>
                </div>
                {t.is_system && (
                  <Star className="h-3 w-3 text-amber-400/70" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-black text-white leading-tight line-clamp-2">{t.name}</p>
                <p className="text-[9px] text-white/35 mt-0.5">{exCount} תרגילים · {t.estimated_duration_minutes ?? "—"} דק׳</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StatsStrip() {
  const { data: prs } = usePersonalRecords();
  const { data: weekWorkouts } = useWeekWorkouts();
  const prCount = (prs ?? []).length;
  const workoutCount = (weekWorkouts ?? []).length;
  const totalMins = (weekWorkouts ?? []).reduce((s: number, w: any) => s + (w.duration_minutes || 0), 0);

  const stats = [
    { label: "אימונים", value: String(workoutCount), sub: "השבוע", icon: Target,   color: "#10b981" },
    { label: "דקות",    value: String(totalMins),     sub: "השבוע", icon: Clock,    color: "#3b82f6" },
    { label: "שיאים",   value: String(prCount),       sub: "סה״כ",  icon: Trophy,   color: "#f59e0b" },
    { label: "קלוריות", value: "0",                   sub: "אתמול", icon: Flame,    color: "#ef4444" },
  ];
  return (
    <div className="grid grid-cols-4 gap-2">
      {stats.map(({ label, value, sub, icon: Icon, color }) => (
        <div key={label} className="rounded-2xl border border-white/8 bg-white/5 backdrop-blur-xl p-3 text-center space-y-1.5">
          <div className="h-7 w-7 rounded-xl mx-auto flex items-center justify-center" style={{ background: color + "22" }}>
            <Icon className="h-3.5 w-3.5" style={{ color }} />
          </div>
          <p className="text-lg font-black text-white leading-none">{value}</p>
          <p className="text-[9px] text-white/35 font-medium">{label}</p>
          <p className="text-[8px] text-white/20">{sub}</p>
        </div>
      ))}
    </div>
  );
}

function WeekStrip() {
  const { data: weekWorkouts } = useWeekWorkouts();
  const completedDays: number[] = [];
  (weekWorkouts ?? []).forEach((w: any) => {
    const d = new Date(w.date).getDay();
    if (!completedDays.includes(d)) completedDays.push(d);
  });
  const done = completedDays.length;
  const goal = 3;
  const pct  = Math.min(100, (done / goal) * 100);
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><Zap className="h-4 w-4 text-emerald-400" /><p className="text-sm font-black text-white">שבוע אימונים</p></div>
        <span className="text-[11px] font-semibold text-white/40">{done}/{goal} אימונים</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full bg-emerald-500 transition-all duration-700 shadow-[0_0_8px_rgba(16,185,129,0.5)]" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between">
        {DAYS.map((day, i) => {
          const isToday   = i === TODAY_IDX;
          const completed = completedDays.includes(i);
          return (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[9px] font-black transition-all ${
                completed ? "bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                : isToday  ? "border-2 border-emerald-500/60 text-emerald-400 bg-emerald-500/10"
                : "border border-white/10 text-white/20"}`}>
                {completed ? "✓" : day}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  TAB 2 — BUILDER
// ═══════════════════════════════════════════════════════════════════════

function Stepper({ value, onChange, min = 0, max = 999, step = 1, suffix = "" }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; suffix?: string;
}) {
  const fmt = (n: number) => n % 1 === 0 ? String(n) : n.toFixed(1);
  const dec = (n: number) => parseFloat((Math.max(min, n - step)).toFixed(2));
  const inc = (n: number) => parseFloat((Math.min(max, n + step)).toFixed(2));
  return (
    <div className="flex items-center gap-1.5">
      <button onClick={() => onChange(dec(value))}
        className="h-8 w-8 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center text-white/70 hover:bg-white/15 active:scale-95 transition-all">
        <Minus className="h-3.5 w-3.5" />
      </button>
      <div className="w-14 text-center">
        <span className="text-sm font-black text-white">{fmt(value)}</span>
        {suffix && <span className="text-[10px] text-white/40 ml-0.5">{suffix}</span>}
      </div>
      <button onClick={() => onChange(inc(value))}
        className="h-8 w-8 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center text-white/70 hover:bg-white/15 active:scale-95 transition-all">
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

interface BuilderEx {
  name: string;
  sets: number;
  reps: number;
  weight_kg: number;
  isTimeBased?: boolean;  // undefined = auto-detect from name
  isWarmup?: boolean;
  group?: number;         // group ID for zebra striping
}

function BuilderExerciseRow({
  ex, onChange, onRemove, onDuplicate, idx, accentColor,
}: {
  ex: BuilderEx;
  onChange: (v: BuilderEx) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  idx: number;
  accentColor?: string;
}) {
  // ── Accordion & menu state ───────────────────────────────────────
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [actOpen,     setActOpen]     = useState(false);

  // ── Swipe-to-reveal ──────────────────────────────────────────────
  const [swipeX,  setSwipeX]  = useState(0);
  const touchStartX = useRef(0);
  const swiping     = useRef(false);
  const ACTION_W    = 104;

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    swiping.current = false;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const delta = touchStartX.current - e.touches[0].clientX;
    if (Math.abs(delta) > 6) swiping.current = true;
    if (delta > 0) setSwipeX(Math.min(delta, ACTION_W));
    else if (delta < -10) setSwipeX(0);
  };
  const onTouchEnd = () => setSwipeX((p) => (p > ACTION_W / 3 ? ACTION_W : 0));

  // ── Time-mode detection ──────────────────────────────────────────
  // isTimeBased=undefined → auto; true/false → explicit override
  const isTimeMode = ex.isTimeBased !== undefined ? ex.isTimeBased : detectTimeBased(ex.name);
  const toggleTimeMode = () => onChange({ ...ex, isTimeBased: !isTimeMode });
  const toggleWarmup   = () => onChange({ ...ex, isWarmup: !ex.isWarmup });

  // ── Local raw-string state ───────────────────────────────────────
  const [rawSets,   setRawSets]   = useState(String(ex.sets));
  const [rawReps,   setRawReps]   = useState(String(ex.reps));
  const [rawWeight, setRawWeight] = useState(ex.weight_kg > 0 ? String(ex.weight_kg) : "");

  useEffect(() => setRawSets(String(ex.sets)),   [ex.sets]);
  useEffect(() => setRawReps(String(ex.reps)),   [ex.reps]);
  useEffect(() => {
    setRawWeight(ex.weight_kg > 0 ? String(ex.weight_kg) : "");
  }, [ex.weight_kg]);

  // ── Tab-to-next ──────────────────────────────────────────────────
  const focusNext = (field: "sets" | "reps" | "weight") => (e: React.KeyboardEvent) => {
    if (e.key !== "Tab" || e.shiftKey) return;
    if (field === "sets") {
      e.preventDefault();
      (document.querySelector(`[data-brow="${idx}"][data-bfield="reps"]`) as HTMLInputElement)?.focus();
    } else if (field === "reps") {
      e.preventDefault();
      (document.querySelector(`[data-brow="${idx}"][data-bfield="weight"]`) as HTMLInputElement)?.focus();
    } else {
      e.preventDefault();
      (document.querySelector(`[data-brow="${idx + 1}"][data-bfield="sets"]`) as HTMLInputElement)?.focus();
    }
  };

  const autoSel   = (e: React.FocusEvent<HTMLInputElement>) => e.target.select();
  const incSets   = (d: number) => onChange({ ...ex, sets:      Math.max(1, ex.sets + d) });
  const incReps   = (d: number) => onChange({ ...ex, reps:      Math.max(1, ex.reps + d) });
  const incWeight = (d: number) => onChange({ ...ex, weight_kg: parseFloat(Math.max(0, ex.weight_kg + d).toFixed(2)) });

  const inputCls = "w-full h-9 rounded-xl bg-white/10 border border-white/12 text-center text-sm font-black text-white outline-none focus:border-emerald-500/60 focus:bg-emerald-500/8 transition-all";
  const microBtn = "h-6 rounded-lg text-[9px] font-bold active:scale-95 transition-all flex items-center justify-center";

  return (
    <div
      className="relative overflow-hidden rounded-2xl select-none"
      style={accentColor ? { borderLeft: `3px solid ${accentColor}60` } : undefined}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Swipe backdrop ── */}
      <div className="absolute inset-y-0 right-0 flex items-stretch gap-1 p-1.5" style={{ width: ACTION_W }}>
        <button
          onClick={() => { onDuplicate(); setSwipeX(0); toast.success("📋 תרגיל שוכפל"); }}
          className="flex-1 rounded-xl bg-blue-500/25 text-blue-400 flex flex-col items-center justify-center gap-0.5 text-[9px] font-bold"
        >
          <CheckCircle2 className="h-4 w-4" />שכפל
        </button>
        <button
          onClick={() => { onRemove(); setSwipeX(0); }}
          className="flex-1 rounded-xl bg-red-500/20 text-red-400 flex flex-col items-center justify-center gap-0.5 text-[9px] font-bold"
        >
          <Trash2 className="h-4 w-4" />מחק
        </button>
      </div>

      {/* Main card ── */}
      <div
        className="rounded-2xl border border-white/10 bg-white/5 p-3 space-y-2.5"
        style={{ transform: `translateX(-${swipeX}px)`, transition: swiping.current ? "none" : "transform 0.18s ease" }}
      >
        {/* ── Name row (always visible) ──── */}
        <div className="flex items-center gap-2">
          {/* Collapse toggle — click index badge */}
          <button
            onClick={() => setIsCollapsed((v) => !v)}
            className="h-6 w-6 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0 hover:bg-emerald-500/30 transition-all"
          >
            {isCollapsed
              ? <ChevronDown className="h-3.5 w-3.5 text-emerald-400" />
              : <span className="text-[10px] font-black text-emerald-400">{idx + 1}</span>}
          </button>

          <input
            value={ex.name}
            onChange={(e) => onChange({ ...ex, name: e.target.value })}
            placeholder="שם תרגיל..."
            className="flex-1 bg-transparent text-sm font-semibold text-white placeholder:text-white/25 outline-none border-b border-white/10 pb-0.5"
            dir="rtl"
          />

          {/* Status badges */}
          {ex.isWarmup && (
            <span className="shrink-0 text-[8px] font-black text-amber-400 px-1.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/20">
              חימום
            </span>
          )}
          {isTimeMode && (
            <span className="shrink-0 text-[8px] font-black text-cyan-400 px-1 py-0.5 rounded-full bg-cyan-500/12 border border-cyan-500/20">
              ⏱
            </span>
          )}

          {/* ⋮ overflow menu */}
          <button
            onClick={() => setActOpen((v) => !v)}
            className={`h-6 w-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 transition-all ${
              actOpen ? "bg-white/15 text-white" : "bg-white/5 text-white/30 hover:bg-white/15 hover:text-white/70"
            }`}
          >
            ⋮
          </button>
        </div>

        {/* ── ⋮ Action row (warmup | time | duplicate | delete) ─── */}
        {actOpen && (
          <div className="flex gap-1.5">
            <button
              onClick={toggleWarmup}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl text-[10px] font-bold transition-all border ${
                ex.isWarmup
                  ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                  : "bg-white/5 text-white/40 border-white/10 hover:bg-white/10"
              }`}
            >
              🔥 חימום
            </button>
            <button
              onClick={toggleTimeMode}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl text-[10px] font-bold transition-all border ${
                isTimeMode
                  ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
                  : "bg-white/5 text-white/40 border-white/10 hover:bg-white/10"
              }`}
            >
              ⏱ זמן
            </button>
            <button
              onClick={() => { onDuplicate(); setActOpen(false); toast.success("📋 תרגיל שוכפל"); }}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl bg-blue-500/15 text-blue-400 text-[10px] font-bold border border-blue-500/20 hover:bg-blue-500/25"
            >
              <CheckCircle2 className="h-3 w-3" />שכפל
            </button>
            <button
              onClick={onRemove}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl bg-red-500/12 text-red-400 text-[10px] font-bold border border-red-500/20 hover:bg-red-500/20"
            >
              <Trash2 className="h-3 w-3" />מחק
            </button>
          </div>
        )}

        {/* ── Stats grid (hidden when collapsed) ────────────────── */}
        {!isCollapsed && (
          <div className="grid grid-cols-3 gap-2">
            {/* Sets */}
            <div className="space-y-1.5">
              <p className="text-[9px] text-white/40 font-medium text-center">סטים</p>
              <input
                data-brow={idx} data-bfield="sets"
                type="text" inputMode="numeric" pattern="[0-9]*"
                value={rawSets}
                onChange={(e) => { setRawSets(e.target.value); const v = parseInt(e.target.value); if (!isNaN(v) && v >= 1) onChange({ ...ex, sets: v }); }}
                onBlur={() => { const v = parseInt(rawSets); if (isNaN(v) || v < 1) setRawSets(String(ex.sets)); }}
                onFocus={autoSel}
                onKeyDown={focusNext("sets")}
                className={inputCls}
              />
              <div className="flex gap-1 justify-center">
                <button onClick={() => incSets(-1)} className={`${microBtn} px-2 bg-white/8 text-white/50 hover:bg-white/15`}>−1</button>
                <button onClick={() => incSets(+1)} className={`${microBtn} px-2 bg-white/8 text-white/50 hover:bg-white/15`}>+1</button>
              </div>
            </div>

            {/* Reps / Time ── dynamic label + micro-buttons */}
            <div className="space-y-1.5">
              <p className={`text-[9px] font-medium text-center ${isTimeMode ? "text-cyan-400/80" : "text-white/40"}`}>
                {isTimeMode ? "שניות" : "חזרות"}
              </p>
              <input
                data-brow={idx} data-bfield="reps"
                type="text" inputMode="numeric" pattern="[0-9]*"
                value={rawReps}
                onChange={(e) => { setRawReps(e.target.value); const v = parseInt(e.target.value); if (!isNaN(v) && v >= 1) onChange({ ...ex, reps: v }); }}
                onBlur={() => { const v = parseInt(rawReps); if (isNaN(v) || v < 1) setRawReps(String(ex.reps)); }}
                onFocus={autoSel}
                onKeyDown={focusNext("reps")}
                className={`${inputCls} ${isTimeMode ? "border-cyan-500/30 focus:border-cyan-500/60 focus:bg-cyan-500/8" : ""}`}
              />
              {isTimeMode ? (
                <div className="flex gap-1 justify-center">
                  <button onClick={() => incReps(-15)} className={`${microBtn} px-1.5 bg-white/8 text-white/50 hover:bg-white/15`}>-15</button>
                  <button onClick={() => incReps(+15)} className={`${microBtn} px-1.5 bg-cyan-500/15 text-cyan-400 hover:bg-cyan-500/25`}>+15</button>
                </div>
              ) : (
                <div className="flex gap-1 justify-center">
                  <button onClick={() => incReps(-1)} className={`${microBtn} px-2 bg-white/8 text-white/50 hover:bg-white/15`}>−1</button>
                  <button onClick={() => incReps(+1)} className={`${microBtn} px-2 bg-white/8 text-white/50 hover:bg-white/15`}>+1</button>
                </div>
              )}
            </div>

            {/* Weight */}
            <div className="space-y-1.5">
              <p className="text-[9px] text-white/40 font-medium text-center">משקל</p>
              <div className="relative">
                <input
                  data-brow={idx} data-bfield="weight"
                  type="text" inputMode="decimal" pattern="[0-9.]*"
                  value={rawWeight} placeholder="0"
                  onChange={(e) => { setRawWeight(e.target.value); const v = parseFloat(e.target.value); if (!isNaN(v) && v >= 0) onChange({ ...ex, weight_kg: parseFloat(v.toFixed(2)) }); }}
                  onBlur={() => { const v = parseFloat(rawWeight); if (isNaN(v) || v < 0) setRawWeight(ex.weight_kg > 0 ? String(ex.weight_kg) : ""); }}
                  onFocus={autoSel}
                  onKeyDown={focusNext("weight")}
                  className={`${inputCls} placeholder:text-white/20`}
                />
                <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[8px] text-white/25 pointer-events-none">kg</span>
              </div>
              <div className="flex gap-0.5 justify-center">
                <button onClick={() => incWeight(-2.5)} className={`${microBtn} px-1.5 bg-white/8 text-white/50 hover:bg-white/15`}>-2.5</button>
                <button onClick={() => incWeight(+2.5)} className={`${microBtn} px-1.5 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25`}>+2.5</button>
                <button onClick={() => incWeight(+5)}   className={`${microBtn} px-1.5 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25`}>+5</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const BUILDER_GOALS = ["בניית שריר", "ירידה במשקל", "כוח מקסימלי", "סיבולת"];
const EQUIPMENT_OPTS = ["חדר כושר", "ביתי", "ללא ציוד"];
const DAYS_OPTS = [3, 4, 5, 6];

type WorkoutDbCategory = "weights" | "calisthenics" | "running" | "mixed";
const WORKOUT_CATEGORIES: { value: WorkoutDbCategory; label: string }[] = [
  { value: "weights",      label: "🏋️ כוח"      },
  { value: "calisthenics", label: "🤸 קלסטניקס"  },
  { value: "running",      label: "🏃 ריצה"      },
  { value: "mixed",        label: "⚡ HIIT"       },
];

function WorkoutBuilderTab({
  externalTemplate,
  onExternalTemplateConsumed,
  pendingExercises,
  onPendingExercisesConsumed,
}: {
  externalTemplate?: any;
  onExternalTemplateConsumed?: () => void;
  pendingExercises?: LibraryExercise[];
  onPendingExercisesConsumed?: () => void;
}) {
  const [subTab, setSubTab] = useState<"ai" | "custom">("custom");
  const [workoutName, setWorkoutName]         = useState("");
  const [workoutCategory, setWorkoutCategory] = useState<WorkoutDbCategory>("weights");
  const [exercises, setExercises]             = useState<BuilderEx[]>([{ name: "", sets: 3, reps: 10, weight_kg: 0, group: 0 }]);
  const [groupCounter, setGroupCounter]       = useState(0);
  const addTemplate   = useAddWorkoutTemplate();
  const addWorkout    = useAddWorkout();
  const { data: templates } = useWorkoutTemplates();
  const deleteTemplate = useDeleteWorkoutTemplate();

  // Load template pushed from the dashboard
  useEffect(() => {
    if (!externalTemplate) return;
    setWorkoutName(externalTemplate.name ?? "");
    setWorkoutCategory((externalTemplate.category as WorkoutDbCategory) ?? "weights");
    setExercises(
      (externalTemplate.exercises ?? []).map((e: any) => ({
        name: e.name, sets: e.sets ?? 3, reps: e.reps ?? 10, weight_kg: e.weight_kg ?? 0,
      }))
    );
    setSubTab("custom");
    onExternalTemplateConsumed?.();
  }, [externalTemplate]);

  // Append exercises picked from the library (new group per batch for zebra striping)
  useEffect(() => {
    if (!pendingExercises?.length) return;
    const parseReps = (reps: string): number => {
      const m = reps.match(/\d+/);
      return m ? parseInt(m[0]) : 10;
    };
    setGroupCounter((prevG) => {
      const newGroup = prevG + 1;
      setExercises((prev) => [
        ...prev.filter((e) => e.name.trim()),
        ...pendingExercises.map((ex) => ({
          name: ex.name,
          sets: ex.defaultSets,
          reps: parseReps(ex.defaultReps),
          weight_kg: 0,
          group: newGroup,
        })),
      ]);
      toast.success(`✅ ${pendingExercises.length} תרגילים נוספו לאימון`);
      return newGroup;
    });
    setSubTab("custom");
    onPendingExercisesConsumed?.();
  }, [pendingExercises]);

  const updateEx = (i: number, v: BuilderEx) => setExercises((prev) => prev.map((e, idx) => idx === i ? v : e));
  const removeEx = (i: number) => setExercises((prev) => prev.filter((_, idx) => idx !== i));
  const dupEx    = (i: number) => setExercises((prev) => { const c = [...prev]; c.splice(i + 1, 0, { ...prev[i] }); return c; });
  const addEx    = () => setExercises((prev) => {
    // New manual exercise joins the last group (or starts group 0)
    const lastGroup = prev.length ? (prev[prev.length - 1].group ?? 0) : 0;
    return [...prev, { name: "", sets: 3, reps: 10, weight_kg: 0, group: lastGroup }];
  });

  const handleSaveTemplate = async () => {
    if (!workoutName.trim()) return toast.error("תן שם לאימון");
    const filled = exercises.filter((e) => e.name.trim());
    if (!filled.length) return toast.error("הוסף לפחות תרגיל אחד");
    try {
      await addTemplate.mutateAsync({ name: workoutName, category: workoutCategory, exercises: filled });
      toast.success("תבנית נשמרה ✅");
      setWorkoutName(""); setExercises([{ name: "", sets: 3, reps: 10, weight_kg: 0 }]);
    } catch { toast.error("שגיאה בשמירה"); }
  };

  const handleLogNow = async () => {
    if (!workoutName.trim()) return toast.error("תן שם לאימון");
    const filled = exercises.filter((e) => e.name.trim());
    if (!filled.length) return toast.error("הוסף לפחות תרגיל אחד");
    try {
      await addWorkout.mutateAsync({ category: workoutCategory, exercises: filled, notes: workoutName });
      toast.success("אימון נרשם! 💪");
      setWorkoutName(""); setExercises([{ name: "", sets: 3, reps: 10, weight_kg: 0 }]);
    } catch { toast.error("שגיאה בשמירה"); }
  };

  const handleLoadTemplate = (t: any) => {
    setWorkoutName(t.name);
    setExercises((t.exercises ?? []).map((e: any) => ({ name: e.name, sets: e.sets, reps: e.reps, weight_kg: e.weight_kg || 0 })));
    toast.info(`טעינת תבנית: ${t.name}`);
  };

  const [aiGoal, setAiGoal]       = useState(BUILDER_GOALS[0]);
  const [aiDays, setAiDays]       = useState(4);
  const [aiEquip, setAiEquip]     = useState(EQUIPMENT_OPTS[0]);
  const [aiConstraints, setAiConstraints] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPlan, setAiPlan]       = useState<WorkoutPlan | null>(null);
  const [expandedDay, setExpandedDay] = useState<number | null>(0);
  const { data: prs } = usePersonalRecords();

  const handleGeneratePlan = async () => {
    setAiLoading(true); setAiPlan(null);
    try {
      const plan = await generateWorkoutPlan({
        goal: aiGoal, daysPerWeek: aiDays, equipment: aiEquip,
        constraints: aiConstraints || "אין",
        recentPRs: (prs ?? []).slice(0, 5).map((p: any) => ({ exercise_name: p.exercise_name, value: p.value, unit: p.unit })),
      });
      setAiPlan(plan); setExpandedDay(0);
    } catch { toast.error("שגיאה ביצירת תוכנית, נסה שנית"); }
    finally { setAiLoading(false); }
  };

  return (
    <div className="px-4 pt-8 space-y-4">
      <div className="flex gap-1 p-1 rounded-2xl border border-white/10 bg-white/5">
        {([["custom", "🏗️ בנה אימון"], ["ai", "🤖 AI Planner"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setSubTab(k)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${subTab === k ? "bg-emerald-500 text-white shadow-lg" : "text-white/40"}`}>
            {l}
          </button>
        ))}
      </div>

      {subTab === "custom" && (
        <div className="space-y-4">
          {(templates ?? []).length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-white/40">תבניות שמורות</p>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {(templates ?? []).map((t: any) => (
                  <div key={t.id} className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 bg-white/5">
                    <button onClick={() => handleLoadTemplate(t)} className="text-xs font-semibold text-white/80 hover:text-white whitespace-nowrap">{t.name}</button>
                    <button onClick={() => deleteTemplate.mutate(t.id)} className="text-red-400/60 hover:text-red-400"><X className="h-3 w-3" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl px-4 py-3">
            <input value={workoutName} onChange={(e) => setWorkoutName(e.target.value)}
              placeholder="שם האימון (למשל: כוח עליון)"
              className="w-full bg-transparent text-sm font-black text-white placeholder:text-white/25 outline-none text-right" dir="rtl" />
          </div>
          <div className="flex gap-1.5">
            {WORKOUT_CATEGORIES.map(({ value, label }) => (
              <button key={value} onClick={() => setWorkoutCategory(value)}
                className={`flex-1 py-1.5 rounded-xl text-[10px] font-bold transition-all border ${
                  workoutCategory === value
                    ? "bg-emerald-500/25 text-emerald-300 border-emerald-500/50"
                    : "text-white/30 border-white/10 hover:text-white/50"
                }`}>
                {label}
              </button>
            ))}
          </div>
          <div className="space-y-2.5">
            {(() => {
              // Compute zebra accent colors per group block
              let block = 0;
              let prevGroup: number | undefined = undefined;
              return exercises.map((ex, i) => {
                const g = ex.group ?? 0;
                if (prevGroup !== undefined && g !== prevGroup) block++;
                prevGroup = g;
                const accentColor = GROUP_ACCENT_COLORS[block % GROUP_ACCENT_COLORS.length];
                return (
                  <BuilderExerciseRow
                    key={i}
                    ex={ex}
                    idx={i}
                    accentColor={accentColor}
                    onChange={(v) => updateEx(i, v)}
                    onRemove={() => removeEx(i)}
                    onDuplicate={() => dupEx(i)}
                  />
                );
              });
            })()}
          </div>
          <div className="flex gap-2">
            <button onClick={addEx}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-white/20 text-white/50 hover:border-emerald-500/40 hover:text-emerald-400 transition-all text-sm font-semibold">
              <Plus className="h-4 w-4" />הוסף תרגיל
            </button>
            <button
              onClick={() => setGroupCounter((g) => {
                const ng = g + 1;
                setExercises((prev) => [...prev, { name: "", sets: 3, reps: 10, weight_kg: 0, group: ng }]);
                return ng;
              })}
              className="flex items-center justify-center gap-1.5 px-3 py-3 rounded-2xl border border-dashed border-white/15 text-white/35 hover:border-blue-500/40 hover:text-blue-400 transition-all text-xs font-semibold whitespace-nowrap"
              title="הוסף קבוצת שרירים חדשה (צבע חדש)"
            >
              <Plus className="h-3.5 w-3.5" />קבוצה
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={handleSaveTemplate} disabled={addTemplate.isPending}
              className="flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-white/20 bg-white/8 text-white text-sm font-bold hover:bg-white/12 active:scale-[0.98] transition-all">
              <Star className="h-4 w-4 text-amber-400" />שמור תבנית
            </button>
            <button onClick={handleLogNow} disabled={addWorkout.isPending}
              className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-emerald-500 text-white text-sm font-black hover:bg-emerald-400 active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <Play className="h-4 w-4" />רשום עכשיו
            </button>
          </div>
        </div>
      )}

      {subTab === "ai" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 space-y-4">
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-white/50">מטרה</p>
              <div className="grid grid-cols-2 gap-2">
                {BUILDER_GOALS.map((g) => (
                  <button key={g} onClick={() => setAiGoal(g)}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${aiGoal === g ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-300" : "border-white/10 bg-white/5 text-white/50"}`}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-white/50">ימי אימון בשבוע</p>
              <div className="flex gap-2">
                {DAYS_OPTS.map((d) => (
                  <button key={d} onClick={() => setAiDays(d)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-black border transition-all ${aiDays === d ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-300" : "border-white/10 bg-white/5 text-white/50"}`}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-white/50">ציוד זמין</p>
              <div className="flex gap-2">
                {EQUIPMENT_OPTS.map((e) => (
                  <button key={e} onClick={() => setAiEquip(e)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${aiEquip === e ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-300" : "border-white/10 bg-white/5 text-white/50"}`}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-white/50">מגבלות / פציעות (אופציונלי)</p>
              <input value={aiConstraints} onChange={(e) => setAiConstraints(e.target.value)}
                placeholder="למשל: כאב בכתף ימין, אין ריצה..."
                className="w-full rounded-xl border border-white/10 bg-white/8 px-3 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-emerald-500/40"
                dir="rtl" />
            </div>
            <button onClick={handleGeneratePlan} disabled={aiLoading}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl bg-emerald-500 text-white font-black text-sm min-h-[48px] hover:bg-emerald-400 active:scale-[0.98] transition-all shadow-[0_0_24px_rgba(16,185,129,0.35)] disabled:opacity-60">
              {aiLoading ? <><Loader2 className="h-4 w-4 animate-spin" />יוצר תוכנית...</> : <><Zap className="h-4 w-4" />צור תוכנית שבועית</>}
            </button>
          </div>
          {aiPlan && (
            <div className="space-y-3">
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/8 p-3">
                <p className="text-xs text-emerald-300 font-semibold">{aiPlan.summary}</p>
              </div>
              {aiPlan.workouts.map((w, i) => (
                <div key={i} className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                  <button onClick={() => setExpandedDay(expandedDay === i ? null : i)}
                    className="w-full flex items-center justify-between px-4 py-3.5 text-right">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-xs font-black text-emerald-400">{i + 1}</div>
                      <div>
                        <p className="text-sm font-black text-white">{w.day}</p>
                        <p className="text-[10px] text-white/40">{w.name} · {w.duration_minutes} דק׳</p>
                      </div>
                    </div>
                    {expandedDay === i ? <ChevronUp className="h-4 w-4 text-white/40" /> : <ChevronDown className="h-4 w-4 text-white/40" />}
                  </button>
                  {expandedDay === i && (
                    <div className="border-t border-white/8 divide-y divide-white/5">
                      {w.exercises.map((ex, j) => (
                        <div key={j} className="flex items-center justify-between px-4 py-2.5">
                          <div>
                            <p className="text-xs font-semibold text-white/80">{ex.name}</p>
                            {ex.notes && <p className="text-[10px] text-white/35 mt-0.5">{ex.notes}</p>}
                          </div>
                          <span className="text-[10px] font-mono text-emerald-400">{ex.sets}×{ex.reps}{ex.weight_kg ? ` @ ${ex.weight_kg}kg` : ""}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {aiPlan.tips?.length > 0 && (
                <div className="rounded-2xl border border-white/8 bg-white/4 p-3 space-y-1.5">
                  <p className="text-[10px] font-bold text-white/40">טיפים מה-AI</p>
                  {aiPlan.tips.map((tip, i) => <p key={i} className="text-xs text-white/60">• {tip}</p>)}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  TAB 3 — EXERCISE LIBRARY
// ═══════════════════════════════════════════════════════════════════════

function ExerciseModal({
  ex,
  groupKey,
  onClose,
  isFavorite,
  onToggleFavorite,
  onToggleHidden,
}: {
  ex: LibraryExercise;
  groupKey?: string;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onToggleHidden: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div
        className="w-full max-w-lg mx-auto rounded-t-3xl border-t border-x border-white/10 bg-[#0d1117]/95 backdrop-blur-2xl p-5 space-y-4 pb-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full bg-white/20 mx-auto" />
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {groupKey && BODY_DOTS[groupKey] && (
              <div className="shrink-0 mt-0.5">
                <MuscleBodyIcon muscleKey={groupKey} size={28} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-black text-white leading-tight">{ex.name}</h3>
              <p className="text-xs text-white/40 mt-0.5">{ex.muscles}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
              className={`h-8 w-8 rounded-xl flex items-center justify-center transition-all ${
                isFavorite ? "bg-red-500/20 text-red-400" : "bg-white/8 text-white/40 hover:bg-white/15"
              }`}
            >
              <Heart className={`h-3.5 w-3.5 ${isFavorite ? "fill-red-400" : ""}`} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onToggleHidden(); onClose(); }}
              className="h-8 w-8 rounded-xl bg-white/8 flex items-center justify-center text-white/40 hover:bg-white/15 transition-all"
              title="הסתר תרגיל"
            >
              <EyeOff className="h-3.5 w-3.5" />
            </button>
            <button onClick={onClose} className="h-8 w-8 rounded-xl bg-white/8 flex items-center justify-center text-white/50 hover:bg-white/15">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 text-center">
          {[["סטים", ex.defaultSets], ["חזרות", ex.defaultReps], ["ציוד", ex.equipment]].map(([label, val]) => (
            <div key={String(label)} className="rounded-xl border border-white/8 bg-white/5 p-2.5">
              <p className="text-[9px] text-white/35">{label}</p>
              <p className="text-sm font-black text-white mt-0.5 leading-tight">{val}</p>
            </div>
          ))}
        </div>

        {/* Tips */}
        <div className="space-y-2">
          <p className="text-[11px] font-bold text-white/50">💡 טיפים לביצוע נכון</p>
          {ex.tips.map((tip, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="h-5 w-5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
              <p className="text-xs text-white/70">{tip}</p>
            </div>
          ))}
        </div>

        {/* YouTube */}
        <a
          href={`https://www.youtube.com/results?search_query=${ex.youtubeQuery}`}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400 font-bold text-sm hover:bg-red-500/15 transition-all"
        >
          <span>▶</span>סרטון הדרכה ב-YouTube
        </a>
      </div>
    </div>
  );
}

type LibraryWorkoutType = "weights" | "calisthenics" | "warmup";

function ExerciseLibraryTab({ onAddToWorkout }: { onAddToWorkout?: (exs: LibraryExercise[]) => void }) {
  const [workoutType,    setWorkoutType]    = useState<LibraryWorkoutType>("weights");
  const [selectedGroup,  setSelectedGroup]  = useState<MuscleGroup | null>(null);
  const [selectedEquip,  setSelectedEquip]  = useState<EquipmentCategory | null>(null);
  const [selectedEx,     setSelectedEx]     = useState<{ ex: LibraryExercise; groupKey: string } | null>(null);
  const [checked,        setChecked]        = useState<Set<string>>(new Set());
  const [showHidden,     setShowHidden]     = useState(false);

  const { data: settings } = useUserSettings();
  const updateSettings = useUpdateUserSettings();
  const favorites: string[] = (settings as any)?.favorite_exercises ?? [];
  const hidden: string[]    = (settings as any)?.hidden_exercises   ?? [];

  const toggleFavorite = (name: string) => {
    const next = favorites.includes(name)
      ? favorites.filter((n) => n !== name)
      : [...favorites, name];
    updateSettings.mutate({ favorite_exercises: next });
  };

  const toggleHidden = (name: string) => {
    const next = hidden.includes(name)
      ? hidden.filter((n) => n !== name)
      : [...hidden, name];
    updateSettings.mutate({ hidden_exercises: next });
  };

  const toggleCheck = (name: string) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });

  // Build a flat map of all exercises for lookup
  const allExMap = new Map<string, LibraryExercise>();
  [...MUSCLE_GROUPS, ...CALISTHENICS_MUSCLE_GROUPS, ...WARMUP_GROUPS]
    .forEach((g) => g.exercises.forEach((ex) => allExMap.set(ex.name, ex)));

  const handleAddToWorkout = () => {
    const exs = [...checked].map((n) => allExMap.get(n)!).filter(Boolean);
    onAddToWorkout?.(exs);
    setChecked(new Set());
  };

  const handleTypeChange = (t: LibraryWorkoutType) => {
    setWorkoutType(t);
    setSelectedGroup(null);
    setSelectedEquip(null);
    setChecked(new Set());
  };

  const handleGroupSelect = (g: MuscleGroup) => {
    setSelectedGroup(g);
    setSelectedEquip(null);
  };

  const handleBack = () => {
    if (selectedEquip) { setSelectedEquip(null); return; }
    setSelectedGroup(null);
  };

  // Exercises in the current group, optionally filtered by equipment
  const groupExercises = (() => {
    if (!selectedGroup) return [];
    let exs = selectedGroup.exercises.filter((ex) => showHidden || !hidden.includes(ex.name));
    if (selectedEquip) exs = exs.filter((ex) => getEquipCat(ex.equipment) === selectedEquip);
    return exs;
  })();

  // Equipment categories present in the selected group (weights only)
  const equipCategories: EquipmentCategory[] = selectedGroup
    ? [...new Set(selectedGroup.exercises.map((ex) => getEquipCat(ex.equipment)))]
    : [];

  // Favorite exercises for the current type
  const favForType = favorites.filter((name) => {
    const ex = allExMap.get(name);
    if (!ex) return false;
    const inWeights = MUSCLE_GROUPS.some((g) => g.exercises.some((e) => e.name === name));
    const inCali    = CALISTHENICS_MUSCLE_GROUPS.some((g) => g.exercises.some((e) => e.name === name));
    const inWarmup  = WARMUP_GROUPS.some((g) => g.exercises.some((e) => e.name === name));
    if (workoutType === "weights")      return inWeights;
    if (workoutType === "calisthenics") return inCali;
    if (workoutType === "warmup")       return inWarmup;
    return false;
  });

  const groups =
    workoutType === "weights"      ? MUSCLE_GROUPS :
    workoutType === "calisthenics" ? CALISTHENICS_MUSCLE_GROUPS :
    WARMUP_GROUPS;

  return (
    <div className="px-4 pt-8 space-y-4 pb-28">
      {/* ── Type tabs ─────────────────────────────────────────────── */}
      <div className="flex gap-1 p-1 rounded-2xl bg-white/5 border border-white/8">
        {([
          { key: "weights"      as const, label: "🏋️ חדר כושר"  },
          { key: "calisthenics" as const, label: "🤸 קלסטניקס"  },
          { key: "warmup"       as const, label: "🔥 חימום"      },
        ] as const).map(({ key, label }) => (
          <button key={key} onClick={() => handleTypeChange(key)}
            className={`flex-1 py-2 rounded-xl text-[11px] font-black transition-all ${
              workoutType === key ? "bg-white/15 text-white shadow-sm" : "text-white/35 hover:text-white/55"
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Favorites row (when on root view) ─────────────────────── */}
      {!selectedGroup && favForType.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-bold text-white/45 flex items-center gap-1.5">
            <Heart className="h-3 w-3 text-red-400 fill-red-400" />מועדפים
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {favForType.map((name) => {
              const ex = allExMap.get(name)!;
              const isChecked = checked.has(name);
              return (
                <div key={name}
                  className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                    isChecked
                      ? "border-emerald-500/60 bg-emerald-500/15"
                      : "border-white/10 bg-white/5"
                  }`}
                  onClick={() => toggleCheck(name)}
                >
                  <div className={`h-4 w-4 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                    isChecked ? "border-emerald-500 bg-emerald-500" : "border-white/25"
                  }`}>
                    {isChecked && <Check className="h-2.5 w-2.5 text-white" />}
                  </div>
                  <span className="text-xs font-semibold text-white whitespace-nowrap">{name}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedEx({ ex, groupKey: "" }); }}
                    className="text-white/25 hover:text-white/60 transition-colors"
                  >
                    <BookOpen className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Back button + breadcrumb (when in a group) ─────────────── */}
      {selectedGroup && (
        <div className="flex items-center gap-3">
          <button onClick={handleBack}
            className="h-8 w-8 rounded-xl bg-white/8 flex items-center justify-center text-white/60 hover:bg-white/15">
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-xl">{selectedGroup.emoji}</span>
            <div className="min-w-0">
              <p className="text-sm font-black text-white leading-tight">
                {selectedGroup.label}
                {selectedEquip && <span className="text-white/40 font-normal"> · {EQUIP_META[selectedEquip].label}</span>}
              </p>
            </div>
          </div>
          {hidden.length > 0 && (
            <button
              onClick={() => setShowHidden((v) => !v)}
              className={`h-7 px-2.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
                showHidden ? "bg-white/15 text-white" : "bg-white/5 text-white/30"
              }`}
            >
              <Eye className="h-3 w-3" />
            </button>
          )}
        </div>
      )}

      {/* ── WARMUP: flat group sections ─────────────────────────────── */}
      {workoutType === "warmup" && !selectedGroup && (
        <>
          <p className="text-sm font-black text-white">בחר קטגוריה</p>
          <div className="space-y-3">
            {WARMUP_GROUPS.map((g) => (
              <button key={g.key} onClick={() => handleGroupSelect(g)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 text-right flex items-center gap-3 hover:border-white/20 hover:bg-white/8 active:scale-[0.97] transition-all">
                <div className="h-11 w-11 rounded-2xl flex items-center justify-center text-2xl shrink-0" style={{ background: g.color + "22" }}>
                  {g.emoji}
                </div>
                <div>
                  <p className="text-sm font-black text-white">{g.label}</p>
                  <p className="text-[10px] text-white/35">{g.exercises.length} תרגילים</p>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* ── WEIGHTS / CALISTHENICS root: muscle group grid ─────────── */}
      {(workoutType === "weights" || workoutType === "calisthenics") && !selectedGroup && (
        <>
          <p className="text-sm font-black text-white">בחר קבוצת שרירים</p>
          <div className="grid grid-cols-2 gap-3">
            {groups.map((g) => {
              const visibleCount = g.exercises.filter((ex) => !hidden.includes(ex.name)).length;
              return (
                <button key={g.key} onClick={() => handleGroupSelect(g)}
                  className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 text-right flex items-center gap-3 hover:border-white/20 hover:bg-white/8 active:scale-[0.97] transition-all">
                  <div className="h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 relative" style={{ background: g.color + "22" }}>
                    <MuscleBodyIcon muscleKey={g.key} size={30} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-white">{g.label}</p>
                    <p className="text-[10px] text-white/35">{visibleCount} תרגילים</p>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* ── WEIGHTS inside group: equipment chips ───────────────────── */}
      {workoutType === "weights" && selectedGroup && !selectedEquip && (
        <>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {equipCategories.map((cat) => {
              const meta = EQUIP_META[cat];
              const count = selectedGroup.exercises.filter(
                (ex) => getEquipCat(ex.equipment) === cat && (showHidden || !hidden.includes(ex.name))
              ).length;
              if (count === 0) return null;
              return (
                <button key={cat} onClick={() => setSelectedEquip(cat)}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8 active:scale-95 transition-all">
                  <span className="text-base leading-none">{meta.emoji}</span>
                  <div className="text-right">
                    <p className="text-[11px] font-bold text-white whitespace-nowrap">{meta.label}</p>
                    <p className="text-[9px] text-white/35">{count} תרגילים</p>
                  </div>
                </button>
              );
            })}
          </div>
          {/* Show all exercises grouped by equipment when no filter */}
          <div className="space-y-2">
            {groupExercises.map((ex) => (
              <ExerciseRow
                key={ex.name}
                ex={ex}
                groupKey={selectedGroup.key}
                isChecked={checked.has(ex.name)}
                isFavorite={favorites.includes(ex.name)}
                onCheck={() => toggleCheck(ex.name)}
                onOpen={() => setSelectedEx({ ex, groupKey: selectedGroup.key })}
              />
            ))}
          </div>
        </>
      )}

      {/* ── WEIGHTS with equipment selected: filtered list ──────────── */}
      {workoutType === "weights" && selectedGroup && selectedEquip && (
        <div className="space-y-2">
          {groupExercises.map((ex) => (
            <ExerciseRow
              key={ex.name}
              ex={ex}
              groupKey={selectedGroup.key}
              isChecked={checked.has(ex.name)}
              isFavorite={favorites.includes(ex.name)}
              onCheck={() => toggleCheck(ex.name)}
              onOpen={() => setSelectedEx({ ex, groupKey: selectedGroup.key })}
            />
          ))}
        </div>
      )}

      {/* ── CALISTHENICS / WARMUP inside group: exercise list ──────── */}
      {(workoutType === "calisthenics" || workoutType === "warmup") && selectedGroup && (
        <div className="space-y-2">
          {groupExercises.map((ex) => (
            <ExerciseRow
              key={ex.name}
              ex={ex}
              groupKey={selectedGroup.key}
              isChecked={checked.has(ex.name)}
              isFavorite={favorites.includes(ex.name)}
              onCheck={() => toggleCheck(ex.name)}
              onOpen={() => setSelectedEx({ ex, groupKey: selectedGroup.key })}
            />
          ))}
          {groupExercises.length === 0 && (
            <div className="text-center py-8 text-white/30 text-xs">
              כל התרגילים מוסתרים —{" "}
              <button onClick={() => setShowHidden(true)} className="underline">הצג מוסתרים</button>
            </div>
          )}
        </div>
      )}

      {/* ── Modal ─────────────────────────────────────────────────── */}
      {selectedEx && (
        <ExerciseModal
          ex={selectedEx.ex}
          groupKey={selectedEx.groupKey}
          onClose={() => setSelectedEx(null)}
          isFavorite={favorites.includes(selectedEx.ex.name)}
          onToggleFavorite={() => toggleFavorite(selectedEx.ex.name)}
          onToggleHidden={() => toggleHidden(selectedEx.ex.name)}
        />
      )}

      {/* ── Floating add bar ──────────────────────────────────────── */}
      {checked.size > 0 && (
        <div className="fixed bottom-20 left-4 right-4 z-40 flex items-center gap-2 p-2.5 rounded-2xl bg-emerald-500 shadow-xl shadow-emerald-500/40">
          <button
            onClick={() => setChecked(new Set())}
            className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
          <button
            onClick={handleAddToWorkout}
            className="flex-1 text-sm font-black text-white text-center min-h-[36px] flex items-center justify-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            הוסף {checked.size} {checked.size === 1 ? "תרגיל" : "תרגילים"} לאימון
          </button>
        </div>
      )}
    </div>
  );
}

// ── ExerciseRow sub-component ────────────────────────────────────────────────
function ExerciseRow({
  ex,
  groupKey,
  isChecked,
  isFavorite,
  onCheck,
  onOpen,
}: {
  ex: LibraryExercise;
  groupKey: string;
  isChecked: boolean;
  isFavorite: boolean;
  onCheck: () => void;
  onOpen: () => void;
}) {
  return (
    <div
      className={`w-full rounded-2xl border backdrop-blur-xl p-3.5 flex items-center gap-3 transition-all cursor-pointer ${
        isChecked
          ? "border-emerald-500/50 bg-emerald-500/10"
          : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8"
      }`}
      onClick={onCheck}
    >
      {/* Checkbox */}
      <div className={`h-5 w-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
        isChecked ? "border-emerald-500 bg-emerald-500" : "border-white/25"
      }`}>
        {isChecked && <Check className="h-3 w-3 text-white" />}
      </div>

      {/* Body icon */}
      {BODY_DOTS[groupKey] && (
        <div className="shrink-0">
          <MuscleBodyIcon muscleKey={groupKey} size={22} />
        </div>
      )}

      {/* Text */}
      <div className="flex-1 min-w-0 text-right">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-black text-white leading-tight flex-1 truncate">{ex.name}</p>
          {isFavorite && <Heart className="h-3 w-3 text-red-400 fill-red-400 shrink-0" />}
        </div>
        <p className="text-[10px] text-white/35 mt-0.5 truncate">{ex.muscles}</p>
        <div className="flex gap-1.5 mt-1.5 flex-wrap">
          <span className="text-[9px] px-1.5 py-0.5 rounded-full border border-white/10 bg-white/5 text-white/40">{ex.equipment}</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full border border-emerald-500/20 bg-emerald-500/8 text-emerald-400">{ex.defaultSets}×{ex.defaultReps}</span>
        </div>
      </div>

      {/* Open modal */}
      <button
        onClick={(e) => { e.stopPropagation(); onOpen(); }}
        className="h-8 w-8 rounded-xl bg-white/5 flex items-center justify-center text-white/30 hover:bg-white/15 hover:text-white/70 shrink-0 transition-all"
      >
        <BookOpen className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  TAB 4 — PROGRESS & BODY
// ═══════════════════════════════════════════════════════════════════════

function WeightChart() {
  const { data: entries } = useWeightEntries(30);
  const addWeight    = useAddWeight();
  const deleteWeight = useDeleteWeight();
  const updateWeight = useUpdateWeight();
  const [newWeight, setNewWeight]   = useState(75);
  const [showAdd, setShowAdd]       = useState(false);
  const [showList, setShowList]     = useState(false);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [editValue, setEditValue]   = useState("");

  const chartData = [...(entries ?? [])].reverse().slice(-14).map((e: any) => ({
    date: new Date(e.date).toLocaleDateString("he-IL", { day: "numeric", month: "numeric" }),
    kg: e.weight_kg,
  }));

  const latest = (entries ?? [])[0] as any;
  const prev   = (entries ?? [])[1] as any;
  const delta  = latest && prev ? (latest.weight_kg - prev.weight_kg).toFixed(1) : null;

  const handleAdd = async () => {
    try {
      await addWeight.mutateAsync({ weight_kg: newWeight });
      toast.success(`⚖️ ${newWeight}kg נרשם!`);
      setShowAdd(false);
    } catch { toast.error("שגיאה בשמירה"); }
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    const val = parseFloat(editValue);
    if (!val || val <= 0) { toast.error("הזן משקל תקין"); return; }
    try {
      await updateWeight.mutateAsync({ id: editingId, weight_kg: val });
      toast.success("משקל עודכן");
      setEditingId(null);
    } catch { toast.error("שגיאה בעדכון"); }
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-blue-400" />
          <p className="text-sm font-black text-white">מעקב משקל</p>
        </div>
        <div className="flex items-center gap-2">
          {(entries ?? []).length > 0 && (
            <button onClick={() => setShowList((v) => !v)}
              className="text-[10px] text-white/40 hover:text-white/70 font-bold transition-colors">
              {showList ? "הסתר רשימה" : "ערוך / מחק"}
            </button>
          )}
          <button onClick={() => setShowAdd((v) => !v)}
            className="h-7 w-7 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center text-blue-400 hover:bg-blue-500/25">
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {latest && (
        <div className="flex items-end gap-3">
          <p className="text-4xl font-black text-white">{latest.weight_kg}<span className="text-lg text-white/40 ml-1">kg</span></p>
          {delta !== null && (
            <span className={`text-sm font-bold mb-1 ${Number(delta) < 0 ? "text-emerald-400" : Number(delta) > 0 ? "text-red-400" : "text-white/40"}`}>
              {Number(delta) > 0 ? "+" : ""}{delta}kg
            </span>
          )}
        </div>
      )}

      {showAdd && (
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/8 p-3 flex items-center gap-3">
          <Stepper value={newWeight} onChange={setNewWeight} min={30} max={250} step={0.5} suffix="kg" />
          <button onClick={handleAdd} disabled={addWeight.isPending}
            className="flex-1 py-2 rounded-xl bg-blue-500 text-white font-bold text-sm hover:bg-blue-400 active:scale-95 transition-all">
            {addWeight.isPending ? "שומר..." : "שמור"}
          </button>
        </div>
      )}

      {showList && (
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {(entries ?? []).map((e: any) => (
            <div key={e.id} className="flex items-center justify-between px-3 py-2 rounded-xl border border-white/8 bg-white/5">
              {editingId === e.id ? (
                <>
                  <input
                    type="number" step="0.1" value={editValue}
                    onChange={(ev) => setEditValue(ev.target.value)}
                    className="w-24 rounded-lg bg-white/10 border border-blue-500/40 px-2 py-1 text-sm text-white focus:outline-none"
                    dir="ltr" autoFocus
                  />
                  <div className="flex items-center gap-1">
                    <button onClick={handleSaveEdit} disabled={updateWeight.isPending}
                      className="h-7 w-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center hover:bg-emerald-500/30 disabled:opacity-50">
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setEditingId(null)}
                      className="h-7 w-7 rounded-lg bg-white/8 text-white/40 flex items-center justify-center hover:bg-white/15">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black text-white" dir="ltr">{e.weight_kg} kg</span>
                    <span className="text-[10px] text-white/35">{new Date(e.date).toLocaleDateString("he-IL")}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setEditingId(e.id); setEditValue(String(e.weight_kg)); }}
                      className="h-7 w-7 rounded-lg bg-white/5 text-white/30 flex items-center justify-center hover:bg-white/15 hover:text-white/70">
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button onClick={() => deleteWeight.mutate(e.id, { onSuccess: () => toast.success("נמחק") })}
                      className="h-7 w-7 rounded-lg bg-white/5 text-red-400/50 flex items-center justify-center hover:bg-red-500/15 hover:text-red-400">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {chartData.length > 1 ? (
        <ResponsiveContainer width="100%" height={140}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }} axisLine={false} tickLine={false} />
            <YAxis domain={["auto", "auto"]} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }} axisLine={false} tickLine={false} width={30} />
            <Tooltip contentStyle={{ background: "#0d1117", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff", fontSize: 11 }} />
            <Line type="monotone" dataKey="kg" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6", r: 3 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[140px] flex items-center justify-center">
          <p className="text-xs text-white/25">הוסף לפחות 2 מדידות לגרף</p>
        </div>
      )}
    </div>
  );
}

function PRSection() {
  const { data: prs } = usePersonalRecords();
  const addPR = useAddPersonalRecord();
  const [showForm, setShowForm] = useState(false);
  const [prName, setPrName]     = useState("");
  const [prValue, setPrValue]   = useState(100);
  const [prUnit, setPrUnit]     = useState("kg");

  const handleAdd = async () => {
    if (!prName.trim()) return toast.error("שם התרגיל חסר");
    try {
      await addPR.mutateAsync({ exercise_name: prName, value: prValue, unit: prUnit });
      toast.success(`🏆 שיא חדש: ${prName} ${prValue}${prUnit}`);
      setPrName(""); setPrValue(100); setShowForm(false);
    } catch { toast.error("שגיאה בשמירה"); }
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Medal className="h-4 w-4 text-amber-400" />
          <p className="text-sm font-black text-white">שיאים אישיים</p>
        </div>
        <button onClick={() => setShowForm((v) => !v)}
          className="h-7 w-7 rounded-xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center text-amber-400 hover:bg-amber-500/25">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      {showForm && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/8 p-3 space-y-3">
          <input value={prName} onChange={(e) => setPrName(e.target.value)} placeholder="שם התרגיל..."
            className="w-full bg-transparent text-sm text-white placeholder:text-white/25 outline-none border-b border-white/10 pb-1" dir="rtl" />
          <div className="flex items-center gap-3">
            <Stepper value={prValue} onChange={setPrValue} min={1} max={999} step={1} suffix={prUnit} />
            <select value={prUnit} onChange={(e) => setPrUnit(e.target.value)}
              className="bg-white/10 border border-white/10 rounded-xl text-xs text-white px-2 py-1.5 outline-none">
              {["kg", "reps", "km", "min", "sec"].map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
            <button onClick={handleAdd} disabled={addPR.isPending}
              className="flex-1 py-2 rounded-xl bg-amber-500 text-white font-bold text-xs hover:bg-amber-400 active:scale-95 transition-all">
              שמור
            </button>
          </div>
        </div>
      )}
      {(prs ?? []).length === 0 ? (
        <div className="text-center py-6">
          <span className="text-4xl">🏆</span>
          <p className="text-xs text-white/30 mt-2">אין שיאים עדיין — הוסף את הראשון!</p>
        </div>
      ) : (
        <div className="divide-y divide-white/5">
          {(prs ?? []).slice(0, 8).map((pr: any) => (
            <div key={pr.id} className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-2">
                <Trophy className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span className="text-xs font-semibold text-white/80">{pr.exercise_name}</span>
              </div>
              <div className="text-left">
                <span className="text-sm font-black text-amber-400">{pr.value}</span>
                <span className="text-[10px] text-white/40 ml-1">{pr.unit}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WorkoutHistoryStrip() {
  const { data: workouts } = useWeekWorkouts();
  const list = (workouts ?? []).slice(0, 5) as any[];
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-emerald-400" />
        <p className="text-sm font-black text-white">היסטוריית אימונים</p>
      </div>
      {list.length === 0 ? (
        <p className="text-xs text-white/25 text-center py-4">אין אימונים השבוע עדיין</p>
      ) : (
        <div className="space-y-2">
          {list.map((w) => (
            <div key={w.id} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
              <div>
                <p className="text-xs font-bold text-white/80">{w.category}</p>
                <p className="text-[10px] text-white/35">{new Date(w.date).toLocaleDateString("he-IL", { weekday: "short", day: "numeric", month: "numeric" })}</p>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-white/40">
                <Clock className="h-3 w-3" />{w.duration_minutes || "—"} דק׳
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  TASK 5 — Running Module & Visual Progress
// ═══════════════════════════════════════════════════════════════════════

// ─── Pace helpers ────────────────────────────────────────────────────────────
function computePaceDecimal(distanceKm: number, durationMinutes: number): number | null {
  if (distanceKm <= 0 || durationMinutes <= 0) return null;
  const p = durationMinutes / distanceKm;
  if (p < 2 || p > 40) return null;
  return p;
}
function formatPace(decimalMinutes: number): string {
  const mins = Math.floor(decimalMinutes);
  const secs = Math.round((decimalMinutes - mins) * 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}
function formatDurationHMS(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  const s = Math.round((minutes - Math.floor(minutes)) * 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// Canvas: rounded rectangle path helper
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

// ─── Share Run Modal ──────────────────────────────────────────────────────────
interface RunForShare {
  date: string;
  distanceKm:      number | null;
  durationMinutes: number | null;
  paceDecimal:     number | null;
  notes?:          string | null;
}

function ShareRunModal({ run, onClose }: { run: RunForShare; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 1080, H = 1080;
    canvas.width = W; canvas.height = H;

    // ── Background gradient ──
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0,   "#070e19");
    bg.addColorStop(0.45,"#0b2018");
    bg.addColorStop(1,   "#060c15");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // ── Emerald glow — top right ──
    const g1 = ctx.createRadialGradient(W * 0.85, H * 0.1, 0, W * 0.85, H * 0.1, 460);
    g1.addColorStop(0, "rgba(16,185,129,0.20)");
    g1.addColorStop(1, "rgba(16,185,129,0)");
    ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H);

    // ── Orange glow — bottom left ──
    const g2 = ctx.createRadialGradient(W * 0.18, H * 0.9, 0, W * 0.18, H * 0.9, 340);
    g2.addColorStop(0, "rgba(249,115,22,0.14)");
    g2.addColorStop(1, "rgba(249,115,22,0)");
    ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H);

    // ── Subtle dot grid ──
    ctx.fillStyle = "rgba(255,255,255,0.025)";
    for (let x = 30; x < W; x += 54) {
      for (let y = 30; y < H; y += 54) {
        ctx.beginPath(); ctx.arc(x, y, 1.5, 0, Math.PI * 2); ctx.fill();
      }
    }

    // ── Text setup (RTL) ──
    ctx.direction  = "rtl";
    ctx.textBaseline = "alphabetic";

    // ── App name ──
    ctx.font      = "bold 48px -apple-system, Arial, sans-serif";
    ctx.fillStyle = "#10b981";
    ctx.textAlign = "right";
    ctx.fillText("LifePulse", W - 80, 104);

    // ── Date ──
    const dateStr = new Date(run.date).toLocaleDateString("he-IL", {
      weekday: "long", day: "numeric", month: "long",
    });
    ctx.font      = "32px -apple-system, Arial, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.36)";
    ctx.fillText(dateStr, W - 80, 152);

    // ── Top divider ──
    ctx.strokeStyle = "rgba(16,185,129,0.22)";
    ctx.lineWidth   = 1.5;
    ctx.setLineDash([10, 7]);
    ctx.beginPath(); ctx.moveTo(80, 186); ctx.lineTo(W - 80, 186); ctx.stroke();
    ctx.setLineDash([]);

    // ── Hero: "PACE" label ──
    ctx.font      = "bold 30px -apple-system, Arial, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.30)";
    ctx.textAlign = "center";
    ctx.fillText("פייס ממוצע", W / 2, 280);

    // ── Hero pace number ──
    const paceStr = run.paceDecimal ? formatPace(run.paceDecimal) : "--:--";
    ctx.font      = "bold 230px -apple-system, Arial, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.96)";
    ctx.fillText(paceStr, W / 2, 530);

    // ── /ק"מ unit ──
    ctx.font      = "bold 58px -apple-system, Arial, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.38)";
    ctx.fillText("/ק״מ", W / 2, 600);

    // ── Stats boxes ──
    const stats: { label: string; value: string }[] = [];
    if (run.distanceKm)      stats.push({ label: "קילומטר",  value: run.distanceKm.toFixed(1) });
    if (run.durationMinutes) stats.push({ label: "זמן ריצה", value: formatDurationHMS(run.durationMinutes) });

    if (stats.length > 0) {
      const bW = stats.length === 1 ? 360 : 310;
      const bH = 148;
      const bY = 666;
      const gap = 30;
      const totalW = stats.length * bW + (stats.length - 1) * gap;
      const startX = (W - totalW) / 2;

      stats.forEach((s, i) => {
        const bx = startX + i * (bW + gap);
        ctx.fillStyle = "rgba(255,255,255,0.055)";
        roundRect(ctx, bx, bY, bW, bH, 24);
        ctx.fill();

        ctx.font      = `bold ${stats.length === 1 ? 88 : 76}px -apple-system, Arial, sans-serif`;
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.fillText(s.value, bx + bW / 2, bY + 94);

        ctx.font      = "28px -apple-system, Arial, sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.38)";
        ctx.fillText(s.label, bx + bW / 2, bY + 130);
      });
    }

    // ── Bottom divider ──
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth   = 1;
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(80, H - 128); ctx.lineTo(W - 80, H - 128); ctx.stroke();

    // ── Footer ──
    ctx.font      = "26px -apple-system, Arial, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.16)";
    ctx.textAlign = "center";
    ctx.fillText("LifePulse • מעקב כושר ובריאות", W / 2, H - 68);

  }, [run]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url; a.download = `run_${run.date}.png`; a.click();
  };

  const handleShare = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], "my-run.png", { type: "image/png" });
      if (typeof navigator.share === "function") {
        try {
          await navigator.share({ files: [file], title: "הריצה שלי 🏃" });
          return;
        } catch {/* user cancelled — fall through to download */}
      }
      handleDownload();
    }, "image/png");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm space-y-3 rounded-3xl border border-white/10 bg-black/90 backdrop-blur-xl p-4 pb-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="h-7 w-7 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/15 transition-all"
          >
            <X className="h-3.5 w-3.5 text-white/60" />
          </button>
          <p className="text-sm font-black text-white">שתף ריצה</p>
          <div className="w-7" />
        </div>

        {/* Canvas preview */}
        <div className="rounded-2xl overflow-hidden w-full aspect-square bg-black shadow-2xl">
          <canvas ref={canvasRef} className="w-full h-full" style={{ imageRendering: "auto" }} />
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={handleDownload}
            className="flex-1 py-3 rounded-2xl bg-white/8 border border-white/10 text-sm font-bold text-white/60 flex items-center justify-center gap-2 hover:bg-white/12 active:scale-95 transition-all"
          >
            <Download className="h-4 w-4" /> הורד
          </button>
          <button
            onClick={handleShare}
            className="flex-1 py-3 rounded-2xl bg-emerald-500 text-sm font-black text-white flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 active:scale-95 transition-all"
          >
            <Share2 className="h-4 w-4" /> שתף
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Running Log Section ──────────────────────────────────────────────────────
function RunningLogSection() {
  const addWorkout = useAddWorkout();
  const { data: runs } = useRunHistory();

  const [distRaw,  setDistRaw]  = useState("");
  const [minsRaw,  setMinsRaw]  = useState("");
  const [secsRaw,  setSecsRaw]  = useState("0");
  const [runNotes, setRunNotes] = useState("");
  const [shareRun, setShareRun] = useState<RunForShare | null>(null);

  // Real-time derived pace
  const distKm    = parseFloat(distRaw)  || 0;
  const totalMins = (parseInt(minsRaw)   || 0) + (parseInt(secsRaw) || 0) / 60;
  const paceDec   = computePaceDecimal(distKm, totalMins);

  const handleSave = async () => {
    if (!distKm && !totalMins) return toast.error("הכנס לפחות מרחק או זמן");
    try {
      await addWorkout.mutateAsync({
        category: "running",
        duration_minutes: totalMins || undefined,
        notes: runNotes || undefined,
        run: {
          distance_km:      distKm     || undefined,
          duration_minutes: totalMins  || undefined,
          pace_per_km:      paceDec    || undefined,
        },
      });
      toast.success(
        `🏃 ריצה נרשמה! ${distKm ? distKm + " ק״מ" : ""}${paceDec ? "  ·  " + formatPace(paceDec) + " /ק״מ" : ""}`
      );
      setDistRaw(""); setMinsRaw(""); setSecsRaw("0"); setRunNotes("");
    } catch {
      toast.error("שגיאה בשמירה");
    }
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 space-y-4">
      {shareRun && (
        <ShareRunModal run={shareRun} onClose={() => setShareRun(null)} />
      )}

      {/* Title */}
      <div className="flex items-center gap-2">
        <Flame className="h-4 w-4 text-orange-400" />
        <p className="text-sm font-black text-white">יומן ריצה</p>
      </div>

      {/* Inputs */}
      <div className="space-y-2.5">

        {/* Distance */}
        <div className="flex items-center gap-2.5">
          <MapPin className="h-4 w-4 text-orange-400 shrink-0" />
          <div className="flex-1 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5">
            <input
              type="text"
              inputMode="decimal"
              pattern="[0-9.]*"
              value={distRaw}
              onChange={(e) => setDistRaw(e.target.value)}
              onFocus={(e) => e.target.select()}
              placeholder="0.0"
              className="flex-1 bg-transparent text-sm font-bold text-white placeholder:text-white/20 outline-none text-left"
              dir="ltr"
            />
            <span className="text-xs font-bold text-orange-400/70 shrink-0">ק״מ</span>
          </div>
        </div>

        {/* Duration: minutes + seconds */}
        <div className="flex items-center gap-2.5">
          <Timer className="h-4 w-4 text-orange-400 shrink-0" />
          <div className="flex flex-1 gap-2">
            <div className="flex-1 flex items-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={minsRaw}
                onChange={(e) => setMinsRaw(e.target.value.replace(/\D/g, ""))}
                onFocus={(e) => e.target.select()}
                placeholder="0"
                className="w-full bg-transparent text-sm font-bold text-white placeholder:text-white/20 outline-none text-left"
                dir="ltr"
              />
              <span className="text-xs font-bold text-orange-400/70 shrink-0">דק׳</span>
            </div>
            <div className="w-24 flex items-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={secsRaw}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "");
                  const n = parseInt(v) || 0;
                  setSecsRaw(String(Math.min(59, n)));
                }}
                onFocus={(e) => e.target.select()}
                placeholder="0"
                className="w-full bg-transparent text-sm font-bold text-white placeholder:text-white/20 outline-none text-left"
                dir="ltr"
              />
              <span className="text-xs font-bold text-orange-400/70 shrink-0">שנ׳</span>
            </div>
          </div>
        </div>

        {/* Real-time pace pill */}
        {paceDec && (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-orange-500/25 bg-orange-500/10 px-4 py-3 transition-all">
            <span className="text-2xl font-black text-white tracking-tight">{formatPace(paceDec)}</span>
            <span className="text-sm font-bold text-orange-400">/ק״מ</span>
          </div>
        )}

        {/* Notes */}
        <input
          value={runNotes}
          onChange={(e) => setRunNotes(e.target.value)}
          placeholder="הערות (מסלול, תחושה...)..."
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/20 outline-none"
          dir="rtl"
        />

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={addWorkout.isPending || (!distKm && !totalMins)}
          className="w-full py-3.5 rounded-2xl bg-orange-500 text-white font-black text-sm disabled:opacity-40 hover:bg-orange-400 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 min-h-[44px]"
        >
          {addWorkout.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          שמור ריצה
        </button>
      </div>

      {/* Recent runs list */}
      {(runs ?? []).length > 0 && (
        <div className="space-y-2 pt-1 border-t border-white/5">
          <p className="text-[11px] font-bold text-white/35 uppercase tracking-wider pt-1">ריצות אחרונות</p>
          <div className="space-y-1.5">
            {(runs ?? []).slice(0, 6).map((r: any) => {
              const rd   = r.run;
              const pace = rd?.pace_per_km ? formatPace(Number(rd.pace_per_km)) : null;
              const dist = rd?.distance_km ? Number(rd.distance_km).toFixed(1) : null;
              return (
                <div key={r.id}
                  className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2.5"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {dist && (
                        <span className="text-sm font-black text-white">{dist} ק״מ</span>
                      )}
                      {pace && (
                        <span className="text-xs font-bold text-orange-400 bg-orange-400/10 rounded-lg px-1.5 py-0.5">
                          {pace} /ק״מ
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-white/30 mt-0.5">
                      {new Date(r.date).toLocaleDateString("he-IL", {
                        weekday: "short", day: "numeric", month: "numeric",
                      })}
                      {rd?.duration_minutes
                        ? `  ·  ${formatDurationHMS(Number(rd.duration_minutes))}`
                        : ""}
                    </p>
                  </div>
                  {/* Share button */}
                  <button
                    onClick={() =>
                      setShareRun({
                        date:             r.date,
                        distanceKm:      rd?.distance_km      ? Number(rd.distance_km)      : null,
                        durationMinutes: rd?.duration_minutes ? Number(rd.duration_minutes) : null,
                        paceDecimal:     rd?.pace_per_km      ? Number(rd.pace_per_km)      : null,
                        notes:           r.notes,
                      })
                    }
                    className="h-8 w-8 rounded-xl bg-white/8 flex items-center justify-center shrink-0 hover:bg-white/12 active:scale-90 transition-all"
                  >
                    <Share2 className="h-3.5 w-3.5 text-white/40" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Body Progress Gallery ────────────────────────────────────────────────────
type BodyAngle = "front" | "back" | "side";

const BODY_ANGLES: { key: BodyAngle; label: string; emoji: string }[] = [
  { key: "front", label: "קדמי",  emoji: "🧍" },
  { key: "back",  label: "אחורי", emoji: "🔄" },
  { key: "side",  label: "צד",    emoji: "↔️" },
];

function BodyProgressGallery() {
  const [angle,      setAngle]      = useState<BodyAngle>("front");
  const [newFile,    setNewFile]    = useState<File | null>(null);
  const [newPreview, setNewPreview] = useState<string | null>(null);
  const [notes,      setNotes]      = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: allPhotos, isLoading } = useBodyProgress();
  const addPhoto    = useAddBodyProgress();
  const deletePhoto = useDeleteBodyProgress();

  // Per-angle slice
  const anglePhotos = useMemo(
    () => (allPhotos ?? []).filter((p: any) => (p.angle ?? "front") === angle),
    [allPhotos, angle],
  );
  const ghostPhoto = anglePhotos[0] ?? null;

  // Clean up object URL on unmount or swap
  useEffect(() => {
    return () => { if (newPreview) URL.revokeObjectURL(newPreview); };
  }, [newPreview]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (newPreview) URL.revokeObjectURL(newPreview);
    setNewFile(file);
    setNewPreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const handleSave = async () => {
    if (!newFile) return toast.error("בחר תמונה");
    try {
      await addPhoto.mutateAsync({ file: newFile, angle, notes });
      const lbl = BODY_ANGLES.find((a) => a.key === angle)?.label ?? angle;
      toast.success(`📸 תמונה נשמרה — ${lbl}`);
      setNewFile(null); setNewPreview(null); setNotes("");
    } catch {/* handled in hook */}
  };

  const handleDiscard = () => {
    if (newPreview) URL.revokeObjectURL(newPreview);
    setNewFile(null); setNewPreview(null);
  };

  const handleDeleteWithConfirm = (p: any) => {
    toast.error("מחיקת תמונה?", {
      action: {
        label: "מחק",
        onClick: () => deletePhoto.mutate({ id: p.id, photoPath: p.photo_url }),
      },
      duration: 5000,
    });
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Camera className="h-4 w-4 text-violet-400" />
        <p className="text-sm font-black text-white">גלריית טרנספורמציה</p>
      </div>

      {/* Angle tabs */}
      <div className="flex gap-1 p-1 rounded-2xl bg-white/[0.04] border border-white/10">
        {BODY_ANGLES.map(({ key, label, emoji }) => (
          <button
            key={key}
            onClick={() => {
              setAngle(key);
              if (newPreview) URL.revokeObjectURL(newPreview);
              setNewFile(null); setNewPreview(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              angle === key
                ? "bg-violet-500 text-white shadow-lg shadow-violet-500/25"
                : "text-white/40 hover:text-white/65"
            }`}
          >
            {emoji} {label}
          </button>
        ))}
      </div>

      {/* Main: upload zone OR comparison */}
      {newPreview ? (
        /* ── Comparison: ghost (before) | new (after) ── */
        <div className="space-y-3">
          <div className="flex gap-2 h-52">
            {/* Before */}
            <div className="flex-1 rounded-2xl overflow-hidden relative">
              {ghostPhoto?.signedUrl ? (
                <img
                  src={ghostPhoto.signedUrl}
                  alt="לפני"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-white/5 flex items-center justify-center">
                  <p className="text-[10px] text-white/25">אין תמונה קודמת</p>
                </div>
              )}
              <div className="absolute bottom-0 inset-x-0 bg-black/55 py-1 flex items-center justify-center">
                <span className="text-[10px] font-bold text-white/55">
                  {ghostPhoto
                    ? new Date(ghostPhoto.date).toLocaleDateString("he-IL", {
                        day: "numeric", month: "numeric", year: "2-digit",
                      })
                    : "לפני"}
                </span>
              </div>
            </div>

            {/* After */}
            <div className="flex-1 rounded-2xl overflow-hidden relative">
              <img src={newPreview} alt="עכשיו" className="w-full h-full object-cover" />
              <div className="absolute bottom-0 inset-x-0 bg-emerald-500/55 py-1 flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">עכשיו</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="הערות (משקל, תחושה, תאריך...)..."
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/20 outline-none"
            dir="rtl"
          />

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleDiscard}
              className="flex-1 py-3 rounded-2xl border border-white/10 bg-white/5 text-sm font-bold text-white/50 hover:bg-white/8 active:scale-95 transition-all"
            >
              ביטול
            </button>
            <button
              onClick={handleSave}
              disabled={addPhoto.isPending}
              className="flex-1 py-3 rounded-2xl bg-violet-500 text-white font-black text-sm disabled:opacity-40 shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2 hover:bg-violet-400 active:scale-95 transition-all min-h-[44px]"
            >
              {addPhoto.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              שמור
            </button>
          </div>
        </div>
      ) : (
        /* ── Ghost overlay upload zone ── */
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-52 rounded-2xl border border-dashed border-white/20 relative overflow-hidden flex items-center justify-center group hover:border-violet-500/40 transition-all"
          >
            {/* Ghost image — low opacity background */}
            {ghostPhoto?.signedUrl && (
              <img
                src={ghostPhoto.signedUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                style={{ opacity: 0.20, filter: "blur(1.5px) saturate(0.7)" }}
              />
            )}
            {/* Overlay content */}
            <div className="relative z-10 flex flex-col items-center gap-2 pointer-events-none">
              <div className="h-12 w-12 rounded-2xl bg-white/12 flex items-center justify-center group-hover:bg-violet-500/20 transition-all">
                <Camera className="h-6 w-6 text-white/50 group-hover:text-violet-400 transition-all" />
              </div>
              <p className="text-xs font-medium text-white/45 group-hover:text-white/65 transition-all">
                {ghostPhoto ? "הוסף תמונה חדשה" : "צלם / בחר תמונה"}
              </p>
              {ghostPhoto && (
                <p className="text-[10px] text-violet-400/55">
                  תמונה קודמת:{" "}
                  {new Date(ghostPhoto.date).toLocaleDateString("he-IL", {
                    day: "numeric", month: "long",
                  })}
                </p>
              )}
            </div>
          </button>
        </>
      )}

      {/* History strip */}
      {!isLoading && anglePhotos.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-bold text-white/30 uppercase tracking-wider">
            היסטוריה — {BODY_ANGLES.find((a) => a.key === angle)?.label}
          </p>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {anglePhotos.map((p: any) => (
              <div key={p.id} className="shrink-0 w-20 h-20 rounded-xl overflow-hidden relative group">
                {p.signedUrl ? (
                  <img src={p.signedUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-white/10" />
                )}
                {/* Delete on hover/long-tap */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteWithConfirm(p); }}
                    className="h-7 w-7 rounded-lg bg-red-500/80 flex items-center justify-center hover:bg-red-500 active:scale-90 transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-white" />
                  </button>
                </div>
                {/* Date badge */}
                <div className="absolute bottom-0 inset-x-0 bg-black/50 py-0.5">
                  <p className="text-[8px] text-white/55 text-center">
                    {new Date(p.date).toLocaleDateString("he-IL", { day: "numeric", month: "numeric" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Progress Tab ─────────────────────────────────────────────────────────────
function ProgressTab() {
  return (
    <div className="px-4 pt-8 space-y-4 pb-4">
      <RunningLogSection />
      <WeightChart />
      <PRSection />
      <WorkoutHistoryStrip />
      <BodyProgressGallery />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════
function SportPage() {
  const [activeTab,        setActiveTab]        = useState<Tab>("dashboard");
  const [isTraining,       setIsTraining]       = useState(true);
  const [loadedTemplate,   setLoadedTemplate]   = useState<any>(null);
  const [pendingExercises, setPendingExercises] = useState<LibraryExercise[]>([]);

  const handleLoadTemplate = (t: any) => {
    setLoadedTemplate(t);
    setActiveTab("builder");
  };

  const handleAddExercisesToWorkout = (exs: LibraryExercise[]) => {
    setPendingExercises(exs);
    setActiveTab("builder");
  };

  return (
    <>
      <div
        dir="rtl"
        className="-mx-3 md:-mx-6 -mt-3 md:-mt-6 relative bg-cover bg-center"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2000&auto=format&fit=crop')`,
          minHeight: "100vh",
        }}
      >
        <div className="absolute inset-0 bg-black/40 pointer-events-none" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-emerald-500/15 blur-[120px]" />
          <div className="absolute bottom-40 -left-16 h-60 w-60 rounded-full bg-blue-500/10 blur-[100px]" />
        </div>

        <div className="relative z-10 pb-32 pt-2">
          {/* Sticky Tab Bar */}
          <div className="sticky top-0 z-10 px-4 py-2 bg-black/25 backdrop-blur-xl">
            <div className="flex gap-1 p-1 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
              {TABS.map((t) => (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  className={`flex-1 py-2 px-1 rounded-xl text-[11px] font-bold transition-all duration-200 ${
                    activeTab === t.key ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30" : "text-white/40 hover:text-white/70"}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {activeTab === "dashboard" && (
            <div className="px-4 pt-6 space-y-5">
              <DayStatusBanner isTraining={isTraining} onToggle={() => setIsTraining((v) => !v)} />
              <StreakBanner />
              <div className="space-y-4">
                <QuickAddRow />
                <QuickTemplatesRow onLoadTemplate={handleLoadTemplate} />
              </div>
              <StatsStrip />
              <WeekStrip />
            </div>
          )}

          {activeTab === "builder" && (
            <WorkoutBuilderTab
              externalTemplate={loadedTemplate}
              onExternalTemplateConsumed={() => setLoadedTemplate(null)}
              pendingExercises={pendingExercises}
              onPendingExercisesConsumed={() => setPendingExercises([])}
            />
          )}
          {activeTab === "library" && <ExerciseLibraryTab onAddToWorkout={handleAddExercisesToWorkout} />}
          {activeTab === "progress" && <ProgressTab />}
        </div>
      </div>

      <style>{`
        @keyframes sportPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
}
