"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const back = (mode: string, key: "error" | "message", text: string): never =>
  redirect(`/login?mode=${mode}&${key}=${encodeURIComponent(text)}`);

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email")).trim(),
    password: String(formData.get("password")),
  });
  if (error) back("signin", "error", error.message);
  redirect("/");
}

export async function signUp(formData: FormData) {
  const supabase = await createClient();
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const displayName = String(formData.get("display_name") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!/^[a-z0-9_]{3,20}$/.test(username))
    back("signup", "error", "Username must be 3-20 letters, numbers or underscores.");
  if (password.length < 6) back("signup", "error", "Password must be at least 6 characters.");

  const { data: free } = await supabase.rpc("username_available", { u: username });
  if (!free) back("signup", "error", "That username is taken.");

  const origin = (await headers()).get("origin") ?? "";
  const { data, error } = await supabase.auth.signUp({
    email: String(formData.get("email")).trim(),
    password,
    options: {
      data: { username, display_name: displayName || username },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });
  if (error) back("signup", "error", error.message);
  if (!data.session) back("signin", "message", "Check your email to confirm your account, then sign in.");
  redirect("/");
}
