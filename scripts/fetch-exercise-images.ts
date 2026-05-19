/**
 * One-time script: fetch exercise images from Wger API → upload to Supabase Storage
 * Run with: bun scripts/fetch-exercise-images.ts
 *
 * Prerequisites:
 * 1. Create Supabase bucket "exercise-images" (public) in the dashboard
 * 2. Add SUPABASE_SERVICE_ROLE_KEY to .env.local
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// Load env from .env.local
const envFile = fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf-8");
const env: Record<string, string> = {};
for (const line of envFile.split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim().replace(/^"|"$/g, "");
}

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = "exercise-images";
const OUTPUT_FILE = path.join(process.cwd(), "src/data/exercise-image-urls.json");

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ── All exercise names in the app (extracted from sport.tsx data) ──────────────
// These are the `ex.name` values used as keys in the data arrays.
// Both Hebrew and English names are included.
const APP_EXERCISES: { name: string; englishHint?: string }[] = [
  // Chest
  { name: "לחיצת חזה שכיבה", englishHint: "Bench Press" },
  { name: "פרפר (Fly)", englishHint: "Dumbbell Fly" },
  { name: "שכיבות סמיכה", englishHint: "Push-up" },
  { name: "לחיצת חזה במכונה", englishHint: "Machine Chest Press" },
  { name: "קרוסאובר (כבלים)", englishHint: "Cable Crossover" },
  { name: "לחיצת דמבלים משופעת", englishHint: "Incline Dumbbell Press" },
  { name: "לחיצת מוט משופעת", englishHint: "Incline Barbell Press" },
  { name: "לחיצת דמבלים ירידה", englishHint: "Decline Dumbbell Press" },
  { name: "פרפר משופע", englishHint: "Incline Fly" },
  { name: "Pec Deck מכונה", englishHint: "Pec Deck" },
  { name: "Cable Fly מגבוה", englishHint: "High Cable Fly" },
  { name: "Cable Fly מלמטה", englishHint: "Low Cable Fly" },
  { name: "Dumbbell Pullover", englishHint: "Dumbbell Pullover" },
  { name: "שכיבות ירידה", englishHint: "Decline Push-up" },
  { name: "Squeeze Press", englishHint: "Squeeze Press" },
  { name: "מקבילים לחזה", englishHint: "Chest Dips" },
  { name: "Cable Crossover רחב", englishHint: "Cable Crossover" },
  { name: "Cable Fly אמצעי", englishHint: "Cable Fly" },
  { name: "Single Arm Cable Fly", englishHint: "Single Arm Cable Fly" },
  { name: "Incline Cable Fly", englishHint: "Incline Cable Fly" },
  { name: "Low to High Cable Fly", englishHint: "Low Cable Fly" },
  { name: "High to Low Cable Fly", englishHint: "High Cable Fly" },
  { name: "Machine Chest Press", englishHint: "Machine Chest Press" },
  { name: "Smith Machine Bench", englishHint: "Smith Machine Bench Press" },
  { name: "Iso-Lateral Chest Press", englishHint: "Chest Press" },
  { name: "Machine Incline Press", englishHint: "Incline Chest Press" },
  // Back
  { name: "מתח (Pull-up)", englishHint: "Pull-up" },
  { name: "חתירה (Barbell Row)", englishHint: "Barbell Row" },
  { name: "חתירה כבלים ישיבה", englishHint: "Seated Cable Row" },
  { name: "לט פולדאון", englishHint: "Lat Pulldown" },
  { name: "דדליפט", englishHint: "Deadlift" },
  { name: "Single Arm Dumbbell Row", englishHint: "One-arm Dumbbell Row" },
  { name: "T-Bar Row", englishHint: "T-Bar Row" },
  { name: "Chest Supported Row", englishHint: "Chest Supported Row" },
  { name: "Lat Pulldown רחב", englishHint: "Wide Grip Lat Pulldown" },
  { name: "Lat Pulldown צר", englishHint: "Close Grip Lat Pulldown" },
  { name: "Straight Arm Pulldown", englishHint: "Straight Arm Pulldown" },
  { name: "Renegade Row", englishHint: "Renegade Row" },
  { name: "Meadows Row", englishHint: "Meadows Row" },
  { name: "Seal Row", englishHint: "Seal Row" },
  { name: "Rack Pull", englishHint: "Rack Pull" },
  { name: "Back Extension", englishHint: "Back Extension" },
  { name: "Good Morning", englishHint: "Good Morning" },
  // Shoulders
  { name: "לחיצת כתפיים (OHP)", englishHint: "Overhead Press" },
  { name: "הרמות צד (Lateral Raise)", englishHint: "Lateral Raise" },
  { name: "הרמות קדמיות (Front Raise)", englishHint: "Front Raise" },
  { name: "Face Pull", englishHint: "Face Pull" },
  { name: "Arnold Press", englishHint: "Arnold Press" },
  { name: "Upright Row", englishHint: "Upright Row" },
  { name: "Shrug — כיווץ כתפיים", englishHint: "Shrug" },
  { name: "Band Pull-Apart", englishHint: "Band Pull Apart" },
  { name: "Machine Lateral Raise", englishHint: "Lateral Raise" },
  { name: "Rear Delt Fly דמבלים", englishHint: "Rear Delt Fly" },
  { name: "Cable Rear Delt Fly", englishHint: "Cable Rear Delt Fly" },
  // Arms
  { name: "כפיפות מרפק (Bicep Curl)", englishHint: "Bicep Curl" },
  { name: "פשיטת מרפק (Tricep Extension)", englishHint: "Tricep Extension" },
  { name: "מקבילים (Dips)", englishHint: "Dips" },
  { name: "Hammer Curl", englishHint: "Hammer Curl" },
  { name: "Preacher Curl", englishHint: "Preacher Curl" },
  { name: "Concentration Curl", englishHint: "Concentration Curl" },
  { name: "Spider Curl", englishHint: "Spider Curl" },
  { name: "Skull Crusher", englishHint: "Skull Crusher" },
  { name: "Close Grip Bench", englishHint: "Close Grip Bench Press" },
  { name: "Overhead Tricep Extension", englishHint: "Overhead Tricep Extension" },
  { name: "Tricep Pushdown V-Bar", englishHint: "Tricep Pushdown" },
  { name: "Tricep Kickback", englishHint: "Tricep Kickback" },
  { name: "Rope Pushdown", englishHint: "Rope Pushdown" },
  { name: "EZ Bar Curl", englishHint: "EZ Bar Curl" },
  // Legs
  { name: "סקוואט (Squat)", englishHint: "Squat" },
  { name: "לאנג' (Lunges)", englishHint: "Lunge" },
  { name: "לג פרס (Leg Press)", englishHint: "Leg Press" },
  { name: "כפיפות ברכיים (Hamstring Curl)", englishHint: "Leg Curl" },
  { name: "הרמות עקב (Calf Raise)", englishHint: "Calf Raise" },
  { name: "Romanian Deadlift", englishHint: "Romanian Deadlift" },
  { name: "Sumo Squat", englishHint: "Sumo Squat" },
  { name: "Hack Squat מכונה", englishHint: "Hack Squat" },
  { name: "Leg Extension", englishHint: "Leg Extension" },
  { name: "Seated Calf Raise", englishHint: "Seated Calf Raise" },
  { name: "Glute Bridge", englishHint: "Glute Bridge" },
  { name: "Hip Thrust", englishHint: "Hip Thrust" },
  { name: "Goblet Squat", englishHint: "Goblet Squat" },
  { name: "Nordic Hamstring Curl", englishHint: "Nordic Curl" },
  { name: "Bulgarian Split Squat", englishHint: "Bulgarian Split Squat" },
  { name: "Lying Leg Curl", englishHint: "Leg Curl" },
  { name: "Smith Machine Squat", englishHint: "Squat" },
  // Core
  { name: "פלנק (Plank)", englishHint: "Plank" },
  { name: "סיט אפ (Sit-up)", englishHint: "Sit-up" },
  { name: "רוסיאן טוויסט", englishHint: "Russian Twist" },
  { name: "ברכיים לחזה (Knee Tucks)", englishHint: "Knee Tuck" },
  { name: "Dead Bug", englishHint: "Dead Bug" },
  { name: "Cable Crunch", englishHint: "Cable Crunch" },
  { name: "Dragon Flag", englishHint: "Dragon Flag" },
  { name: "Ab Wheel Rollout", englishHint: "Ab Wheel Rollout" },
  { name: "Hanging Leg Raise", englishHint: "Hanging Leg Raise" },
  { name: "V-Up", englishHint: "V-Up" },
  { name: "Pallof Press", englishHint: "Pallof Press" },
  { name: "Side Plank", englishHint: "Side Plank" },
];

interface WgerRawExercise {
  id: number;
  images: { id: number; image: string; is_main: boolean }[];
  translations: { name: string; language: number }[];
}

interface WgerExercise {
  id: number;
  name: string;
  images: { id: number; image: string; is_main: boolean }[];
}

async function fetchWgerExercises(): Promise<WgerExercise[]> {
  const exercises: WgerExercise[] = [];
  let url = "https://wger.de/api/v2/exerciseinfo/?format=json&limit=100";
  let page = 1;
  while (url) {
    console.log(`  Fetching page ${page}...`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Wger API error: ${res.status}`);
    const data = await res.json() as { count: number; next: string | null; results: WgerRawExercise[] };
    for (const raw of data.results) {
      // language=2 is English in Wger
      const englishTranslation = raw.translations.find(t => t.language === 2);
      if (englishTranslation?.name && raw.images.length > 0) {
        exercises.push({ id: raw.id, name: englishTranslation.name, images: raw.images });
      }
    }
    url = data.next ?? "";
    page++;
    if (!data.next) break;
    await new Promise(r => setTimeout(r, 300)); // be polite to the API
  }
  console.log(`  Total exercises from Wger: ${exercises.length}`);
  return exercises;
}

function normalize(name: string | null | undefined): string {
  if (!name) return "";
  return name.toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function findBestMatch(
  hint: string,
  wgerExercises: WgerExercise[]
): WgerExercise | null {
  const hintNorm = normalize(hint);
  // 1. Exact match
  let match = wgerExercises.find(e => normalize(e.name) === hintNorm);
  if (match) return match;
  // 2. Wger name contains hint
  match = wgerExercises.find(e => normalize(e.name).includes(hintNorm));
  if (match) return match;
  // 3. Hint contains wger name (partial)
  const words = hintNorm.split(" ").filter(w => w.length > 3);
  if (words.length >= 2) {
    match = wgerExercises.find(e => {
      const en = normalize(e.name);
      return words.every(w => en.includes(w));
    });
    if (match) return match;
  }
  return null;
}

async function uploadImage(
  exerciseName: string,
  imageUrl: string
): Promise<string | null> {
  try {
    const res = await fetch(imageUrl);
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    const ext = imageUrl.split(".").pop()?.split("?")[0] ?? "jpg";
    const fileName = exerciseName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) + "." + ext;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, buffer, {
        contentType: ext === "gif" ? "image/gif" : "image/jpeg",
        upsert: true,
      });

    if (error) {
      console.warn(`  ⚠ Upload failed for ${fileName}: ${error.message}`);
      return null;
    }
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
    return data.publicUrl;
  } catch (e) {
    console.warn(`  ⚠ Error uploading image for ${exerciseName}:`, e);
    return null;
  }
}

async function main() {
  console.log("🏋️ Fetching exercises from Wger API...");
  const wgerExercises = await fetchWgerExercises();
  const wgerWithImages = wgerExercises.filter(e => e.images.length > 0);
  console.log(`  Exercises with images: ${wgerWithImages.length}`);

  const urlMap: Record<string, string> = {};
  let matched = 0;
  let uploaded = 0;

  // Load existing map if it exists (to skip already-uploaded)
  if (fs.existsSync(OUTPUT_FILE)) {
    const existing = JSON.parse(fs.readFileSync(OUTPUT_FILE, "utf-8"));
    Object.assign(urlMap, existing);
    console.log(`  Loaded ${Object.keys(urlMap).length} existing entries`);
  }

  for (const { name, englishHint } of APP_EXERCISES) {
    if (urlMap[name]) {
      console.log(`  ✓ Skip (already mapped): ${name}`);
      continue;
    }
    const hint = englishHint ?? name;
    const wgerMatch = findBestMatch(hint, wgerWithImages);
    if (!wgerMatch) {
      console.log(`  ✗ No match: ${name} (hint: "${hint}")`);
      continue;
    }
    matched++;
    const mainImage = wgerMatch.images.find(i => i.is_main) ?? wgerMatch.images[0];
    const imageUrl = mainImage.image.startsWith("http")
      ? mainImage.image
      : `https://wger.de${mainImage.image}`;

    console.log(`  → Match: "${name}" ↔ "${wgerMatch.name}" — ${imageUrl}`);
    const publicUrl = await uploadImage(name, imageUrl);
    if (publicUrl) {
      urlMap[name] = publicUrl;
      uploaded++;
      console.log(`    ✓ Uploaded: ${publicUrl}`);
    }
    await new Promise(r => setTimeout(r, 100));
  }

  // Ensure output directory exists
  const dir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(urlMap, null, 2));
  console.log(`\n✅ Done! Matched: ${matched}, Uploaded: ${uploaded}`);
  console.log(`   Output: ${OUTPUT_FILE}`);
  console.log(`   Total mapped: ${Object.keys(urlMap).length} exercises`);
}

main().catch(console.error);
