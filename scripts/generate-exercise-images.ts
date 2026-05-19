/**
 * Exercise image generator — DALL-E 3
 *
 * Usage:
 *   bun scripts/generate-exercise-images.ts --batch chest    # generate chest exercises
 *   bun scripts/generate-exercise-images.ts --batch back
 *   bun scripts/generate-exercise-images.ts --batch shoulders
 *   bun scripts/generate-exercise-images.ts --batch arms
 *   bun scripts/generate-exercise-images.ts --batch legs
 *   bun scripts/generate-exercise-images.ts --batch core
 *   bun scripts/generate-exercise-images.ts --all            # all exercises
 *
 * Style: Black & white anatomical line drawing — same style as Wger diagrams
 * Model: DALL-E 3, 1024x1024, standard quality
 * Cost:  ~$0.04 per image
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// ─── Load .env.local ─────────────────────────────────────────────────────────
const envFile = fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf-8");
const env: Record<string, string> = {};
for (const line of envFile.split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
}

const OPENAI_API_KEY = env.OPENAI_API_KEY ?? "";
const SUPABASE_URL = env.VITE_SUPABASE_URL ?? "";
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const BUCKET = "exercise-images";
const OUTPUT_FILE = path.join(process.cwd(), "src/data/exercise-image-urls.json");

if (!OPENAI_API_KEY) { console.error("❌ Missing OPENAI_API_KEY in .env.local"); process.exit(1); }
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) { console.error("❌ Missing Supabase credentials"); process.exit(1); }

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ─── Slug helper ─────────────────────────────────────────────────────────────
function toSlug(hint: string): string {
  return hint.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ─── makeEx helper — auto-deduplicates slugs ─────────────────────────────────
interface ExerciseEntry {
  name: string;        // key in exercise-image-urls.json (must match sport.tsx)
  englishName: string; // used in the DALL-E prompt
  slug: string;        // Supabase filename
  description: string; // movement description for the prompt
}

const _usedSlugs = new Set<string>([
  // Pre-register all explicit slugs from existing entries so makeEx won't collide
  "bench-press", "incline-dumbbell-press", "cable-crossover", "dumbbell-fly", "push-up",
  "pec-deck-machine", "high-to-low-cable-fly", "cable-crossover-wide", "single-arm-cable-fly",
  "incline-cable-fly", "low-to-high-cable-fly-2", "high-to-low-cable-fly-3",
  "iso-lateral-chest-press", "machine-incline-press",
  "pull-up", "barbell-row", "seated-cable-row", "lat-pulldown", "deadlift",
  "overhead-press", "lateral-raise", "front-raise", "face-pull", "arnold-press",
  "bicep-curl", "tricep-extension", "skull-crusher", "hammer-curl", "tricep-pushdown-v-bar",
  "squat", "lunges", "romanian-deadlift", "leg-press", "hip-thrust",
  "plank", "sit-up", "hanging-leg-raise", "cable-crunch", "russian-twist",
]);

function makeEx(name: string, englishName: string, slugOverride?: string): ExerciseEntry {
  const base = toSlug(slugOverride || englishName);
  let slug = base;
  let i = 2;
  while (_usedSlugs.has(slug)) { slug = base + "-" + i; i++; }
  _usedSlugs.add(slug);
  return { name, englishName, slug, description: "" };
}

// ─── Image prompt builder ─────────────────────────────────────────────────────
// Produces a consistent anatomical line-drawing style for every exercise.
function buildPrompt(exercise: ExerciseEntry): string {
  return [
    "Black and white anatomical line drawing of a person performing a " + exercise.englishName + ".",
    exercise.description || "",
    "Clean precise lines showing correct form and muscle engagement.",
    "White background, fitness manual diagram style, no color, no text, no labels, no watermark.",
    "Similar to classic exercise anatomy illustrations.",
  ].filter(s => s.length > 0).join(" ");
}

// ─── gpt-image-1 image generation (returns base64) ───────────────────────────
async function generateImage(prompt: string): Promise<Buffer | null> {
  try {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt,
        n: 1,
        size: "1024x1024",
        quality: "medium",
        output_format: "png",
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.warn("  ⚠ OpenAI error:", err);
      return null;
    }
    const data = await res.json() as { data: { b64_json?: string; url?: string }[] };
    const item = data.data[0];
    if (item?.b64_json) return Buffer.from(item.b64_json, "base64");
    if (item?.url) {
      const imgRes = await fetch(item.url);
      return Buffer.from(await imgRes.arrayBuffer());
    }
    return null;
  } catch (e) {
    console.warn("  ⚠ generateImage error:", e);
    return null;
  }
}

// ─── Upload buffer to Supabase ────────────────────────────────────────────────
async function uploadImage(slug: string, buffer: Buffer): Promise<string | null> {
  try {
    const fileName = `${slug}.png`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, buffer, { contentType: "image/png", upsert: true });

    if (error) { console.warn(`  ⚠ Upload failed: ${error.message}`); return null; }
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
    return data.publicUrl;
  } catch (e) {
    console.warn("  ⚠ uploadImage error:", e);
    return null;
  }
}

// ─── Exercise definitions ─────────────────────────────────────────────────────

// ── CHEST ─────────────────────────────────────────────────────────────────────
const CHEST: ExerciseEntry[] = [
  {
    name: "לחיצת חזה שכיבה",
    englishName: "Barbell Bench Press",
    slug: "bench-press",
    description: "Person lying on a flat bench, gripping a barbell with both hands, pressing it upward. Chest muscles (pectoralis major) fully engaged.",
  },
  {
    name: "לחיצת דמבלים משופעת",
    englishName: "Incline Dumbbell Press",
    slug: "incline-dumbbell-press",
    description: "Person on an incline bench (45 degrees), pressing two dumbbells upward. Upper chest muscles engaged.",
  },
  {
    name: "קרוסאובר (כבלים)",
    englishName: "Cable Crossover",
    slug: "cable-crossover",
    description: "Person standing between two cable machines, pulling the cables forward and crossing arms in front of the chest. Pectoral muscles contracted.",
  },
  {
    name: "פרפר (Fly)",
    englishName: "Dumbbell Chest Fly",
    slug: "dumbbell-fly",
    description: "Person lying flat on bench, holding dumbbells with arms wide open to sides then bringing them together above chest in an arc motion. Chest stretch visible.",
  },
  {
    name: "שכיבות סמיכה",
    englishName: "Push-Up",
    slug: "push-up",
    description: "Person in plank position, lowering chest to floor and pushing back up. Arms at chest level, body straight. Classic push-up form.",
  },
  // ── 9 missing chest exercises ────────────────────────────────────────────────
  {
    name: "Pec Deck מכונה",
    englishName: "Pec Deck Butterfly Machine",
    slug: "pec-deck-machine",
    description: "Person seated at a pec deck machine, arms resting on padded levers at shoulder height, squeezing both arms together in front of the chest. Pectoralis major fully contracted at the midpoint.",
  },
  {
    name: "Cable Fly מגבוה",
    englishName: "High Cable Fly",
    slug: "high-to-low-cable-fly",
    description: "Person standing between two high cable pulleys, gripping handles set above head, pulling cables downward and forward in an arc crossing at hip level. Lower pectoral muscles fully engaged.",
  },
  {
    name: "Cable Crossover רחב",
    englishName: "Wide Cable Crossover",
    slug: "cable-crossover-wide",
    description: "Person standing between two cable machines, arms stretched wide open at shoulder height, pulling both cable handles together crossing at chest level. Full pectoral stretch to contraction.",
  },
  {
    name: "Single Arm Cable Fly",
    englishName: "Single Arm Cable Fly",
    slug: "single-arm-cable-fly",
    description: "Person standing sideways to a cable machine, pulling one cable handle across the body in a sweeping fly motion from an outstretched position to center of chest. One pectoral muscle isolated.",
  },
  {
    name: "Incline Cable Fly",
    englishName: "Incline Cable Fly",
    slug: "incline-cable-fly",
    description: "Person lying on an incline bench, pulling two low cable handles upward and together above the upper chest in an arc. Upper pectoral stretch and contraction shown clearly.",
  },
  {
    name: "Low to High Cable Fly",
    englishName: "Low to High Cable Fly",
    slug: "low-to-high-cable-fly-2",
    description: "Person standing, pulling cable handles from a low pulley position upward and across in front of the upper chest. Upper chest (clavicular head) and front deltoid engaged.",
  },
  {
    name: "High to Low Cable Fly",
    englishName: "High to Low Cable Fly",
    slug: "high-to-low-cable-fly-3",
    description: "Person standing, pulling cable handles from a high pulley position downward and across in front of the lower chest. Lower pectoral muscles (sternal head) fully engaged.",
  },
  {
    name: "Iso-Lateral Chest Press",
    englishName: "Iso-Lateral Chest Press Machine",
    slug: "iso-lateral-chest-press",
    description: "Person seated at an iso-lateral chest press machine, pushing two independent handles forward at chest height. Both pectoral muscles contracting simultaneously, elbows tracking outward.",
  },
  {
    name: "Machine Incline Press",
    englishName: "Machine Incline Chest Press",
    slug: "machine-incline-press",
    description: "Person seated at an incline chest press machine, gripping handles at upper chest height and pushing them upward at an incline angle. Upper chest and anterior deltoids engaged.",
  },
  // ── chest_upper subgroup ─────────────────────────────────────────────────────
  makeEx("לחיצת מוט משופעת (Incline Barbell)", "Incline Barbell Press"),
  makeEx("פרפר דמבלים משופע", "Incline Dumbbell Fly"),
  makeEx("כבל נמוך-לגבוה (Low-to-High)", "Low to High Cable Fly Variant", "low-to-high-cable-fly-4"),
  makeEx("Incline Smith Machine Press", "Incline Smith Machine Press"),
  makeEx("Squeeze Press משופע", "Incline Squeeze Press"),
  makeEx("Hammer Strength Incline Press", "Hammer Strength Incline Press"),
  makeEx("כבל חד-צדדי משופע", "Incline Unilateral Cable Fly"),
  makeEx("DB Pullover (Lat-Chest)", "Dumbbell Pullover for Chest and Lats"),
  makeEx("High-Incline 75° DB Press", "High Incline 75 Degree Dumbbell Press"),
  makeEx("Reverse Grip Bench Press", "Reverse Grip Bench Press"),
  makeEx("Cable Upper Chest Fly", "Cable Upper Chest Fly"),
  makeEx("Cable Chest Pullover", "Cable Chest Pullover"),
  makeEx("Landmine Press חזה", "Landmine Chest Press"),
  // ── chest_mid subgroup ───────────────────────────────────────────────────────
  makeEx("Cable Chest Press עמידה", "Standing Cable Chest Press"),
  makeEx("Cable Squeeze חזה", "Cable Chest Squeeze"),
  makeEx("Cable Fly Neutral Grip", "Neutral Grip Cable Fly"),
  makeEx("Cable Crossover Neutral", "Neutral Grip Cable Crossover"),
  makeEx("Pause Bench Press", "Pause Bench Press"),
  makeEx("Flat Dumbbell Fly", "Flat Dumbbell Fly"),
  makeEx("Cable Crossover אמצע", "Mid Cable Crossover"),
  makeEx("Neutral Grip DB Press", "Neutral Grip Dumbbell Press"),
  makeEx("Squeeze Press שטוח", "Flat Squeeze Press"),
  makeEx("Wide Grip Bench Press", "Wide Grip Bench Press"),
  makeEx("Close Grip Bench Press", "Close Grip Bench Press"),
  makeEx("Cable Fly מקביל לחזה", "Parallel Cable Chest Fly"),
  makeEx("Squeeze Press", "Squeeze Press"),
  // ── chest_lower subgroup ─────────────────────────────────────────────────────
  makeEx("High-to-Low Cable Fly", "High to Low Cable Fly", "high-to-low-cable-fly-5"),
  makeEx("לחיצת מוט שיפוע שלילי", "Decline Barbell Press"),
  makeEx("לחיצת דמבלים שיפוע שלילי", "Decline Dumbbell Press"),
  makeEx("Decline Dumbbell Fly", "Decline Dumbbell Fly"),
  makeEx("Chest Dips מקבילים", "Chest Dips on Parallel Bars"),
  makeEx("Decline Smith Machine Press", "Decline Smith Machine Press"),
  makeEx("Hammer Strength Decline", "Hammer Strength Decline Press"),
  makeEx("Cable Crossover תחתון", "Low Cable Crossover"),
  makeEx("Weighted Decline Push-up", "Weighted Decline Push-up"),
  // ── chest_machine subgroup ───────────────────────────────────────────────────
  makeEx("Pec Deck Single Arm", "Single Arm Pec Deck"),
  makeEx("Reverse Pec Deck", "Reverse Pec Deck Fly"),
  makeEx("Smith Machine Flat Press", "Smith Machine Flat Bench Press"),
  makeEx("Hammer Strength Flat Press", "Hammer Strength Flat Chest Press"),
  // ── Calisthenics chest ───────────────────────────────────────────────────────
  makeEx("שכיבות יהלום", "Diamond Push-up"),
  makeEx("שכיבות רחבות", "Wide Grip Push-up"),
  makeEx("Spiderman Push-up", "Spiderman Push-up"),
  makeEx("Hindu Push-up", "Hindu Push-up"),
  makeEx("Dive Bomber Push-up", "Dive Bomber Push-up"),
  makeEx("שכיבות עם עצירה (Pause Push-up)", "Pause Push-up"),
  makeEx("Walking Push-up", "Walking Push-up"),
  makeEx("Staggered Push-up", "Staggered Push-up"),
  makeEx("שכיבות פייק", "Pike Push-up"),
  makeEx("Pseudo Planche Push-up", "Pseudo Planche Push-up"),
  makeEx("שכיבות ירידה (Decline Push-up)", "Decline Push-up"),
  makeEx("Pike Fly Push-up", "Pike Fly Push-up"),
  makeEx("Korean Dip", "Korean Dip"),
  makeEx("שכיבות עלייה (Incline Push-up)", "Incline Push-up"),
  makeEx("שכיבות ארצ'ר", "Archer Push-up"),
  makeEx("Typewriter Push-up", "Typewriter Push-up"),
  makeEx("Archer Push-up מתקדם", "Advanced Archer Push-up"),
  makeEx("Tuck Planche", "Tuck Planche Hold"),
  makeEx("Straddle Planche", "Straddle Planche Hold"),
  makeEx("Planche Push-up (Tuck)", "Tuck Planche Push-up"),
  makeEx("Superman Push-up", "Superman Push-up"),
  makeEx("Wide Clap Push-up", "Wide Clap Push-up"),
  makeEx("Straddle Planche Push-up", "Straddle Planche Push-up"),
  makeEx("שכיבת יד אחת (One-Arm Push-up)", "One-Arm Push-up"),
  makeEx("שכיבות מחיאת כף (Clap Push-up)", "Clap Push-up"),
  makeEx("Tiger Bend Push-up", "Tiger Bend Push-up"),
  makeEx("Assisted One-Arm Push-up", "Assisted One-Arm Push-up"),
  makeEx("Ring Push-up", "Ring Push-up"),
  makeEx("Ring Fly", "Ring Fly"),
  makeEx("Ring Dip", "Ring Dip"),
  makeEx("Ring Push-up Lean", "Ring Push-up with Forward Lean"),
  makeEx("Ring Support Hold", "Ring Support Hold"),
  makeEx("Ring Push-up Narrow", "Narrow Ring Push-up"),
  makeEx("Ring Chest Fly Hold", "Ring Chest Fly Hold"),
  makeEx("Ring Push-up Lean Wide", "Wide Ring Push-up Lean"),
];

// ── BACK ──────────────────────────────────────────────────────────────────────
const BACK: ExerciseEntry[] = [
  {
    name: "מתח (Pull-up)",
    englishName: "Pull-Up",
    slug: "pull-up",
    description: "Person hanging from a bar, pulling their chin above the bar. Lat muscles and biceps engaged.",
  },
  {
    name: "חתירה (Barbell Row)",
    englishName: "Barbell Bent Over Row",
    slug: "barbell-row",
    description: "Person bent forward at 45 degrees, pulling a barbell up toward the lower chest. Back muscles (latissimus dorsi, rhomboids) engaged.",
  },
  {
    name: "חתירה כבלים ישיבה",
    englishName: "Seated Cable Row",
    slug: "seated-cable-row",
    description: "Person seated, pulling a cable handle toward their abdomen. Back straight, elbows back, rowing motion. Rhomboids and lats engaged.",
  },
  {
    name: "לט פולדאון",
    englishName: "Lat Pulldown",
    slug: "lat-pulldown",
    description: "Person seated at a machine, pulling a wide bar down to their upper chest. Lat muscles fully stretched and contracted.",
  },
  {
    name: "דדליפט",
    englishName: "Deadlift",
    slug: "deadlift",
    description: "Person standing, lifting a loaded barbell from the floor to hip height. Back straight, legs driving, full posterior chain engaged.",
  },
  // ── Lats ─────────────────────────────────────────────────────────────────────
  makeEx("Neutral Grip Lat Pulldown", "Neutral Grip Lat Pulldown"),
  makeEx("Single Arm Lat Pulldown", "Single Arm Lat Pulldown"),
  makeEx("Lat Pulldown אחיזה הפוכה", "Reverse Grip Lat Pulldown"),
  makeEx("Machine Pullover", "Machine Pullover"),
  makeEx("Cable Pullover גב", "Cable Pullover for Back"),
  makeEx("Cable Pullover (גב)", "Cable Straight Arm Pullover"),
  makeEx("Assisted Pull-up Machine", "Assisted Pull-up Machine"),
  makeEx("Hammer Strength Lat Pull", "Hammer Strength Lat Pulldown"),
  makeEx("Reverse Grip Lat Pulldown", "Reverse Grip Lat Pulldown", "reverse-grip-lat-pulldown-2"),
  makeEx("Rope Pulldown", "Rope Lat Pulldown"),
  makeEx("Unilateral Lat Pulldown", "Unilateral Lat Pulldown"),
  makeEx("Hammer Strength Pulldown", "Hammer Strength Pulldown"),
  makeEx("Kneeling Lat Pulldown", "Kneeling Lat Pulldown"),
  makeEx("One Arm Machine Pulldown", "One Arm Machine Lat Pulldown"),
  makeEx("Incline DB Row (Lat Focus)", "Incline Dumbbell Row Lat Focus"),
  makeEx("Prone Incline Cable Row", "Prone Incline Cable Row"),
  makeEx("Cable Straight Arm Row", "Cable Straight Arm Row"),
  makeEx("Straight Arm Pulldown", "Straight Arm Cable Pulldown"),
  makeEx("Lat Pulldown רחב", "Wide Grip Lat Pulldown"),
  makeEx("Lat Pulldown צר", "Close Grip Lat Pulldown"),
  // ── Traps / Mid Back ─────────────────────────────────────────────────────────
  makeEx("T-Bar Row", "T-Bar Row"),
  makeEx("Single Arm Dumbbell Row", "Single Arm Dumbbell Row"),
  makeEx("Chest Supported Row", "Chest Supported Row"),
  makeEx("Meadows Row", "Meadows Row"),
  makeEx("Seal Row", "Seal Row"),
  makeEx("Renegade Row", "Renegade Row"),
  makeEx("Pendlay Row", "Pendlay Row"),
  makeEx("Kroc Row", "Kroc Row"),
  makeEx("Hammer Strength Row", "Hammer Strength Row"),
  makeEx("Unilateral Cable Row", "Unilateral Cable Row"),
  makeEx("High Cable Row", "High Cable Row"),
  makeEx("Wide Grip Cable Row", "Wide Grip Cable Row"),
  makeEx("Reverse Grip Cable Row", "Reverse Grip Cable Row"),
  makeEx("Underhand Cable Row", "Underhand Cable Row"),
  makeEx("Machine Seated Row", "Machine Seated Row"),
  makeEx("Machine High Row", "Machine High Row"),
  makeEx("Barbell Row אחיזה רחבה", "Wide Grip Barbell Row"),
  makeEx("Yates Row", "Yates Row"),
  makeEx("T-Bar Row רחב", "Wide Grip T-Bar Row"),
  makeEx("DB Row כבד (Kroc Row)", "Heavy Dumbbell Kroc Row"),
  makeEx("Seated Cable Row רחב", "Wide Grip Seated Cable Row"),
  makeEx("Chest Supported DB Row", "Chest Supported Dumbbell Row"),
  makeEx("Single Arm Cable Row", "Single Arm Cable Row"),
  makeEx("Cross Body Cable Row", "Cross Body Cable Row"),
  makeEx("Chest Supported Machine Row", "Chest Supported Machine Row"),
  makeEx("Low Seated Cable Row", "Low Seated Cable Row"),
  // ── Lower Back ───────────────────────────────────────────────────────────────
  makeEx("Rack Pull", "Rack Pull"),
  makeEx("Back Extension", "Back Extension"),
  makeEx("Good Morning", "Good Morning"),
  makeEx("Hyperextension מכונה", "Machine Hyperextension"),
  makeEx("Cable Lower Back Ext", "Cable Lower Back Extension"),
  makeEx("Back Extension עם משקל", "Weighted Back Extension"),
  makeEx("Cable Pull-Through (גב)", "Cable Pull Through Back"),
  makeEx("Deficit Deadlift", "Deficit Deadlift"),
  // ── Calisthenics back ────────────────────────────────────────────────────────
  makeEx("מתח אחיזה הפוכה (Chin-up)", "Chin-Up"),
  makeEx("L-Sit Pull-up", "L-Sit Pull-up"),
  makeEx("Wide Grip Pull-up", "Wide Grip Pull-up"),
  makeEx("Commando Pull-up", "Commando Pull-up"),
  makeEx("Scapula Pull-up", "Scapula Pull-up"),
  makeEx("Passive Hang", "Passive Hang"),
  makeEx("Active Hang", "Active Hang Dead Hang"),
  makeEx("Negative Pull-up איטי", "Slow Negative Pull-up"),
  makeEx("Jumping Pull-up", "Jumping Pull-up"),
  makeEx("Hollow Body Pull-up", "Hollow Body Pull-up"),
  makeEx("Narrow Grip Pull-up", "Narrow Grip Pull-up"),
  makeEx("Hanging Scapular Retraction", "Hanging Scapular Retraction"),
  makeEx("מתח אוסטרלי (Row)", "Australian Pull-up Inverted Row"),
  makeEx("Pike Row", "Pike Row"),
  makeEx("Bat Wing Row Hold", "Bat Wing Row Isometric Hold"),
  makeEx("Muscle-Up (עליות כוח)", "Muscle-Up"),
  makeEx("Tuck Front Lever", "Tuck Front Lever Hold"),
  makeEx("Straddle Front Lever", "Straddle Front Lever Hold"),
  makeEx("Full Front Lever", "Full Front Lever"),
  makeEx("Front Lever Row", "Front Lever Row"),
  makeEx("Front Lever Pull-up", "Front Lever Pull-up"),
  makeEx("Typewriter Pull-up", "Typewriter Pull-up"),
  makeEx("Archer Pull-up", "Archer Pull-up"),
  makeEx("Explosive Pull-up", "Explosive Pull-up"),
  makeEx("One Arm Pull-up Neg", "One Arm Pull-up Negative"),
  makeEx("Negative Muscle-Up", "Negative Muscle-Up"),
  makeEx("Stacked Grip Pull-up", "Stacked Grip Pull-up"),
  makeEx("Tuck Front Lever Raises", "Tuck Front Lever Raises"),
  makeEx("Front Lever Raises (Full)", "Full Front Lever Raises"),
  makeEx("Tuck Back Lever Raises", "Tuck Back Lever Raises"),
  makeEx("Half Muscle-Up Hold", "Half Muscle-Up Hold"),
  makeEx("Ring Muscle-Up", "Ring Muscle-Up"),
  makeEx("Tuck Back Lever", "Tuck Back Lever Hold"),
  makeEx("Full Back Lever", "Full Back Lever"),
  makeEx("Skin the Cat", "Skin the Cat Rings"),
  makeEx("Ring Row", "Ring Row"),
  makeEx("Ring Pull-up", "Ring Pull-up"),
  makeEx("Ring Inverted Row", "Ring Inverted Row"),
  makeEx("One-Arm Ring Row", "One Arm Ring Row"),
  makeEx("Ring Tuck Row", "Ring Tuck Row"),
  makeEx("Ring Face Pull", "Ring Face Pull"),
  makeEx("Muscle-Up Transition Hold", "Muscle-Up Transition Hold"),
];

// ── SHOULDERS ─────────────────────────────────────────────────────────────────
const SHOULDERS: ExerciseEntry[] = [
  {
    name: "לחיצת כתפיים (OHP)",
    englishName: "Overhead Barbell Press",
    slug: "overhead-press",
    description: "Person standing, pressing a barbell from shoulder height straight overhead. Deltoid muscles fully engaged, core tight.",
  },
  {
    name: "הרמות צד (Lateral Raise)",
    englishName: "Dumbbell Lateral Raise",
    slug: "lateral-raise",
    description: "Person standing, raising two dumbbells out to the sides to shoulder height. Medial deltoid muscles engaged.",
  },
  {
    name: "הרמות קדמיות (Front Raise)",
    englishName: "Dumbbell Front Raise",
    slug: "front-raise",
    description: "Person standing, raising one or two dumbbells forward to shoulder height. Anterior deltoid engaged.",
  },
  {
    name: "Face Pull",
    englishName: "Cable Face Pull",
    slug: "face-pull",
    description: "Person pulling a rope attachment toward their face from a high cable position. Rear deltoids and rotator cuff engaged, elbows flared out.",
  },
  {
    name: "Arnold Press",
    englishName: "Arnold Dumbbell Press",
    slug: "arnold-press",
    description: "Person seated, holding dumbbells at shoulder height with palms facing inward, rotating palms forward while pressing overhead. All three deltoid heads engaged.",
  },
  makeEx("Cross Body Cable Raise", "Cross Body Cable Front Raise"),
  makeEx("Machine Shoulder Press", "Machine Shoulder Press"),
  makeEx("Machine Front Raise", "Machine Front Raise"),
  makeEx("Plate Front Raise", "Plate Front Raise"),
  makeEx("Cable Single Arm Front Raise", "Single Arm Cable Front Raise"),
  makeEx("Half-Kneeling Cable Press", "Half Kneeling Cable Press"),
  makeEx("Barbell OHP (Overhead Press)", "Barbell Overhead Press"),
  makeEx("Seated DB OHP", "Seated Dumbbell Overhead Press"),
  makeEx("הרמות קדמיות דמבלים", "Dumbbell Front Raise", "dumbbell-front-raise-2"),
  makeEx("הרמות קדמיות כבל", "Cable Front Raise"),
  makeEx("הרמות קדמיות מוט", "Barbell Front Raise"),
  makeEx("Z-Press", "Z-Press Overhead"),
  makeEx("Landmine Press כתפיים", "Landmine Shoulder Press"),
  makeEx("Standing DB OHP", "Standing Dumbbell Overhead Press"),
  makeEx("Cable Upright Row", "Cable Upright Row"),
  makeEx("Single Arm Cable Lateral", "Single Arm Cable Lateral Raise"),
  makeEx("Lying Cable Lateral Raise", "Lying Cable Lateral Raise"),
  makeEx("Leaning Cable Lateral", "Leaning Cable Lateral Raise"),
  makeEx("Cable Y-Raise", "Cable Y Raise"),
  makeEx("Cable Behind-Back Lateral", "Behind Back Cable Lateral Raise"),
  makeEx("Cable Rope Upright Row", "Cable Rope Upright Row"),
  makeEx("הרמות צד דמבלים", "Dumbbell Lateral Raise", "dumbbell-lateral-raise-2"),
  makeEx("הרמות צד ישיבה", "Seated Dumbbell Lateral Raise"),
  makeEx("הרמות צד כבל", "Cable Lateral Raise"),
  makeEx("Leaning Lateral Raise", "Leaning Lateral Raise"),
  makeEx("Upright Row מוט", "Barbell Upright Row"),
  makeEx("Upright Row כבל", "Cable Upright Row", "cable-upright-row-2"),
  makeEx("Upright Row דמבלים", "Dumbbell Upright Row"),
  makeEx("45° Incline Lateral Raise", "45 Degree Incline Lateral Raise"),
  makeEx("One Arm Cable Lateral", "One Arm Cable Lateral Raise"),
  makeEx("Barbell Shrug", "Barbell Shrug"),
  makeEx("DB Shrug", "Dumbbell Shrug"),
  makeEx("Rope Face Pull מתקדם", "Advanced Rope Face Pull"),
  makeEx("High Cable Rear Delt Fly", "High Cable Rear Delt Fly"),
  makeEx("Low Cable Rear Delt", "Low Cable Rear Delt Fly"),
  makeEx("Cable External Rotation", "Cable External Rotation"),
  makeEx("Machine Rear Delt Fly", "Machine Rear Delt Fly"),
  makeEx("Rear Delt Fly DB", "Dumbbell Rear Delt Fly"),
  makeEx("Pec Deck Reverse", "Reverse Pec Deck Rear Delt"),
  makeEx("Face Pull כבל", "Cable Face Pull", "cable-face-pull-2"),
  makeEx("Prone Incline Rear Delt Fly", "Prone Incline Rear Delt Fly"),
  makeEx("Machine Rear Delt", "Machine Rear Delt"),
  makeEx("Bent Over Lateral Raise", "Bent Over Lateral Raise"),
  makeEx("Dumbbell Rear Delt Row", "Dumbbell Rear Delt Row"),
  makeEx("Cable W-Raise", "Cable W Raise"),
  makeEx("Cable Rope Face Pull", "Cable Rope Face Pull"),
  makeEx("Cuban Press", "Cuban Press"),
  // ── Calisthenics shoulders ───────────────────────────────────────────────────
  makeEx("שכיבות פייק", "Pike Push-up", "pike-push-up-2"),
  makeEx("שכיבות ארצ'ר", "Archer Push-up for Shoulders", "archer-push-up-sh"),
  makeEx("Pike Push-up Elevated", "Elevated Pike Push-up"),
  makeEx("Box Pike Push-up", "Box Pike Push-up"),
  makeEx("Pike Push-up + Push-up Combo", "Pike Push-up to Push-up Combo"),
  makeEx("הנדסטנד Push-up (בקיר)", "Wall Handstand Push-up"),
  makeEx("HSPU בקיר", "Wall Handstand Push-up Variation", "wall-hspu-2"),
  makeEx("Strict HSPU", "Strict Handstand Push-up"),
  makeEx("Wall Walk", "Wall Walk Handstand"),
  makeEx("Handstand Hold בקיר", "Wall Handstand Hold"),
  makeEx("Freestanding Handstand", "Freestanding Handstand"),
  makeEx("Handstand Walk", "Handstand Walk"),
  makeEx("Korean HSPU", "Korean Handstand Push-up"),
  makeEx("HSPU אחיזה צרה (Tricep Focus)", "Narrow Handstand Push-up Tricep Focus"),
  makeEx("L-Sit to Press Prep", "L-Sit to Press Preparation"),
  makeEx("Tuck Planche Push-up", "Tuck Planche Push-up", "tuck-planche-push-up-sh"),
  makeEx("Tiger Bend HSPU", "Tiger Bend Handstand Push-up"),
  makeEx("Wall Walk + HSPU", "Wall Walk with Handstand Push-up"),
  makeEx("כפפות כתפיים (Shoulder Taps)", "Shoulder Tap Plank"),
  makeEx("Planche Lean", "Planche Lean Hold"),
  makeEx("Superman Hold", "Superman Hold"),
  makeEx("Reverse Plank", "Reverse Plank"),
  makeEx("Hollow Body to Arch", "Hollow Body to Arch Rock"),
  makeEx("Pseudo Planche Push-up Lean", "Pseudo Planche Push-up Lean"),
  makeEx("Maltese Lean Hold", "Maltese Lean Hold"),
  makeEx("Superman Push-up", "Superman Push-up", "superman-push-up-2"),
  makeEx("Straddle Planche Lean Floor", "Straddle Planche Lean on Floor"),
  makeEx("Ring HSPU", "Ring Handstand Push-up"),
  makeEx("Ring Shoulder Press", "Ring Shoulder Press"),
  makeEx("Ring L-Sit Press", "Ring L-Sit Press"),
  makeEx("Ring HSPU Elevated", "Elevated Ring Handstand Push-up"),
  makeEx("Ring Lateral Raise", "Ring Lateral Raise"),
  makeEx("Elevated Ring Pike Push-up", "Elevated Ring Pike Push-up"),
  makeEx("Ring L-Sit to Shoulder Press", "Ring L-Sit to Shoulder Press"),
  makeEx("Ring Dip to Support Hold", "Ring Dip to Support Hold"),
  makeEx("Smith Machine OHP", "Smith Machine Overhead Press"),
  makeEx("לחיצת כתפיים בישיבה", "Seated Shoulder Press"),
  makeEx("Cable Front Raise", "Cable Front Raise", "cable-front-raise-2"),
  makeEx("Cable Internal Rotation", "Cable Internal Rotation"),
  makeEx("Machine Lateral Raise", "Machine Lateral Raise"),
  makeEx("Cable Rear Delt Fly", "Cable Rear Delt Fly"),
];

// ── ARMS ──────────────────────────────────────────────────────────────────────
const ARMS: ExerciseEntry[] = [
  {
    name: "כפיפות מרפק (Bicep Curl)",
    englishName: "Dumbbell Bicep Curl",
    slug: "bicep-curl",
    description: "Person standing, curling dumbbells from hip level to shoulder level. Biceps brachii fully contracted.",
  },
  {
    name: "פשיטת מרפק (Tricep Extension)",
    englishName: "Tricep Extension",
    slug: "tricep-extension",
    description: "Person standing or seated, extending arms overhead with a dumbbell or cable. Triceps brachii engaged at full extension.",
  },
  {
    name: "Skull Crusher",
    englishName: "Skull Crusher",
    slug: "skull-crusher",
    description: "Person lying on bench, holding barbell above forehead, bending elbows to lower it toward forehead then extending back up. Triceps fully engaged.",
  },
  {
    name: "Hammer Curl",
    englishName: "Hammer Curl",
    slug: "hammer-curl",
    description: "Person standing, curling dumbbells with neutral grip (palms facing each other) toward shoulders. Brachialis and biceps engaged.",
  },
  {
    name: "Tricep Pushdown V-Bar",
    englishName: "Tricep Pushdown",
    slug: "tricep-pushdown-v-bar",
    description: "Person standing at cable machine, pushing a V-bar attachment downward from chest height to hip level. Triceps fully contracted.",
  },
  // ── Biceps ───────────────────────────────────────────────────────────────────
  makeEx("Preacher Curl", "Preacher Curl"),
  makeEx("Incline Dumbbell Curl", "Incline Dumbbell Curl"),
  makeEx("Concentration Curl", "Concentration Curl"),
  makeEx("Spider Curl", "Spider Curl"),
  makeEx("Cable Curl", "Cable Curl"),
  makeEx("Hammer Curl כבלים", "Cable Hammer Curl"),
  makeEx("Cable Concentration Curl", "Cable Concentration Curl"),
  makeEx("Rope Hammer Curl", "Rope Hammer Curl"),
  makeEx("High Cable Curl", "High Cable Curl"),
  makeEx("Low Cable Curl", "Low Cable Curl"),
  makeEx("Cable 21s ביצפס", "Cable 21s Bicep Curl"),
  makeEx("Unilateral Cable Curl", "Unilateral Cable Curl"),
  makeEx("Machine Preacher Curl", "Machine Preacher Curl"),
  makeEx("EZ Bar Curl", "EZ Bar Curl"),
  makeEx("Barbell Preacher Curl", "Barbell Preacher Curl"),
  makeEx("Cable Spider Curl", "Cable Spider Curl"),
  makeEx("Zottman Curl", "Zottman Curl"),
  makeEx("Cable Drag Curl", "Cable Drag Curl"),
  makeEx("Barbell Curl", "Barbell Curl"),
  makeEx("Incline DB Curl", "Incline DB Curl"),
  makeEx("Preacher Curl EZ", "EZ Bar Preacher Curl"),
  makeEx("Preacher Curl Machine", "Machine Preacher Curl", "machine-preacher-curl-2"),
  makeEx("Cross Body Hammer Curl", "Cross Body Hammer Curl"),
  makeEx("Cable Curl בר", "Bar Cable Curl"),
  makeEx("Cable Curl חבל", "Rope Cable Curl"),
  makeEx("Machine Curl", "Machine Bicep Curl"),
  makeEx("21s Curl", "21s Curl"),
  // ── Triceps ──────────────────────────────────────────────────────────────────
  makeEx("מקבילים (Dips)", "Parallel Bar Dips"),
  makeEx("Close Grip Bench", "Close Grip Bench Press"),
  makeEx("Overhead Tricep Extension", "Overhead Tricep Extension"),
  makeEx("Tricep Kickback", "Tricep Kickback"),
  makeEx("Rope Pushdown", "Rope Tricep Pushdown"),
  makeEx("Reverse Grip Pushdown", "Reverse Grip Tricep Pushdown"),
  makeEx("Single Arm Pushdown", "Single Arm Tricep Pushdown"),
  makeEx("Overhead Cable Ext Rope", "Overhead Cable Rope Tricep Extension"),
  makeEx("Single Arm Cable Overhead", "Single Arm Overhead Cable Tricep Extension"),
  makeEx("Cable Kickback", "Cable Tricep Kickback"),
  makeEx("Rope Overhead Ext", "Rope Overhead Tricep Extension"),
  makeEx("Cable Bar Pushdown", "Cable Bar Pushdown"),
  makeEx("Machine Tricep Ext", "Machine Tricep Extension"),
  makeEx("Tricep Dip Machine", "Tricep Dip Machine"),
  makeEx("JM Press", "JM Press"),
  makeEx("Tate Press", "Tate Press"),
  makeEx("Board Press", "Board Press"),
  makeEx("Cable Long Head Ext", "Cable Long Head Tricep Extension"),
  makeEx("Skull Crusher מוט", "Barbell Skull Crusher"),
  makeEx("Skull Crusher EZ", "EZ Bar Skull Crusher"),
  makeEx("Tricep Pushdown חבל", "Rope Tricep Pushdown", "rope-tricep-pushdown-2"),
  makeEx("Tricep Pushdown בר", "Bar Tricep Pushdown"),
  makeEx("Overhead Tricep Ext DB", "Dumbbell Overhead Tricep Extension"),
  makeEx("Overhead Tricep Ext כבל", "Cable Overhead Tricep Extension"),
  makeEx("Lying DB Tricep Extension", "Lying Dumbbell Tricep Extension"),
  makeEx("Weighted Dips", "Weighted Parallel Bar Dips"),
  // ── Forearms ─────────────────────────────────────────────────────────────────
  makeEx("Reverse Curl", "Reverse Curl"),
  makeEx("Wrist Curl", "Wrist Curl"),
  makeEx("Reverse Curl מוט", "Reverse Barbell Curl"),
  makeEx("Reverse Curl EZ", "Reverse EZ Bar Curl"),
  makeEx("Wrist Curl מוט", "Barbell Wrist Curl"),
  makeEx("Wrist Curl DB", "Dumbbell Wrist Curl"),
  makeEx("Reverse Wrist Curl", "Reverse Wrist Curl"),
  makeEx("Farmer's Walk", "Farmers Walk"),
  makeEx("Plate Pinch", "Plate Pinch Grip"),
  // ── Calisthenics arms ────────────────────────────────────────────────────────
  makeEx("מתח אחיזה הפוכה", "Chin-Up", "chin-up-2"),
  makeEx("Towel Pull-up Curl", "Towel Pull-up Curl"),
  makeEx("Around the World Pull-up", "Around the World Pull-up"),
  makeEx("Assisted One-Arm Chin-up", "Assisted One-Arm Chin-up"),
  makeEx("Hammer Grip Pull-up", "Hammer Grip Pull-up"),
  makeEx("Negative One-Arm Chin-up", "Negative One-Arm Chin-up"),
  makeEx("Towel Chin-up", "Towel Chin-up"),
  makeEx("False Grip Chin-up", "False Grip Chin-up"),
  makeEx("Tricep Push-up", "Tricep Push-up"),
  makeEx("L-Sit Dips", "L-Sit Dips"),
  makeEx("Korean Dips (Tricep)", "Korean Tricep Dips"),
  makeEx("Slow Negative Dips", "Slow Negative Dips"),
  makeEx("Forearm to Push-up", "Forearm to Push-up"),
  makeEx("Pike Push-up Dip Combo", "Pike Push-up Dip Combo"),
  makeEx("Korean Dip Eccentric", "Eccentric Korean Dip"),
  makeEx("Forearm Stand Push-up", "Forearm Stand Push-up"),
  makeEx("Narrow Parallette Dip", "Narrow Parallette Dip"),
  makeEx("Hanging Straight Hold", "Hanging Straight Arm Hold"),
  makeEx("Wrist Push-up", "Wrist Push-up"),
  makeEx("Ring Dips מתקדם", "Advanced Ring Dips"),
  makeEx("Ring Tricep Ext", "Ring Tricep Extension"),
  makeEx("Ring Bicep Curl", "Ring Bicep Curl"),
  makeEx("Ring Face Pull", "Ring Face Pull", "ring-face-pull-2"),
  makeEx("Ring Rows מתקדם", "Advanced Ring Rows"),
  makeEx("Ring Turn Out Dip", "Ring Turn Out Dip"),
  makeEx("Ring Chin-up with Pause", "Ring Chin-up with Pause"),
  makeEx("Ring Bicep Curl Supination", "Ring Bicep Curl with Supination"),
  makeEx("Ring Tricep Dip Slow", "Slow Ring Tricep Dip"),
  makeEx("Ring Row Underhand", "Underhand Ring Row"),
  makeEx("Ring Around The World", "Ring Around the World"),
  makeEx("Ring Overhead Tricep Extension", "Ring Overhead Tricep Extension"),
  makeEx("Ring Push-up Narrow to Wide", "Ring Push-up Narrow to Wide"),
  makeEx("Ring Lockout Hold", "Ring Lockout Hold"),
];

// ── LEGS ──────────────────────────────────────────────────────────────────────
const LEGS: ExerciseEntry[] = [
  {
    name: "סקוואט (Squat)",
    englishName: "Barbell Back Squat",
    slug: "squat",
    description: "Person with barbell across upper back, squatting down until thighs are parallel to floor then standing back up. Quadriceps, glutes, hamstrings engaged.",
  },
  {
    name: "לאנג' (Lunges)",
    englishName: "Dumbbell Lunges",
    slug: "lunges",
    description: "Person stepping forward with one leg, lowering the back knee toward the floor. Holding dumbbells at sides. Quadriceps and glutes engaged.",
  },
  {
    name: "Romanian Deadlift",
    englishName: "Romanian Deadlift",
    slug: "romanian-deadlift",
    description: "Person standing, hinging at hips while lowering a barbell along the legs. Slight bend in knees, hamstrings fully stretched.",
  },
  {
    name: "לג פרס (Leg Press)",
    englishName: "Leg Press Machine",
    slug: "leg-press",
    description: "Person seated in leg press machine, pushing a weighted platform upward with both feet. Quadriceps engaged throughout the movement.",
  },
  {
    name: "Hip Thrust",
    englishName: "Barbell Hip Thrust",
    slug: "hip-thrust",
    description: "Person with upper back on a bench, barbell across hips, driving hips upward by squeezing glutes. Glutes and hamstrings fully contracted at top.",
  },
  makeEx("Romanian Deadlift", "Romanian Deadlift", "romanian-deadlift-2"),
  makeEx("Hip Thrust", "Barbell Hip Thrust", "barbell-hip-thrust-legs"),
  makeEx("Hack Squat מכונה", "Hack Squat Machine"),
  makeEx("Leg Extension", "Leg Extension Machine"),
  makeEx("Goblet Squat", "Goblet Squat"),
  makeEx("Step Up לספסל", "Step Up to Bench"),
  makeEx("Sumo Squat", "Sumo Squat"),
  makeEx("Hip Adduction מכונה", "Machine Hip Adduction"),
  makeEx("Hip Abduction מכונה", "Machine Hip Abduction"),
  makeEx("Bulgarian Split Squat", "Bulgarian Split Squat"),
  makeEx("Smith Machine Squat", "Smith Machine Squat"),
  makeEx("Cable Hip Flexion", "Cable Hip Flexion"),
  makeEx("Smith Machine Lunge", "Smith Machine Lunge"),
  makeEx("Back Squat", "Barbell Back Squat", "barbell-back-squat-2"),
  makeEx("Front Squat", "Barbell Front Squat"),
  makeEx("Leg Extension מכונה", "Leg Extension Machine", "leg-extension-machine-2"),
  makeEx("Leg Press רגלים גבוהות", "High Foot Placement Leg Press"),
  makeEx("Leg Press רגלים נמוכות", "Low Foot Placement Leg Press"),
  makeEx("Bulgarian Split Squat DB", "Dumbbell Bulgarian Split Squat"),
  makeEx("Heel Elevated Squat", "Heel Elevated Squat"),
  makeEx("Box Squat", "Box Squat"),
  makeEx("Pause Squat", "Pause Squat"),
  makeEx("Step Up משקל", "Weighted Step Up"),
  makeEx("Sissy Squat מכונה", "Sissy Squat Machine"),
  makeEx("Nordic Hamstring Curl", "Nordic Hamstring Curl"),
  makeEx("Good Morning רגליים", "Good Morning", "good-morning-legs"),
  makeEx("Lying Leg Curl", "Lying Leg Curl"),
  makeEx("Cable Romanian DL", "Cable Romanian Deadlift"),
  makeEx("Standing Leg Curl", "Standing Leg Curl"),
  makeEx("Seated Leg Curl", "Seated Leg Curl"),
  makeEx("Romanian Deadlift DB", "Dumbbell Romanian Deadlift"),
  makeEx("Single Leg RDL", "Single Leg Romanian Deadlift"),
  makeEx("Glute Ham Raise", "Glute Ham Raise"),
  makeEx("Stiff Leg Deadlift", "Stiff Leg Deadlift"),
  makeEx("Kneeling Leg Curl", "Kneeling Leg Curl"),
  makeEx("Cable Leg Curl עמידה", "Standing Cable Leg Curl"),
  makeEx("Good Morning מוט", "Barbell Good Morning"),
  makeEx("Cable Pull-Through", "Cable Pull Through"),
  makeEx("Hip Thrust מוט", "Barbell Hip Thrust", "barbell-hip-thrust-2"),
  makeEx("Hip Thrust מכונה", "Machine Hip Thrust"),
  makeEx("Single Leg Glute Bridge", "Single Leg Glute Bridge"),
  makeEx("Cable Glute Kickback", "Cable Glute Kickback"),
  makeEx("Donkey Kick Machine", "Donkey Kick Machine"),
  makeEx("Sumo Squat DB", "Dumbbell Sumo Squat"),
  makeEx("Clamshell + לולאה", "Clamshell with Resistance Band"),
  makeEx("הרמות עקב (Calf Raise)", "Calf Raise"),
  makeEx("Seated Calf Raise", "Seated Calf Raise"),
  makeEx("Standing Calf Raise מכונה", "Standing Calf Raise Machine"),
  makeEx("Seated Calf Raise מכונה", "Machine Seated Calf Raise"),
  makeEx("Leg Press Calf Raise", "Leg Press Calf Raise"),
  makeEx("Single Leg Calf Raise DB", "Single Leg Dumbbell Calf Raise"),
  makeEx("Donkey Calf Raise", "Donkey Calf Raise"),
  makeEx("Tibialis Raise", "Tibialis Anterior Raise"),
  // ── Calisthenics legs ────────────────────────────────────────────────────────
  makeEx("סקוואט משקל גוף", "Bodyweight Squat"),
  makeEx("ישיבת קיר (Wall Sit)", "Wall Sit"),
  makeEx("Cossack Squat", "Cossack Squat"),
  makeEx("Sissy Squat", "Sissy Squat"),
  makeEx("Reverse Nordic Curl", "Reverse Nordic Curl"),
  makeEx("Single Leg Wall Sit", "Single Leg Wall Sit"),
  makeEx("Lateral Lunge", "Lateral Lunge"),
  makeEx("Frog Squat", "Frog Squat"),
  makeEx("Single Leg RDL BW", "Single Leg Romanian Deadlift Bodyweight"),
  makeEx("Nordic Curl Eccentric", "Eccentric Nordic Curl"),
  makeEx("Nordic Curl על טבעות", "Ring Nordic Curl"),
  makeEx("Single Leg Glute Bridge BW", "Bodyweight Single Leg Glute Bridge"),
  makeEx("Curtsy Lunge", "Curtsy Lunge"),
  makeEx("Glute Bridge Marching", "Glute Bridge March"),
  makeEx("סקוואט קפיצה (Jump Squat)", "Jump Squat"),
  makeEx("Tuck Jump", "Tuck Jump"),
  makeEx("Broad Jump", "Broad Jump"),
  makeEx("180 Jump Squat", "180 Degree Jump Squat"),
  makeEx("Box Jump", "Box Jump"),
  makeEx("Depth Jump", "Depth Jump"),
  makeEx("Plyometric Lunge", "Plyometric Lunge"),
  makeEx("Explosive Step-up", "Explosive Step Up"),
  makeEx("Sprint Bounds", "Sprint Bounds"),
  makeEx("Lateral Box Jump", "Lateral Box Jump"),
  makeEx("Single Leg Hop Continuous", "Single Leg Continuous Hop"),
  makeEx("Single Leg Box Jump", "Single Leg Box Jump"),
  makeEx("Pistol Squat", "Pistol Squat"),
  makeEx("Shrimp Squat", "Shrimp Squat"),
  makeEx("Skater Squat", "Skater Squat"),
  makeEx("Dragon Squat", "Dragon Squat"),
  makeEx("Pistol Squat Progression", "Pistol Squat Progression"),
  makeEx("Burpee + Pistol", "Burpee with Pistol Squat"),
  makeEx("Single Leg Squat to Box", "Single Leg Squat to Box"),
  makeEx("Assisted Pistol Squat", "Assisted Pistol Squat"),
  makeEx("Eccentric Pistol Squat", "Eccentric Pistol Squat"),
  makeEx("Step-Down Eccentric", "Step Down Eccentric"),
  makeEx("Cossack Squat Deep", "Deep Cossack Squat"),
  makeEx("Dragon Squat Advanced", "Advanced Dragon Squat"),
  makeEx("Single Leg Calf Raise BW", "Bodyweight Single Leg Calf Raise"),
];

// ── CORE ──────────────────────────────────────────────────────────────────────
const CORE: ExerciseEntry[] = [
  {
    name: "פלנק (Plank)",
    englishName: "Plank",
    slug: "plank",
    description: "Person holding a straight body position supported on forearms and toes. Core muscles, abs, and lower back fully engaged.",
  },
  {
    name: "סיט אפ (Sit-up)",
    englishName: "Sit-Up",
    slug: "sit-up",
    description: "Person lying on back with knees bent, rising up to sitting position. Abdominal muscles fully contracted.",
  },
  {
    name: "Hanging Leg Raise",
    englishName: "Hanging Leg Raise",
    slug: "hanging-leg-raise",
    description: "Person hanging from a pull-up bar, raising straight legs up to hip or higher. Lower abdominals and hip flexors engaged.",
  },
  {
    name: "Cable Crunch",
    englishName: "Cable Crunch",
    slug: "cable-crunch",
    description: "Person kneeling in front of a cable machine, pulling a rope attachment down while crunching forward. Rectus abdominis fully contracted.",
  },
  {
    name: "רוסיאן טוויסט",
    englishName: "Russian Twist",
    slug: "russian-twist",
    description: "Person seated with feet raised, rotating torso from side to side holding a weight. Oblique muscles engaged.",
  },
  makeEx("Hanging Leg Raise", "Hanging Leg Raise", "hanging-leg-raise-2"),
  makeEx("Cable Crunch", "Cable Crunch", "cable-crunch-2"),
  makeEx("Dragon Flag", "Dragon Flag"),
  makeEx("Ab Wheel Rollout", "Ab Wheel Rollout"),
  makeEx("V-Up", "V-Up"),
  makeEx("Hollow Crunch", "Hollow Crunch"),
  makeEx("Cable Crunch ברכיים", "Kneeling Cable Crunch"),
  makeEx("Machine Crunch", "Machine Crunch"),
  makeEx("Dragon Flag ספסל", "Bench Dragon Flag"),
  makeEx("Decline Crunch", "Decline Crunch"),
  makeEx("Hanging Leg Raise ישר", "Straight Leg Hanging Raise"),
  makeEx("Stability Ball Crunch", "Stability Ball Crunch"),
  makeEx("TRX Jackknife", "TRX Jackknife"),
  makeEx("Decline Sit-up", "Decline Sit-up"),
  makeEx("High Cable Crunch עמידה", "Standing High Cable Crunch"),
  makeEx("Hollow Body Rock", "Hollow Body Rock"),
  makeEx("Reverse Crunch משוקל", "Weighted Reverse Crunch"),
  makeEx("Ab Wheel Standing", "Standing Ab Wheel Rollout"),
  makeEx("Barbell Rollout", "Barbell Ab Rollout"),
  makeEx("Medicine Ball Slam", "Medicine Ball Slam"),
  makeEx("Cable Oblique Crunch", "Cable Oblique Crunch"),
  makeEx("Standing Cable Lift", "Standing Cable Lift"),
  makeEx("Cable Anti-Rotation Hold", "Cable Anti-Rotation Pallof Press"),
  makeEx("Kneeling Cable Oblique", "Kneeling Cable Oblique Crunch"),
  makeEx("Woodchop (גרזן)", "Cable Woodchop"),
  makeEx("Woodchop גבוה-נמוך", "High to Low Cable Woodchop"),
  makeEx("Woodchop נמוך-גבוה", "Low to High Cable Woodchop"),
  makeEx("Pallof Press", "Pallof Press"),
  makeEx("Side Plank", "Side Plank"),
  makeEx("Landmine Rotation", "Landmine Rotation"),
  makeEx("Pallof Press עמידה", "Standing Pallof Press"),
  makeEx("Pallof Press ברכיים", "Kneeling Pallof Press"),
  makeEx("Side Bend DB", "Dumbbell Side Bend"),
  makeEx("Russian Twist משקל", "Weighted Russian Twist"),
  makeEx("Cable Side Crunch", "Cable Side Crunch"),
  makeEx("Rotational Med Ball Throw", "Rotational Medicine Ball Throw"),
  makeEx("Side Plank + DB", "Side Plank with Dumbbell"),
  makeEx("Hollow Body Hold", "Hollow Body Hold"),
  makeEx("Ab Wheel from Knees", "Ab Wheel Rollout from Knees"),
  makeEx("Copenhagen Plank", "Copenhagen Plank"),
  makeEx("Stir the Pot", "Stability Ball Stir the Pot"),
  makeEx("Reverse Crunch", "Reverse Crunch"),
  makeEx("Ab Wheel Standing Rollout", "Standing Ab Wheel Rollout", "standing-ab-wheel-rollout-2"),
  makeEx("L-Sit (בין כסאות)", "L-Sit Between Chairs"),
  makeEx("L-Sit (מקבילים)", "Parallette L-Sit"),
  makeEx("V-Sit", "V-Sit"),
  makeEx("Tuck L-Sit", "Tuck L-Sit"),
  makeEx("Straddle L-Sit", "Straddle L-Sit"),
  makeEx("Straddle L-Sit Floor", "Straddle L-Sit on Floor"),
  makeEx("V-Sit Hold", "V-Sit Hold"),
  makeEx("הרמות ברכיים תלויות", "Hanging Knee Raise"),
  makeEx("Toes to Bar", "Toes to Bar"),
  makeEx("Windshield Wipers", "Hanging Windshield Wipers"),
  makeEx("Knee Raises on Parallettes", "Knee Raise on Parallettes"),
  makeEx("Windshield Wipers Tuck Hanging", "Tuck Hanging Windshield Wipers"),
  makeEx("Human Flag (Tuck)", "Tuck Human Flag"),
  makeEx("Full Human Flag", "Full Human Flag"),
  makeEx("Dragon Flag (Full)", "Full Dragon Flag"),
  makeEx("Dragon Flag Negative", "Negative Dragon Flag"),
  makeEx("Dragon Flag Incline", "Incline Dragon Flag"),
  makeEx("Planche Shrug", "Planche Shoulder Shrug"),
  makeEx("Tuck Planche Shrug", "Tuck Planche Shoulder Shrug"),
  makeEx("Ring L-Sit", "Ring L-Sit"),
  makeEx("Ring Tuck L-Sit", "Ring Tuck L-Sit"),
  makeEx("Ring Ab Rollout", "Ring Ab Rollout"),
  makeEx("Side Plank Hip Raises", "Side Plank Hip Dip"),
  makeEx("Bicycle Crunch Premium", "Bicycle Crunch"),
  makeEx("Plank Knee to Elbow", "Plank Knee to Elbow"),
  makeEx("ברכיים לחזה (Knee Tucks)", "Knee Tucks"),
  makeEx("Dead Bug", "Dead Bug"),
];

// ─── Batch map ────────────────────────────────────────────────────────────────
const BATCHES: Record<string, ExerciseEntry[]> = {
  chest: CHEST,
  back: BACK,
  shoulders: SHOULDERS,
  arms: ARMS,
  legs: LEGS,
  core: CORE,
};

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const batchArg = process.argv.find(a => a.startsWith("--batch=") || a === "--batch");
  const allArg = process.argv.includes("--all");

  let exercises: ExerciseEntry[] = [];
  let batchName = "";

  if (allArg) {
    exercises = Object.values(BATCHES).flat();
    batchName = "ALL";
  } else if (batchArg) {
    const name = batchArg.includes("=") ? batchArg.split("=")[1] : process.argv[process.argv.indexOf("--batch") + 1];
    if (!BATCHES[name]) {
      console.error(`❌ Unknown batch "${name}". Options: ${Object.keys(BATCHES).join(", ")}`);
      process.exit(1);
    }
    exercises = BATCHES[name];
    batchName = name.toUpperCase();
  } else {
    console.log("Usage:");
    console.log("  bun scripts/generate-exercise-images.ts --batch chest");
    console.log("  bun scripts/generate-exercise-images.ts --batch back");
    console.log("  bun scripts/generate-exercise-images.ts --batch shoulders");
    console.log("  bun scripts/generate-exercise-images.ts --batch arms");
    console.log("  bun scripts/generate-exercise-images.ts --batch legs");
    console.log("  bun scripts/generate-exercise-images.ts --batch core");
    console.log("  bun scripts/generate-exercise-images.ts --all");
    process.exit(0);
  }

  const estimatedCost = (exercises.length * 0.04).toFixed(2);
  console.log(`\n🎨 DALL-E 3 Exercise Image Generator`);
  console.log(`   Batch:      ${batchName}`);
  console.log(`   Exercises:  ${exercises.length}`);
  console.log(`   Est. cost:  ~$${estimatedCost}\n`);

  // Load existing URL map
  const urlMap: Record<string, string> = fs.existsSync(OUTPUT_FILE)
    ? JSON.parse(fs.readFileSync(OUTPUT_FILE, "utf-8"))
    : {};

  let generated = 0;
  let failed = 0;
  let skipped = 0;

  for (const ex of exercises) {
    const idx = generated + failed + skipped + 1;
    // Skip if already has an image URL
    if (urlMap[ex.name]) {
      console.log(`⏭  [${idx}/${exercises.length}] Skipping (already has image): ${ex.name}`);
      skipped++;
      continue;
    }

    console.log(`\n📐 [${idx}/${exercises.length}] ${ex.name}`);
    console.log(`   English: ${ex.englishName}`);

    const prompt = buildPrompt(ex);

    // Generate image
    process.stdout.write("   Generating... ");
    const imageBuffer = await generateImage(prompt);
    if (!imageBuffer) { console.log("✗ failed"); failed++; continue; }
    console.log("✓");

    // Upload to Supabase
    process.stdout.write("   Uploading...   ");
    const publicUrl = await uploadImage(ex.slug, imageBuffer);
    if (!publicUrl) { console.log("✗ failed"); failed++; continue; }
    console.log("✓");
    console.log(`   URL: ${publicUrl}`);

    urlMap[ex.name] = publicUrl;
    generated++;

    // Save after each exercise (so progress is never lost)
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(urlMap, null, 2));

    // Respect rate limits: DALL-E 3 allows ~5 images/min on standard tier
    if (generated + failed < exercises.length) {
      process.stdout.write("   Waiting 13s (rate limit)... ");
      await sleep(13000);
      console.log("done");
    }
  }

  console.log(`\n✅ Done!`);
  console.log(`   Generated: ${generated}`);
  console.log(`   Skipped:   ${skipped} (already had image)`);
  console.log(`   Failed:    ${failed}`);
  console.log(`   JSON updated: ${OUTPUT_FILE}\n`);
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }
main().catch(console.error);
