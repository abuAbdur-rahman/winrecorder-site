"use client";

import {
  AppWindow,
  Crop,
  Film,
  FolderOpen,
  Monitor,
  Pause,
  Play,
  Settings,
  Square,
  Timer,
  Video,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";

const COLORS = {
  bg: "var(--wr-bg)",
  s: "var(--wr-surface)",
  s2: "var(--wr-surface-2)",
  line: "var(--wr-line)",
  tx: "var(--wr-ink)",
  mu: "var(--wr-muted)",
  rec: "var(--wr-rec)",
  bar: "var(--wr-bar)",
  bar2: "var(--wr-bar-2)",
  amb: "var(--wr-amber)",
};

const grad = (h: number) =>
  `linear-gradient(135deg,hsl(${(h % 360)} 45% 36%),hsl(${
    ((h + 55) % 360)
  } 50% 18%))`;

const pad = (n: number) => String(n).padStart(2, "0");
const fmt = (s: number) =>
  (s >= 3600 ? pad(Math.floor(s / 3600)) + ":" : "") +
  pad(Math.floor((s / 60) % 60)) +
  ":" +
  pad(s % 60);

const SRC: Record<
  string,
  Array<{ id: number; n: string; r: string; h: number }>
> = {
  screen: [
    { id: 1, n: "Display 1", r: "1920 × 1080", h: 225 },
    { id: 2, n: "Display 2", r: "2560 × 1440", h: 285 },
  ],
  window: [
    { id: 3, n: "VS Code", r: "Inbox", h: 205 },
    { id: 4, n: "Chrome", r: "Inbox", h: 30 },
    { id: 5, n: "Terminal", r: "~/projects", h: 150 },
    { id: 6, n: "File Explorer", r: "Videos", h: 50 },
    { id: 7, n: "Figma", r: "Design v3", h: 320 },
    { id: 8, n: "Spotify", r: "Now playing", h: 140 },
    { id: 9, n: "Slack", r: "#general", h: 280 },
    { id: 10, n: "Notion", r: "Roadmap", h: 0 },
  ],
};

const LIB_SEED = [
  { n: "Recording_2026-11-16_21-04.mp4", mb: 182, s: 754, d: 1, h: 210 },
  { n: "Recording_2026-11-14_09-30.mp4", mb: 64, s: 212, d: 3, h: 320 },
  { n: "Recording_2026-11-10_17-12.mp4", mb: 540, s: 2310, d: 7, h: 20 },
  { n: "Recording_2026-11-02_11-00.mp4", mb: 23, s: 58, d: 15, h: 160 },
];

const meterLevels = () =>
  Array.from({ length: 5 }, () => Math.max(4, 4 + Math.random() * 20));

function makeRecording(seconds: number) {
  const now = new Date();
  return {
    n: `Recording_${now.toISOString().slice(0, 16).replace(/[:T]/g, "-")}.mp4`,
    mb: Math.max(1, seconds * 2),
    s: seconds,
    d: 0,
    h: (now.getTime() / 7) % 360,
  };
}

export function ProductTour() {
  const [view, setView] = useState<"record" | "library" | "settings">("record");
  const [capType, setCapType] = useState<"screen" | "window">("screen");
  const [srcId, setSrcId] = useState(1);
  const [sysAudio, setSysAudio] = useState(true);
  const [mic, setMic] = useState(false);
  const [fps, setFps] = useState("30");
  const [quality, setQuality] = useState("High");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [recState, setRecState] = useState<"idle" | "recording" | "paused">("idle");
  const [acc, setAcc] = useState(0);
  const [showBar, setShowBar] = useState(false);
  const [showRest, setShowRest] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastUndo, setToastUndo] = useState<(() => void) | null>(null);
  const [sort, setSort] = useState<"new" | "old" | "big" | "long">("new");
  const [lib, setLib] = useState(() => [...LIB_SEED]);
  const [displayElapsed, setDisplayElapsed] = useState(0);
  const [meter, setMeter] = useState([4, 4, 4, 4, 4]);

  // Refs for impure values (kept out of render path)
  const t0Ref = useRef(0);
  const accRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cdRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer: update display elapsed every 200ms while recording
  useEffect(() => {
    if (recState === "recording") {
      t0Ref.current = Date.now();
      accRef.current = acc;
      timerRef.current = setInterval(() => {
        setDisplayElapsed(accRef.current + (Date.now() - t0Ref.current));
        setMeter(meterLevels());
      }, 200);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setDisplayElapsed(accRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (cdRef.current) clearInterval(cdRef.current);
    };
  }, [recState, acc]);

  // ---------- actions ----------

  function say(msg: string, undo?: () => void) {
    setToastMsg(msg);
    setToastUndo(undo ?? null);
    setShowToast(true);
    if (cdRef.current) {
      clearInterval(cdRef.current);
      cdRef.current = null;
    }
    cdRef.current = setTimeout(() => setShowToast(false), undo ? 5000 : 2200);
  }

  function sortLib(a: { d: number; mb: number; s: number }, b: { d: number; mb: number; s: number }): number {
    if (sort === "new") return a.d - b.d;
    if (sort === "old") return b.d - a.d;
    if (sort === "big") return b.mb - a.mb;
    return b.s - a.s;
  }

  function deleteLib(v: { n: string; d: number; mb: number; s: number; h: number }) {
    const i = lib.findIndex((x) => x.n === v.n);
    if (i < 0) return;
    const removed = lib[i];
    const next = lib.filter((_, idx) => idx !== i);
    setLib(next);
    say("Moved to Recycle Bin", () => {
      setLib([...next, removed].sort(sortLib));
    });
  }

  function startRecording() {
    if (recState !== "idle" || countdown !== null) return;
    const n = 3;
    if (!n) {
      beginRecording();
      return;
    }
    setCountdown(n);
    cdRef.current = setInterval(() => {
      setCountdown((c) => {
        const next = (c ?? n) - 1;
        if (next <= 0) {
          if (cdRef.current) {
            clearInterval(cdRef.current);
            cdRef.current = null;
          }
          setCountdown(null);
          beginRecording();
          return next;
        }
        return next;
      });
    }, 1000);
  }

  function beginRecording() {
    setAcc(0);
    setRecState("recording");
    setShowRest(true);
    setShowBar(true);
  }

  function stopRecording() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const s = Math.floor(displayElapsed / 1000);
    setRecState("idle");
    setAcc(0);
    setShowRest(false);
    setShowBar(false);
    const newItem = makeRecording(s);
    setLib([newItem, ...lib]);
    say(`Recording saved (${fmt(s)})`);
    setView("library");
  }

  function togglePause() {
    if (recState === "recording") {
      setAcc(displayElapsed);
      setRecState("paused");
    } else if (recState === "paused") {
      setRecState("recording");
    }
  }

  function discardRecording() {
    const prev = { acc: displayElapsed, was: recState };
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRecState("idle");
    setAcc(0);
    setShowRest(false);
    setShowBar(false);
    say("Recording discarded", () => {
      setAcc(prev.acc);
      setShowRest(true);
      setShowBar(true);
      if (prev.was === "recording") setRecState("recording");
      else setRecState("paused");
    });
  }

  // ---------- render ----------

  const navItem = (item: {
    id: "record" | "library" | "settings";
    label: string;
    Icon: typeof Monitor;
  }) => (
    <button
      key={item.id}
      className="nv group"
      aria-label={item.label}
      aria-pressed={view === item.id}
      data-v={item.id}
      onClick={() => setView(item.id)}
      style={{
        position: "relative",
        width: 48,
        height: 48,
        borderRadius: 14,
        display: "grid",
        placeItems: "center",
        color: view === item.id ? COLORS.tx : COLORS.mu,
        background: view === item.id ? COLORS.s2 : "transparent",
        border: "none",
        cursor: "pointer",
        transition: "0.15s",
      }}
    >
      <item.Icon
        strokeWidth={1.6}
        aria-hidden="true"
        style={{ width: 18, height: 18, color: "currentColor" }}
      />
      <span
        className="tip opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
        style={{
          position: "absolute",
          left: 62,
          whiteSpace: "nowrap",
          background: COLORS.bar,
          color: "#f3f2ef",
          fontSize: 12,
          padding: "5px 10px",
          borderRadius: 8,
          transform: "translateX(-4px)",
          pointerEvents: "none",
          zIndex: 5,
        }}
      >
        {item.label}
      </span>
      {view === item.id ? (
        <span
          aria-hidden="true"
          className="wr-nav-indicator"
          style={{
            position: "absolute",
            left: -14,
            top: 12,
            bottom: 12,
            width: 4,
            borderRadius: "0 4px 4px 0",
            background: COLORS.rec,
          }}
        />
      ) : null}
    </button>
  );

  const nav = (
    <div
      className="rail wr-rail"
      aria-label="Main"
      style={{
        position: "relative",
        top: 0,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "18px 0",
        gap: 6,
        borderRight: `1px solid ${COLORS.line}`,
        background: COLORS.s,
      }}
    >
      <div
        className="logo wr-logo"
        aria-hidden="true"
        style={{
          width: 40,
          height: 40,
          display: "grid",
          placeItems: "center",
          marginBottom: 14,
        }}
      >
        <svg
          viewBox="0 0 24 24"
          width="24"
          height="24"
          fill={COLORS.rec}
        >
          <circle cx="12" cy="12" r="8" />
        </svg>
      </div>
      {navItem({ id: "record", label: "Record", Icon: Video })}
      {navItem({ id: "library", label: "Library", Icon: Film })}
      <span className="sp wr-rail-sp" style={{ flex: 1 }} />
      {navItem({ id: "settings", label: "Settings", Icon: Settings })}
    </div>
  );

  const topBar = (
    <div
      className="top"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 15,
        display: "flex",
        alignItems: "center",
        height: 68,
        padding: "0 32px",
        background: `color-mix(in srgb, ${COLORS.bg} 82%, transparent)`,
        backdropFilter: "blur(14px)",
      }}
    >
      <h1 id="pt" style={{ margin: 0, fontSize: 20 }}>
        {view === "record" ? "Record" : view === "library" ? "Library" : "Settings"}
      </h1>
    </div>
  );

  const recordSection = (
    <section
      id="v-record"
      aria-label="Record"
      style={{ display: view === "record" ? "" : "none" }}
    >
      <div
        className="row"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          justifyContent: "center",
          margin: "0 0 20px",
        }}
        role="group"
        aria-label="Capture type"
      >
        <div
          className="seg"
          style={{
            display: "inline-flex",
            gap: 2,
            background: COLORS.s2,
            borderRadius: 12,
            padding: 3,
          }}
        >
          {[
            { id: "screen", label: "Screen", Icon: Monitor },
            { id: "window", label: "Window", Icon: AppWindow },
            { id: "region", label: "Region", Icon: Crop, disabled: true },
          ].map((item) => (
            <button
              key={item.id}
              aria-pressed={capType === item.id}
              data-k={item.id}
              disabled={item.disabled}
              title={item.disabled ? "Coming in 2.1" : undefined}
              onClick={() =>
                setCapType(item.id as "screen" | "window")
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "7px 14px",
                borderRadius: 9,
                color: capType === item.id ? COLORS.tx : COLORS.mu,
                fontWeight: 500,
                background: capType === item.id ? COLORS.s : "transparent",
                boxShadow:
                  capType === item.id
                    ? "0 1px 2px #0000000d,0 8px 24px #0000000a"
                    : undefined,
                border: "none",
                cursor: item.disabled ? "not-allowed" : "pointer",
                opacity: item.disabled ? 0.45 : 1,
                fontSize: "inherit",
              }}
            >
              <item.Icon
                className="size-3.5"
                strokeWidth={1.6}
                aria-hidden="true"
                style={{ color: "currentColor" }}
              />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div
        className="stage"
        id="stage"
        style={{
          aspectRatio: "16/9",
          borderRadius: 20,
          background: grad(
            SRC[capType].find((s) => s.id === srcId)?.h ?? 225
          ),
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 1px 2px #0000000d,0 8px 24px #0000000a",
          transition: "background 0.3s",
        }}
      >
        <span
          className="lab"
          id="sn"
          style={{
            position: "absolute",
            left: 14,
            bottom: 14,
            zIndex: 1,
            background: "#000a",
            color: "#fff",
            borderRadius: 9999,
            padding: "6px 14px",
            fontSize: 13,
            backdropFilter: "blur(8px)",
          }}
        >
          {SRC[capType].find((s) => s.id === srcId)?.n} ·{" "}
          {SRC[capType].find((s) => s.id === srcId)?.r}
        </span>
        <button
          className="rb"
          id="go"
          aria-label="Start recording"
          onClick={startRecording}
          disabled={recState !== "idle" || countdown !== null}
          style={{
            position: "absolute",
            inset: 0,
            margin: "auto",
            width: 76,
            height: 76,
            borderRadius: "50%",
            background: COLORS.rec,
            display: "grid",
            placeItems: "center",
            zIndex: 2,
            color: "#fff",
            boxShadow:
              "0 0 0 8px #ffffff2e,0 10px 30px #0006",
            transition: "0.2s",
            border: "none",
            cursor: recState !== "idle" || countdown !== null ? "not-allowed" : "pointer",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            style={{ width: 30, height: 30 }}
          >
            <circle cx="12" cy="12" r="8" />
          </svg>
        </button>
      </div>

      <div
        className="row"
        id="src"
        style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}
        role="group"
        aria-label="Capture source"
      >
        {capType === "window" ? (
          <button
            className="chip"
            id="cw"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              height: 38,
              padding: "0 14px",
              borderRadius: 9999,
              border: `1px solid ${COLORS.line}`,
              background: COLORS.s,
              cursor: "pointer",
              transition: "0.15s",
              userSelect: "none",
            }}
          >
            <AppWindow className="size-3.5" strokeWidth={1.6} aria-hidden="true" style={{ color: "currentColor" }} />
            Choose another window
          </button>
        ) : (
          SRC.screen.map((s) => (
            <label
              key={s.id}
              className="chip"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                height: 38,
                padding: "0 14px",
                borderRadius: 9999,
                border: `1px solid ${COLORS.line}`,
                background: COLORS.s,
                cursor: "pointer",
                transition: "0.15s",
                userSelect: "none",
              }}
            >
              <input
                type="radio"
                name="s"
                value={s.id}
                checked={srcId === s.id}
                onChange={() => setSrcId(s.id)}
                style={{ position: "absolute", opacity: 0 }}
              />
              <span
                className="sw"
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  background: grad(s.h),
                  flex: "none",
                }}
              />
              {s.n}
            </label>
          ))
        )}
      </div>

      <p
        className="hint"
        style={{
          textAlign: "center",
          color: COLORS.mu,
          fontSize: 13,
          marginTop: 16,
        }}
      >
        Press{" "}
        <kbd style={{ font: '12px "Red Hat Mono",monospace', background: COLORS.s2, border: `1px solid ${COLORS.line}`, borderRadius: 6, padding: "2px 6" }}>Ctrl</kbd>{" "}
        <kbd style={{ font: '12px "Red Hat Mono",monospace', background: COLORS.s2, border: `1px solid ${COLORS.line}`, borderRadius: 6, padding: "2px 6" }}>Shift</kbd>{" "}
        <kbd style={{ font: '12px "Red Hat Mono",monospace', background: COLORS.s2, border: `1px solid ${COLORS.line}`, borderRadius: 6, padding: "2px 6" }}>R</kbd>{" "}
        to start or stop
      </p>

      <p
        className="hint"
        id="sumt"
        style={{ marginTop: 4 }}
      >
        {[sysAudio ? "System audio" : "No system audio", mic ? "Mic on" : "Mic off", fps + " fps", quality].join(" · ")}
      </p>

      <div style={{ marginTop: 40 }}>
        <div className="rh" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "40px 0 12px" }}>
          <h2 style={{ display: "flex", alignItems: "center", fontSize: 13, fontWeight: 500, color: COLORS.mu, margin: "0 0 0 4px" }}>
            <Timer className="size-3" strokeWidth={1.6} aria-hidden="true" style={{ color: COLORS.mu, marginRight: 8 }} />
            Recent recordings
          </h2>
          <button
            id="ra"
            onClick={() => setView("library")}
            style={{ color: COLORS.mu, fontSize: 13, background: "none", border: "none", cursor: "pointer" }}
          >
            View all
          </button>
        </div>
        <div
          className="rl wr-recent"
          id="rl"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 14,
          }}
        >
          {[...lib]
            .sort(sortLib)
            .slice(0, 3)
            .map((v) => (
              <button
                key={v.n}
                className="rc"
                style={{
                  textAlign: "left",
                  display: "block",
                  minWidth: 0,
                  background: COLORS.bg,
                  border: `1px solid ${COLORS.line}`,
                  borderRadius: 14,
                  padding: 8,
                  transition: "0.15s",
                }}
              >
                <span
                  className="th"
                  style={{
                    position: "relative",
                    display: "grid",
                    placeItems: "center",
                    aspectRatio: "16/9",
                    borderRadius: 10,
                    background: grad(v.h),
                    color: "#ffffffb0",
                  }}
                >
                  <Play className="size-3" strokeWidth={1.6} aria-hidden="true" style={{ opacity: 0, transition: "0.15s" }} />
                  <span
                    className="badge"
                    style={{
                      position: "absolute",
                      right: 8,
                      bottom: 8,
                      background: "#000a",
                      borderRadius: 6,
                      padding: "1px 8px",
                      font: '12px "Red Hat Mono",monospace',
                    }}
                  >
                    {fmt(v.s)}
                  </span>
                </span>
                <b
                  style={{
                    display: "block",
                    fontWeight: 500,
                    fontSize: 13,
                    marginTop: 8,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {v.n.replace("Recording_", "").replace(".mp4", "")}
                </b>
                <small
                  style={{ color: COLORS.mu, fontSize: 12 }}
                >
                  {v.mb} MB · {v.d ? v.d + "d ago" : "Just now"}
                </small>
              </button>
            ))}
        </div>
      </div>
    </section>
  );

  const librarySection = (
    <section
      id="v-library"
      className="hide"
      aria-label="Library"
      style={{ display: view === "library" ? "" : "none" }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <span style={{ flex: 1 }} />
        <select
          id="sort"
          aria-label="Sort by"
          value={sort}
          onChange={(e) => setSort(e.target.value as "new" | "old" | "big" | "long")}
          style={{
            height: 38,
            padding: "0 12px",
            borderRadius: 9999,
            border: `1px solid ${COLORS.line}`,
            background: COLORS.s,
            font: "inherit",
            color: "inherit",
          }}
        >
          <option value="new">Newest</option>
          <option value="old">Oldest</option>
          <option value="big">Largest</option>
          <option value="long">Longest</option>
        </select>
        <button
          className="btn"
          id="of"
          onClick={() => say("Would open the output folder")}
          style={{
            height: 38,
            padding: "0 16px",
            borderRadius: 9999,
            border: `1px solid ${COLORS.line}`,
            background: COLORS.s,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
            font: "inherit",
            color: "inherit",
          }}
        >
          <FolderOpen className="size-3.5" strokeWidth={1.6} aria-hidden="true" style={{ color: "currentColor" }} />
          Open folder
        </button>
      </div>
      <div
        className="grid"
        id="lib"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
          gap: 16,
        }}
      >
        {lib.length ? [...lib].sort(sortLib).map((v) => (
          <article
            key={v.n}
            className="card"
            data-n={v.n}
            style={{
              textAlign: "left",
              borderRadius: 16,
              overflow: "hidden",
              transition: "0.15s",
              background: COLORS.s,
              border: `1px solid ${COLORS.line}`,
            }}
          >
            <div
              className="th"
              data-a="p"
              role="button"
              tabIndex={0}
              aria-label={`Play ${v.n}`}
              style={{
                aspectRatio: "16/9",
                background: grad(v.h),
                position: "relative",
                display: "grid",
                placeItems: "center",
                color: "#fff",
                cursor: "pointer",
              }}
              onClick={() => say("Would play in default player")}
              onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.currentTarget.click();
                }
              }}
            >
              <Play className="size-4" strokeWidth={1.6} aria-hidden="true" style={{ opacity: 0, transition: "0.15s" }} />
              <span
                className="badge"
                style={{
                  position: "absolute",
                  right: 8,
                  bottom: 8,
                  background: "#000a",
                  borderRadius: 6,
                  padding: "1px 8px",
                  font: '12px "Red Hat Mono",monospace',
                }}
              >
                {fmt(v.s)}
              </span>
            </div>
            <div
              className="cb"
              style={{ padding: "12px 14px 4px", fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
            >
              {v.n}
            </div>
            <div
              className="ca"
              style={{ display: "flex", alignItems: "center", padding: "0 8px 8px 14px", color: COLORS.mu, fontSize: 13 }}
            >
              <span style={{ flex: 1 }}>
                {v.mb} MB · {v.d ? v.d + (v.d > 1 ? " days" : " day") + " ago" : "Just now"}
              </span>
              <button
                className="ib"
                data-a="r"
                aria-label="Show in folder"
                title="Show in folder"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  color: COLORS.mu,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
                onClick={() => say("Would reveal in Explorer")}
              >
                <FolderOpen className="size-3.5" strokeWidth={1.6} aria-hidden="true" style={{ color: "currentColor" }} />
              </button>
              <button
                className="ib d"
                data-a="d"
                aria-label="Delete"
                title="Delete"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  color: COLORS.mu,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
                onClick={() => deleteLib(v)}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-3.5"
                  aria-hidden="true"
                  style={{ color: "currentColor" }}
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </button>
            </div>
          </article>
        )) : (
          <div className="empty" style={{ border: `1px dashed ${COLORS.line}`, borderRadius: 16, padding: 56, textAlign: "center", color: COLORS.mu }}>
            No recordings yet.<br />
            Press Record to make your first one.
          </div>
        )}
      </div>
    </section>
  );

  const settingsSection = (
    <section
      id="v-settings"
      className="hide"
      aria-label="Settings"
      style={{ display: view === "settings" ? "" : "none" }}
    >
      <p className="note" style={{ color: COLORS.mu, fontSize: 13, margin: "-12px 0 20px" }}>
        Changes save automatically.
      </p>
      <h2 style={{ fontSize: 13, fontWeight: 500, color: COLORS.mu, margin: "0 0 8px 4px" }}>Recording defaults</h2>
      <div className="grp" style={{ background: COLORS.s, border: `1px solid ${COLORS.line}`, borderRadius: 16, padding: "0 18px", marginBottom: 24 }}>
        <div className="fld" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, minHeight: 60, padding: "10px 0", borderBottom: `1px solid ${COLORS.line}` }}>
          <div>
            <div style={{ fontSize: 14 }}>System audio</div>
            <small style={{ display: "block", color: COLORS.mu, fontSize: 13 }}>Capture sound from your PC</small>
          </div>
          <label className="tg" style={{ position: "relative", width: 44, height: 26, flex: "none" }}>
            <input
              type="checkbox"
              id="sys"
              checked={sysAudio}
              aria-label="System audio"
              onChange={(e) => setSysAudio(e.target.checked)}
              style={{ position: "absolute", inset: 0, opacity: 0, margin: 0, cursor: "pointer" }}
            />
            <s
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 9999,
                background: COLORS.line,
                transition: "0.15s",
                pointerEvents: "none",
              }}
            />
            <s
              style={{
                position: "absolute",
                top: "3px",
                left: "3px",
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: "#fff",
                boxShadow: "0 1px 2px #0003",
                transition: "0.15s",
                transform: sysAudio ? "translateX(18px)" : "translateX(0)",
              }}
              aria-hidden="true"
            />
          </label>
        </div>
        <div className="fld" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, minHeight: 60, padding: "10px 0", borderBottom: `1px solid ${COLORS.line}` }}>
          <div>
            <div style={{ fontSize: 14 }}>Microphone</div>
            <small style={{ display: "block", color: COLORS.mu, fontSize: 13 }}>Record your voice</small>
          </div>
          <label className="tg" style={{ position: "relative", width: 44, height: 26, flex: "none" }}>
            <input
              type="checkbox"
              id="mic"
              checked={mic}
              aria-label="Microphone"
              onChange={(e) => setMic(e.target.checked)}
              style={{ position: "absolute", inset: 0, opacity: 0, margin: 0, cursor: "pointer" }}
            />
            <s
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 9999,
                background: COLORS.line,
                transition: "0.15s",
                pointerEvents: "none",
              }}
            />
            <s
              style={{
                position: "absolute",
                top: "3px",
                left: "3px",
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: "#fff",
                boxShadow: "0 1px 2px #0003",
                transition: "0.15s",
                transform: mic ? "translateX(18px)" : "translateX(0)",
              }}
              aria-hidden="true"
            />
          </label>
        </div>
        <div className="fld" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, minHeight: 60, padding: "10px 0", borderBottom: `1px solid ${COLORS.line}` }}>
          <div style={{ fontSize: 14 }}>Microphone device</div>
          <select
            style={{
              height: 38,
              padding: "0 12px",
              borderRadius: 9999,
              border: `1px solid ${COLORS.line}`,
              background: COLORS.s,
              font: "inherit",
              color: "inherit",
            }}
          >
            <option>Default microphone</option>
            <option>USB condenser mic</option>
          </select>
        </div>
        <div className="fld" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, minHeight: 60, padding: "10px 0", borderBottom: `1px solid ${COLORS.line}` }}>
          <div style={{ fontSize: 14 }}>Frame rate</div>
          <select
            id="fps"
            value={fps}
            onChange={(e) => setFps(e.target.value)}
            style={{
              height: 38,
              padding: "0 12px",
              borderRadius: 9999,
              border: `1px solid ${COLORS.line}`,
              background: COLORS.s,
              font: "inherit",
              color: "inherit",
            }}
          >
            <option value="30">30 fps</option>
            <option value="60">60 fps</option>
          </select>
        </div>
        <div className="fld" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, minHeight: 60, padding: "10px 0", borderBottom: 0 }}>
          <div style={{ fontSize: 14 }}>Quality</div>
          <select
            id="q"
            value={quality}
            onChange={(e) => setQuality(e.target.value)}
            style={{
              height: 38,
              padding: "0 12px",
              borderRadius: 9999,
              border: `1px solid ${COLORS.line}`,
              background: COLORS.s,
              font: "inherit",
              color: "inherit",
            }}
          >
            <option value="Standard">Standard</option>
            <option value="High">High</option>
            <option value="Ultra">Ultra</option>
          </select>
        </div>
      </div>

      <h2 style={{ fontSize: 13, fontWeight: 500, color: COLORS.mu, margin: "0 0 8px 4px" }}>Capture</h2>
      <div className="grp" style={{ background: COLORS.s, border: `1px solid ${COLORS.line}`, borderRadius: 16, padding: "0 18px", marginBottom: 24 }}>
        <div className="fld" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, minHeight: 60, padding: "10px 0", borderBottom: `1px solid ${COLORS.line}` }}>
          <div>
            <div style={{ fontSize: 14 }}>Countdown</div>
            <small style={{ display: "block", color: COLORS.mu, fontSize: 13 }}>Before recording starts. Esc cancels.</small>
          </div>
          <select
            id="cd"
            style={{
              height: 38,
              padding: "0 12px",
              borderRadius: 9999,
              border: `1px solid ${COLORS.line}`,
              background: COLORS.s,
              font: "inherit",
              color: "inherit",
            }}
          >
            <option value="0">None</option>
            <option value="3">3 seconds</option>
            <option value="5">5 seconds</option>
          </select>
        </div>
        <div className="fld" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, minHeight: 60, padding: "10px 0", borderBottom: `1px solid ${COLORS.line}` }}>
          <div style={{ fontSize: 14 }}>Hide app from recordings</div>
          <label className="tg" style={{ position: "relative", width: 44, height: 26, flex: "none" }}>
            <input
              type="checkbox"
              checked
              aria-label="Hide app from recordings"
              readOnly
              style={{ position: "absolute", inset: 0, opacity: 0, margin: 0, cursor: "pointer" }}
            />
            <s
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 9999,
                background: COLORS.line,
                transition: "0.15s",
                pointerEvents: "none",
              }}
            />
            <s
              style={{
                position: "absolute",
                top: "3px",
                left: "3px",
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: "#fff",
                boxShadow: "0 1px 2px #0003",
                transition: "0.15s",
                transform: "translateX(18px)",
              }}
              aria-hidden="true"
            />
          </label>
        </div>
        <div className="fld" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, minHeight: 60, padding: "10px 0", borderBottom: 0 }}>
          <div style={{ fontSize: 14 }}>Recording border</div>
          <small style={{ color: COLORS.mu, fontSize: 13 }}>Coming in 2.1</small>
          <label className="tg" style={{ position: "relative", width: 44, height: 26, flex: "none" }}>
            <input
              type="checkbox"
              disabled
              aria-label="Recording border"
              style={{ position: "absolute", inset: 0, opacity: 0, margin: 0 }}
            />
            <s
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 9999,
                background: COLORS.line,
                transition: "0.15s",
                pointerEvents: "none",
                opacity: 0.4,
              }}
            />
            <s
              style={{
                position: "absolute",
                top: "3px",
                left: "3px",
                width: 20,
                height: 20,
                borderRadius: "50%",
                background: "#fff",
                boxShadow: "0 1px 2px #0003",
                transition: "0.15s",
                transform: "translateX(0)",
              }}
              aria-hidden="true"
            />
          </label>
        </div>
      </div>

      <h2 style={{ fontSize: 13, fontWeight: 500, color: COLORS.mu, margin: "0 0 8px 4px" }}>Output</h2>
      <div className="grp" style={{ background: COLORS.s, border: `1px solid ${COLORS.line}`, borderRadius: 16, padding: "0 18px", marginBottom: 24 }}>
        <div className="fld" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, minHeight: 60, padding: "10px 0", borderBottom: 0 }}>
          <div style={{ fontSize: 14 }}>Save to</div>
          <div className="path" style={{ font: '13px "Red Hat Mono",monospace', color: COLORS.mu }}>C:\Users\you\Videos\WinRecorder</div>
          <button
            className="btn"
            style={{
              height: 38,
              padding: "0 16px",
              borderRadius: 9999,
              border: `1px solid ${COLORS.line}`,
              background: COLORS.s,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
              font: "inherit",
              color: "inherit",
            }}
          >
            Change
          </button>
        </div>
      </div>

      <h2 style={{ fontSize: 13, fontWeight: 500, color: COLORS.mu, margin: "0 0 8px 4px" }}>Hotkeys</h2>
      <div className="grp" style={{ background: COLORS.s, border: `1px solid ${COLORS.line}`, borderRadius: 16, padding: "0 18px" }}>
        <div className="fld" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, minHeight: 60, padding: "10px 0", borderBottom: `1px solid ${COLORS.line}` }}>
          <div style={{ fontSize: 14 }}>Start / stop</div>
          <span>
            <kbd style={{ font: '12px "Red Hat Mono",monospace', background: COLORS.s2, border: `1px solid ${COLORS.line}`, borderRadius: 6, padding: "2px 6" }}>Ctrl</kbd>{" "}
            <kbd style={{ font: '12px "Red Hat Mono",monospace', background: COLORS.s2, border: `1px solid ${COLORS.line}`, borderRadius: 6, padding: "2px 6" }}>Shift</kbd>{" "}
            <kbd style={{ font: '12px "Red Hat Mono",monospace', background: COLORS.s2, border: `1px solid ${COLORS.line}`, borderRadius: 6, padding: "2px 6" }}>R</kbd>
          </span>
        </div>
        <div className="fld" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, minHeight: 60, padding: "10px 0", borderBottom: 0 }}>
          <div style={{ fontSize: 14 }}>Pause / resume</div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span
              className="warn"
              style={{ color: "#b7791f", fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}
            >
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12" y2="17" />
              </svg>
              Used by another app
            </span>
            <button
              className="btn"
              style={{
                height: 38,
                padding: "0 16px",
                borderRadius: 9999,
                border: `1px solid ${COLORS.line}`,
                background: COLORS.s,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
                font: "inherit",
                color: "inherit",
              }}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16v16H4z" /></svg>
              Change
            </button>
          </div>
        </div>
      </div>
    </section>
  );

  const barWidth = 272;
  const barHeight = 60;
  const margin = 20;
  const vpW = typeof window !== "undefined" ? window.innerWidth : barWidth + margin * 2;
  const vpH = typeof window !== "undefined" ? window.innerHeight : 800;
  const floatingBar = (
    <div
      className={`bar h ${recState === "paused" ? "paused" : ""}`}
      id="bar"
      role="group"
      aria-label="Recorder"
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        background: COLORS.bar,
        color: "#f3f2ef",
        borderRadius: 9999,
        boxShadow: "0 12px 32px #0004,0 0 0 1px #ffffff12 inset",
        touchAction: "none",
        cursor: "grab",
        transition: "transform 0.5s cubic-bezier(.2,1.15,.3,1),width 0.3s,height 0.3s,opacity 0.25s",
        width: barWidth,
        height: barHeight,
        padding: "0 10px",
        transform: `translate(${vpW - barWidth - margin}px,${vpH - barHeight - margin}px)`,
        opacity: showBar ? 1 : 0,
        pointerEvents: showBar ? "auto" : "none",
      }}
    >
      <div
        className="grip"
        id="grip"
        tabIndex={0}
        role="button"
        aria-label="Move recorder"
        style={{
          display: "grid",
          gap: 3,
          padding: 8,
          borderRadius: 12,
          outline: "none",
          gridTemplateRows: "repeat(3,4px)",
          gridAutoFlow: "column",
        }}
      >
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <span
            key={i}
            className="i"
            style={{
              width: 4,
              height: 4,
              borderRadius: "50%",
              background: "#8d9096",
            }}
            aria-hidden="true"
          />
        ))}
      </div>
      <div
        className="meter"
        aria-hidden="true"
        style={{ display: "flex", alignItems: "center", gap: 3, height: 26 }}
      >
        {meter.map((h, i) => (
          <span
            key={i}
            style={{
              width: 3,
              height: recState === "recording" ? Math.max(4, h) : 4,
              borderRadius: 2,
              background: recState === "paused" ? COLORS.amb : COLORS.rec,
              transition: recState === "recording" ? "height 0.09s linear" : undefined,
            }}
          />
        ))}
      </div>
      <div
        className="time"
        id="time"
        role="timer"
        aria-label="Recording time"
        style={{
          font: '600 14px "Red Hat Mono",monospace',
          textAlign: "center",
          color: recState === "paused" ? COLORS.amb : "#f3f2ef",
        }}
      >
        {fmt(Math.floor(displayElapsed / 1000))}
      </div>
      <button
        id="pause"
        aria-label={recState === "paused" ? "Resume recording" : "Pause recording"}
        onClick={togglePause}
        disabled={recState === "idle"}
        style={{
          display: "grid",
          placeItems: "center",
          width: 38,
          height: 38,
          borderRadius: "50%",
          background: COLORS.bar2,
          color: "#f3f2ef",
          transition: "background 0.15s,transform 0.12s",
          border: "none",
          cursor: recState === "idle" ? "not-allowed" : "pointer",
        }}
      >
        {recState === "paused" ? (
          <Play className="size-3" fill="currentColor" strokeWidth={0} aria-hidden="true" />
        ) : (
          <Pause className="size-3" fill="currentColor" strokeWidth={0} aria-hidden="true" />
        )}
      </button>
      <button
        className="main"
        id="stop"
        aria-label="Stop and save"
        onClick={stopRecording}
        disabled={recState === "idle"}
        style={{
          width: 46,
          height: 46,
          background: COLORS.rec,
          display: "grid",
          placeItems: "center",
          borderRadius: "50%",
          color: "#fff",
          transition: "background 0.15s,transform 0.12s",
          border: "none",
          cursor: recState === "idle" ? "not-allowed" : "pointer",
        }}
      >
        <Square className="size-2.5" fill="currentColor" strokeWidth={0} aria-hidden="true" />
      </button>
      <button
        id="discard"
        aria-label="Discard recording"
        onClick={discardRecording}
        disabled={recState === "idle"}
        style={{
          display: "grid",
          placeItems: "center",
          width: 38,
          height: 38,
          borderRadius: "50%",
          background: COLORS.bar2,
          color: "#f3f2ef",
          transition: "background 0.15s,transform 0.12s",
          border: "none",
          cursor: recState === "idle" ? "not-allowed" : "pointer",
        }}
      >
        <svg
          viewBox="0 0 16 16"
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{ color: "currentColor" }}
        >
          <path d="M3.5 2.1 8 6.6l4.5-4.5 1.4 1.4L9.4 8l4.5 4.5-1.4 1.4L8 9.4l-4.5 4.5-1.4-1.4L6.6 8 2.1 3.5z" />
        </svg>
      </button>
    </div>
  );

  const countdownOverlay = (
    <div
      className="cd"
      id="cdn"
      aria-live="assertive"
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 40,
        display: countdown === null ? "none" : "grid",
        placeItems: "center",
        background: `color-mix(in srgb, ${COLORS.bg} 92%, transparent)`,
        color: COLORS.tx,
        textAlign: "center",
        lineHeight: 1,
      }}
    >
      <div>
        <div style={{ fontSize: 160, fontWeight: 600 }}>{countdown}</div>
        <small style={{ display: "block", fontSize: 14, fontWeight: 400, color: COLORS.mu, marginTop: 16 }}>
          Recording starts soon. Press Esc to cancel.
        </small>
      </div>
    </div>
  );

  const restBanner = (
    <div
      className="rest"
      id="rest"
      style={{
        position: "absolute",
        inset: 0,
        display: showRest ? "grid" : "none",
        placeItems: "center",
        textAlign: "center",
        background: `color-mix(in srgb, ${COLORS.bg} 82%, transparent)`,
        backdropFilter: "blur(10px)",
        zIndex: 20,
        pointerEvents: "none",
        color: COLORS.mu,
      }}
    >
      <div>
        <b style={{ display: "block", color: COLORS.tx, fontSize: 20, fontWeight: 600, marginBottom: 4 }}>
          Recording in progress
        </b>
        Use the floating bar to pause or stop.<br />
        Drag it anywhere.
      </div>
    </div>
  );

  const toast = (
    <div
      className="toast"
      id="toast"
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        left: "50%",
        bottom: "calc(88px + env(safe-area-inset-bottom))",
        transform: `translate(-50%,${showToast ? 0 : 12}px)`,
        display: "flex",
        alignItems: "center",
        gap: 14,
        background: COLORS.bar,
        color: "#f3f2ef",
        padding: "10px 18px",
        borderRadius: 9999,
        fontSize: 14,
        opacity: showToast ? 1 : 0,
        transition: "0.25s",
        pointerEvents: showToast ? "auto" : "none",
        zIndex: 60,
        boxShadow: "0 10px 26px #0004",
      }}
    >
      <span id="tm">{toastMsg}</span>
      {toastUndo ? (
        <button
          onClick={() => {
            toastUndo();
            setShowToast(false);
          }}
          style={{ color: "#8fb4ff", fontWeight: 600, padding: "2px 4px", borderRadius: 6, background: "none", border: "none", cursor: "pointer" }}
        >
          Undo
        </button>
      ) : null}
    </div>
  );

  return (
    <section
      id="product"
      className="relative px-5 pb-16"
      aria-labelledby="product-tour-title"
    >
      <div className="mx-auto max-w-6xl">
        <h2 id="product-tour-title" className="sr-only">WinRecorder app preview</h2>

        <div
          className="frame wr-app overflow-hidden"
          style={{
            position: "relative",
            display: "grid",
            gridTemplateColumns: "76px minmax(0,1fr)",
            gridTemplateRows: "minmax(0, 1fr)",
            height: "min(820px, 82vh)",
            fontFamily: 'Inter, "Segoe UI", system-ui, -apple-system, sans-serif',
            color: COLORS.tx,
            border: `1px solid #34343a`,
            borderRadius: 14,
            background: COLORS.bg,
            boxShadow: "0 0 0 1px #ffffff12, 0 30px 80px -24px #000, 0 12px 32px -12px #000",
          }}
        >
          {nav}
          <div className="pane wr-pane" style={{ minWidth: 0, overflowY: "auto" }}>
            {topBar}
            <main className="wr-main" style={{ maxWidth: 760, margin: "0 auto", padding: "8px 24px 64px" }}>
              {recordSection}
              {librarySection}
              {settingsSection}
              <div style={{ marginBottom: 60 }} />
            </main>
          </div>
          {countdownOverlay}
          {restBanner}
        </div>

        {showBar ? floatingBar : null}
        {toast}
      </div>
    </section>
  );
}
