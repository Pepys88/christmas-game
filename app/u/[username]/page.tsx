import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Countdown from "@/components/Countdown";
import { createClient } from "@/lib/supabase/server";
import { addItem, deleteItem, claimItem, unclaimItem } from "@/app/actions";

export default async function WishlistPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("id, username, display_name").eq("username", username.toLowerCase()).maybeSingle();
  if (!profile) notFound();

  const isOwner = profile.id === user.id;

  const { data: items } = await supabase
    .from("items").select("id, title, url, price").eq("owner_id", profile.id).order("created_at");

  // Which items are claimed (anyone can see this, even the owner) ...
  const { data: claimedIds } = await supabase.rpc("claimed_item_ids", { p_owner: profile.id });
  const claimed = new Set<string>(claimedIds ?? []);
  // ... and which of them are claimed by ME (RLS only lets me see my own claims)
  const { data: myClaims } = await supabase.from("claims").select("item_id");
  const mine = new Set<string>((myClaims ?? []).map((c) => c.item_id));

  return (
    <main>
      <p><Link href="/" style={{ color: "#e8b84b" }}>← All lists</Link></p>
      <h1>{isOwner ? "My Wish List" : `${profile.display_name}'s Wish List`}</h1>
      <Countdown />
<p className="center"><Link href={`/u/${profile.username}/tree`} style={{ color: "#e8b84b" }}>🎄 {isOwner ? "My Christmas tree" : `${profile.display_name}'s Christmas tree`}</Link></p>
      {isOwner && (
        <div className="card">
          <form action={addItem} className="grid">
            <input className="w" name="title" placeholder="Gift idea" required maxLength={200} />
            <input name="price" placeholder="Price (optional)" maxLength={40} />
            <input name="url" type="url" placeholder="Link (optional)" />
            <button className="w" type="submit">Add to my list 🎁</button>
          </form>
        </div>
      )}
      {isOwner && <p className="note">🤫 You can see which gifts are claimed, but never who claimed them.</p>}

      {(items ?? []).length === 0 && (
        <p className="note">{isOwner ? "Add your first wish above ✨" : "No wishes yet. Check back soon!"}</p>
      )}

      {(items ?? []).map((it) => {
        const isClaimed = claimed.has(it.id);
        return (
          <div key={it.id} className={`card${isClaimed ? " claimed" : ""}`}>
            <div className="row">
              <div>
                <div className="t">{it.title}</div>
                <div className="m">
                  {it.price && <>{it.price} · </>}
                  {it.url && <a href={it.url} target="_blank" rel="noopener noreferrer">View link</a>}
                </div>
              </div>
              <div className="row">
                {isOwner ? (
                  <>
                    {isClaimed && <span className="tag">Claimed 🎁</span>}
                    <form action={deleteItem}>
                      <input type="hidden" name="item_id" value={it.id} />
                      <button className="ghost">Remove</button>
                    </form>
                  </>
                ) : mine.has(it.id) ? (
                  <>
                    <span className="tag">You&apos;re giving this</span>
                    <form action={unclaimItem}>
                      <input type="hidden" name="item_id" value={it.id} />
                      <button className="ghost">Undo</button>
                    </form>
                  </>
                ) : isClaimed ? (
                  <span className="tag">Already claimed</span>
                ) : (
                  <form action={claimItem}>
                    <input type="hidden" name="item_id" value={it.id} />
                    <button>I&apos;ll give this 🎁</button>
                  </form>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </main>
  );
}
