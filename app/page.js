"use client";

import { useState, useEffect, useRef } from "react";

const INTERVALS = [
  { label: "15 minutes", value: 15 },
  { label: "1 hour", value: 60 },
  { label: "6 hours", value: 360 },
  { label: "24 hours", value: 1440 }
];

const STATUS_COLORS = {
  ok: "bg-green-100 text-green-700",
  error: "bg-red-100 text-red-700",
  blocked: "bg-orange-100 text-orange-700",
  pending: "bg-slate-100 text-slate-600"
};

function compareText(oldText = "", newText = "") {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");
  const oldSet = new Set(oldLines);
  const newSet = new Set(newLines);

  return {
    removed: oldLines.filter(line => !newSet.has(line)),
    added: newLines.filter(line => !oldSet.has(line))
  };
}

function formatTime(time) {
  return time ? new Date(time).toLocaleString() : "Never";
}

function showDiff(diff) {
  if (!diff || (!diff.removed.length && !diff.added.length)) {
    return (
      <p className="mt-2 text-sm text-slate-500">
        Content changed (only the order of lines is different).
      </p>
    );
  }

  return (
    <div className="mt-3 space-y-1 text-sm">
      {diff.removed.map((line, i) => (
        <p key={`r${i}`} className="break-words rounded bg-red-50 px-3 py-1 text-red-800">
          − {line}
        </p>
      ))}
      {diff.added.map((line, i) => (
        <p key={`a${i}`} className="break-words rounded bg-green-50 px-3 py-1 text-green-800">
          + {line}
        </p>
      ))}
    </div>
  );
}

