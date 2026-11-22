import Link from "next/link";
import { signIn, signUp } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; error?: string; message?: string }>;
}) {
  const { mode, error, message } = await searchParams;
  const signup = mode === "signup";
  return (
    <main style={{ maxWidth: 420 }}>
      <div className="center" style={{ fontSize: 40 }}>🎁</div>
      <h1>{signup ? "Create your list" : "Welcome back"}</h1>
      {error && <div className="err">{error}</div>}
      {message && <div className="ok">{message}</div>}
      <div className="card">
        <form action={signup ? signUp : signIn} style={{ display: "grid", gap: 10 }}>
          {signup && (
            <>
              <input name="display_name" placeholder="Your name (e.g. Grandma Sue)" required />
              <input name="username" placeholder="Username (letters, numbers, _)" required />
            </>
          )}
          <input name="email" type="email" placeholder="Email" required />
          <input name="password" type="password" placeholder="Password" minLength={6} required />
          <button type="submit">{signup ? "Sign up 🎄" : "Sign in"}</button>
        </form>
      </div>
      <p className="note">
        {signup ? (
          <>Already have an account? <Link href="/login?mode=signin" style={{ color: "#e8b84b" }}>Sign in</Link></>
        ) : (
          <>New here? <Link href="/login?mode=signup" style={{ color: "#e8b84b" }}>Create an account</Link></>
        )}
      </p>
    </main>
  );
}
