import { MultiFormatWriter, BarcodeFormat, EncodeHintType } from "@zxing/library";

// ─── Barcode SVG renderer ─────────────────────────────────────────────────────

/**
 * Renders a Code128 barcode as an inline SVG string.
 * White background is always forced so scanner contrast is correct even in dark mode.
 */
export function renderBarcodeSvg(value: string, height = 80): string | null {
  if (!value.trim()) return null;
  try {
    const hints = new Map<EncodeHintType, unknown>();
    hints.set(EncodeHintType.MARGIN, 10);

    const writer = new MultiFormatWriter();
    const matrix = writer.encode(value.trim(), BarcodeFormat.CODE_128, 0, height, hints);
    const w = matrix.getWidth();

    // For 1D barcodes every row is identical — read column 0 for each x
    let bars = "";
    for (let x = 0; x < w; x++) {
      if (matrix.get(x, 0)) {
        bars += `<rect x="${x}" y="0" width="1" height="${height}"/>`;
      }
    }

    return (
      `<svg xmlns="http://www.w3.org/2000/svg" ` +
      `viewBox="0 0 ${w} ${height}" preserveAspectRatio="none" ` +
      `style="display:block;background:#fff">` +
      `<g fill="#000">${bars}</g>` +
      `</svg>`
    );
  } catch {
    return null;
  }
}

/**
 * Renders a QR code as an SVG string via BrowserQRCodeSvgWriter.
 * Falls back to null if encoding fails.
 */
export function renderQrSvg(value: string, size = 200): string | null {
  if (!value.trim()) return null;
  try {
    // Dynamic import path — BrowserQRCodeSvgWriter lives in @zxing/browser
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { BrowserQRCodeSvgWriter } = require("@zxing/browser");
    const writer = new BrowserQRCodeSvgWriter();
    const svgEl: SVGSVGElement = writer.write(value.trim(), size, size);
    return svgEl.outerHTML;
  } catch {
    return null;
  }
}

/**
 * Detects the best display format for a coupon's code/barcode value.
 * - Pure-digit strings ≥ 8 chars → CODE128 barcode
 * - Alphanumeric short ≤ 20 → text code (copy-friendly)
 * - URLs / longer strings → QR code
 */
export type DisplayFormat = "barcode" | "qr" | "text";

export function detectDisplayFormat(value: string): DisplayFormat {
  if (!value) return "text";
  const trimmed = value.trim();
  if (/^\d{8,}$/.test(trimmed)) return "barcode";
  if (trimmed.startsWith("http") || trimmed.length > 20) return "qr";
  return "text";
}

// ─── Coupon ↔ Grocery matching ────────────────────────────────────────────────

interface MatchableCoupon {
  id: string;
  title: string;
  store?: string | null;
  category?: string | null;
  is_used?: boolean | null;
}

interface MatchableItem {
  id: string;
  name: string;
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "סופרמרקט": ["סופר", "מרקט", "שופרסל", "רמי לוי", "מגה", "יינות ביתן", "ויקטורי", "פרש מרקט"],
  "מזון":     ["מזון", "אוכל", "מטבח", "בשר", "דגים", "ירקות", "פירות"],
  "ביגוד":    ["ביגוד", "אופנה", "בגדים", "נעליים", "זארה", "H&M", "קסטרו"],
  "מסעדות":   ["מסעדה", "אוכל", "פיצה", "המבורגר", "סושי"],
  "תרופות":   ["בית מרקחת", "פארם", "super-pharm", "תרופה", "ויטמין"],
};

function normalize(s: string): string {
  return s.toLowerCase().replace(/[\s\-_'"]/g, "");
}

/**
 * Cross-references active coupons against grocery item names.
 * Returns a Map<groceryItemId, couponId> for all matches.
 * Matching strategy:
 *   1. Direct substring match (coupon store/title ↔ item name)
 *   2. Category keyword match
 */
export function matchCouponsToGrocery(
  coupons: MatchableCoupon[],
  items: MatchableItem[]
): Map<string, string> {
  const result = new Map<string, string>();
  const active = coupons.filter((c) => !c.is_used);

  for (const item of items) {
    const itemNorm = normalize(item.name);

    for (const coupon of active) {
      const storNorm  = normalize(coupon.store  ?? "");
      const titleNorm = normalize(coupon.title  ?? "");
      const catNorm   = normalize(coupon.category ?? "");

      // Direct text match
      if (
        storNorm  && (itemNorm.includes(storNorm)  || storNorm.includes(itemNorm)) ||
        titleNorm && itemNorm.includes(titleNorm)
      ) {
        result.set(item.id, coupon.id);
        break;
      }

      // Category keyword match
      const keywords = CATEGORY_KEYWORDS[coupon.category ?? ""] ?? [];
      if (keywords.some((kw) => itemNorm.includes(normalize(kw)) || normalize(kw).includes(itemNorm))) {
        if (!result.has(item.id)) result.set(item.id, coupon.id);
      }
    }
  }

  return result;
}

// ─── Grouping ─────────────────────────────────────────────────────────────────

export const CATEGORY_META: Record<string, { emoji: string; color: string }> = {
  "סופרמרקט": { emoji: "🛒", color: "text-emerald-400" },
  "ביגוד":    { emoji: "👕", color: "text-purple-400" },
  "מסעדות":   { emoji: "🍽️", color: "text-orange-400" },
  "תרופות":   { emoji: "💊", color: "text-blue-400" },
  "אלקטרוניקה": { emoji: "💻", color: "text-cyan-400" },
  "תחבורה":   { emoji: "🚗", color: "text-yellow-400" },
  "בריאות":   { emoji: "🏃", color: "text-rose-400" },
  "אחר":      { emoji: "🏷️", color: "text-muted-foreground" },
};

export function getCategoryMeta(cat: string | null | undefined) {
  return CATEGORY_META[cat ?? "אחר"] ?? CATEGORY_META["אחר"];
}

export function daysUntilExpiry(expiry: string | null | undefined): number | null {
  if (!expiry) return null;
  return Math.ceil((new Date(expiry).getTime() - Date.now()) / 86_400_000);
}

export function groupCouponsByCategory<T extends { category?: string | null; expiry_date?: string | null }>(
  coupons: T[]
): Record<string, T[]> {
  const groups: Record<string, T[]> = {};
  for (const c of coupons) {
    const cat = c.category ?? "אחר";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(c);
  }
  // Sort each group: expiring soonest first, then no-expiry
  for (const cat in groups) {
    groups[cat].sort((a, b) => {
      const da = daysUntilExpiry(a.expiry_date);
      const db = daysUntilExpiry(b.expiry_date);
      if (da === null && db === null) return 0;
      if (da === null) return 1;
      if (db === null) return -1;
      return da - db;
    });
  }
  return groups;
}
