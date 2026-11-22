"use client";
import { useState } from "react";
import { deleteOrnament } from "@/app/actions";

const ICONS = ["🔴", "🔵", "⭐", "🔔", "🎁", "🍬", "🦌", "⛄", "🧦", "🪩", "❄️", "🍪"];

export type Orn = { id: string; icon: number; author: string; body: string | null; mine: boolean };

function hue(id: string) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

export default function Tree({ ornaments, isOwner, ownerName }: { ornaments: Orn[]; isOwner: boolean; ownerName: string }) {
  const [open, setOpen] = useState<Orn | null>(null);

  // Row 1 has 1 ornament, row 2 has 2, and so on, so the pile grows into a tree shape
  const rows: Orn[][] = [];
  for (let i = 0, k = 1; i < ornaments.length; i += k, k++) rows.push(ornaments.slice(i, i + k));
  const width = Math.max(260, rows.length * 70 + 80);

  return (
    <div className="treewrap">
      <div className="star">⭐</div>
      <div className="tree" style={{ width }}>
        {rows.length === 0 && <p className="note" style={{ marginTop: 60 }}>No ornaments yet</p>}
        {rows.map((row, r) => (
          <div className="trow" key={r}>
            {row.map((o) => (
              <button key={o.id} className="orn" onClick={() => setOpen(o)} aria-label={`Wish from ${o.author}`}>
                <span className="ball" style={{ background: `radial-gradient(circle at 30% 30%, #fff8, hsl(${hue(o.id)} 70% 45%))` }}>
                  {ICONS[o.icon % ICONS.length]}
                  {isOwner && o.body === null && <i className="lock">🔒</i>}
                </span>
                <span className="oname">{o.author}</span>
              </button>
            ))}
          </div>
        ))}
      </div>
      <div className="trunk" />

      {open && (
        <div className="modal" onClick={() => setOpen(null)}>
          <div className="card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 360, width: "100%" }}>
            <div className="t">{ICONS[open.icon % ICONS.length]} From {open.mine ? "you" : open.author}</div>
            <p style={{ whiteSpace: "pre-wrap", margin: "10px 0" }}>
              {open.body !== null
                ? open.body
                : isOwner
                ? "🔒 This wish opens on December 24."
                : `🎁 Only ${ownerName} can open this wish, on December 24.`}
            </p>
            <div className="row">
              {open.mine && (
                <form action={deleteOrnament} onSubmit={() => setOpen(null)}>
                  <input type="hidden" name="ornament_id" value={open.id} />
                  <button className="ghost">Remove my ornament</button>
                </form>
              )}
              <button onClick={() => setOpen(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}