import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import {
  Lock,
  Unlock,
  ShieldCheck,
  Info,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

/* =========================================================
   DEVSOKO GROWTH ROOM
   ---------------------------------------------------------
   A transparency dashboard, not a trading floor.

   The "DevSoko Index" (DSI) is a single number derived from
   three real platform metrics: gross marketplace value (GMV),
   platform fee revenue, and new active users. It moves only
   because those underlying numbers move.

   INTEGRATION NOTES FOR YOUR SUPABASE BACKEND
   - Create a `growth_metrics` table: (date, gmv, new_users, revenue)
   - Write access restricted via RLS to rows where
     auth.uid() is in your `admins` table — that's the only
     "admin privilege" this page needs. Admins log real daily
     numbers; they never set the index value itself.
   - Replace `generateDailyData()` below with a Supabase query
     that returns rows ordered by date.
   - Replace the static LEDGER array with a `supporters` table
     (name, joined_at, contribution_kes, dsi_at_entry). This
     table represents a record of separate written agreements,
     not a live order book.
   ========================================================= */

const COLORS = {
  bg: "#101A1C",
  panel: "#16242A",
  panelAlt: "#1C2E31",
  border: "#283A3D",
  text: "#F4F1EA",
  muted: "#8FA3A6",
  gold: "#E0A858",
  up: "#5FAD8C",
  down: "#D9745A",
};

const WEIGHTS = { gmv: 0.45, revenue: 0.35, users: 0.2 };
const BASE_INDEX = 100;
const UNIT_BASE_PRICE = 10; // KES per Support Unit when DSI = 100

const LABELS = {
  gmv: "GMV",
  revenue: "Platform revenue",
  users: "New active users",
};

const MILESTONES = {
  W3: "Hire Developers page launched",
  W6: "M-Pesa STK push integrated",
  W9: "Dev token purchases went live",
  W12: "Buyer & seller dashboards v2 shipped",
};

const LEDGER = [
  { name: "Founder Pool", role: "Founder", date: "2026-03-16", units: 85000 },
  { name: "T. Mwambingu", role: "Supporter", date: "2026-03-23", contributionKES: 50000, dsiAtEntry: 101 },
  { name: "E. Frank", role: "Supporter", date: "2026-04-13", contributionKES: 35000, dsiAtEntry: 112 },
  { name: "S. Oduor", role: "Supporter", date: "2026-05-11", contributionKES: 80000, dsiAtEntry: 128 },
];

/* ---------- seeded random so the demo data is stable ---------- */
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- demo data: swap for a Supabase query ---------- */
function generateDailyData() {
  const rand = mulberry32(42);
  const days = [];
  let gmv = 15000;
  let users = 2;
  let revenue = 1500;
  const start = new Date("2026-03-16");

  for (let i = 0; i < 91; i++) {
    gmv = gmv * (1 + 0.006 + (rand() - 0.5) * 0.03);
    users = Math.max(0, users + (rand() - 0.45) * 1.5);
    revenue = revenue * (1 + 0.0055 + (rand() - 0.5) * 0.035);

    const date = new Date(start);
    date.setDate(date.getDate() + i);

    days.push({
      date: date.toISOString().slice(0, 10),
      gmv: Math.round(gmv),
      users: Math.max(0, Math.round(users)),
      revenue: Math.round(revenue),
    });
  }
  return days;
}

/* ---------- DSI = f(real metrics), never set directly ---------- */
function computeIndexSeries(daily) {
  let index = BASE_INDEX;
  const out = [];
  for (let i = 0; i < daily.length; i++) {
    if (i < 7) {
      out.push({ ...daily[i], index });
      continue;
    }
    const prev = daily[i - 7];
    const cur = daily[i];
    const gmvGrowth = (cur.gmv - prev.gmv) / prev.gmv;
    const revGrowth = (cur.revenue - prev.revenue) / prev.revenue;
    const usersGrowth = prev.users === 0 ? 0 : (cur.users - prev.users) / Math.max(prev.users, 1);
    const dailyGrowth =
      (WEIGHTS.gmv * gmvGrowth + WEIGHTS.revenue * revGrowth + WEIGHTS.users * usersGrowth) / 7;
    index = index * (1 + dailyGrowth);
    out.push({ ...cur, index });
  }
  return out;
}

/* ---------- weekly OHLC candles from the daily index ---------- */
function toCandles(series) {
  const candles = [];
  for (let i = 7; i <= series.length; i += 7) {
    const week = series.slice(i - 7, i);
    const open = week[0].index;
    const close = week[week.length - 1].index;
    const high = Math.max(...week.map((d) => d.index));
    const low = Math.min(...week.map((d) => d.index));
    candles.push({
      week: `W${Math.floor(i / 7)}`,
      label: week[week.length - 1].date,
      open,
      close,
      high,
      low,
      gmv: week.reduce((s, d) => s + d.gmv, 0),
      revenue: week.reduce((s, d) => s + d.revenue, 0),
      users: week.reduce((s, d) => s + d.users, 0),
    });
  }
  return candles;
}

function formatMetric(key, value) {
  if (key === "users") return value.toLocaleString();
  return `KES ${Math.round(value).toLocaleString()}`;
}

/* ---------- custom candlestick body, drawn from low/high range ---------- */
function Candle(props) {
  const { x, y, width, height, payload } = props;
  const { open, close, high, low } = payload;
  const isUp = close >= open;
  const color = isUp ? COLORS.up : COLORS.down;

  if (high === low) {
    return <line x1={x + width / 2} x2={x + width / 2} y1={y} y2={y + height} stroke={color} strokeWidth={2} />;
  }

  const pxPerUnit = height / (high - low);
  const bodyTop = y + (high - Math.max(open, close)) * pxPerUnit;
  const bodyHeight = Math.max(Math.abs(open - close) * pxPerUnit, 1.5);
  const bodyX = x + width * 0.18;
  const bodyWidth = width * 0.64;
  const wickX = x + width / 2;

  return (
    <g>
      <line x1={wickX} x2={wickX} y1={y} y2={y + height} stroke={color} strokeWidth={1.5} />
      <rect x={bodyX} y={bodyTop} width={bodyWidth} height={bodyHeight} fill={color} rx={1.5} />
    </g>
  );
}

function CandleTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div className="dsi-tooltip dsi-mono">
      <p className="dsi-tooltip-week">
        {d.week} · {d.label}
      </p>
      <p>
        Open <span>{d.open.toFixed(2)}</span>
      </p>
      <p>
        Close <span>{d.close.toFixed(2)}</span>
      </p>
      <p>
        High <span>{d.high.toFixed(2)}</span>
      </p>
      <p>
        Low <span>{d.low.toFixed(2)}</span>
      </p>
      <hr />
      <p>
        GMV <span>{formatMetric("gmv", d.gmv)}</span>
      </p>
      <p>
        Revenue <span>{formatMetric("revenue", d.revenue)}</span>
      </p>
      <p>
        New users <span>{d.users}</span>
      </p>
    </div>
  );
}

