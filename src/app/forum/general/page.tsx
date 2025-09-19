import React from 'react';
import '@/styles/forum.css';
import jwt from 'jsonwebtoken';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { env } from '@/env';
import ForumGeneralClient from './ForumGeneralClient';

export default async function ForumGeneralPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  
  if (!token) return redirect('/login');
  
  try {
    jwt.verify(token as string, env.AUTH_SECRET || 'dev-secret');
  } catch (err) {
    return redirect('/login');
  }

  return <ForumGeneralClient />;
}
