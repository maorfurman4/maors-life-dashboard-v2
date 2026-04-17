

## תוכנית — 5 תיקונים

### 1. מובייל כמו אפליקציה (Native feel)
- **PWA קל**: `manifest.json` בלבד עם `display: "standalone"`, אייקונים, theme-color כהה. בלי service worker (כדי לא לשבור preview).
- **Meta tags ב-`__root.tsx`**: `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style=black-translucent`, `viewport` עם `viewport-fit=cover, user-scalable=no` (מבטל zoom ידני).
- **Safe-area**: `pt` ל-`TopBar` ו-`pb` ל-`BottomNav` עם `env(safe-area-inset-*)`.
- **Tap feedback**: `-webkit-tap-highlight-color: transparent`, `touch-action: manipulation`.
- **תוצאה**: "Add to Home Screen" → פותח full-screen בלי כתובת דפדפן.

### 2. הגדרות מתקדמות לכלכלה
מסך חדש `SettingsFinanceCategories.tsx` משולב ב-`/settings`:
- **קטגוריות הוצאה**: רשימה מטבלת `expense_categories` — הוסף/ערוך/מחק/קבע `budget_limit` + `icon` + `sort_order`.
- **הוצאות קבועות**: ניהול מלא של `fixed_expenses` (שם, סכום, יום חיוב, פעיל/לא, קטגוריה).
- **יעד חיסכון**: סליידר 0–60% (כבר קיים — נחבר ל-DB עם hook אמיתי).
- **מצב סנכרון** נטו/בנק (קיים — נוודא שמירה).
- כל פעולה → mutation ל-Supabase + toast + invalidate.

### 3. מסכים שחורים / תקיעות
סיבות עיקריות שזיהיתי:
- `useAuth` עושה SSR-fetch של session → flash שחור לפני hydration.
- חוסר `Suspense` boundaries → טעינות חוסמות renders.
- **תיקונים**:
  - הוסף `<div>טוען…</div>` skeleton ב-`_app.tsx` במקום redirect ריק.
  - הוסף `defaultPendingComponent` ל-router עם spinner נקי במקום מסך שחור.
  - ב-`__root.tsx`: רקע גוף = `var(--background)` כבר ב-HTML shell (מונע פלאש שחור בין routes).
  - הוסף `errorComponent` גלובלי במקום קריסות שקטות.
  - הסר `PWA service worker` אם נרשם איפשהו (בודק).

### 4. שוק ההון — מחירים בזמן אמת
כרגע אין מנוע מחירים, רק חיפוש סימבולים.
- **Edge function חדש** `stock-quotes`: מקבל list of symbols, קורא ל-Yahoo `quote` endpoint (`query1.finance.yahoo.com/v7/finance/quote?symbols=AAPL,TSLA`), מחזיר: `regularMarketPrice`, `regularMarketChangePercent`, `currency`, `marketState`.
- **Hook חדש** `useStockQuotes(symbols[])` עם `refetchInterval: 60_000` (רענון כל דקה).
- **MarketPortfolio**: לכל אחזקה מציג מחיר חי, שינוי יומי באחוזים (ירוק/אדום), שווי שוק נוכחי, רווח/הפסד מול `avg_price`.
- **MarketWatchlist**: אותו דבר למניות במעקב.
- כרטיס סיכום עליון: שווי תיק כולל + רווח/הפסד יומי + רווח/הפסד מצטבר.

### 5. חיפוש מזון בעברית (ישראלי)
OpenFoodFacts מחזיר תוצאות מוגבלות בעברית. שיפור:
- **Edge function חדש** `food-search`: 
  - שלב 1: קורא ל-OpenFoodFacts עם `lang=he` ו-`countries_tags=israel`.
  - שלב 2 (fallback): אם <3 תוצאות → קורא ל-USDA FoodData Central (אנגלית, איכות גבוהה) + מתרגם שם לעברית עם Lovable AI Gateway (`google/gemini-2.5-flash-lite` — מהיר וזול).
  - מחזיר תוצאות מאוחדות עם שם בעברית, יצרן, קלוריות/מאקרו ל-100g.
- **`AddMealDrawer`**: משתמש ב-edge function החדש במקום fetch ישיר. ברירת מחדל = mode "search". placeholder: "חפש: חזה עוף, אורז, במבה...".
- **כפתור כמות** (50/100/200g) לשינוי מהיר של מנה לפני שמירה.

---

### סדר ביצוע
1. PWA + meta tags + safe-area + ביטול zoom (מהיר)
2. תיקון מסכים שחורים + pending components
3. Edge function `stock-quotes` + UI מחירים חיים
4. Edge function `food-search` עברית + AI translation
5. SettingsFinanceCategories — קטגוריות + הוצאות קבועות

### שאלה אחת לפני ביצוע
מה לגבי חיפוש מזון בעברית: להעדיף **דיוק** (Lovable AI לתרגום, ~0.5s לכל חיפוש, עלות מינימלית) או **מהירות** (רק OpenFoodFacts עברי, פחות תוצאות אבל מיידי)?

אם תכתוב "המשך" — אבחר **דיוק** (AI translation) כברירת מחדל, כי זה הפתרון האמיתי לבעיה.

