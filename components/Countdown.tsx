"use client";
import { useEffect, useState } from "react";

function target() {
  const now = new Date();
  const y = now.getFullYear();
  return now > new Date(y, 11, 26) ? new Date(y + 1, 11, 25) : new Date(y, 11, 25);
}

export default function Countdown() {
  const [ms, setMs] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setMs(target().getTime() - Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  if (ms === null) return <div className="count" style={{ minHeight: 70 }} />;
  if (ms <= 0) return <div className="count"><div><b>🎅 Merry Christmas!</b></div></div>;
  const v: [string, number][] = [
    ["Days", Math.floor(ms / 864e5)],
    ["Hours", Math.floor(ms / 36e5) % 24],
    ["Min", Math.floor(ms / 6e4) % 60],
    ["Sec", Math.floor(ms / 1e3) % 60],
  ];
  return (
    <div className="count">
      {v.map(([label, n]) => (
        <div key={label}><b>{n}</b><span>{label}</span></div>
      ))}
    </div>
  );
}
