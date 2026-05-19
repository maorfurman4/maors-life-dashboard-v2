/**
 * Exercise image fetcher v3 — full verification + design polish
 *
 * Usage:
 *   bun scripts/fetch-exercise-images.ts --preview   # shows matches, writes scripts/preview-matches.json
 *   bun scripts/fetch-exercise-images.ts --upload    # clears bucket, uploads all, writes src/data/exercise-image-urls.json
 *
 * Sources:
 *   1. Wger (hardcoded ID map for accuracy) — line-drawing diagrams
 *   2. GitHub free-exercise-db (fallback) — clean photos, 873 exercises
 *      https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/{id}/0.jpg
 *
 * v3 changes:
 *   - FORCE_GITHUB: bypass Wger for known-bad images (broken, logo, photo, watermark, wrong)
 *   - Duplicate Wger ID detection: second exercise sharing an ID → GitHub fallback
 *   - Image validation: HEAD request confirms content-type + blocks images >2MB (real photos)
 *   - Fixed wrong Wger IDs: Machine Chest Press 543→1655, Machine Lateral Raise→1654,
 *     Seated Cable Row→921, Plank→458, Cable Front Raise→1745
 *   - ~70 new exercises added for cable/machine/_EX5 exercises
 *   - ExerciseDB removed (API no longer returns gifUrl)
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

// ─── GitHub free-exercise-db base URL ─────────────────────────────────────────
// 873 clean exercise photos: https://github.com/yuhonas/free-exercise-db
const GITHUB_BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises";

// ─── FORCE_GITHUB: skip Wger entirely for these exercises ─────────────────────
// These exercises have verified bad Wger images (broken, logo, stock photo, watermark, wrong).
// They skip Wger and go directly to GitHub free-exercise-db lookup.
const FORCE_GITHUB = new Set<string>([
  // Cat 1 — no Wger ID / Wger broken
  "Side Plank", "Dead Bug", "Hollow Crunch",
  // Cat 2 — Wger#1573 (Ab Wheel) returns logo graphic, not a diagram
  "Dragon Flag", "Ab Wheel Rollout",
  // Cat 3 — Wger#1378 returns stock photo of woman
  "Lateral Raise כבלים",
  // Cat 4 — wrong or missing exercise images
  "Concentration Curl", "Donkey Kicks", "Shrug — כיווץ כתפיים",
  "Iso-Lateral Chest Press",  // Wger#543 returns shoulder press image (wrong exercise)
  // Cat 5 — watermarked screenshot (no Wger ID)
  "EZ Bar Curl",
  // Cat 6 — real photos (Wger#184 / #1637 are real photos)
  "דדליפט", "Single Arm Dumbbell Row", "Meadows Row",
]);

// ─── GITHUB_EXERCISE_MAP: exercise name → GitHub free-exercise-db folder ID ───
// Used for FORCE_GITHUB exercises AND as fallback when Wger fails validation.
// All IDs verified with HTTP 200 from GitHub CDN.
const GITHUB_EXERCISE_MAP: Record<string, string> = {
  // ── Core ───────────────────────────────────────────────────────────────────
  "פלנק (Plank)":              "Plank",
  "Side Plank":                "Side_Jackknife",
  "Dead Bug":                  "Dead_Bug",
  "Hollow Crunch":             "Jackknife_Sit-Up",
  "ברכיים לחזה (Knee Tucks)":  "Jackknife_Sit-Up",
  "V-Up":                      "Jackknife_Sit-Up",
  "Ab Wheel Rollout":          "Barbell_Ab_Rollout",
  "Dragon Flag":               "Barbell_Ab_Rollout",           // closest available
  "Pallof Press":              "Pallof_Press",
  "Woodchop (גרזן)":           "Standing_Cable_Wood_Chop",
  "Landmine Rotation":         "Landmine_180s",
  "Medicine Ball Slam":        "One-Arm_Medicine_Ball_Slam",
  "סיט אפ (Sit-up)":           "Jackknife_Sit-Up",
  // ── FORCE_GITHUB targets ──────────────────────────────────────────────────
  "Lateral Raise כבלים":       "Cable_Seated_Lateral_Raise",
  "Concentration Curl":        "Concentration_Curls",
  "Donkey Kicks":              "Glute_Kickback",
  "Shrug — כיווץ כתפיים":      "Dumbbell_Shrug",
  "EZ Bar Curl":               "Close-Grip_EZ_Bar_Curl",
  "דדליפט":                    "Barbell_Deadlift",
  "Single Arm Dumbbell Row":   "One-Arm_Dumbbell_Row",
  "Meadows Row":               "Bent_Over_Two-Dumbbell_Row",
  // ── Shoulders ─────────────────────────────────────────────────────────────
  "Arnold Press":              "Arnold_Dumbbell_Press",
  "Band Pull-Apart":           "Band_Pull_Apart",
  "Face Pull":                 "Face_Pull",
  "לחיצת כתפיים בישיבה":       "Seated_Dumbbell_Press",
  "Smith Machine OHP":         "Smith_Machine_Overhead_Shoulder_Press",
  "Cable Internal Rotation":   "Cable_Internal_Rotation",
  "Cuban Press":               "Cuban_Press",
  // ── Back ──────────────────────────────────────────────────────────────────
  "Good Morning":              "Good_Morning",
  "Good Morning רגליים":       "Good_Morning",
  "Renegade Row":              "Alternating_Renegade_Row",
  "Lat Pulldown רחב":          "Wide-Grip_Lat_Pulldown",
  "Lat Pulldown צר":           "Close-Grip_Front_Lat_Pulldown",
  "Reverse Grip Cable Row":    "Reverse_Grip_Bent-Over_Rows",
  // ── Chest ─────────────────────────────────────────────────────────────────
  "Smith Machine Bench":       "Smith_Machine_Bench_Press",
  // ── Legs ──────────────────────────────────────────────────────────────────
  "Hip Thrust":                "Barbell_Hip_Thrust",
  "Glute Bridge":              "Barbell_Hip_Thrust",
  "Standing Leg Curl":         "Standing_Leg_Curl",
  "Machine Glute Kickback":    "One-Legged_Cable_Kickback",
  // ── Arms ──────────────────────────────────────────────────────────────────
  "Zottman Curl":              "Zottman_Curl",
  "Machine Preacher Curl":     "Machine_Preacher_Curls",
  "Cable Drag Curl":           "Drag_Curl",
  "Hammer Curl כבלים":         "Cable_Hammer_Curls_-_Rope_Attachment",
  "Rope Hammer Curl":          "Cable_Hammer_Curls_-_Rope_Attachment",
  "High Cable Curl":           "High_Cable_Curls",
  "Rope Overhead Ext":         "Cable_Rope_Overhead_Triceps_Extension",
  "Overhead Cable Ext Rope":   "Cable_Rope_Overhead_Triceps_Extension",
  "Overhead Tricep Extension": "Cable_Rope_Overhead_Triceps_Extension",
  "Machine Tricep Ext":        "Machine_Triceps_Extension",
  "Barbell Preacher Curl":     "Cable_Preacher_Curl",
  "Spider Curl":               "Spider_Curl",
  "Reverse Cable Curl":        "Reverse_Cable_Curl",
  "Incline Dumbbell Curl":     "Incline_Dumbbell_Curl",
  "Wrist Curl":                "Wrist_Roller",
  "Close Grip Bench":          "Close-Grip_Barbell_Bench_Press",
  "Tricep Kickback":           "Triceps_Pushdown",
  "Rope Pushdown":             "Triceps_Pushdown",
  // ── Chest ─────────────────────────────────────────────────────────────────
  "שכיבות סמיכה":              "Pushups",
  // ── Shoulders (Wger invalid) ──────────────────────────────────────────────
  "לחיצת כתפיים (OHP)":        "Standing_Military_Press",
  // ── Legs (Wger invalid) ──────────────────────────────────────────────────
  "Step Up לספסל":             "Dumbbell_Step_Ups",
  "Hanging Leg Raise":         "Hanging_Leg_Raise",
  "Sumo Squat":                "Sumo_Deadlift",
};

// ─── Manual Wger exercise ID map (verified IDs → line-drawing diagrams) ──────
// Fetch URL: https://wger.de/api/v2/exerciseimage/?exercise=${id}&format=json
const WGER_ID_MAP: Record<string, number> = {
  // ── Core ───────────────────────────────────────────────────────────────────
  "פלנק (Plank)":                458,   // Plank — 239KB PNG diagram (verified)
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
  "Smith Machine Bench":          73,    // Bench Press (Smith)
  "Machine Chest Press":           1655,  // Machine Chest Press Exercise — 32KB webp (verified)
  "Iso-Lateral Chest Press":      543,   // Iso-Lateral Chest Press
  "Machine Incline Press":        538,   // Incline Press (machine)
  "Single Arm Cable Fly":         1922,  // Seated Cable Chest Fly (single arm variant)
  "Incline Cable Fly":            1296,  // Low Cable Fly → incline
  // ── Back ───────────────────────────────────────────────────────────────────
  "מתח (Pull-up)":                475,   // Pull-ups
  "חתירה (Barbell Row)":          83,    // Bent Over Rowing
  "לט פולדאון":                   158,   // Close-grip Lat Pull Down
  "חתירה כבלים ישיבה":             921,   // Seated Cable Rows — 22KB PNG (verified)
  "Single Arm Dumbbell Row":      1637,  // 8MB photo — in FORCE_GITHUB, won't reach here
  "T-Bar Row":                    513,   // T-Bar Row
  "Chest Supported Row":          1283,  // Chest Supported Row
  "Lat Pulldown רחב":             158,   // Lat Pulldown
  "Lat Pulldown צר":              158,   // Close-grip Lat Pulldown
  "Straight Arm Pulldown":        1726,  // Straight-Arm Pulldown
  "Renegade Row":                 83,    // Bent Over Row (plank)
  "Seal Row":                     1283,  // Chest Supported Row
  "Rack Pull":                    484,   // Rack Deadlift
  "Back Extension":               301,   // Hyperextensions
  "Good Morning":                 268,   // Good Mornings
  // ── Shoulders ──────────────────────────────────────────────────────────────
  "Cable Front Raise":            1745,  // Cable Front Raise with a small bar — 57KB JPEG (verified)
  "לחיצת כתפיים (OHP)":          1893,  // Overhead Barbell Press
  "הרמות צד (Lateral Raise)":    348,   // Lateral Raises
  "הרמות קדמיות (Front Raise)":  256,   // Front Raises
  "Face Pull":                    1639,  // Dumbbell Bent Over Face Pull
  "Machine Lateral Raise":        1654,  // Machine lateral wise — 45KB JPEG (verified)
  "Arnold Press":                 1893,  // OHP (duplicate — will fall to GitHub "Arnold_Dumbbell_Press")
  "Upright Row":                  694,   // Upright Row w/ Dumbbells
  "Band Pull-Apart":              1639,  // Face Pull (duplicate — will fall to GitHub "Band_Pull_Apart")
  "Rear Delt Fly דמבלים":         829,   // Rear Delt Raise
  "Cable Rear Delt Fly":          822,   // Cable Rear Delt Fly
  "לחיצת כתפיים בישיבה":         1893,  // Seated Shoulder Press → use OHP diagram
  "Cuban Press":                  256,   // Front Raises (similar plane)
  // ── Arms ───────────────────────────────────────────────────────────────────
  "כפיפות מרפק (Bicep Curl)":    92,    // Biceps Curls With Dumbbell
  "פשיטת מרפק (Tricep Extension)": 1519, // Overhead Triceps Extension (GIF)
  "מקבילים (Dips)":              194,   // Dips
  "Hammer Curl":                  272,   // Hammer Curls
  "Preacher Curl":                465,   // Preacher Curls
  "Spider Curl":                  465,   // Preacher Curl (similar)
  "Skull Crusher":                246,   // Skullcrusher
  "Close Grip Bench":             1897,  // Close-Grip Bench Press
  "Overhead Tricep Extension":    1519,  // Overhead Triceps Extension (GIF)
  "Tricep Pushdown V-Bar":        1185,  // Triceps Pushdown
  "Tricep Kickback":              805,   // Tricep Pushdown on Cable
  "Rope Pushdown":                1900,  // Tricep Rope Pushdowns
  "Hammer Curl כבלים":           275,   // Hammer Cable Curl
  "Incline Dumbbell Curl":        92,    // Dumbbell Curl (incline angle)
  "Reverse Curl":                 91,    // Biceps Curls Barbell (overhand)
  "Cable Curl":                   95,    // Cable Bicep Curl
  "Wrist Curl":                   91,    // Wrist Curl (use barbell curl image)
  "Barbell Preacher Curl":        465,   // Preacher Curls
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
  // ── Core ───────────────────────────────────────────────────────────────────
  "סיט אפ (Sit-up)":             1105,  // Seated Knee Tuck (sit-up variant)
  "רוסיאן טוויסט":               1193,  // Russian Twist
  "ברכיים לחזה (Knee Tucks)":    1105,  // Seated Knee Tuck
  "Cable Crunch":                 1194,  // Pallof Press (cable core)
  "Hanging Leg Raise":            979,   // Leg Raises Pull Up Bar
  "V-Up":                         1105,  // Seated Knee Tuck
  "Pallof Press":                 1194,  // Pallof Press
  "Landmine Rotation":            1194,  // Pallof Press (rotational core)
  "Woodchop (גרזן)":              1194,  // Cable core rotation
};

// ─── Exercise list: all exercises that need images ────────────────────────────
// englishHint → used as filename slug (must be unique & ASCII).
// IMPORTANT: name must match exactly the name used in sport.tsx exercise objects.
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
  // _EX2 back (cable/machine) — new in v3
  { name: "Cable Pullover גב",         englishHint: "Cable Pullover Back" },
  { name: "Unilateral Cable Row",       englishHint: "Unilateral Cable Row" },
  { name: "High Cable Row",            englishHint: "High Cable Row" },
  { name: "Rope Pulldown",             englishHint: "Rope Lat Pulldown" },
  { name: "Unilateral Lat Pulldown",   englishHint: "Single Arm Lat Pulldown" },
  { name: "Wide Grip Cable Row",       englishHint: "Wide Grip Cable Row" },
  { name: "Reverse Grip Cable Row",    englishHint: "Reverse Grip Cable Row" },
  { name: "Underhand Cable Row",       englishHint: "Underhand Cable Row" },
  { name: "Cable Straight Arm Row",    englishHint: "Cable Straight Arm Row" },
  { name: "Cable Lower Back Ext",      englishHint: "Cable Lower Back Extension" },
  { name: "Machine Pullover",          englishHint: "Machine Pullover" },
  { name: "Hammer Strength Lat Pull",  englishHint: "Hammer Strength Lat Pulldown" },
  { name: "Machine Seated Row",        englishHint: "Machine Seated Row" },
  { name: "Assisted Pull-up Machine",  englishHint: "Assisted Pullup Machine" },
  { name: "Reverse Grip Lat Pulldown", englishHint: "Reverse Grip Lat Pulldown" },
  { name: "Machine High Row",          englishHint: "Machine High Row" },
  { name: "Cable Rope Face Pull",      englishHint: "Cable Face Pull" },
  { name: "Chest Supported Cable Row", englishHint: "Chest Supported Cable Row" },
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
  // _EX2 shoulders (cable/machine) — new in v3
  { name: "Cable Front Raise",         englishHint: "Cable Front Raise" },
  { name: "Cable Upright Row",         englishHint: "Cable Upright Row" },
  { name: "Single Arm Cable Lateral",  englishHint: "Single Arm Cable Lateral Raise" },
  { name: "Lying Cable Lateral Raise", englishHint: "Lying Cable Lateral Raise" },
  { name: "Rope Face Pull מתקדם",      englishHint: "Rope Face Pull Advanced" },
  { name: "High Cable Rear Delt Fly",  englishHint: "High Cable Rear Delt Fly" },
  { name: "Low Cable Rear Delt",       englishHint: "Low Cable Rear Delt" },
  { name: "Cable External Rotation",   englishHint: "Cable External Rotation Shoulder" },
  { name: "Cable Internal Rotation",   englishHint: "Cable Internal Rotation Shoulder" },
  { name: "Leaning Cable Lateral",     englishHint: "Leaning Cable Lateral Raise" },
  { name: "Cable Y-Raise",             englishHint: "Cable Y Raise" },
  { name: "Cross Body Cable Raise",    englishHint: "Cross Body Cable Raise" },
  { name: "Machine Shoulder Press",    englishHint: "Machine Shoulder Press" },
  { name: "Smith Machine OHP",         englishHint: "Smith Machine Overhead Press" },
  { name: "Machine Rear Delt Fly",     englishHint: "Machine Rear Delt Fly" },
  { name: "Machine Front Raise",       englishHint: "Machine Front Raise" },
  { name: "Cable Behind-Back Lateral", englishHint: "Behind Back Cable Lateral Raise" },
  { name: "Cable Rope Upright Row",    englishHint: "Cable Rope Upright Row" },
  { name: "Plate Front Raise",         englishHint: "Plate Front Raise" },
  { name: "Cable Single Arm Front Raise", englishHint: "Single Arm Cable Front Raise" },
  { name: "Half-Kneeling Cable Press", englishHint: "Half Kneeling Cable Press" },
  { name: "Dumbbell Rear Delt Row",    englishHint: "Dumbbell Rear Delt Row" },
  { name: "Cable W-Raise",             englishHint: "Cable W Raise" },
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
  { name: "Barbell Preacher Curl",     englishHint: "Barbell Preacher Curl" },
  // _EX2 arms (cable/machine) — new in v3
  { name: "Cable Concentration Curl",  englishHint: "Cable Concentration Curl" },
  { name: "Rope Hammer Curl",          englishHint: "Rope Hammer Curl Cable" },
  { name: "High Cable Curl",           englishHint: "High Cable Bicep Curl" },
  { name: "Low Cable Curl",            englishHint: "Low Cable Bicep Curl" },
  { name: "Cable 21s ביצפס",           englishHint: "Cable 21s Bicep" },
  { name: "Unilateral Cable Curl",     englishHint: "One Arm Cable Curl" },
  { name: "Machine Preacher Curl",     englishHint: "Machine Preacher Curl" },
  { name: "Reverse Cable Curl",        englishHint: "Reverse Cable Curl" },
  { name: "Cable Spider Curl",         englishHint: "Cable Spider Curl" },
  { name: "Zottman Curl",              englishHint: "Zottman Curl" },
  { name: "Cable Drag Curl",           englishHint: "Cable Drag Curl" },
  { name: "Reverse Grip Pushdown",     englishHint: "Reverse Grip Tricep Pushdown" },
  { name: "Single Arm Pushdown",       englishHint: "Single Arm Cable Pushdown" },
  { name: "Overhead Cable Ext Rope",   englishHint: "Overhead Cable Tricep Extension" },
  { name: "Single Arm Cable Overhead", englishHint: "Single Arm Overhead Tricep Extension" },
  { name: "Cable Kickback",            englishHint: "Cable Tricep Kickback" },
  { name: "Rope Overhead Ext",         englishHint: "Rope Overhead Tricep Extension" },
  { name: "Cable Bar Pushdown",        englishHint: "Cable Bar Tricep Pushdown" },
  { name: "Machine Tricep Ext",        englishHint: "Machine Tricep Extension" },
  { name: "Tricep Dip Machine",        englishHint: "Tricep Dip Machine" },
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
  // _EX2 legs (cable/machine) — new in v3
  { name: "Cable Pull-Through",        englishHint: "Cable Pull Through Glutes" },
  { name: "Cable Romanian DL",         englishHint: "Cable Romanian Deadlift" },
  { name: "Machine Glute Kickback",    englishHint: "Machine Glute Kickback" },
  { name: "Cable Hip Flexion",         englishHint: "Cable Hip Flexion" },
  { name: "Smith Machine Lunge",       englishHint: "Smith Machine Lunge" },
  { name: "Standing Leg Curl",         englishHint: "Standing Leg Curl Machine" },
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
  // _EX2 core (cable) — new in v3
  { name: "Cable Oblique Crunch",      englishHint: "Cable Oblique Crunch" },
  { name: "Standing Cable Lift",       englishHint: "Cable Standing Lift" },
  { name: "Cable Anti-Rotation Hold",  englishHint: "Cable Anti Rotation Pallof Press" },
  { name: "Kneeling Cable Oblique",    englishHint: "Kneeling Cable Oblique Crunch" },
  // _EX5 core — new in v3
  { name: "Medicine Ball Slam",        englishHint: "Medicine Ball Slam" },
  { name: "Stability Ball Crunch",     englishHint: "Stability Ball Crunch" },
  { name: "TRX Jackknife",             englishHint: "TRX Jackknife" },
  { name: "Decline Sit-up",            englishHint: "Decline Sit Up" },
  { name: "High Cable Crunch עמידה",   englishHint: "Standing Cable Crunch" },
];

// De-duplicate (same name might appear in array twice)
const UNIQUE_EXERCISES = Array.from(
  new Map(APP_EXERCISES.map(e => [e.name, e])).values()
);

// ─── Validate that a URL actually serves an image (and not a photo > 2MB) ─────
// Images > 2MB are almost certainly real photographs, not line-drawing diagrams.
async function isValidImage(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD" });
    if (!res.ok) return false;
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.startsWith("image/")) return false;
    const cl = parseInt(res.headers.get("content-length") ?? "0", 10);
    if (cl > 2_000_000) return false; // >2MB → real photo, reject
    return true;
  } catch {
    return false;
  }
}

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

// ─── Fetch GitHub free-exercise-db image ─────────────────────────────────────
// Returns direct CDN URL if the exercise exists, null otherwise.
async function fetchGithubImage(githubId: string): Promise<string | null> {
  const url = `${GITHUB_BASE}/${githubId}/0.jpg`;
  try {
    const res = await fetch(url, { method: "HEAD" });
    return res.ok ? url : null;
  } catch {
    return null;
  }
}

// ─── Look up an exercise in GITHUB_EXERCISE_MAP and fetch its image ───────────
async function fetchGithubFallback(name: string): Promise<string | null> {
  const githubId = GITHUB_EXERCISE_MAP[name];
  if (!githubId) return null;
  return fetchGithubImage(githubId);
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
  source: "wger" | "github" | "none";
  wgerId?: number;
  imageUrl: string | null;
  status: "✓" | "✗";
  note?: string;
}

async function main() {
  console.log(`\n🏋️  Exercise Image Fetcher v3 — ${isPreview ? "PREVIEW" : "UPLOAD"} mode`);
  console.log(`   Total exercises: ${UNIQUE_EXERCISES.length}\n`);

  const preview: PreviewEntry[] = [];
  const urlMap: Record<string, string> = {};

  let wgerHits = 0;
  let githubHits = 0;
  let misses = 0;
  let forcedGithub = 0;
  let duplicateSkips = 0;
  let validationFails = 0;

  // Track Wger IDs already used — duplicate gets GitHub fallback instead
  const usedWgerIds = new Set<number>();

  for (const { name, englishHint } of UNIQUE_EXERCISES) {
    const slug = toSlug(englishHint);
    const wgerId = WGER_ID_MAP[name];

    let imageUrl: string | null = null;
    let source: "wger" | "github" | "none" = "none";
    let note = "";

    // ── Step 1: Check if this exercise is force-routed to GitHub ─────────────
    if (FORCE_GITHUB.has(name)) {
      forcedGithub++;
      note = "forced→GitHub";
      // Skip directly to GitHub fallback below
    } else if (wgerId) {
      // ── Step 2: Duplicate Wger ID detection ──────────────────────────────────
      if (usedWgerIds.has(wgerId)) {
        duplicateSkips++;
        note = `dup wger#${wgerId}→GitHub`;
        // Skip Wger, fall through to GitHub
      } else {
        usedWgerIds.add(wgerId);
        const wgerUrl = await fetchWgerImageUrl(wgerId);
        await sleep(150);

        if (wgerUrl) {
          // ── Step 3: Validate Wger image (content-type + size < 2MB) ─────────
          const valid = await isValidImage(wgerUrl);
          await sleep(100);
          if (valid) {
            imageUrl = wgerUrl;
            source = "wger";
            wgerHits++;
          } else {
            validationFails++;
            note = `wger#${wgerId} invalid (bad type or >2MB)→GitHub`;
          }
        }
      }
    }

    // ── Step 4: GitHub free-exercise-db fallback ──────────────────────────────
    if (!imageUrl) {
      const ghUrl = await fetchGithubFallback(name);
      if (ghUrl) {
        imageUrl = ghUrl;
        source = "github";
        githubHits++;
      }
      await sleep(100);
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
      note: note || undefined,
    };
    preview.push(entry);

    const sourceLabel =
      source === "wger" ? `wger#${wgerId}` :
      source === "github" ? `GitHub/${GITHUB_EXERCISE_MAP[name] ?? "?"}` :
      "no match";
    const noteStr = note ? ` [${note}]` : "";
    console.log(`  ${entry.status} [${sourceLabel}]${noteStr} ${name} → ${slug}`);
    if (imageUrl) console.log(`      ${imageUrl}`);
  }

  // Write preview file
  const dir = path.dirname(PREVIEW_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(PREVIEW_FILE, JSON.stringify(preview, null, 2));

  console.log(`\n📋 Summary:`);
  console.log(`   Total exercises:       ${UNIQUE_EXERCISES.length}`);
  console.log(`   Wger diagram matches:  ${wgerHits}`);
  console.log(`   GitHub photo matches:  ${githubHits}`);
  console.log(`   Forced to GitHub:      ${forcedGithub}`);
  console.log(`   Duplicate Wger ID:     ${duplicateSkips}`);
  console.log(`   Wger invalid/photo:    ${validationFails}`);
  console.log(`   No match (emoji):      ${misses}`);
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
  console.log(`   Uploaded:     ${uploaded}`);
  console.log(`   No image:     ${misses}`);
  console.log(`   Output:       ${OUTPUT_FILE}`);
  console.log(`   Total mapped: ${Object.keys(urlMap).length} exercises\n`);
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

main().catch(console.error);
