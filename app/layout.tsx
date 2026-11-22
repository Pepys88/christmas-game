import "./globals.css";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./actions";

export const metadata = { title: "Christmas Wish List", description: "Share wishes, claim gifts, keep the surprise." };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return (
    <html lang="en">
      <body>
        <nav>
          <Link href="/">🎄 Wish Lists</Link>
          {user && (
            <form action={signOut}><button className="ghost" style={{ color: "#fffaf0", borderColor: "#fffaf0" }}>Sign out</button></form>
          )}
        </nav>
        {children}
      </body>
    </html>
  );
}