export default function Home() {
  const [sites, setSites] = useState([]);
  const [checkingIds, setCheckingIds] = useState({});
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [minutes, setMinutes] = useState(60);
  const [error, setError] = useState("");
  const [hydrated, setHydrated] = useState(false);

  const sitesRef = useRef(sites);
  const checkingRef = useRef(new Set());
  const checkSiteRef = useRef(null);

  sitesRef.current = sites;

  useEffect(() => {
    try {
      const saved = localStorage.getItem("watchtower-sites-v2");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setSites(parsed);
      }
    } catch {
      setError("Saved data could not be loaded.");
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem("watchtower-sites-v2", JSON.stringify(sites));
    } catch {
      setError("Could not save data in this browser.");
    }
  }, [sites, hydrated]);

  function updateSite(id, patch) {
    setSites(old => old.map(s => (s.id === id ? { ...s, ...patch } : s)));
  }

  function addSite(e) {
    e.preventDefault();
    setError("");

    let parsed;
    try {
      parsed = new URL(url.trim());
    } catch {
      setError("Enter a valid HTTP or HTTPS URL.");
      return;
    }

    if (!["http:", "https:"].includes(parsed.protocol)) {
      setError("Enter a valid HTTP or HTTPS URL.");
      return;
    }

    const cleanUrl = parsed.href.replace(/\/$/, "");

    if (sites.some(s => s.url === cleanUrl)) {
      setError("This website is already added.");
      return;
    }

    setSites(old => [
      ...old,
      {
        id: Date.now().toString(),
        name: name.trim(),
        url: cleanUrl,
        interval: Number(minutes),
        monitoring: true,
        status: "pending",
        error: "",
        changes: 0,
        lastChecked: null,
        lastChanged: null,
        hash: "",
        content: "",
        screenshot: "",
        history: []
      }
    ]);

    setName("");
    setUrl("");
  }

  async function checkSite(id) {
    const site = sitesRef.current.find(s => s.id === id);
    if (!site || checkingRef.current.has(id)) return;

    checkingRef.current.add(id);
    setCheckingIds(old => ({ ...old, [id]: true }));

    const now = new Date().toISOString();

    try {
      const response = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: site.url })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Website check failed.");
      }

      if (data.status !== "ok") {
        updateSite(id, {
          status: data.status,
          error: data.error || "",
          lastChecked: data.checkedAt || now
        });
        return;
      }

      const latest = {
        status: "ok",
        error: "",
        lastChecked: data.checkedAt,
        title: data.title,
        content: data.content,
        hash: data.hash,
        screenshot: data.screenshot
      };

      if (!site.hash) {
        updateSite(id, {
          ...latest,
          history: [
            { time: data.checkedAt, type: "baseline", screenshot: data.screenshot }
          ]
        });
      } else if (site.hash === data.hash) {
        updateSite(id, { status: "ok", error: "", lastChecked: data.checkedAt });
      } else {
        const diff = compareText(site.content, data.content);

        updateSite(id, {
          ...latest,
          changes: site.changes + 1,
          lastChanged: data.checkedAt,
          history: [
            { time: data.checkedAt, type: "changed", diff, screenshot: data.screenshot },
            ...site.history
          ].slice(0, 20)
        });
      }
    } catch (err) {
      updateSite(id, {
        status: "error",
        error:
          err.name === "TypeError"
            ? "Could not reach the server. Is it running?"
            : err.message,
        lastChecked: now
      });
    } finally {
      checkingRef.current.delete(id);
      setCheckingIds(old => {
        const copy = { ...old };
        delete copy[id];
        return copy;
      });
    }
  }

  checkSiteRef.current = checkSite;

  useEffect(() => {
    if (!hydrated) return;

    const timer = setInterval(() => {
      const now = Date.now();

      sitesRef.current.forEach(site => {
        const due =
          !site.lastChecked ||
          now - new Date(site.lastChecked).getTime() >= site.interval * 60000;

        if (site.monitoring && due) checkSiteRef.current(site.id);
      });
    }, 60000);

    return () => clearInterval(timer);
  }, [hydrated]);

  function toggleMonitoring(id) {
    const site = sitesRef.current.find(s => s.id === id);
    if (site) updateSite(id, { monitoring: !site.monitoring });
  }

  function removeSite(id) {
    setSites(old => old.filter(s => s.id !== id));
  }

  const totalChanges = sites.reduce((sum, s) => sum + s.changes, 0);
  const needsAttention = sites.filter(
    s => s.status === "error" || s.status === "blocked"
  ).length;

  if (!hydrated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-600">Loading WatchTower...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-5 text-slate-900 md:p-10">
      <h1 className="text-3xl font-bold text-blue-700">◈ WatchTower</h1>
      <p className="mt-1 text-slate-500">
        Know when a web page really changes.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          ["Monitored websites", sites.length],
          ["Changes detected", totalChanges],
          ["Needs attention", needsAttention]
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-3 text-3xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold">Add a website</h3>

        <form onSubmit={addSite} className="mt-4 space-y-3">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Website name"
            className="w-full rounded-xl border px-4 py-3"
            required
          />

          <input
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full rounded-xl border px-4 py-3"
            required
          />

          <select
            value={minutes}
            onChange={e => setMinutes(e.target.value)}
            className="w-full rounded-xl border px-4 py-3"
          >
            {INTERVALS.map(item => (
              <option key={item.value} value={item.value}>
                Check every {item.label}
              </option>
            ))}
          </select>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button className="rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white">
            + Add website
          </button>
        </form>
      </div>

      <div className="mt-8 rounded-2xl border bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold">Monitored websites</h3>

        {sites.length === 0 ? (
          <p className="mt-4 rounded-xl bg-slate-50 p-5 text-center text-slate-500">
            No websites added yet.
          </p>
        ) : (
          sites.map(site => (
            <div key={site.id} className="mt-5 rounded-xl border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{site.name}</p>
                  <p className="mt-1 break-all text-sm text-slate-500">{site.url}</p>

                  <p className="mt-2 text-sm text-slate-500">
                    Checks every{" "}
                    {INTERVALS.find(i => i.value === site.interval)?.label ||
                      `${site.interval} minutes`}{" "}
                    · Auto-monitor:{" "}
                    <span className={site.monitoring ? "font-semibold text-green-700" : "font-semibold"}>
                      {site.monitoring ? "ON" : "OFF"}
                    </span>
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Last checked: {formatTime(site.lastChecked)}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Last changed: {formatTime(site.lastChanged)} ({site.changes} changes)
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-3 py-2 text-sm font-semibold ${STATUS_COLORS[site.status] || STATUS_COLORS.pending}`}>
                    {site.status.toUpperCase()}
                  </span>

                  <button
                    onClick={() => toggleMonitoring(site.id)}
                    className="rounded-lg border px-3 py-2 text-sm"
                  >
                    {site.monitoring ? "Pause auto" : "Enable auto"}
                  </button>

                  <button
                    onClick={() => checkSite(site.id)}
                    disabled={Boolean(checkingIds[site.id])}
                    className="rounded-lg bg-blue-700 px-3 py-2 text-sm text-white disabled:opacity-50"
                  >
                    {checkingIds[site.id] ? "Checking..." : "Check website"}
                  </button>

                  <button
                    onClick={() => removeSite(site.id)}
                    disabled={Boolean(checkingIds[site.id])}
                    className="text-sm text-red-600 disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              </div>

              {site.error && (
                <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  Check failed: {site.error}
                  <span className="mt-1 block text-red-600">
                    Your last good version is kept.
                  </span>
                </p>
              )}

              {site.hash && (
                <div className="mt-4 rounded-lg bg-slate-50 p-4">
                  <p className="font-semibold">{site.title || "(no title)"}</p>

                  {site.screenshot && (
                    <a
                      href={site.screenshot}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-block text-sm text-blue-700 underline"
                    >
                      View latest screenshot
                    </a>
                  )}

                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm font-medium text-blue-700">
                      View extracted text
                    </summary>
                    <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-600">
                      {site.content.slice(0, 1500)}
                    </p>
                  </details>
                </div>
              )}

              <div className="mt-5 border-t pt-4">
                <h4 className="font-semibold">Version history</h4>

                {site.history.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-500">No history yet.</p>
                ) : (
                  site.history.map((item, i) => (
                    <details key={`${item.time}-${i}`} className="mt-3 rounded-lg border p-3">
                      <summary className="cursor-pointer">
                        {item.type === "baseline" ? "First version saved" : "Content changed"}
                        <span className="mt-1 block text-xs text-slate-500">
                          {formatTime(item.time)}
                        </span>
                      </summary>

                      {item.type === "changed" && showDiff(item.diff)}

                      {item.screenshot && (
                        <a
                          href={item.screenshot}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-block text-sm text-blue-700 underline"
                        >
                          View screenshot
                        </a>
                      )}
                    </details>
                  ))
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <footer className="mt-8 text-center text-sm text-slate-400">
        WatchTower · Monitor smarter, not harder.
      </footer>
    </main>
  );
}