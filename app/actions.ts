"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function safeUrl(u: string) {
  try {
    const x = new URL(u);
    return x.protocol === "http:" || x.protocol === "https:" ? x.href : null;
  } catch {
    return null;
  }
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function addItem(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const title = String(formData.get("title") ?? "").trim().slice(0, 200);
  if (!title) return;
  const rawUrl = String(formData.get("url") ?? "").trim();
  await supabase.from("items").insert({
    owner_id: user.id,
    title,
    price: String(formData.get("price") ?? "").trim().slice(0, 40) || null,
    url: rawUrl ? safeUrl(rawUrl) : null,
  });
  revalidatePath("/u/[username]", "page");
}

export async function deleteItem(formData: FormData) {
  const supabase = await createClient();
  await supabase.from("items").delete().eq("id", String(formData.get("item_id"))); // RLS: owner only
  revalidatePath("/u/[username]", "page");
}

export async function claimItem(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  // Primary key on item_id means a second claim on the same gift just fails quietly
  await supabase.from("claims").insert({ item_id: String(formData.get("item_id")), claimed_by: user.id });
  revalidatePath("/u/[username]", "page");
}

export async function unclaimItem(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  await supabase.from("claims").delete().eq("item_id", String(formData.get("item_id"))).eq("claimed_by", user.id);
  revalidatePath("/u/[username]", "page");
  
}
export async function createProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const display = String(formData.get("display_name") ?? "").trim() || username;
  if (!/^[a-z0-9_]{3,20}$/.test(username)) redirect("/?error=" + encodeURIComponent("Username must be 3-20 letters, numbers or underscores."));
  const { error } = await supabase.from("profiles").insert({ id: user.id, username, display_name: display });
  if (error) redirect("/?error=" + encodeURIComponent("That username is taken or invalid."));
  redirect(`/u/${username}`);
}
export async function leaveOrnament(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const username = String(formData.get("username"));
  const { error } = await supabase.rpc("leave_ornament", {
    p_owner: String(formData.get("owner_id")),
    p_body: String(formData.get("body") ?? ""),
  });
  if (error) redirect(`/u/${username}/tree?error=${encodeURIComponent(error.message)}`);
  redirect(`/u/${username}/tree`);
}

export async function deleteOrnament(formData: FormData) {
  const supabase = await createClient();
  await supabase.from("ornaments").delete().eq("id", String(formData.get("ornament_id"))); // RLS: author only
  revalidatePath("/u/[username]/tree", "page");
}