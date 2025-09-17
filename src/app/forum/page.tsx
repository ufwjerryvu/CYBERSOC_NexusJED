import Link from "next/link";
import "@/styles/landing.css";
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { env } from '@/env';

export default async function ForumPage() {
  // server-side check for access_token cookie
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  if (!token) return redirect('/login');

  try {
    jwt.verify(token as string, env.AUTH_SECRET || 'dev-secret');
  } catch (err) {
    return redirect('/login');
  }

  return (
    <main className="nx-wrap nx-section">
      <h2>Forum</h2>
      <p>This is the forum placeholder. Replace with your forum implementation (Discourse, Flarum, or custom threads) when ready.</p>
      <p>
        <Link href="/">Back to home</Link>
      </p>
    </main>
  );
}
