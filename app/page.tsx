import Link from "next/link";
import { redirect } from "next/navigation";
import Countdown from "@/components/Countdown";
import { createClient } from "@/lib/supabase/server";
import { createProfile } from "./actions";

export default async function Home({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profiles } = await supabase.from("profiles").select("id, username, display_name").order("display_name");
  const me = profiles?.find((p) => p.id === user.id);
  const others = profiles?.filter((p) => p.id !== user.id) ?? [];

  return (
    <main>
      <div className="center" style={{ fontSize: 36 }}>🎄</div>
      <h1>Christmas Wish Lists</h1>
      <Countdown />

      {!me && (
        <div className="card">
          <div className="t">Finish setting up your wish list</div>
          {error && <div className="err">{error}</div>}
          <form action={createProfile} style={{ display: "grid", gap: 10, marginTop: 10 }}>
            <input name="display_name" placeholder="Your name (e.g. Grandma Sue)" required />
            <input name="username" placeholder="Username (letters, numbers, _)" required />
            <button type="submit">Create my wish list 🎁</button>
          </form>
        </div>
      )}

      {me && (
        <Link href={`/u/${me.username}`} className="card" style={{ display: "block", textDecoration: "none", color: "inherit" }}>
          <div className="t">⭐ My wish list</div>
          <div className="m">Add your ideas. You can see which are claimed, never by whom.</div>
        </Link>
      )}

      <h2>Everyone else</h2>
      {others.length === 0 && <p className="note">Nobody else has joined yet. Share the link with your family!</p>}
      <div className="people">
        {others.map((p) => (
          <Link key={p.id} href={`/u/${p.username}`} className="card">
            <div className="t">{p.display_name}</div>
            <div className="m">@{p.username}</div>
          </Link>
        ))}
      </div>
    </main>
  );
}