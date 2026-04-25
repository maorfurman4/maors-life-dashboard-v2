import { useEffect, useState } from "react";
import { Sun, Cloud, CloudRain, CloudSnow } from "lucide-react";

function getIcon(code: number) {
  if (code === 0) return Sun;
  if (code <= 48) return Cloud;
  if (code <= 77) return CloudSnow;
  return CloudRain;
}

export function WeatherMini() {
  const [data, setData] = useState<{ temp: number; code: number } | null>(null);

  useEffect(() => {
    const go = (lat: number, lon: number) =>
      fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`
      )
        .then((r) => r.json())
        .then((d) => setData({ temp: Math.round(d.current.temperature_2m), code: d.current.weather_code }))
        .catch(() => {});

    navigator.geolocation?.getCurrentPosition(
      (p) => go(p.coords.latitude, p.coords.longitude),
      () => go(32.0853, 34.7818),
      { timeout: 5000 }
    );
  }, []);

  if (!data) return null;

  const Icon = getIcon(data.code);

  return (
    <div className="flex items-center gap-1.5 rounded-2xl border border-white/15 bg-white/10 px-3 py-2 backdrop-blur-md">
      <Icon className="h-4 w-4 text-amber-300" />
      <span className="text-sm font-bold text-white">{data.temp}°</span>
    </div>
  );
}
