import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import {
  Dumbbell, Play, CheckCircle2, Trophy, Flame, Clock,
  Target, Zap, ChevronRight, Plus, RotateCcw, Minus,
  ChevronDown, ChevronUp, Loader2, Star, X, BookOpen,
  TrendingUp, Scale, Medal, BarChart3, Camera,
  Pencil, Check, Trash2,
} from "lucide-react";
import {
  usePersonalRecords, useAddPersonalRecord,
  useWorkoutTemplates, useAddWorkoutTemplate, useDeleteWorkoutTemplate,
  useWeekWorkouts, useAddWorkout,
  useWeightEntries, useAddWeight, useDeleteWeight, useUpdateWeight,
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
  { key: "cardio",    label: "ריצה / קרדיו",  emoji: "🏃", color: "#f97316", image: "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=400&q=80", durations: [20, 30, 45] },
  { key: "strength",  label: "כוח",            emoji: "🏋️", color: "#10b981", image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80", durations: [45, 60, 75] },
  { key: "hiit",      label: "HIIT",           emoji: "⚡", color: "#eab308", image: "https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?w=400&q=80", durations: [15, 20, 30] },
  { key: "chest",     label: "חזה / כתפיים",  emoji: "💪", color: "#3b82f6", image: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&q=80", durations: [45, 60, 75] },
  { key: "back",      label: "גב / מתח",      emoji: "🦾", color: "#8b5cf6", image: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&q=80", durations: [45, 60, 75] },
  { key: "legs",      label: "רגליים",         emoji: "🦵", color: "#ec4899", image: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400&q=80", durations: [50, 60, 80] },
  { key: "core",      label: "ליבה / בטן",    emoji: "🎯", color: "#06b6d4", image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&q=80", durations: [15, 25, 40] },
  { key: "yoga",      label: "יוגה / גמישות", emoji: "🧘", color: "#a78bfa", image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&q=80", durations: [20, 45, 60] },
] as const;

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

// ─── Weekly day strip ─────────────────────────────────────────────────────────
const DAYS = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];
const TODAY_IDX = new Date().getDay();
const TODAY_NAME = new Date().toLocaleDateString("he-IL", { weekday: "long" });

const TODAY_PLAN = {
  name: "כוח עליון — חזה וכתפיים",
  duration: 60,
  exercises: [
    { name: "לחיצת חזה",    sets: 4, reps: "8"     },
    { name: "לחיצת כתפיים", sets: 3, reps: "10"    },
    { name: "פרפר",         sets: 3, reps: "12"    },
    { name: "מקבילים",      sets: 3, reps: "10-12" },
  ],
};

// ═══════════════════════════════════════════════════════════════════════
//  TAB 1 — DASHBOARD sub-components
// ═══════════════════════════════════════════════════════════════════════

function DayStatusBanner({ isTraining, onToggle }: { isTraining: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all duration-300 text-right ${
        isTraining ? "border-emerald-500/30 bg-emerald-500/8" : "border-border bg-card"
      }`}
    >
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isTraining ? "bg-emerald-500/20" : "bg-secondary/50"}`}>
        {isTraining ? <Flame className="h-5 w-5 text-emerald-500" /> : <RotateCcw className="h-5 w-5 text-muted-foreground" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-black text-foreground leading-tight">{isTraining ? "🔥 יום אימון" : "😴 יום מנוחה"}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{isTraining ? "כל הכבוד — לכו על זה!" : "מנוחה = התאוששות = גדילה"}</p>
      </div>
      <div className={`relative w-12 h-6 rounded-full shrink-0 transition-colors duration-300 ${isTraining ? "bg-emerald-500" : "bg-secondary/70"}`}>
        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-lg transition-transform duration-300 ${isTraining ? "translate-x-6" : "translate-x-0.5"}`} />
      </div>
    </button>
  );
}

function QuickWorkoutCard({ workout, onQuickLog }: { workout: (typeof QUICK_WORKOUTS)[number]; onQuickLog: (label: string, duration: number) => void }) {
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
      <button onClick={() => onQuickLog(workout.label, selDuration)}
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
  const handleQuickLog = async (label: string, duration: number) => {
    try {
      await addWorkout.mutateAsync({ category: label, duration_minutes: duration });
      toast.success(`✅ ${label} — ${duration} דקות נרשם!`, { duration: 2500 });
    } catch { toast.error("שגיאה בשמירת האימון"); }
  };
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-foreground">הוסף מהיר</p>
        <button className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
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

function TodayPlanCard({ isTraining }: { isTraining: boolean }) {
  const [started, setStarted] = useState(false);
  if (!isTraining) return (
    <div className="rounded-2xl border border-border bg-card p-5 text-center space-y-2">
      <span className="text-4xl">🌙</span>
      <p className="text-sm font-bold text-muted-foreground">יום מנוחה</p>
      <p className="text-[11px] text-muted-foreground/60">מתאושש היום — האימון הבא מחר</p>
    </div>
  );
  return (
    <div className={`rounded-2xl border p-4 space-y-4 transition-all ${started ? "border-sport/30 bg-sport/5" : "border-border bg-card"}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-sport/15 border border-sport/20 flex items-center justify-center">
            <Dumbbell className="h-4 w-4 text-sport" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">{TODAY_PLAN.name}</p>
            <p className="text-[11px] text-muted-foreground">{TODAY_NAME}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />{TODAY_PLAN.duration} דק׳
        </div>
      </div>
      <div className="rounded-xl bg-secondary/30 border border-border/50 divide-y divide-border/50">
        {TODAY_PLAN.exercises.map((ex) => (
          <div key={ex.name} className="flex items-center justify-between px-4 py-2.5">
            <span className="text-xs font-semibold text-foreground/80">{ex.name}</span>
            <span className="text-[10px] text-muted-foreground font-mono">{ex.sets}×{ex.reps}</span>
          </div>
        ))}
      </div>
      {!started ? (
        <button onClick={() => setStarted(true)} className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl bg-sport text-sport-foreground font-bold text-sm min-h-[44px] hover:opacity-90 active:scale-[0.98] transition-all">
          <Play className="h-4 w-4" />התחל אימון
        </button>
      ) : (
        <div className="flex items-center justify-center gap-2 py-3 text-sport">
          <CheckCircle2 className="h-5 w-5" />
          <span className="text-sm font-bold">האימון רץ — כל הכבוד! 💪</span>
        </div>
      )}
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
        <div key={label} className="rounded-xl border border-border bg-card p-3 text-center space-y-1.5">
          <div className="h-7 w-7 rounded-lg mx-auto flex items-center justify-center" style={{ background: color + "18" }}>
            <Icon className="h-3.5 w-3.5" style={{ color }} />
          </div>
          <p className="text-lg font-black text-foreground leading-none">{value}</p>
          <p className="text-[9px] text-muted-foreground font-medium">{label}</p>
          <p className="text-[8px] text-muted-foreground/60">{sub}</p>
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
    <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><Zap className="h-4 w-4 text-sport" /><p className="text-sm font-bold text-foreground">שבוע אימונים</p></div>
        <span className="text-[11px] font-semibold text-muted-foreground">{done}/{goal} אימונים</span>
      </div>
      <div className="h-1.5 rounded-full bg-secondary/60 overflow-hidden">
        <div className="h-full rounded-full bg-sport transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between">
        {DAYS.map((day, i) => {
          const isToday   = i === TODAY_IDX;
          const completed = completedDays.includes(i);
          return (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[9px] font-bold transition-all ${
                completed ? "bg-sport text-sport-foreground"
                : isToday  ? "border-2 border-sport/60 text-sport bg-sport/10"
                : "border border-border text-muted-foreground/40"}`}>
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
//  TAB 2 — BUILDER  (AI Planner + Custom Workout)
// ═══════════════════════════════════════════════════════════════════════

/** Smart stepper button */
function Stepper({ value, onChange, min = 0, max = 999, step = 1, suffix = "" }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; suffix?: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <button onClick={() => onChange(Math.max(min, value - step))}
        className="h-8 w-8 rounded-xl bg-secondary/50 border border-border flex items-center justify-center text-muted-foreground hover:bg-secondary active:scale-95 transition-all">
        <Minus className="h-3.5 w-3.5" />
      </button>
      <div className="w-14 text-center">
        <span className="text-sm font-black text-foreground">{value}</span>
        {suffix && <span className="text-[10px] text-muted-foreground ml-0.5">{suffix}</span>}
      </div>
      <button onClick={() => onChange(Math.min(max, value + step))}
        className="h-8 w-8 rounded-xl bg-secondary/50 border border-border flex items-center justify-center text-muted-foreground hover:bg-secondary active:scale-95 transition-all">
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

interface BuilderEx { name: string; sets: number; reps: number; weight_kg: number; }

function BuilderExerciseRow({ ex, onChange, onRemove, idx }: {
  ex: BuilderEx; onChange: (v: BuilderEx) => void; onRemove: () => void; idx: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 space-y-3">
      <div className="flex items-center gap-2">
        <div className="h-6 w-6 rounded-lg bg-sport/15 flex items-center justify-center text-[10px] font-black text-sport shrink-0">
          {idx + 1}
        </div>
        <input value={ex.name} onChange={(e) => onChange({ ...ex, name: e.target.value })}
          placeholder="שם תרגיל..."
          className="flex-1 bg-transparent text-sm font-semibold text-foreground placeholder:text-muted-foreground/50 outline-none border-b border-border pb-0.5"
          dir="rtl" />
        <button onClick={onRemove} className="h-6 w-6 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive hover:bg-destructive/20 shrink-0">
          <X className="h-3 w-3" />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="space-y-1">
          <p className="text-[9px] text-muted-foreground font-medium">סטים</p>
          <Stepper value={ex.sets} onChange={(v) => onChange({ ...ex, sets: v })} min={1} max={10} />
        </div>
        <div className="space-y-1">
          <p className="text-[9px] text-muted-foreground font-medium">חזרות</p>
          <Stepper value={ex.reps} onChange={(v) => onChange({ ...ex, reps: v })} min={1} max={50} />
        </div>
        <div className="space-y-1">
          <p className="text-[9px] text-muted-foreground font-medium">משקל</p>
          <Stepper value={ex.weight_kg} onChange={(v) => onChange({ ...ex, weight_kg: v })} min={0} max={300} step={2.5} suffix="kg" />
        </div>
      </div>
    </div>
  );
}

const BUILDER_GOALS = ["בניית שריר", "ירידה במשקל", "כוח מקסימלי", "סיבולת"];
const EQUIPMENT_OPTS = ["חדר כושר", "ביתי", "ללא ציוד"];
const DAYS_OPTS = [3, 4, 5, 6];

function WorkoutBuilderTab() {
  const [subTab, setSubTab] = useState<"ai" | "custom">("custom");

  const [workoutName, setWorkoutName]   = useState("");
  const [exercises, setExercises]       = useState<BuilderEx[]>([
    { name: "", sets: 3, reps: 10, weight_kg: 0 },
  ]);
  const addTemplate   = useAddWorkoutTemplate();
  const addWorkout    = useAddWorkout();
  const { data: templates } = useWorkoutTemplates();
  const deleteTemplate = useDeleteWorkoutTemplate();

  const updateEx = (i: number, v: BuilderEx) => setExercises((prev) => prev.map((e, idx) => idx === i ? v : e));
  const removeEx = (i: number) => setExercises((prev) => prev.filter((_, idx) => idx !== i));
  const addEx    = () => setExercises((prev) => [...prev, { name: "", sets: 3, reps: 10, weight_kg: 0 }]);

  const handleSaveTemplate = async () => {
    if (!workoutName.trim()) return toast.error("תן שם לאימון");
    const filled = exercises.filter((e) => e.name.trim());
    if (!filled.length) return toast.error("הוסף לפחות תרגיל אחד");
    try {
      await addTemplate.mutateAsync({ name: workoutName, category: "custom", exercises: filled });
      toast.success("תבנית נשמרה ✅");
      setWorkoutName(""); setExercises([{ name: "", sets: 3, reps: 10, weight_kg: 0 }]);
    } catch { toast.error("שגיאה בשמירה"); }
  };

  const handleLogNow = async () => {
    if (!workoutName.trim()) return toast.error("תן שם לאימון");
    const filled = exercises.filter((e) => e.name.trim());
    if (!filled.length) return toast.error("הוסף לפחות תרגיל אחד");
    try {
      await addWorkout.mutateAsync({ category: workoutName, exercises: filled });
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
        goal: aiGoal,
        daysPerWeek: aiDays,
        equipment: aiEquip,
        constraints: aiConstraints || "אין",
        recentPRs: (prs ?? []).slice(0, 5).map((p: any) => ({ exercise_name: p.exercise_name, value: p.value, unit: p.unit })),
      });
      setAiPlan(plan);
      setExpandedDay(0);
    } catch { toast.error("שגיאה ביצירת תוכנית, נסה שנית"); }
    finally { setAiLoading(false); }
  };

  return (
    <div className="px-4 pt-4 space-y-4">
      {/* Sub-tab switcher */}
      <div className="flex gap-1 p-1 rounded-xl border border-border bg-secondary/30">
        {([["custom", "🏗️ בנה אימון"], ["ai", "🤖 AI Planner"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setSubTab(k)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${subTab === k ? "bg-sport text-sport-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {l}
          </button>
        ))}
      </div>

      {/* ── CUSTOM BUILDER ── */}
      {subTab === "custom" && (
        <div className="space-y-4">
          {(templates ?? []).length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-muted-foreground">תבניות שמורות</p>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {(templates ?? []).map((t: any) => (
                  <div key={t.id} className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card">
                    <button onClick={() => handleLoadTemplate(t)} className="text-xs font-semibold text-foreground hover:text-sport whitespace-nowrap">{t.name}</button>
                    <button onClick={() => deleteTemplate.mutate(t.id)} className="text-destructive/60 hover:text-destructive"><X className="h-3 w-3" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-border bg-card px-4 py-3">
            <input value={workoutName} onChange={(e) => setWorkoutName(e.target.value)}
              placeholder="שם האימון (למשל: כוח עליון)"
              className="w-full bg-transparent text-sm font-bold text-foreground placeholder:text-muted-foreground/50 outline-none text-right"
              dir="rtl" />
          </div>

          <div className="space-y-3">
            {exercises.map((ex, i) => (
              <BuilderExerciseRow key={i} ex={ex} idx={i} onChange={(v) => updateEx(i, v)} onRemove={() => removeEx(i)} />
            ))}
          </div>

          <button onClick={addEx}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border text-muted-foreground hover:border-sport/40 hover:text-sport transition-all text-sm font-semibold">
            <Plus className="h-4 w-4" />הוסף תרגיל
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={handleSaveTemplate} disabled={addTemplate.isPending}
              className="flex items-center justify-center gap-2 py-3 rounded-xl border border-border bg-card text-foreground text-sm font-bold hover:bg-secondary/50 active:scale-[0.98] transition-all">
              <Star className="h-4 w-4 text-amber-500" />שמור תבנית
            </button>
            <button onClick={handleLogNow} disabled={addWorkout.isPending}
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-sport text-sport-foreground text-sm font-bold hover:opacity-90 active:scale-[0.98] transition-all">
              <Play className="h-4 w-4" />רשום עכשיו
            </button>
          </div>
        </div>
      )}

      {/* ── AI PLANNER ── */}
      {subTab === "ai" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-muted-foreground">מטרה</p>
              <div className="grid grid-cols-2 gap-2">
                {BUILDER_GOALS.map((g) => (
                  <button key={g} onClick={() => setAiGoal(g)}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${aiGoal === g ? "border-sport/50 bg-sport/10 text-sport" : "border-border bg-secondary/30 text-muted-foreground"}`}>
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-bold text-muted-foreground">ימי אימון בשבוע</p>
              <div className="flex gap-2">
                {DAYS_OPTS.map((d) => (
                  <button key={d} onClick={() => setAiDays(d)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-black border transition-all ${aiDays === d ? "border-sport/50 bg-sport/10 text-sport" : "border-border bg-secondary/30 text-muted-foreground"}`}>
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-bold text-muted-foreground">ציוד זמין</p>
              <div className="flex gap-2">
                {EQUIPMENT_OPTS.map((e) => (
                  <button key={e} onClick={() => setAiEquip(e)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${aiEquip === e ? "border-sport/50 bg-sport/10 text-sport" : "border-border bg-secondary/30 text-muted-foreground"}`}>
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-bold text-muted-foreground">מגבלות / פציעות (אופציונלי)</p>
              <input value={aiConstraints} onChange={(e) => setAiConstraints(e.target.value)}
                placeholder="למשל: כאב בכתף ימין, אין ריצה..."
                className="w-full rounded-xl border border-border bg-secondary/30 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-sport/50 focus:ring-1 focus:ring-sport/30"
                dir="rtl" />
            </div>

            <button onClick={handleGeneratePlan} disabled={aiLoading}
              className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl bg-sport text-sport-foreground font-bold text-sm min-h-[44px] hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60">
              {aiLoading ? <><Loader2 className="h-4 w-4 animate-spin" />יוצר תוכנית...</> : <><Zap className="h-4 w-4" />צור תוכנית שבועית</>}
            </button>
          </div>

          {aiPlan && (
            <div className="space-y-3">
              <div className="rounded-xl border border-sport/20 bg-sport/5 p-3">
                <p className="text-xs text-sport font-semibold">{aiPlan.summary}</p>
              </div>
              {aiPlan.workouts.map((w, i) => (
                <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
                  <button onClick={() => setExpandedDay(expandedDay === i ? null : i)}
                    className="w-full flex items-center justify-between px-4 py-3.5 text-right">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-xl bg-sport/10 border border-sport/20 flex items-center justify-center text-xs font-black text-sport">{i + 1}</div>
                      <div>
                        <p className="text-sm font-bold text-foreground">{w.day}</p>
                        <p className="text-[10px] text-muted-foreground">{w.name} · {w.duration_minutes} דק׳</p>
                      </div>
                    </div>
                    {expandedDay === i ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </button>
                  {expandedDay === i && (
                    <div className="border-t border-border divide-y divide-border/50">
                      {w.exercises.map((ex, j) => (
                        <div key={j} className="flex items-center justify-between px-4 py-2.5">
                          <div>
                            <p className="text-xs font-semibold text-foreground/80">{ex.name}</p>
                            {ex.notes && <p className="text-[10px] text-muted-foreground mt-0.5">{ex.notes}</p>}
                          </div>
                          <span className="text-[10px] font-mono text-sport">{ex.sets}×{ex.reps}{ex.weight_kg ? ` @ ${ex.weight_kg}kg` : ""}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {aiPlan.tips?.length > 0 && (
                <div className="rounded-xl border border-border bg-card p-3 space-y-1.5">
                  <p className="text-[10px] font-bold text-muted-foreground">טיפים מה-AI</p>
                  {aiPlan.tips.map((tip, i) => (
                    <p key={i} className="text-xs text-foreground/70">• {tip}</p>
                  ))}
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

function ExerciseModal({ ex, onClose }: { ex: LibraryExercise; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg mx-auto rounded-t-3xl border-t border-x border-border bg-card p-5 space-y-4 pb-10"
        onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full bg-border mx-auto" />

        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-foreground">{ex.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{ex.muscles}</p>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-xl bg-secondary/50 flex items-center justify-center text-muted-foreground hover:bg-secondary shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          {[["סטים", ex.defaultSets], ["חזרות", ex.defaultReps], ["ציוד", ex.equipment]].map(([label, val]) => (
            <div key={String(label)} className="rounded-xl border border-border bg-secondary/30 p-2.5">
              <p className="text-[9px] text-muted-foreground">{label}</p>
              <p className="text-sm font-bold text-foreground mt-0.5">{val}</p>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-bold text-muted-foreground">💡 טיפים לביצוע נכון</p>
          {ex.tips.map((tip, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="h-5 w-5 rounded-full bg-sport/15 text-sport text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
              <p className="text-xs text-foreground/80">{tip}</p>
            </div>
          ))}
        </div>

        <a href={`https://www.youtube.com/results?search_query=${ex.youtubeQuery}`} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-500 font-bold text-sm hover:bg-red-500/15 transition-all min-h-[44px]">
          <span>▶</span>סרטון הדרכה ב-YouTube
        </a>
      </div>
    </div>
  );
}

type LibraryWorkoutType = "weights" | "calisthenics";

function ExerciseLibraryTab() {
  const [workoutType, setWorkoutType]     = useState<LibraryWorkoutType>("weights");
  const [selectedGroup, setSelectedGroup] = useState<MuscleGroup | null>(null);
  const [selectedEx, setSelectedEx]       = useState<LibraryExercise | null>(null);

  const groups = workoutType === "weights" ? MUSCLE_GROUPS : CALISTHENICS_MUSCLE_GROUPS;

  const handleTypeChange = (t: LibraryWorkoutType) => {
    setWorkoutType(t);
    setSelectedGroup(null);
    setSelectedEx(null);
  };

  return (
    <div className="px-4 pt-4 space-y-4">
      {/* Workout type tabs */}
      <div className="flex gap-1 p-1 rounded-xl border border-border bg-secondary/30">
        {([
          { key: "weights" as const,      label: "🏋️ חדר כושר"  },
          { key: "calisthenics" as const, label: "🤸 קלסטניקס"  },
        ]).map(({ key, label }) => (
          <button key={key} onClick={() => handleTypeChange(key)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
              workoutType === key
                ? "bg-sport text-sport-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}>
            {label}
          </button>
        ))}
      </div>

      {!selectedGroup ? (
        <>
          <p className="text-sm font-bold text-foreground">בחר קבוצת שרירים</p>
          <div className="grid grid-cols-2 gap-3">
            {groups.map((g) => (
              <button key={g.key} onClick={() => setSelectedGroup(g)}
                className="rounded-xl border border-border bg-card p-4 text-right flex items-center gap-3 hover:border-sport/30 hover:bg-sport/5 active:scale-[0.97] transition-all">
                <div className="h-11 w-11 rounded-xl flex items-center justify-center text-2xl shrink-0" style={{ background: g.color + "18" }}>
                  {g.emoji}
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{g.label}</p>
                  <p className="text-[10px] text-muted-foreground">{g.exercises.length} תרגילים</p>
                </div>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedGroup(null)}
              className="h-8 w-8 rounded-xl bg-secondary/50 border border-border flex items-center justify-center text-muted-foreground hover:bg-secondary">
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xl">{selectedGroup.emoji}</span>
              <p className="text-sm font-bold text-foreground">{selectedGroup.label}</p>
            </div>
          </div>
          <div className="space-y-2">
            {selectedGroup.exercises.map((ex) => (
              <button key={ex.name} onClick={() => setSelectedEx(ex)}
                className="w-full rounded-xl border border-border bg-card p-4 text-right flex items-center justify-between gap-3 hover:border-sport/30 hover:bg-sport/5 active:scale-[0.98] transition-all">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">{ex.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{ex.muscles}</p>
                  <div className="flex gap-2 mt-1.5">
                    <span className="text-[9px] px-2 py-0.5 rounded-full border border-border bg-secondary/30 text-muted-foreground">{ex.equipment}</span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full border border-sport/20 bg-sport/8 text-sport">{ex.defaultSets}×{ex.defaultReps}</span>
                  </div>
                </div>
                <BookOpen className="h-4 w-4 text-muted-foreground/50 shrink-0" />
              </button>
            ))}
          </div>
        </>
      )}

      {selectedEx && <ExerciseModal ex={selectedEx} onClose={() => setSelectedEx(null)} />}
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

  const chartData = [...(entries ?? [])]
    .reverse()
    .slice(-14)
    .map((e: any) => ({
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
    <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-blue-500" />
          <p className="text-sm font-bold text-foreground">מעקב משקל</p>
        </div>
        <div className="flex items-center gap-2">
          {(entries ?? []).length > 0 && (
            <button onClick={() => setShowList((v) => !v)}
              className="text-[10px] text-muted-foreground hover:text-foreground font-semibold transition-colors">
              {showList ? "הסתר רשימה" : "ערוך / מחק"}
            </button>
          )}
          <button onClick={() => setShowAdd((v) => !v)}
            className="h-7 w-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 hover:bg-blue-500/20">
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Current weight display */}
      {latest && (
        <div className="flex items-end gap-3">
          <p className="text-4xl font-black text-foreground">{latest.weight_kg}<span className="text-lg text-muted-foreground ml-1">kg</span></p>
          {delta !== null && (
            <span className={`text-sm font-bold mb-1 ${Number(delta) < 0 ? "text-emerald-500" : Number(delta) > 0 ? "text-destructive" : "text-muted-foreground"}`}>
              {Number(delta) > 0 ? "+" : ""}{delta}kg
            </span>
          )}
        </div>
      )}

      {/* Add weight */}
      {showAdd && (
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 flex items-center gap-3">
          <Stepper value={newWeight} onChange={setNewWeight} min={30} max={250} step={0.5} suffix="kg" />
          <button onClick={handleAdd} disabled={addWeight.isPending}
            className="flex-1 py-2 rounded-xl bg-blue-500 text-white font-bold text-sm hover:bg-blue-400 active:scale-95 transition-all">
            {addWeight.isPending ? "שומר..." : "שמור"}
          </button>
        </div>
      )}

      {/* Edit/delete list */}
      {showList && (
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {(entries ?? []).map((e: any) => (
            <div key={e.id} className="flex items-center justify-between px-3 py-2 rounded-xl border border-border bg-secondary/20">
              {editingId === e.id ? (
                <>
                  <input
                    type="number" step="0.1" value={editValue}
                    onChange={(ev) => setEditValue(ev.target.value)}
                    className="w-24 rounded-lg bg-secondary/50 border border-blue-500/40 px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500/40"
                    dir="ltr" autoFocus
                  />
                  <div className="flex items-center gap-1">
                    <button onClick={handleSaveEdit} disabled={updateWeight.isPending}
                      className="h-7 w-7 rounded-lg bg-emerald-500/15 text-emerald-600 flex items-center justify-center hover:bg-emerald-500/25 disabled:opacity-50">
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setEditingId(null)}
                      className="h-7 w-7 rounded-lg bg-secondary/50 text-muted-foreground flex items-center justify-center hover:bg-secondary">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-foreground" dir="ltr">{e.weight_kg} kg</span>
                    <span className="text-[10px] text-muted-foreground">{new Date(e.date).toLocaleDateString("he-IL")}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setEditingId(e.id); setEditValue(String(e.weight_kg)); }}
                      className="h-7 w-7 rounded-lg bg-secondary/30 text-muted-foreground flex items-center justify-center hover:bg-secondary hover:text-sport">
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button onClick={() => deleteWeight.mutate(e.id, { onSuccess: () => toast.success("נמחק") })}
                      className="h-7 w-7 rounded-lg bg-secondary/30 text-muted-foreground flex items-center justify-center hover:bg-destructive/10 hover:text-destructive">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Chart */}
      {chartData.length > 1 ? (
        <ResponsiveContainer width="100%" height={140}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} axisLine={false} tickLine={false} />
            <YAxis domain={["auto", "auto"]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} axisLine={false} tickLine={false} width={30} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, color: "hsl(var(--foreground))", fontSize: 11 }} />
            <Line type="monotone" dataKey="kg" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6", r: 3 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[140px] flex items-center justify-center">
          <p className="text-xs text-muted-foreground">הוסף לפחות 2 מדידות לגרף</p>
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
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Medal className="h-4 w-4 text-amber-500" />
          <p className="text-sm font-bold text-foreground">שיאים אישיים</p>
        </div>
        <button onClick={() => setShowForm((v) => !v)}
          className="h-7 w-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 hover:bg-amber-500/20">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 space-y-3">
          <input value={prName} onChange={(e) => setPrName(e.target.value)} placeholder="שם התרגיל..."
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none border-b border-border pb-1" dir="rtl" />
          <div className="flex items-center gap-3">
            <Stepper value={prValue} onChange={setPrValue} min={1} max={999} step={1} suffix={prUnit} />
            <select value={prUnit} onChange={(e) => setPrUnit(e.target.value)}
              className="bg-secondary/50 border border-border rounded-xl text-xs text-foreground px-2 py-1.5 outline-none">
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
          <p className="text-xs text-muted-foreground mt-2">אין שיאים עדיין — הוסף את הראשון!</p>
        </div>
      ) : (
        <div className="divide-y divide-border/50">
          {(prs ?? []).slice(0, 8).map((pr: any) => (
            <div key={pr.id} className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-2">
                <Trophy className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span className="text-xs font-semibold text-foreground/80">{pr.exercise_name}</span>
              </div>
              <div className="text-left">
                <span className="text-sm font-black text-amber-500">{pr.value}</span>
                <span className="text-[10px] text-muted-foreground ml-1">{pr.unit}</span>
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
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-sport" />
        <p className="text-sm font-bold text-foreground">היסטוריית אימונים</p>
      </div>
      {list.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">אין אימונים השבוע עדיין</p>
      ) : (
        <div className="space-y-2">
          {list.map((w) => (
            <div key={w.id} className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
              <div>
                <p className="text-xs font-bold text-foreground/80">{w.category}</p>
                <p className="text-[10px] text-muted-foreground">{new Date(w.date).toLocaleDateString("he-IL", { weekday: "short", day: "numeric", month: "numeric" })}</p>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Clock className="h-3 w-3" />
                {w.duration_minutes || "—"} דק׳
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProgressTab() {
  return (
    <div className="px-4 pt-4 space-y-4">
      <WeightChart />
      <PRSection />
      <WorkoutHistoryStrip />

      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Camera className="h-4 w-4 text-violet-500" />
          <p className="text-sm font-bold text-foreground">גלריית טרנספורמציה</p>
        </div>
        <div className="h-24 rounded-xl border border-dashed border-border flex items-center justify-center">
          <div className="text-center">
            <Camera className="h-6 w-6 text-muted-foreground/30 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground/50">העלאת תמונות — בקרוב</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════
function SportPage() {
  const [activeTab,  setActiveTab]  = useState<Tab>("dashboard");
  const [isTraining, setIsTraining] = useState(true);

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

        {/* Sticky Tab Bar */}
        <div className="sticky top-0 z-10 px-4 py-2 bg-black/30 backdrop-blur-xl border-b border-white/10">
          <div className="flex gap-1 p-1 rounded-xl bg-secondary/30">
            {TABS.map((t) => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`flex-1 py-2 px-1 rounded-lg text-[11px] font-bold transition-all duration-200 ${
                  activeTab === t.key ? "bg-sport text-sport-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative z-10 pb-32">
          {/* TAB 1 */}
          {activeTab === "dashboard" && (
            <div className="px-4 pt-4 space-y-4">
              <DayStatusBanner isTraining={isTraining} onToggle={() => setIsTraining((v) => !v)} />
              <QuickAddRow />
              <div className="space-y-2">
                <p className="text-sm font-bold text-foreground">אימון היום</p>
                <TodayPlanCard isTraining={isTraining} />
              </div>
              <StatsStrip />
              <WeekStrip />
            </div>
          )}

          {/* TAB 2 */}
          {activeTab === "builder" && <WorkoutBuilderTab />}

          {/* TAB 3 */}
          {activeTab === "library" && <ExerciseLibraryTab />}

          {/* TAB 4 */}
          {activeTab === "progress" && <ProgressTab />}
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
}
