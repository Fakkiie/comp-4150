"use client";
import { useEffect, useState } from "react";

export default function Home() {
  const [status, setStatus] = useState<null | string>(null);

  useEffect(() => {
    const api = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api").replace(/\/$/, "");
    const url = `${api}/health`;

    (async () => {
      setStatus("Checking…");
      try {
        const res = await fetch(url, { method: "GET", headers: { Accept: "application/json" } });
        if (!res.ok) {
          setStatus(`HTTP error ${res.status} ${res.statusText}`);
          return;
        }
        const json = await res.json();
        setStatus(`Reachable ${JSON.stringify(json)}`);
      } catch (e: any) {
        try {
          const probe = await fetch(url, { mode: "no-cors" });
          if (probe && probe.type === "opaque") {
            setStatus("CORS blocked (server reachable, browser blocked)");
            return;
          }
          setStatus(`Fetch failed: ${e?.message || String(e)}`);
        } catch {
          setStatus("Network error (server not reachable from browser)");
        }
      }
    })();
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow p-6 space-y-4">
        <h1 className="text-2xl font-bold">Frontend ✓</h1>
        <p className="text-sm text-slate-600">
          Backend URL: {process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api"}
        </p>
        <pre className="text-xs text-black bg-slate-50 p-3 rounded border overflow-auto">
          {status ?? "Checking /api/health..."}
        </pre>
      </div>
    </main>
  );
}
