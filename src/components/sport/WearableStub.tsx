import { Watch, Bluetooth, BluetoothConnected, ChevronRight } from "lucide-react";
import { useState } from "react";

type Provider = "apple_health" | "google_fit";

interface StubActivity {
  steps: number;
  activeCalories: number;
  heartRateAvg: number;
  standHours: number;
}

// Stub module — replace body of fetchActivity() with real SDK calls when ready
async function fetchActivity(_provider: Provider): Promise<StubActivity> {
  // TODO: integrate Apple HealthKit (react-native-health) or Google Fit REST API
  return {
    steps: 7432,
    activeCalories: 310,
    heartRateAvg: 72,
    standHours: 8,
  };
}

export function WearableStub() {
  const [provider, setProvider] = useState<Provider>("apple_health");
  const [data, setData] = useState<StubActivity | null>(null);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const result = await fetchActivity(provider);
      setData(result);
      setConnected(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-sport/10 flex items-center justify-center">
          {connected ? (
            <BluetoothConnected className="h-4 w-4 text-sport" />
          ) : (
            <Bluetooth className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        <div>
          <h3 className="text-sm font-semibold">שעון חכם</h3>
          <p className="text-xs text-muted-foreground">
            {connected ? "מחובר — נתוני פעילות היום" : "חבר Apple Health / Google Fit"}
          </p>
        </div>
      </div>

      {!connected && (
        <div className="space-y-2">
          <div className="flex gap-2">
            {(["apple_health", "google_fit"] as Provider[]).map((p) => (
              <button
                key={p}
                onClick={() => setProvider(p)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                  provider === p
                    ? "border-sport/40 bg-sport/10 text-sport"
                    : "border-border bg-secondary/30 text-muted-foreground"
                }`}
              >
                {p === "apple_health" ? "Apple Health" : "Google Fit"}
              </button>
            ))}
          </div>
          <button
            onClick={handleConnect}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-sport/10 border border-sport/30 text-sport text-xs font-semibold hover:bg-sport/20 transition-colors disabled:opacity-50"
          >
            <Watch className="h-3.5 w-3.5" />
            {loading ? "מתחבר..." : "חבר עכשיו (STUB)"}
          </button>
        </div>
      )}

      {connected && data && (
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "צעדים היום", value: data.steps.toLocaleString("he") },
            { label: "קלוריות פעילות", value: `${data.activeCalories} קל'` },
            { label: "דופק ממוצע", value: `${data.heartRateAvg} bpm` },
            { label: "שעות עמידה", value: `${data.standHours}/12` },
          ].map((item) => (
            <div key={item.label} className="rounded-xl bg-secondary/30 border border-border p-3">
              <p className="text-[10px] text-muted-foreground">{item.label}</p>
              <p className="text-base font-black mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>
      )}

      {connected && (
        <button
          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => { setConnected(false); setData(null); }}
        >
          <ChevronRight className="h-3 w-3" />
          נתק
        </button>
      )}
    </div>
  );
}