export default function DevSokoGrowthRoom() {
  const [role, setRole] = useState("investor");
  const [timeframe, setTimeframe] = useState("8W");
  const [dailyData, setDailyData] = useState(() => generateDailyData());
  const [form, setForm] = useState({ gmv: "", users: "", revenue: "" });
  const [feedback, setFeedback] = useState(null);

  const indexSeries = useMemo(() => computeIndexSeries(dailyData), [dailyData]);
  const candles = useMemo(() => toCandles(indexSeries), [indexSeries]);

  const latest = candles[candles.length - 1];
  const prevCandle = candles[candles.length - 2] || latest;
  const dsiValue = latest.close;
  const dsiChange = ((latest.close - prevCandle.close) / prevCandle.close) * 100;
  const isUp = dsiChange >= 0;

  const visibleCandles = useMemo(() => {
    if (timeframe === "All") return candles;
    const n = parseInt(timeframe, 10);
    return candles.slice(-n);
  }, [candles, timeframe]);

  const yDomain = useMemo(() => {
    const lows = visibleCandles.map((c) => c.low);
    const highs = visibleCandles.map((c) => c.high);
    const min = Math.min(...lows);
    const max = Math.max(...highs);
    const pad = (max - min) * 0.1 || 1;
    return [Math.floor(min - pad), Math.ceil(max + pad)];
  }, [visibleCandles]);

  const breakdown = useMemo(() => {
    const n = dailyData.length;
    const cur7 = dailyData.slice(Math.max(0, n - 7), n);
    const prev7 = dailyData.slice(Math.max(0, n - 14), Math.max(0, n - 7));
    const sum = (arr, key) => arr.reduce((s, d) => s + d[key], 0);
    return ["gmv", "revenue", "users"].map((key) => {
      const curSum = sum(cur7, key);
      const prevSum = sum(prev7, key) || 1;
      const pct = ((curSum - prevSum) / prevSum) * 100;
      return { key, curSum, pct, weight: WEIGHTS[key] };
    });
  }, [dailyData]);

  const ledgerRows = useMemo(() => {
    const rows = LEDGER.map((row) => {
      if (row.role === "Founder") return { ...row, units: row.units };
      const unitPrice = UNIT_BASE_PRICE * (row.dsiAtEntry / 100);
      return { ...row, units: row.contributionKES / unitPrice };
    });
    const total = rows.reduce((s, r) => s + r.units, 0);
    return rows.map((r) => ({ ...r, pct: (r.units / total) * 100 }));
  }, []);

  function handleLogMetrics(e) {
    e.preventDefault();
    const gmv = parseFloat(form.gmv);
    const users = parseFloat(form.users);
    const revenue = parseFloat(form.revenue);
    if (isNaN(gmv) || isNaN(users) || isNaN(revenue)) {
      setFeedback({ type: "error", text: "Enter a number for each field." });
      return;
    }
    const lastDate = new Date(dailyData[dailyData.length - 1].date);
    lastDate.setDate(lastDate.getDate() + 1);
    setDailyData((prev) => [...prev, { date: lastDate.toISOString().slice(0, 10), gmv, users, revenue }]);
    setForm({ gmv: "", users: "", revenue: "" });
    setFeedback({ type: "success", text: "Logged. DSI recalculated from the new numbers — a new candle forms once a full week is in." });
  }

  const tickerItems = [
    `DSI ${dsiValue.toFixed(2)}  ${isUp ? "▲" : "▼"} ${Math.abs(dsiChange).toFixed(1)}% this week`,
    `7D GMV ${formatMetric("gmv", breakdown[0].curSum)}`,
    `7D REVENUE ${formatMetric("revenue", breakdown[1].curSum)}`,
    `NEW USERS (7D) ${breakdown[2].curSum}`,
    `FOUNDER CIRCLE — ${ledgerRows.length} HOLDERS`,
  ];

  return (
    <div className="dsi-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500;600&display=swap');

        .dsi-root {
          background: ${COLORS.bg};
          color: ${COLORS.text};
          font-family: 'Inter', system-ui, sans-serif;
          border-radius: 16px;
          overflow: hidden;
        }
        .dsi-mono { font-family: 'IBM Plex Mono', monospace; }

        .dsi-ticker-wrap { overflow: hidden; border-bottom: 1px solid ${COLORS.border}; background: ${COLORS.panelAlt}; }
        .dsi-ticker {
          display: flex; gap: 0; white-space: nowrap; padding: 9px 0;
          font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: ${COLORS.gold};
          animation: dsi-scroll 28s linear infinite;
          width: max-content;
        }
        .dsi-ticker span { padding: 0 24px; border-right: 1px solid ${COLORS.border}; }
        @keyframes dsi-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @media (prefers-reduced-motion: reduce) { .dsi-ticker { animation: none; } }

        .dsi-container { padding: 24px; display: flex; flex-direction: column; gap: 20px; }

        .dsi-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px; }
        .dsi-eyebrow { font-family: 'IBM Plex Mono', monospace; font-size: 11px; letter-spacing: 0.15em; color: ${COLORS.gold}; margin: 0 0 6px; }
        .dsi-title { font-family: 'Space Grotesk', sans-serif; font-size: 28px; font-weight: 700; margin: 0 0 4px; }
        .dsi-sub { color: ${COLORS.muted}; margin: 0; font-size: 14px; max-width: 480px; line-height: 1.5; }

        .dsi-role-toggle { display: flex; gap: 8px; }
        .dsi-role-toggle button {
          display: flex; align-items: center; gap: 6px; background: ${COLORS.panel};
          border: 1px solid ${COLORS.border}; color: ${COLORS.muted}; padding: 8px 14px;
          border-radius: 999px; font-size: 12px; cursor: pointer; font-family: 'IBM Plex Mono', monospace;
          transition: all .15s;
        }
        .dsi-role-toggle button.active { background: ${COLORS.gold}; color: #1A1206; border-color: ${COLORS.gold}; }
        .dsi-role-toggle button:focus-visible { outline: 2px solid ${COLORS.gold}; outline-offset: 2px; }

        .dsi-summary { display: flex; flex-direction: column; gap: 4px; }
        .dsi-value { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; }
        .dsi-num { font-family: 'Space Grotesk', sans-serif; font-size: 44px; font-weight: 700; line-height: 1; }
        .dsi-change { display: flex; align-items: center; gap: 4px; font-family: 'IBM Plex Mono', monospace; font-size: 13px; padding: 4px 10px; border-radius: 6px; }
        .dsi-change.up { color: ${COLORS.up}; background: rgba(95,173,140,0.12); }
        .dsi-change.down { color: ${COLORS.down}; background: rgba(217,116,90,0.12); }
        .dsi-value-label { color: ${COLORS.muted}; font-size: 12px; margin: 0; }

        .dsi-panel { background: ${COLORS.panel}; border: 1px solid ${COLORS.border}; border-radius: 12px; padding: 20px; }
        .dsi-panel-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; gap: 12px; flex-wrap: wrap; }
        .dsi-panel-head h2 { font-family: 'Space Grotesk', sans-serif; font-size: 16px; font-weight: 600; color: ${COLORS.text}; margin: 0; }
        .dsi-panel-head-right { color: ${COLORS.muted}; display: flex; align-items: center; gap: 10px; }

        .dsi-timeframe { display: flex; gap: 6px; }
        .dsi-timeframe button {
          background: ${COLORS.panelAlt}; border: 1px solid ${COLORS.border}; color: ${COLORS.muted};
          font-family: 'IBM Plex Mono', monospace; font-size: 11px; padding: 5px 10px; border-radius: 6px; cursor: pointer;
        }
        .dsi-timeframe button.active { color: ${COLORS.gold}; border-color: ${COLORS.gold}; }

        .dsi-milestones { display: flex; flex-wrap: wrap; gap: 10px 24px; margin-top: 14px; padding-top: 14px; border-top: 1px dashed ${COLORS.border}; font-size: 12px; color: ${COLORS.muted}; }
        .dsi-milestone { display: flex; align-items: center; gap: 6px; }
        .dsi-milestone strong { color: ${COLORS.gold}; font-family: 'IBM Plex Mono', monospace; }

        .dsi-grid { display: grid; grid-template-columns: 1.1fr 1fr; gap: 20px; }
        @media (max-width: 820px) { .dsi-grid { grid-template-columns: 1fr; } }

        .dsi-formula { font-size: 13px; background: ${COLORS.panelAlt}; border: 1px solid ${COLORS.border}; border-radius: 8px; padding: 12px 14px; color: ${COLORS.gold}; overflow-x: auto; margin: 0 0 12px; }
        .dsi-text { color: ${COLORS.muted}; font-size: 13px; line-height: 1.6; margin: 0; }
        .dsi-small { font-size: 12px; margin-top: 12px; }

        .dsi-table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
        .dsi-table th { text-align: left; color: ${COLORS.muted}; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; padding: 6px 8px; border-bottom: 1px solid ${COLORS.border}; }
        .dsi-table td { padding: 8px 8px; border-bottom: 1px solid ${COLORS.border}; }
        .dsi-table td.up { color: ${COLORS.up}; }
        .dsi-table td.down { color: ${COLORS.down}; }
        .dsi-table tr:last-child td { border-bottom: none; }

        .dsi-form { display: flex; flex-direction: column; gap: 12px; margin-top: 8px; }
        .dsi-form label { display: flex; flex-direction: column; gap: 6px; font-size: 12px; color: ${COLORS.muted}; }
        .dsi-form input { background: ${COLORS.panelAlt}; border: 1px solid ${COLORS.border}; border-radius: 8px; padding: 10px 12px; color: ${COLORS.text}; font-family: 'IBM Plex Mono', monospace; font-size: 13px; }
        .dsi-form input:focus-visible { outline: 2px solid ${COLORS.gold}; outline-offset: 1px; }
        .dsi-form button { background: ${COLORS.gold}; color: #1A1206; border: none; border-radius: 8px; padding: 10px 16px; font-weight: 600; cursor: pointer; font-size: 13px; }
        .dsi-feedback { font-size: 12px; margin-top: 10px; padding: 8px 10px; border-radius: 6px; }
        .dsi-feedback.success { background: rgba(95,173,140,0.12); color: ${COLORS.up}; }
        .dsi-feedback.error { background: rgba(217,116,90,0.12); color: ${COLORS.down}; }

        .dsi-tooltip { background: ${COLORS.panelAlt}; border: 1px solid ${COLORS.border}; border-radius: 8px; padding: 10px 12px; font-size: 12px; }
        .dsi-tooltip-week { color: ${COLORS.gold}; margin: 0 0 6px; }
        .dsi-tooltip p { display: flex; justify-content: space-between; gap: 16px; margin: 2px 0; color: ${COLORS.muted}; }
        .dsi-tooltip p span { color: ${COLORS.text}; }
        .dsi-tooltip hr { border-color: ${COLORS.border}; margin: 6px 0; }

        .dsi-footer { display: flex; gap: 10px; align-items: flex-start; color: ${COLORS.muted}; font-size: 12px; line-height: 1.6; border-top: 1px solid ${COLORS.border}; padding-top: 16px; }
        .dsi-footer svg { flex-shrink: 0; margin-top: 2px; color: ${COLORS.gold}; }
      `}</style>

      <div className="dsi-ticker-wrap">
        <div className="dsi-ticker">
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <span key={i}>{item}</span>
          ))}
        </div>
      </div>

      <div className="dsi-container">
        <header className="dsi-header">
          <div>
            <p className="dsi-eyebrow">DEVSOKO GROWTH ROOM</p>
            <h1 className="dsi-title">The DevSoko Index</h1>
            <p className="dsi-sub">
              A live read on DevSoko's traction, built from real marketplace data — gross marketplace value,
              platform revenue, and active users. Not a trading floor, and nothing here is bought or sold automatically.
            </p>
          </div>
          <div className="dsi-role-toggle" role="group" aria-label="View as">
            <button className={role === "investor" ? "active" : ""} onClick={() => setRole("investor")}>
              <Unlock size={14} /> Investor view
            </button>
            <button className={role === "admin" ? "active" : ""} onClick={() => setRole("admin")}>
              <Lock size={14} /> Admin view
            </button>
          </div>
        </header>

        <div className="dsi-summary">
          <div className="dsi-value">
            <span className="dsi-num">{dsiValue.toFixed(2)}</span>
            <span className={`dsi-change ${isUp ? "up" : "down"}`}>
              {isUp ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
              {Math.abs(dsiChange).toFixed(2)}% this week
            </span>
          </div>
          <p className="dsi-value-label">Index points — baseline of 100 at launch (W1)</p>
        </div>

        <section className="dsi-panel">
          <div className="dsi-panel-head">
            <h2>Weekly index — {visibleCandles.length} weeks shown</h2>
            <div className="dsi-panel-head-right">
              <span className="dsi-mono">read like a price chart, built from real platform data</span>
              <div className="dsi-timeframe">
                {["4W", "8W", "All"].map((tf) => (
                  <button key={tf} className={timeframe === tf ? "active" : ""} onClick={() => setTimeframe(tf)}>
                    {tf}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={visibleCandles} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={COLORS.border} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="week" stroke={COLORS.muted} tick={{ fontSize: 11, fontFamily: "IBM Plex Mono, monospace" }} />
              <YAxis domain={yDomain} stroke={COLORS.muted} tick={{ fontSize: 11, fontFamily: "IBM Plex Mono, monospace" }} width={46} />
              <Tooltip content={<CandleTooltip />} />
              {Object.keys(MILESTONES)
                .filter((w) => visibleCandles.some((c) => c.week === w))
                .map((w) => (
                  <ReferenceLine key={w} x={w} stroke={COLORS.gold} strokeDasharray="3 3" strokeOpacity={0.5} />
                ))}
              <Bar dataKey={(d) => [d.low, d.high]} shape={<Candle />} isAnimationActive={false} maxBarSize={28} />
            </ComposedChart>
          </ResponsiveContainer>
          <div className="dsi-milestones">
            {Object.entries(MILESTONES)
              .filter(([w]) => visibleCandles.some((c) => c.week === w))
              .map(([w, label]) => (
                <div key={w} className="dsi-milestone">
                  <Sparkles size={12} /> <strong>{w}</strong> — {label}
                </div>
              ))}
          </div>
        </section>

        <div className="dsi-grid">
          <section className="dsi-panel">
            <div className="dsi-panel-head">
              <h2>How the index is calculated</h2>
              <Info size={16} color={COLORS.muted} />
            </div>
            <p className="dsi-formula dsi-mono">
              DSI(t) = DSI(t-1) × ( 1 + ( 0.45·ΔGMV(7d) + 0.35·ΔRevenue(7d) + 0.20·ΔUsers(7d) ) / 7 )
            </p>
            <p className="dsi-text">
              Each day's value comes from the 7-day rolling change in three numbers pulled straight from DevSoko's
              database. No one — including the admin — edits the index value itself.
            </p>
            <table className="dsi-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Last 7 days</th>
                  <th>7d change</th>
                  <th>Weight</th>
                </tr>
              </thead>
              <tbody>
                {breakdown.map((b) => (
                  <tr key={b.key}>
                    <td>{LABELS[b.key]}</td>
                    <td className="dsi-mono">{formatMetric(b.key, b.curSum)}</td>
                    <td className={`dsi-mono ${b.pct >= 0 ? "up" : "down"}`}>
                      {b.pct >= 0 ? "+" : ""}
                      {b.pct.toFixed(1)}%
                    </td>
                    <td className="dsi-mono">{(b.weight * 100).toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="dsi-panel">
            {role === "admin" ? (
              <>
                <div className="dsi-panel-head">
                  <h2>Log today's numbers</h2>
                  <ShieldCheck size={16} color={COLORS.gold} />
                </div>
                <p className="dsi-text">
                  Only an admin role (checked server-side via Supabase RLS) can post here. This feeds the formula —
                  it never sets the index value directly.
                </p>
                <form className="dsi-form" onSubmit={handleLogMetrics}>
                  <label>
                    GMV today (KES)
                    <input
                      type="number"
                      inputMode="decimal"
                      value={form.gmv}
                      onChange={(e) => setForm({ ...form, gmv: e.target.value })}
                      placeholder="e.g. 28000"
                    />
                  </label>
                  <label>
                    New active users
                    <input
                      type="number"
                      inputMode="decimal"
                      value={form.users}
                      onChange={(e) => setForm({ ...form, users: e.target.value })}
                      placeholder="e.g. 6"
                    />
                  </label>
                  <label>
                    Platform revenue (KES)
                    <input
                      type="number"
                      inputMode="decimal"
                      value={form.revenue}
                      onChange={(e) => setForm({ ...form, revenue: e.target.value })}
                      placeholder="e.g. 2400"
                    />
                  </label>
                  <button type="submit">Log entry &amp; recalculate</button>
                </form>
                {feedback && <p className={`dsi-feedback ${feedback.type}`}>{feedback.text}</p>}
              </>
            ) : (
              <>
                <div className="dsi-panel-head">
                  <h2>Founder Circle ledger</h2>
                  <span className="dsi-mono">{ledgerRows.length} entries</span>
                </div>
                <table className="dsi-table">
                  <thead>
                    <tr>
                      <th>Holder</th>
                      <th>Joined</th>
                      <th>Entry index</th>
                      <th>Units</th>
                      <th>Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledgerRows.map((r) => (
                      <tr key={r.name}>
                        <td>{r.name}</td>
                        <td className="dsi-mono">{r.date}</td>
                        <td className="dsi-mono">{r.dsiAtEntry ? r.dsiAtEntry.toFixed(0) : "—"}</td>
                        <td className="dsi-mono">{Math.round(r.units).toLocaleString()}</td>
                        <td className="dsi-mono">{r.pct.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="dsi-text dsi-small">
                  Units reflect separate written agreements at the index value on the day each person joined. This is
                  a record, not a live order book — nothing here matches buyers with sellers automatically.
                </p>
              </>
            )}
          </section>
        </div>

        <footer className="dsi-footer">
          <ShieldCheck size={16} />
          <p>
            The DevSoko Index tracks real operating data and exists for transparency with supporters. It is not a
            security, share price, or trading venue, and nothing on this page can be bought or sold automatically.
            Any investment or revenue-share arrangement with a supporter is handled through a separate signed
            agreement outside of this dashboard.
          </p>
        </footer>
      </div>
    </div>
  );
}