/**
 * Exercise image fetcher v2 — full rebuild with accurate matching
 *
 * Usage:
 *   bun scripts/fetch-exercise-images.ts --preview   # shows matches, writes scripts/preview-matches.json
 *   bun scripts/fetch-exercise-images.ts --upload    # clears bucket, uploads all, writes src/data/exercise-image-urls.json
 *
 * Sources:
 *   1. Wger (hardcoded ID map for accuracy)
 *   2. ExerciseDB via RapidAPI (fallback for GIFs, optional — needs RAPIDAPI_KEY in .env.local)
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// ─── Load .env.local ────────────────────────────────────────────────────────
const envFile = fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf-8");
const env: Record<string, string> = {};
for (const line of envFile.split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
}

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const RAPIDAPI_KEY = env.RAPIDAPI_KEY ?? "";
const BUCKET = "exercise-images";
const OUTPUT_FILE = path.join(process.cwd(), "src/data/exercise-image-urls.json");
const PREVIEW_FILE = path.join(process.cwd(), "scripts/preview-matches.json");

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const isPreview = process.argv.includes("--preview");
const isUpload = process.argv.includes("--upload");

if (!isPreview && !isUpload) {
  console.log("Usage: bun scripts/fetch-exercise-images.ts --preview | --upload");
  process.exit(0);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ─── Slug helper: ALWAYS derived from englishHint (never Hebrew) ─────────────
function toSlug(hint: string): string {
  return hint.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ─── Manual Wger exercise ID map (verified IDs) ──────────────────────────────
// Fetch URL: https://wger.de/api/v2/exerciseimage/?exercise=${id}&format=json
const WGER_ID_MAP: Record<string, number> = {
  // ── Chest ──────────────────────────────────────────────────────────────────
  "לחיצת חזה שכיבה":             73,    // Bench Press (Barbell)
  "פרפר (Fly)":                   238,   // Fly With Dumbbells
  "שכיבות סמיכה":                 1551,  // Push-Up
  "לחיצת חזה במכונה":             135,   // Butterfly / Pec Deck (chest machine)
  "קרוסאובר (כבלים)":             323,   // Cable Cross-over
  "לחיצת דמבלים משופעת":          537,   // Incline DB Press
  "לחיצת מוט משופעת":             538,   // Incline Barbell Press
  "לחיצת דמבלים ירידה":           185,   // Decline Press
  "פרפר משופע":                   1298,  // High Cable Cross (incline fly)
  "Pec Deck מכונה":               135,   // Butterfly / Pec Deck
  "Cable Fly מגבוה":              1298,  // High Cable Cross → lower chest
  "Cable Fly מלמטה":              1296,  // Low Cable Cross-Over → upper chest
  "Dumbbell Pullover":             237,   // Fly With Cable (pullover style)
  "שכיבות ירידה":                 1112,  // Decline Push-up
  "Squeeze Press":                 75,    // Benchpress Dumbbells
  "מקבילים לחזה":                 194,   // Dips (chest lean)
  "Cable Crossover רחב":          323,   // Cable Cross-over
  "Cable Fly אמצעי":              1922,  // Seated Cable Chest Fly
  "High to Low Cable Fly":        1298,  // High Cable Cross
  "Low to High Cable Fly":        1296,  // Low Cable Cross-Over
  "Machine Chest Press":          543,   // Machine Chest Press
  "Smith Machine Bench":          73,    // Bench Press (Smith)
  "Iso-Lateral Chest Press":      543,   // Iso-Lateral Chest Press
  "Machine Incline Press":        538,   // Incline Press (machine)
  "Incline Cable Fly":            1296,  // Low Cable Fly → incline
  "Single Arm Cable Fly":         1922,  // Seated Cable Chest Fly (single arm variant)
  // ── Back ───────────────────────────────────────────────────────────────────
  "מתח (Pull-up)":                475,   // Pull-ups
  "חתירה (Barbell Row)":          83,    // Bent Over Rowing
  "חתירה כבלים ישיבה":            1117,  // Seated Cable Row
  "לט פולדאון":                   158,   // Close-grip Lat Pull Down
  "דדליפט":                       184,   // Deadlifts
  "Single Arm Dumbbell Row":      1637,  // Single Arm Row
  "T-Bar Row":                    513,   // T-Bar Row
  "Chest Supported Row":          1283,  // Chest Supported Row
  "Lat Pulldown רחב":             158,   // Lat Pulldown
  "Lat Pulldown צר":              158,   // Close-grip Lat Pulldown
  "Straight Arm Pulldown":        1726,  // Straight-Arm Pulldown
  "Renegade Row":                 83,    // Bent Over Row (plank)
  "Meadows Row":                  1637,  // Single Arm Row
  "Seal Row":                     1283,  // Chest Supported Row
  "Rack Pull":                    484,   // Rack Deadlift
  "Back Extension":               301,   // Hyperextensions
  "Good Morning":                 268,   // Good Mornings
  // ── Shoulders ──────────────────────────────────────────────────────────────
  "לחיצת כתפיים (OHP)":          1893,  // Overhead Barbell Press
  "הרמות צד (Lateral Raise)":    348,   // Lateral Raises
  "הרמות קדמיות (Front Raise)":  256,   // Front Raises
  "Face Pull":                    1639,  // Dumbbell Bent Over Face Pull
  "Arnold Press":                 1893,  // OHP (Arnold variant — similar image)
  "Upright Row":                  694,   // Upright Row w/ Dumbbells
  "Shrug — כיווץ כתפיים":        1645,  // Dumbbell Shrug
  "Band Pull-Apart":              1639,  // Face Pull (similar movement)
  "Machine Lateral Raise":        1744,  // Machine Side Lateral
  "Rear Delt Fly דמבלים":         829,   // Rear Delt Raise
  "Cable Rear Delt Fly":          822,   // Cable Rear Delt Fly
  "לחיצת כתפיים בישיבה":         543,   // Shoulder Press on Machine
  "Lateral Raise כבלים":         1378,  // Cable Lateral Raises
  // ── Arms ───────────────────────────────────────────────────────────────────
  "כפיפות מרפק (Bicep Curl)":    92,    // Biceps Curls With Dumbbell
  "פשיטת מרפק (Tricep Extension)": 1519, // Overhead Triceps Extension (GIF)
  "מקבילים (Dips)":              194,   // Dips
  "Hammer Curl":                  272,   // Hammer Curls
  "Preacher Curl":                465,   // Preacher Curls
  "Concentration Curl":           1109,  // Concentration Curl
  "Spider Curl":                  465,   // Preacher Curl (similar)
  "Skull Crusher":                246,   // Skullcrusher
  "Close Grip Bench":             1897,  // Close-Grip Bench Press
  "Overhead Tricep Extension":    1519,  // Overhead Triceps Extension (GIF)
  "Tricep Pushdown V-Bar":        1185,  // Triceps Pushdown
  "Tricep Kickback":              805,   // Tricep Pushdown on Cable
  "Rope Pushdown":                1900,  // Tricep Rope Pushdowns
  "EZ Bar Curl":                  94,    // Biceps Curls With EZ Bar
  "Hammer Curl כבלים":           275,   // Hammer Cable Curl
  "Incline Dumbbell Curl":        92,    // Dumbbell Curl (incline angle)
  "Reverse Curl":                 91,    // Biceps Curls Barbell (overhand)
  "Cable Curl":                   95,    // Cable Bicep Curl
  "Wrist Curl":                   91,    // Wrist Curl (use barbell curl image)
  // ── Legs ───────────────────────────────────────────────────────────────────
  "סקוואט (Squat)":              1801,  // Barbell Full Squat
  "לאנג' (Lunges)":              984,   // Lunges
  "לג פרס (Leg Press)":          371,   // Leg Press
  "כפיפות ברכיים (Hamstring Curl)": 364, // Leg Curl
  "הרמות עקב (Calf Raise)":      1243,  // Double Leg Calf Raise
  "Romanian Deadlift":            1652,  // Dumbbell Romanian Deadlift
  "Sumo Squat":                   1801,  // Barbell Full Squat (sumo stance)
  "Hack Squat מכונה":            375,   // Hack Squat
  "Leg Extension":                369,   // Leg Extension
  "Seated Calf Raise":            1620,  // Seated Dumbbell Calf Raise
  "Glute Bridge":                 1642,  // Dumbbell Hip Thrust
  "Hip Thrust":                   1642,  // Dumbbell Hip Thrust
  "Goblet Squat":                 203,   // Dumbbell Goblet Squat
  "Nordic Hamstring Curl":        909,   // Nordic Curl (Reverse)
  "Bulgarian Split Squat":        988,   // Bulgarian Split Squats
  "Lying Leg Curl":               365,   // Leg Curls Laying
  "Smith Machine Squat":          1747,  // Smith Machine Squat
  "Step Up לספסל":               981,   // Step-ups
  "Hip Abduction מכונה":         1748,  // Machine Hip Abduction
  "Hip Adduction מכונה":         12,    // Seated Hip Adduction
  "Good Morning רגליים":          268,   // Good Mornings
  "Donkey Kicks":                 12,    // Hip Adduction (closest match)
  // ── Core ───────────────────────────────────────────────────────────────────
  "פלנק (Plank)":                458,   // Plank
  "סיט אפ (Sit-up)":             1105,  // Seated Knee Tuck (sit-up variant)
  "רוסיאן טוויסט":               1193,  // Russian Twist
  "ברכיים לחזה (Knee Tucks)":    1105,  // Seated Knee Tuck
  "Dead Bug":                     458,   // Plank (similar core exercise)
  "Cable Crunch":                 1194,  // Pallof Press (cable core)
  "Dragon Flag":                  1573,  // Ab Wheel
  "Ab Wheel Rollout":             1573,  // Ab Wheel
  "Hanging Leg Raise":            979,   // Leg Raises Pull Up Bar
  "V-Up":                         1105,  // Seated Knee Tuck
  "Pallof Press":                 1194,  // Pallof Press
  "Side Plank":                   458,   // Plank
  "Landmine Rotation":            1194,  // Pallof Press (rotational core)
  "Woodchop (גרזן)":              1194,  // Cable core rotation
  "Hollow Crunch":                458,   // Plank (core hold)
};

// ─── Exercise list: all exercises that need images ────────────────────────────
// englishHint → used as filename slug. Must be unique & ASCII.
interface AppExercise { name: string; englishHint: string }

const APP_EXERCISES: AppExercise[] = [
  // ── Chest ──────────────────────────────────────────────────────────────────
  { name: "לחיצת חזה שכיבה",         englishHint: "Bench Press" },
  { name: "פרפר (Fly)",               englishHint: "Dumbbell Fly" },
  { name: "שכיבות סמיכה",             englishHint: "Push-up" },
  { name: "לחיצת חזה במכונה",         englishHint: "Chest Press Machine" },
  { name: "קרוסאובר (כבלים)",         englishHint: "Cable Crossover" },
  { name: "לחיצת דמבלים משופעת",      englishHint: "Incline Dumbbell Press" },
  { name: "לחיצת מוט משופעת",         englishHint: "Incline Barbell Press" },
  { name: "לחיצת דמבלים ירידה",       englishHint: "Decline Dumbbell Press" },
  { name: "פרפר משופע",               englishHint: "Incline Fly" },
  { name: "Pec Deck מכונה",           englishHint: "Pec Deck Machine" },
  { name: "Cable Fly מגבוה",          englishHint: "High to Low Cable Fly" },
  { name: "Cable Fly מלמטה",          englishHint: "Low to High Cable Fly" },
  { name: "Dumbbell Pullover",         englishHint: "Dumbbell Pullover" },
  { name: "שכיבות ירידה",             englishHint: "Decline Push-up" },
  { name: "Squeeze Press",             englishHint: "Squeeze Press" },
  { name: "מקבילים לחזה",             englishHint: "Chest Dips" },
  { name: "Cable Crossover רחב",       englishHint: "Cable Crossover Wide" },
  { name: "Cable Fly אמצעי",          englishHint: "Mid Cable Fly" },
  { name: "Single Arm Cable Fly",      englishHint: "Single Arm Cable Fly" },
  { name: "Incline Cable Fly",         englishHint: "Incline Cable Fly" },
  { name: "Low to High Cable Fly",     englishHint: "Low to High Cable Fly 2" },
  { name: "High to Low Cable Fly",     englishHint: "High to Low Cable Fly" },
  { name: "Machine Chest Press",       englishHint: "Machine Chest Press" },
  { name: "Smith Machine Bench",       englishHint: "Smith Machine Bench Press" },
  { name: "Iso-Lateral Chest Press",   englishHint: "Iso Lateral Chest Press" },
  { name: "Machine Incline Press",     englishHint: "Machine Incline Press" },
  // ── Back ───────────────────────────────────────────────────────────────────
  { name: "מתח (Pull-up)",             englishHint: "Pull-up" },
  { name: "חתירה (Barbell Row)",       englishHint: "Barbell Row" },
  { name: "חתירה כבלים ישיבה",         englishHint: "Seated Cable Row" },
  { name: "לט פולדאון",                englishHint: "Lat Pulldown" },
  { name: "דדליפט",                    englishHint: "Deadlift" },
  { name: "Single Arm Dumbbell Row",   englishHint: "Single Arm Dumbbell Row" },
  { name: "T-Bar Row",                 englishHint: "T-Bar Row" },
  { name: "Chest Supported Row",       englishHint: "Chest Supported Row" },
  { name: "Lat Pulldown רחב",          englishHint: "Wide Grip Lat Pulldown" },
  { name: "Lat Pulldown צר",           englishHint: "Close Grip Lat Pulldown" },
  { name: "Straight Arm Pulldown",     englishHint: "Straight Arm Pulldown" },
  { name: "Renegade Row",              englishHint: "Renegade Row" },
  { name: "Meadows Row",               englishHint: "Meadows Row" },
  { name: "Seal Row",                  englishHint: "Seal Row" },
  { name: "Rack Pull",                 englishHint: "Rack Pull" },
  { name: "Back Extension",            englishHint: "Back Extension" },
  { name: "Good Morning",              englishHint: "Good Morning" },
  // ── Shoulders ──────────────────────────────────────────────────────────────
  { name: "לחיצת כתפיים (OHP)",       englishHint: "Overhead Press" },
  { name: "הרמות צד (Lateral Raise)", englishHint: "Lateral Raise" },
  { name: "הרמות קדמיות (Front Raise)", englishHint: "Front Raise" },
  { name: "Face Pull",                 englishHint: "Face Pull" },
  { name: "Arnold Press",              englishHint: "Arnold Press" },
  { name: "Upright Row",               englishHint: "Upright Row" },
  { name: "Shrug — כיווץ כתפיים",     englishHint: "Dumbbell Shrug" },
  { name: "Band Pull-Apart",           englishHint: "Band Pull Apart" },
  { name: "Machine Lateral Raise",     englishHint: "Machine Lateral Raise" },
  { name: "Rear Delt Fly דמבלים",      englishHint: "Rear Delt Fly" },
  { name: "Cable Rear Delt Fly",       englishHint: "Cable Rear Delt Fly" },
  { name: "לחיצת כתפיים בישיבה",      englishHint: "Seated Shoulder Press" },
  { name: "Lateral Raise כבלים",      englishHint: "Cable Lateral Raise" },
  { name: "Cuban Press",               englishHint: "Cuban Press" },
  // ── Arms ───────────────────────────────────────────────────────────────────
  { name: "כפיפות מרפק (Bicep Curl)",  englishHint: "Bicep Curl" },
  { name: "פשיטת מרפק (Tricep Extension)", englishHint: "Tricep Extension" },
  { name: "מקבילים (Dips)",           englishHint: "Dips" },
  { name: "Hammer Curl",               englishHint: "Hammer Curl" },
  { name: "Preacher Curl",             englishHint: "Preacher Curl" },
  { name: "Concentration Curl",        englishHint: "Concentration Curl" },
  { name: "Spider Curl",               englishHint: "Spider Curl" },
  { name: "Skull Crusher",             englishHint: "Skull Crusher" },
  { name: "Close Grip Bench",          englishHint: "Close Grip Bench Press" },
  { name: "Overhead Tricep Extension", englishHint: "Overhead Tricep Extension" },
  { name: "Tricep Pushdown V-Bar",     englishHint: "Tricep Pushdown V Bar" },
  { name: "Tricep Kickback",           englishHint: "Tricep Kickback" },
  { name: "Rope Pushdown",             englishHint: "Rope Pushdown" },
  { name: "EZ Bar Curl",               englishHint: "EZ Bar Curl" },
  { name: "Incline Dumbbell Curl",     englishHint: "Incline Dumbbell Curl" },
  { name: "Cable Curl",                englishHint: "Cable Bicep Curl" },
  { name: "Hammer Curl כבלים",         englishHint: "Cable Hammer Curl" },
  { name: "Reverse Curl",              englishHint: "Reverse Curl" },
  { name: "Wrist Curl",                englishHint: "Wrist Curl" },
  // ── Legs ───────────────────────────────────────────────────────────────────
  { name: "סקוואט (Squat)",            englishHint: "Squat" },
  { name: "לאנג' (Lunges)",            englishHint: "Lunges" },
  { name: "לג פרס (Leg Press)",        englishHint: "Leg Press" },
  { name: "כפיפות ברכיים (Hamstring Curl)", englishHint: "Hamstring Curl" },
  { name: "הרמות עקב (Calf Raise)",    englishHint: "Calf Raise" },
  { name: "Romanian Deadlift",         englishHint: "Romanian Deadlift" },
  { name: "Sumo Squat",                englishHint: "Sumo Squat" },
  { name: "Hack Squat מכונה",          englishHint: "Hack Squat" },
  { name: "Leg Extension",             englishHint: "Leg Extension" },
  { name: "Seated Calf Raise",         englishHint: "Seated Calf Raise" },
  { name: "Glute Bridge",              englishHint: "Glute Bridge" },
  { name: "Hip Thrust",                englishHint: "Hip Thrust" },
  { name: "Goblet Squat",              englishHint: "Goblet Squat" },
  { name: "Nordic Hamstring Curl",     englishHint: "Nordic Curl" },
  { name: "Bulgarian Split Squat",     englishHint: "Bulgarian Split Squat" },
  { name: "Lying Leg Curl",            englishHint: "Lying Leg Curl" },
  { name: "Smith Machine Squat",       englishHint: "Smith Machine Squat" },
  { name: "Step Up לספסל",             englishHint: "Step Up" },
  { name: "Hip Abduction מכונה",       englishHint: "Hip Abduction Machine" },
  { name: "Hip Adduction מכונה",       englishHint: "Hip Adduction Machine" },
  { name: "Good Morning רגליים",       englishHint: "Good Morning Legs" },
  { name: "Donkey Kicks",              englishHint: "Donkey Kicks" },
  // ── Core ───────────────────────────────────────────────────────────────────
  { name: "פלנק (Plank)",              englishHint: "Plank" },
  { name: "סיט אפ (Sit-up)",           englishHint: "Sit-up" },
  { name: "רוסיאן טוויסט",             englishHint: "Russian Twist" },
  { name: "ברכיים לחזה (Knee Tucks)",  englishHint: "Knee Tucks" },
  { name: "Dead Bug",                  englishHint: "Dead Bug" },
  { name: "Cable Crunch",              englishHint: "Cable Crunch" },
  { name: "Dragon Flag",               englishHint: "Dragon Flag" },
  { name: "Ab Wheel Rollout",          englishHint: "Ab Wheel Rollout" },
  { name: "Hanging Leg Raise",         englishHint: "Hanging Leg Raise" },
  { name: "V-Up",                      englishHint: "V-Up" },
  { name: "Pallof Press",              englishHint: "Pallof Press" },
  { name: "Side Plank",                englishHint: "Side Plank" },
  { name: "Landmine Rotation",         englishHint: "Landmine Rotation" },
  { name: "Woodchop (גרזן)",           englishHint: "Cable Wood Chop" },
  { name: "Hollow Crunch",             englishHint: "Hollow Body Crunch" },
];

// De-duplicate (same name might appear in array twice)
const UNIQUE_EXERCISES = Array.from(
  new Map(APP_EXERCISES.map(e => [e.name, e])).values()
);

// ─── Fetch Wger image URL by exercise ID ─────────────────────────────────────
async function fetchWgerImageUrl(exerciseId: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://wger.de/api/v2/exerciseimage/?exercise=${exerciseId}&format=json&limit=10`,
    );
    if (!res.ok) return null;
    const data = await res.json() as {
      results: { id: number; image: string; is_main: boolean }[];
    };
    if (!data.results.length) return null;
    // Prefer main image, fall back to first
    const main = data.results.find(i => i.is_main) ?? data.results[0];
    const url = main.image.startsWith("http")
      ? main.image
      : `https://wger.de${main.image}`;
    return url;
  } catch {
    return null;
  }
}

// ─── Fetch ExerciseDB image via RapidAPI (GIFs) ───────────────────────────────
async function fetchExerciseDBImage(hint: string): Promise<string | null> {
  if (!RAPIDAPI_KEY) return null;
  try {
    const url = `https://exercisedb.p.rapidapi.com/exercises/name/${encodeURIComponent(hint.toLowerCase())}?limit=3`;
    const res = await fetch(url, {
      headers: {
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": "exercisedb.p.rapidapi.com",
      },
    });
    if (!res.ok) return null;
    const data = await res.json() as { gifUrl?: string; name?: string }[];
    return data[0]?.gifUrl ?? null;
  } catch {
    return null;
  }
}

// ─── Upload image to Supabase ─────────────────────────────────────────────────
async function uploadImage(
  slug: string,
  imageUrl: string,
): Promise<string | null> {
  try {
    const res = await fetch(imageUrl);
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    let ext = "jpg";
    if (contentType.includes("gif"))    ext = "gif";
    else if (contentType.includes("png"))    ext = "png";
    else if (contentType.includes("webp"))   ext = "webp";
    else if (imageUrl.match(/\.(gif|png|webp|jpeg|jpg)(\?|$)/i)) {
      const m = imageUrl.match(/\.(gif|png|webp|jpeg|jpg)(\?|$)/i);
      if (m) ext = m[1].toLowerCase() === "jpeg" ? "jpg" : m[1].toLowerCase();
    }
    const fileName = `${slug}.${ext}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, buffer, { contentType, upsert: true });

    if (error) {
      console.warn(`  ⚠ Upload failed for ${fileName}: ${error.message}`);
      return null;
    }
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
    return data.publicUrl;
  } catch (e) {
    console.warn(`  ⚠ Error uploading ${slug}:`, e);
    return null;
  }
}

// ─── Clear bucket ─────────────────────────────────────────────────────────────
async function clearBucket(): Promise<void> {
  console.log("🗑  Clearing existing files from bucket...");
  let hasMore = true;
  while (hasMore) {
    const { data: files, error } = await supabase.storage.from(BUCKET).list("", { limit: 100 });
    if (error || !files?.length) break;
    const names = files.map(f => f.name);
    await supabase.storage.from(BUCKET).remove(names);
    console.log(`   Deleted ${names.length} files`);
    hasMore = files.length === 100;
  }
  console.log("   Bucket cleared ✓");
}

// ─── Main ─────────────────────────────────────────────────────────────────────
interface PreviewEntry {
  exerciseName: string;
  englishHint: string;
  slug: string;
  source: "wger" | "exercisedb" | "none";
  wgerId?: number;
  imageUrl: string | null;
  status: "✓" | "✗";
}

async function main() {
  console.log(`\n🏋️  Exercise Image Fetcher v2 — ${isPreview ? "PREVIEW" : "UPLOAD"} mode\n`);

  const preview: PreviewEntry[] = [];
  const urlMap: Record<string, string> = {};

  let wgerHits = 0;
  let dbHits = 0;
  let misses = 0;

  for (const { name, englishHint } of UNIQUE_EXERCISES) {
    const slug = toSlug(englishHint);
    const wgerId = WGER_ID_MAP[name];

    let imageUrl: string | null = null;
    let source: "wger" | "exercisedb" | "none" = "none";

    // 1. Try Wger by hardcoded ID
    if (wgerId) {
      imageUrl = await fetchWgerImageUrl(wgerId);
      if (imageUrl) { source = "wger"; wgerHits++; }
      await sleep(150);
    }

    // 2. Fallback: ExerciseDB
    if (!imageUrl && RAPIDAPI_KEY) {
      imageUrl = await fetchExerciseDBImage(englishHint);
      if (imageUrl) { source = "exercisedb"; dbHits++; }
      await sleep(200);
    }

    if (!imageUrl) misses++;

    const entry: PreviewEntry = {
      exerciseName: name,
      englishHint,
      slug,
      source,
      wgerId,
      imageUrl,
      status: imageUrl ? "✓" : "✗",
    };
    preview.push(entry);

    const sourceLabel = source === "wger" ? `wger#${wgerId}` : source === "exercisedb" ? "ExerciseDB" : "no match";
    console.log(`  ${entry.status} [${sourceLabel}] ${name} → ${slug}`);
    if (imageUrl) console.log(`      ${imageUrl}`);
  }

  // Write preview file
  const dir = path.dirname(PREVIEW_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(PREVIEW_FILE, JSON.stringify(preview, null, 2));

  console.log(`\n📋 Summary:`);
  console.log(`   Wger matches:      ${wgerHits}`);
  console.log(`   ExerciseDB matches: ${dbHits}`);
  console.log(`   No match (emoji fallback): ${misses}`);
  console.log(`   Preview → ${PREVIEW_FILE}`);

  if (isPreview) {
    console.log(`\n✅ Preview complete. Review scripts/preview-matches.json then run --upload\n`);
    return;
  }

  // ── UPLOAD MODE ──────────────────────────────────────────────────────────
  console.log("\n🚀 Starting upload...\n");
  await clearBucket();

  let uploaded = 0;
  for (const entry of preview) {
    if (!entry.imageUrl) continue;
    process.stdout.write(`  ↑ ${entry.slug}... `);
    const publicUrl = await uploadImage(entry.slug, entry.imageUrl);
    if (publicUrl) {
      urlMap[entry.exerciseName] = publicUrl;
      uploaded++;
      console.log("✓");
    } else {
      console.log("✗ (upload failed)");
    }
    await sleep(100);
  }

  // Write output JSON
  const outDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(urlMap, null, 2));

  console.log(`\n✅ Done!`);
  console.log(`   Uploaded:   ${uploaded}`);
  console.log(`   No image:   ${misses}`);
  console.log(`   Output:     ${OUTPUT_FILE}`);
  console.log(`   Total mapped: ${Object.keys(urlMap).length} exercises\n`);
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

main().catch(console.error);
