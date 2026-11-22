import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Countdown from "@/components/Countdown";
import Tree, { type Orn } from "@/components/Tree";
import { createClient } from "@/lib/supabase/server";
import { leaveOrnament } from "@/app/actions";

export default async function TreePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { username } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("id, username, display_name").eq("username", username.toLowerCase()).maybeSingle();
  if (!profile) notFound();
  const isOwner = profile.id === user.id;

  const { data: rows } = await supabase
    .from("ornaments")
    .select("id, icon, author_id, created_at, author:profiles!author_id(display_name)")
    .eq("tree_owner_id", profile.id)
    .order("created_at");

  // RLS only returns the wishes this person is allowed to read
  const ids = (rows ?? []).map((o) => o.id);
  const { data: wishes } = ids.length
    ? await supabase.from("ornament_wishes").select("ornament_id, body").in("ornament_id", ids)
    : { data: [] as { ornament_id: string; body: string }[] };
  const bodyById = new Map((wishes ?? []).map((w) => [w.ornament_id, w.body]));

  const ornaments: Orn[] = (rows ?? []).map((o: any) => {
    const a = Array.isArray(o.author) ? o.author[0] : o.author;
    return {
      id: o.id,
      icon: o.icon,
      author: a?.display_name ?? "Someone",
      body: bodyById.get(o.id) ?? null,
      mine: o.author_id === user.id,
    };
  });

  return (
    <main>
      <p>
        <Link href={`/u/${profile.username}`} style={{ color: "#e8b84b" }}>← {isOwner ? "My wish list" : `${profile.display_name}'s wish list`}</Link>
      </p>
      <h1>{isOwner ? "My Christmas Tree" : `${profile.display_name}'s Christmas Tree`}</h1>
      <Countdown />
      <p className="note">
        {isOwner
          ? "🤫 Tap an ornament to see who hung it. Their wishes open on December 24."
          : "Hang an ornament with a wish. Only they can open it, on December 24!"}
      </p>

      <Tree ornaments={ornaments} isOwner={isOwner} ownerName={profile.display_name} />

      {!isOwner && (
        <div className="card">
          <div className="t">Hang an ornament 🎄</div>
          {error && <div className="err">{error}</div>}
          <form action={leaveOrnament} style={{ display: "grid", gap: 10, marginTop: 10 }}>
            <input type="hidden" name="owner_id" value={profile.id} />
            <input type="hidden" name="username" value={profile.username} />
            <textarea name="body" placeholder={`Write your wish for ${profile.display_name}…`} required maxLength={500} rows={3} />
            <button type="submit">Hang it on the tree ✨</button>
          </form>
        </div>
      )}
    </main>
  );
}