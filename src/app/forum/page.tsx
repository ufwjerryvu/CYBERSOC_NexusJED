import Link from "next/link";
import "@/styles/landing.css";
import "@/styles/forum.css";
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
    <main>
      <h2 className="nx-forum-title">Forum</h2>

      <div className="nx-forum-grid">
        <Link href="/forum/general" className="nx-forum-card clickable">
          <h3>NexusCTF - General</h3>
          <p>General discussion about challenges, solutions, or just chill.</p>
        </Link>

        <section className="nx-forum-card">
          <h3>Nexus Team Finder</h3>
          <p>Find teammates for upcoming CTF and connect with players.</p>
        </section>

        <section className="nx-forum-card">
          <h3>Nexus Alerts</h3>
          <p>Announcements and alerts about scheduled maintenance, events, and urgent notices.</p>
        </section>

        <section className="nx-forum-card">
          <h3>Nexus PEP</h3>
          <p>Dedicated channel just for the hours hidden away at the edge of the universe.</p>
        </section>
      </div>

    
    </main>
  );
}
