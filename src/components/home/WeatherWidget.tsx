import { useEffect, useState } from "react";
import { Cloud, CloudRain, Sun, CloudSnow, Wind, Droplets, MapPin, Dumbbell } from "lucide-react";

interface WeatherData {
  temp: number;
  feels_like: number;
  humidity: number;
  wind: number;
  code: number;
  city: string;
  daily: { date: string; max: number; min: number; code: number }[];
}

// WMO weather codes → icon + label
function getWeatherInfo(code: number): { icon: any; label: string; color: string } {
  if (code === 0) return { icon: Sun, label: "בהיר", color: "text-amber-400" };
  if (code <= 3) return { icon: Cloud, label: "מעונן חלקית", color: "text-slate-300" };
  if (code <= 48) return { icon: Cloud, label: "ערפילי", color: "text-slate-400" };
  if (code <= 67) return { icon: CloudRain, label: "גשום", color: "text-blue-400" };
  if (code <= 77) return { icon: CloudSnow, label: "שלג", color: "text-cyan-200" };
  if (code <= 82) return { icon: CloudRain, label: "ממטרים", color: "text-blue-400" };
  return { icon: Cloud, label: "מעונן", color: "text-slate-300" };
}

function getWorkoutRecommendation(temp: number, code: number): { text: string; outdoor: boolean } {
  const isRainy = code >= 51 && code <= 82;
  const isSnowy = code >= 71 && code <= 77;
  if (isRainy || isSnowy) return { text: "מומלץ אימון בבית/חדר כושר", outdoor: false };
  if (temp >= 32) return { text: "חם מדי לחוץ — אימון ממוזג", outdoor: false };
  if (temp <= 8) return { text: "קר — התלבש בשכבות אם יוצא", outdoor: false };
  if (temp >= 15 && temp <= 28) return { text: "מזג אוויר מושלם לריצה בחוץ! 🏃", outdoor: true };
  return { text: "תנאים סבירים לאימון בחוץ", outdoor: true };
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async (lat: number, lon: number, city: string) => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=4`;
        const res = await fetch(url);
        const data = await res.json();
        setWeather({
          temp: Math.round(data.current.temperature_2m),
          feels_like: Math.round(data.current.apparent_temperature),
          humidity: data.current.relative_humidity_2m,
          wind: Math.round(data.current.wind_speed_10m),
          code: data.current.weather_code,
          city,
          daily: data.daily.time.slice(1, 4).map((date: string, i: number) => ({
            date,
            max: Math.round(data.daily.temperature_2m_max[i + 1]),
            min: Math.round(data.daily.temperature_2m_min[i + 1]),
            code: data.daily.weather_code[i + 1],
          })),
        });
      } catch (e) {
        setError("שגיאה בטעינת מזג אוויר");
      } finally {
        setLoading(false);
      }
    };

    if (typeof window === "undefined" || !navigator.geolocation) {
      // Fallback: Tel Aviv
      fetchWeather(32.0853, 34.7818, "תל אביב");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude, "המיקום שלך"),
      () => fetchWeather(32.0853, 34.7818, "תל אביב"),
      { timeout: 5000 }
    );
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4 animate-pulse">
        <div className="h-20" />
      </div>
    );
  }

  if (error || !weather) return null;

  const info = getWeatherInfo(weather.code);
  const Icon = info.icon;
  const rec = getWorkoutRecommendation(weather.temp, weather.code);
  const dayNames = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`h-12 w-12 rounded-xl bg-card border border-border flex items-center justify-center ${info.color}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black">{weather.temp}°</span>
              <span className="text-xs text-muted-foreground">מרגיש כמו {weather.feels_like}°</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>{weather.city}</span>
              <span>•</span>
              <span>{info.label}</span>
            </div>
          </div>
        </div>
        <div className="text-left space-y-0.5">
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground justify-end">
            <Droplets className="h-3 w-3" />
            <span>{weather.humidity}%</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground justify-end">
            <Wind className="h-3 w-3" />
            <span>{weather.wind} קמ"ש</span>
          </div>
        </div>
      </div>

      {/* Workout recommendation */}
      <div className={`rounded-xl border p-2.5 flex items-center gap-2 ${rec.outdoor ? "bg-sport/10 border-sport/30" : "bg-muted/20 border-border"}`}>
        <Dumbbell className={`h-3.5 w-3.5 shrink-0 ${rec.outdoor ? "text-sport" : "text-muted-foreground"}`} />
        <p className={`text-[11px] font-semibold ${rec.outdoor ? "text-sport" : "text-foreground"}`}>{rec.text}</p>
      </div>

      {/* 3-day forecast */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        {weather.daily.map((d) => {
          const di = getWeatherInfo(d.code);
          const DIcon = di.icon;
          const dayIdx = new Date(d.date).getDay();
          return (
            <div key={d.date} className="rounded-lg bg-muted/20 border border-border p-2 text-center space-y-1">
              <p className="text-[10px] text-muted-foreground font-bold">{dayNames[dayIdx]}</p>
              <DIcon className={`h-4 w-4 mx-auto ${di.color}`} />
              <p className="text-[11px] font-bold">
                {d.max}° <span className="text-muted-foreground font-normal">{d.min}°</span>
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
