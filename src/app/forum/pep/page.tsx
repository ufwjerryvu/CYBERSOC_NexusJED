import '@/styles/forum.css';
import jwt from 'jsonwebtoken';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { env } from '@/env';
import ChatSidebar from "../_components/ChatSidebar";
import ForumPepClient from './ForumPepClient';

export default async function ForumPepPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  if (!token) return redirect('/login');

  try {
    jwt.verify(token as string, env.AUTH_SECRET || 'dev-secret');
  } catch (err) {
    return redirect('/login');
  }

  return (
    <main style={{ display: 'flex', gap: 16 }}>
      <ChatSidebar />
      <section style={{ flex: 1, minWidth: 0 }}>
        <ForumPepClient />
      </section>
    </main>
  );
}
