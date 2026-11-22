# Christmas Wish List (Next.js + Supabase)

1. Create a Supabase project. In the SQL Editor, run `supabase/schema.sql`.
2. Copy `.env.local.example` to `.env.local` and fill in the URL + anon key (Project Settings -> API).
3. `npm install` then `npm run dev`.
4. Supabase -> Authentication -> URL Configuration: set Site URL to your app URL (http://localhost:3000 while testing, your Vercel URL later) and add `<url>/auth/callback` under Redirect URLs.
   While testing you can turn OFF "Confirm email" (Authentication -> Providers -> Email) so sign-up logs you straight in.
5. Deploy to Vercel and add the same two env vars.
