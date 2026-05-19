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

// ─── Image prompt builder ─────────────────────────────────────────────────────
// Produces a consistent anatomical line-drawing style for every exercise.
function buildPrompt(exercise: ExerciseEntry): string {
  return [
    "Black and white anatomical line drawing of a person performing a " + exercise.englishName + ".",
    exercise.description,
    "Clean precise lines showing correct form and muscle engagement.",
    "White background, fitness manual diagram style, no color, no text, no labels, no watermark.",
    "Similar to classic exercise anatomy illustrations.",
  ].join(" ");
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
interface ExerciseEntry {
  name: string;        // key in exercise-image-urls.json (must match sport.tsx)
  englishName: string; // used in the DALL-E prompt
  slug: string;        // Supabase filename
  description: string; // movement description for the prompt
}

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

  for (const ex of exercises) {
    console.log(`\n📐 [${generated + failed + 1}/${exercises.length}] ${ex.name}`);
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
  console.log(`   Failed:    ${failed}`);
  console.log(`   JSON updated: ${OUTPUT_FILE}\n`);
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }
main().catch(console.error);
