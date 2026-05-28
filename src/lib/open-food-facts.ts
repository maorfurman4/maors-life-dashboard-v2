export interface FoodFactsProduct {
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  servingSize: number;
  brand?: string;
}

interface OFFNutriments {
  "energy-kcal_100g"?: number;
  "energy_100g"?: number;
  proteins_100g?: number;
  fat_100g?: number;
  carbohydrates_100g?: number;
}

interface OFFProduct {
  product_name?: string;
  brands?: string;
  serving_size?: string;
  nutriments?: OFFNutriments;
}

interface OFFResponse {
  status: number;
  product?: OFFProduct;
}

export async function fetchProductByBarcode(barcode: string): Promise<FoodFactsProduct | null> {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const data: OFFResponse = await res.json();
    if (data.status !== 1 || !data.product) return null;

    const p = data.product;
    const n = p.nutriments ?? {};

    const kcal100 =
      n["energy-kcal_100g"] ??
      (n["energy_100g"] != null ? n["energy_100g"] / 4.184 : 0);

    const name = p.product_name?.trim();
    if (!name) return null;

    const servingRaw = p.serving_size ?? "100g";
    const servingMatch = servingRaw.match(/(\d+(\.\d+)?)/);
    const servingSize = servingMatch ? parseFloat(servingMatch[1]) : 100;

    return {
      name,
      calories: Math.round(kcal100 * 100) / 100,
      protein: Math.round((n.proteins_100g ?? 0) * 100) / 100,
      fat: Math.round((n.fat_100g ?? 0) * 100) / 100,
      carbs: Math.round((n.carbohydrates_100g ?? 0) * 100) / 100,
      servingSize,
      brand: p.brands?.split(",")[0]?.trim() || undefined,
    };
  } catch {
    return null;
  }
}
