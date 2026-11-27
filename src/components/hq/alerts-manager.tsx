"use client";

import { useEffect, useState } from "react";
import { BellOff, BellRing, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Turns Mastery Terminal alerts on or off for this browser, picks topics,
 * and sends a test to this browser only.
 *
 * iPhone and iPad deliver web push only to a site added to the home screen
 * (iOS 16.4 or later); the page says so when push is missing.
 */

const TOPICS = [
  { id: "news", label: "High-impact news" },
  { id: "cot", label: "COT releases" },
  { id: "macro", label: "US data (CPI, jobs, Fed)" },
] as const;

type Status = "checking" | "unsupported" | "blocked" | "off" | "on";

function keyBytes(base64: string): Uint8Array<ArrayBuffer> {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function post(url: string, body: unknown, method = "POST"): Promise<void> {
  const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) {
    const data = (await r.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || `HTTP ${r.status}`);
  }
}

export function AlertsManager({ publicKey }: { publicKey: string }) {
  const [status, setStatus] = useState<Status>("checking");
  const [sub, setSub] = useState<PushSubscription | null>(null);
  const [topics, setTopics] = useState<string[]>(TOPICS.map((t) => t.id));
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    let live = true;
    const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    const check = supported
      ? navigator.serviceWorker
          .register("/hq-sw.js", { scope: "/", updateViaCache: "none" })
          .then((reg) => reg.pushManager.getSubscription())
          .then((existing): [Status, PushSubscription | null] => [
            Notification.permission === "denied" ? "blocked" : existing ? "on" : "off",
            existing,
          ])
      : Promise.resolve<[Status, PushSubscription | null]>(["unsupported", null]);
    check
      .then(([s, existing]) => {
        if (!live) return;
        setStatus(s);
        setSub(existing);
      })
      .catch(() => live && setStatus("unsupported"));
    return () => {
      live = false;
    };
  }, []);

  async function run(task: () => Promise<string>) {
    setBusy(true);
    setNote("");
    try {
      setNote(await task());
    } catch (error) {
      setNote(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  const turnOn = () =>
    run(async () => {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "blocked" : "off");
        return "Notifications were not allowed.";
      }
      const reg = await navigator.serviceWorker.ready;
      const created = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) });
      await post("/api/alerts/subscribe", { subscription: created.toJSON(), topics });
      setSub(created);
      setStatus("on");
      return "Alerts are on for this browser.";
    });

  const turnOff = () =>
    run(async () => {
      if (sub) {
        await post("/api/alerts/subscribe", { endpoint: sub.endpoint }, "DELETE");
        await sub.unsubscribe();
      }
      setSub(null);
      setStatus("off");
      return "Alerts are off for this browser.";
    });

  const saveTopics = () =>
    run(async () => {
      if (!sub) return "Turn alerts on first.";
      await post("/api/alerts/subscribe", { subscription: sub.toJSON(), topics });
      return "Topics saved.";
    });

  const test = () =>
    run(async () => {
      if (!sub) return "Turn alerts on first.";
      await post("/api/alerts/test", { subscription: sub.toJSON() });
      return "Test sent. It should arrive in a few seconds.";
    });

  if (status === "checking") return <p className="text-sm text-muted-foreground">Checking this browser…</p>;
  if (status === "unsupported") {
    return (
      <p className="text-sm text-muted-foreground">
        This browser cannot receive web push. On iPhone or iPad, add this site to the home screen first
        (Share, then Add to Home Screen) and open it from there.
      </p>
    );
  }
  if (status === "blocked") {
    return (
      <p className="text-sm text-muted-foreground">
        Notifications are blocked for this site. Allow them in the browser&apos;s site settings, then reload.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">Send me</legend>
        {TOPICS.map((t) => (
          <label key={t.id} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4 accent-primary"
              checked={topics.includes(t.id)}
              onChange={(e) =>
                setTopics((now) => (e.target.checked ? [...now, t.id] : now.filter((x) => x !== t.id)))
              }
            />
            {t.label}
          </label>
        ))}
      </fieldset>
      <div className="flex flex-wrap gap-2">
        {status === "on" ? (
          <>
            <Button variant="outline" onClick={saveTopics} disabled={busy || topics.length === 0}>
              Save topics
            </Button>
            <Button variant="outline" onClick={test} disabled={busy}>
              <Send aria-hidden /> Send a test
            </Button>
            <Button variant="ghost" onClick={turnOff} disabled={busy}>
              <BellOff aria-hidden /> Turn off
            </Button>
          </>
        ) : (
          <Button onClick={turnOn} disabled={busy || topics.length === 0}>
            <BellRing aria-hidden /> Turn on alerts
          </Button>
        )}
      </div>
      {note ? (
        <p className="text-sm text-muted-foreground" role="status">
          {note}
        </p>
      ) : null}
    </div>
  );
}
