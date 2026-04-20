// Exercise library — comprehensive list categorized by muscle group
// Marked with shoulderSafe to respect user's shoulder sensitivity

export type MuscleGroup =
  | "chest" | "back" | "shoulders" | "biceps" | "triceps"
  | "legs" | "glutes" | "core" | "cardio" | "fullbody";

export type ExerciseDifficulty = "beginner" | "intermediate" | "advanced";

export interface LibraryExercise {
  id: string;
  name: string;
  nameEn: string;
  muscleGroups: MuscleGroup[];
  primaryMuscle: MuscleGroup;
  category: "calisthenics" | "weights" | "combined" | "running";
  difficulty: ExerciseDifficulty;
  shoulderSafe: boolean;
  equipment: string[];
  defaultSets: number;
  defaultReps: number;
  restSeconds: number;
  description?: string;
  youtube_link?: string;
}

export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest: "חזה",
  back: "גב",
  shoulders: "כתפיים",
  biceps: "יד קדמית",
  triceps: "יד אחורית",
  legs: "רגליים",
  glutes: "ישבן",
  core: "בטן/ליבה",
  cardio: "אירובי",
  fullbody: "כל הגוף",
};

export const EXERCISE_LIBRARY: LibraryExercise[] = [
  // CHEST
  { id: "pushup", name: "שכיבות סמיכה", nameEn: "Push-up", muscleGroups: ["chest", "triceps", "shoulders"], primaryMuscle: "chest", category: "calisthenics", difficulty: "beginner", shoulderSafe: true, equipment: [], defaultSets: 3, defaultReps: 15, restSeconds: 60, youtube_link: "https://www.youtube.com/watch?v=IODxDxX7oi4" },
  { id: "diamond-pushup", name: "שכיבת יהלום", nameEn: "Diamond Push-up", muscleGroups: ["chest", "triceps"], primaryMuscle: "triceps", category: "calisthenics", difficulty: "intermediate", shoulderSafe: true, equipment: [], defaultSets: 3, defaultReps: 12, restSeconds: 60, youtube_link: "https://www.youtube.com/watch?v=J0DnG1_S92I" },
  { id: "dips", name: "מקבילים", nameEn: "Parallel Bar Dips", muscleGroups: ["chest", "triceps", "shoulders"], primaryMuscle: "chest", category: "calisthenics", difficulty: "intermediate", shoulderSafe: false, equipment: ["מקבילים"], defaultSets: 3, defaultReps: 10, restSeconds: 90, youtube_link: "https://www.youtube.com/watch?v=2z8JmcrW-As" },
  { id: "bench-press", name: "לחיצת חזה", nameEn: "Bench Press", muscleGroups: ["chest", "triceps", "shoulders"], primaryMuscle: "chest", category: "weights", difficulty: "intermediate", shoulderSafe: false, equipment: ["משקולת", "ספסל"], defaultSets: 4, defaultReps: 8, restSeconds: 120, youtube_link: "https://www.youtube.com/watch?v=SCVCLChPQFY" },
  { id: "incline-pushup", name: "שכיבות בשיפוע", nameEn: "Incline Push-up", muscleGroups: ["chest"], primaryMuscle: "chest", category: "calisthenics", difficulty: "beginner", shoulderSafe: true, equipment: [], defaultSets: 3, defaultReps: 15, restSeconds: 60 },

  // BACK
  { id: "pullup", name: "מתח", nameEn: "Pull-up", muscleGroups: ["back", "biceps"], primaryMuscle: "back", category: "calisthenics", difficulty: "intermediate", shoulderSafe: true, equipment: ["מתח"], defaultSets: 3, defaultReps: 8, restSeconds: 120, youtube_link: "https://www.youtube.com/watch?v=eGo4IYlbE5g" },
  { id: "chinup", name: "מתח אחיזה הפוכה", nameEn: "Chin-up", muscleGroups: ["back", "biceps"], primaryMuscle: "back", category: "calisthenics", difficulty: "intermediate", shoulderSafe: true, equipment: ["מתח"], defaultSets: 3, defaultReps: 8, restSeconds: 120, youtube_link: "https://www.youtube.com/watch?v=brhRXlOhsAM" },
  { id: "australian-pullup", name: "מתח אוסטרלי", nameEn: "Australian Pull-up", muscleGroups: ["back", "biceps"], primaryMuscle: "back", category: "calisthenics", difficulty: "beginner", shoulderSafe: true, equipment: [], defaultSets: 3, defaultReps: 12, restSeconds: 90 },
  { id: "row", name: "חתירה", nameEn: "Row", muscleGroups: ["back", "biceps"], primaryMuscle: "back", category: "weights", difficulty: "beginner", shoulderSafe: true, equipment: ["משקולת"], defaultSets: 4, defaultReps: 10, restSeconds: 90, youtube_link: "https://www.youtube.com/watch?v=FWJR5Ve8bnQ" },
  { id: "deadlift", name: "דדליפט", nameEn: "Deadlift", muscleGroups: ["back", "legs", "glutes"], primaryMuscle: "back", category: "weights", difficulty: "advanced", shoulderSafe: true, equipment: ["מוט", "משקולות"], defaultSets: 4, defaultReps: 6, restSeconds: 180, youtube_link: "https://www.youtube.com/watch?v=op9kVnSso6Q" },

  // SHOULDERS (mostly avoided due to shoulder sensitivity)
  { id: "pike-pushup", name: "שכיבת פייק", nameEn: "Pike Push-up", muscleGroups: ["shoulders", "triceps"], primaryMuscle: "shoulders", category: "calisthenics", difficulty: "intermediate", shoulderSafe: false, equipment: [], defaultSets: 3, defaultReps: 10, restSeconds: 90 },
  { id: "lateral-raise", name: "הרחקת כתפיים", nameEn: "Lateral Raise", muscleGroups: ["shoulders"], primaryMuscle: "shoulders", category: "weights", difficulty: "beginner", shoulderSafe: false, equipment: ["משקולות"], defaultSets: 3, defaultReps: 12, restSeconds: 60 },
  { id: "face-pull", name: "פייס פול", nameEn: "Face Pull", muscleGroups: ["shoulders", "back"], primaryMuscle: "shoulders", category: "weights", difficulty: "beginner", shoulderSafe: true, equipment: ["גומייה"], defaultSets: 3, defaultReps: 15, restSeconds: 60, description: "מצוין לחיזוק כתף בלי עומס" },

  // BICEPS
  { id: "biceps-curl", name: "כפיפות מרפק", nameEn: "Biceps Curl", muscleGroups: ["biceps"], primaryMuscle: "biceps", category: "weights", difficulty: "beginner", shoulderSafe: true, equipment: ["משקולות"], defaultSets: 3, defaultReps: 12, restSeconds: 60 },
  { id: "hammer-curl", name: "כפיפות פטיש", nameEn: "Hammer Curl", muscleGroups: ["biceps"], primaryMuscle: "biceps", category: "weights", difficulty: "beginner", shoulderSafe: true, equipment: ["משקולות"], defaultSets: 3, defaultReps: 12, restSeconds: 60 },

  // TRICEPS
  { id: "triceps-extension", name: "פשיטות מרפק", nameEn: "Triceps Extension", muscleGroups: ["triceps"], primaryMuscle: "triceps", category: "weights", difficulty: "beginner", shoulderSafe: true, equipment: ["משקולת"], defaultSets: 3, defaultReps: 12, restSeconds: 60 },
  { id: "bench-dips", name: "מקבילים על ספסל", nameEn: "Bench Dips", muscleGroups: ["triceps"], primaryMuscle: "triceps", category: "calisthenics", difficulty: "beginner", shoulderSafe: false, equipment: ["ספסל"], defaultSets: 3, defaultReps: 12, restSeconds: 60 },

  // LEGS
  { id: "squat", name: "סקוואט", nameEn: "Squat", muscleGroups: ["legs", "glutes"], primaryMuscle: "legs", category: "calisthenics", difficulty: "beginner", shoulderSafe: true, equipment: [], defaultSets: 4, defaultReps: 15, restSeconds: 90, youtube_link: "https://www.youtube.com/watch?v=aclHkVaku9U" },
  { id: "barbell-squat", name: "סקוואט עם מוט", nameEn: "Barbell Squat", muscleGroups: ["legs", "glutes"], primaryMuscle: "legs", category: "weights", difficulty: "advanced", shoulderSafe: false, equipment: ["מוט", "משקולות"], defaultSets: 4, defaultReps: 8, restSeconds: 180, youtube_link: "https://www.youtube.com/watch?v=Dy28eq2PjcM" },
  { id: "lunges", name: "לאנג'ים", nameEn: "Lunges", muscleGroups: ["legs", "glutes"], primaryMuscle: "legs", category: "calisthenics", difficulty: "beginner", shoulderSafe: true, equipment: [], defaultSets: 3, defaultReps: 12, restSeconds: 60, youtube_link: "https://www.youtube.com/watch?v=QOVaHwm-Q6U" },
  { id: "pistol-squat", name: "פיסטול סקוואט", nameEn: "Pistol Squat", muscleGroups: ["legs", "glutes", "core"], primaryMuscle: "legs", category: "calisthenics", difficulty: "advanced", shoulderSafe: true, equipment: [], defaultSets: 3, defaultReps: 6, restSeconds: 90 },
  { id: "calf-raise", name: "עליות שוק", nameEn: "Calf Raise", muscleGroups: ["legs"], primaryMuscle: "legs", category: "calisthenics", difficulty: "beginner", shoulderSafe: true, equipment: [], defaultSets: 3, defaultReps: 20, restSeconds: 45 },

  // GLUTES
  { id: "glute-bridge", name: "גשר ישבן", nameEn: "Glute Bridge", muscleGroups: ["glutes", "core"], primaryMuscle: "glutes", category: "calisthenics", difficulty: "beginner", shoulderSafe: true, equipment: [], defaultSets: 3, defaultReps: 15, restSeconds: 60 },
  { id: "hip-thrust", name: "היפ ת'ראסט", nameEn: "Hip Thrust", muscleGroups: ["glutes"], primaryMuscle: "glutes", category: "weights", difficulty: "intermediate", shoulderSafe: true, equipment: ["משקולת"], defaultSets: 4, defaultReps: 10, restSeconds: 90 },

  // CORE
  { id: "plank", name: "פלאנק", nameEn: "Plank", muscleGroups: ["core"], primaryMuscle: "core", category: "calisthenics", difficulty: "beginner", shoulderSafe: true, equipment: [], defaultSets: 3, defaultReps: 60, restSeconds: 45, description: "החזק שניות" },
  { id: "side-plank", name: "פלאנק צדדי", nameEn: "Side Plank", muscleGroups: ["core"], primaryMuscle: "core", category: "calisthenics", difficulty: "beginner", shoulderSafe: true, equipment: [], defaultSets: 3, defaultReps: 30, restSeconds: 45 },
  { id: "lsit", name: "L-sit", nameEn: "L-sit", muscleGroups: ["core"], primaryMuscle: "core", category: "calisthenics", difficulty: "advanced", shoulderSafe: true, equipment: [], defaultSets: 3, defaultReps: 20, restSeconds: 90 },
  { id: "leg-raise", name: "הרמות רגליים", nameEn: "Hanging Leg Raise", muscleGroups: ["core"], primaryMuscle: "core", category: "calisthenics", difficulty: "intermediate", shoulderSafe: true, equipment: ["מתח"], defaultSets: 3, defaultReps: 12, restSeconds: 60 },
  { id: "crunches", name: "כפיפות בטן", nameEn: "Crunches", muscleGroups: ["core"], primaryMuscle: "core", category: "calisthenics", difficulty: "beginner", shoulderSafe: true, equipment: [], defaultSets: 3, defaultReps: 20, restSeconds: 45 },
  { id: "russian-twist", name: "טוויסט רוסי", nameEn: "Russian Twist", muscleGroups: ["core"], primaryMuscle: "core", category: "calisthenics", difficulty: "beginner", shoulderSafe: true, equipment: [], defaultSets: 3, defaultReps: 20, restSeconds: 45 },

  // FULL BODY / COMBINED
  { id: "burpee", name: "בורפי", nameEn: "Burpee", muscleGroups: ["fullbody", "cardio"], primaryMuscle: "fullbody", category: "combined", difficulty: "intermediate", shoulderSafe: false, equipment: [], defaultSets: 3, defaultReps: 10, restSeconds: 60 },
  { id: "muscle-up", name: "מאסל אפ", nameEn: "Muscle Up", muscleGroups: ["back", "chest", "triceps"], primaryMuscle: "fullbody", category: "calisthenics", difficulty: "advanced", shoulderSafe: false, equipment: ["מתח"], defaultSets: 3, defaultReps: 5, restSeconds: 180 },
  { id: "bear-crawl", name: "הליכת דוב", nameEn: "Bear Crawl", muscleGroups: ["fullbody", "core"], primaryMuscle: "fullbody", category: "combined", difficulty: "beginner", shoulderSafe: true, equipment: [], defaultSets: 3, defaultReps: 30, restSeconds: 60 },
  { id: "mountain-climber", name: "מטפסי הרים", nameEn: "Mountain Climbers", muscleGroups: ["cardio", "core"], primaryMuscle: "cardio", category: "combined", difficulty: "beginner", shoulderSafe: true, equipment: [], defaultSets: 3, defaultReps: 30, restSeconds: 45 },
  { id: "jump-squat", name: "סקוואט קפיצה", nameEn: "Jump Squat", muscleGroups: ["legs", "cardio"], primaryMuscle: "legs", category: "combined", difficulty: "intermediate", shoulderSafe: true, equipment: [], defaultSets: 3, defaultReps: 12, restSeconds: 60 },
  { id: "box-jump", name: "קפיצות לקופסה", nameEn: "Box Jumps", muscleGroups: ["legs", "cardio"], primaryMuscle: "legs", category: "combined", difficulty: "intermediate", shoulderSafe: true, equipment: ["קופסה"], defaultSets: 3, defaultReps: 10, restSeconds: 90 },
];

export function searchExercises(query: string, muscleFilter?: MuscleGroup, shoulderSafeOnly = false): LibraryExercise[] {
  const q = query.trim().toLowerCase();
  return EXERCISE_LIBRARY.filter((ex) => {
    if (shoulderSafeOnly && !ex.shoulderSafe) return false;
    if (muscleFilter && !ex.muscleGroups.includes(muscleFilter)) return false;
    if (!q) return true;
    return (
      ex.name.toLowerCase().includes(q) ||
      ex.nameEn.toLowerCase().includes(q) ||
      ex.muscleGroups.some((m) => MUSCLE_LABELS[m].toLowerCase().includes(q))
    );
  });
}
