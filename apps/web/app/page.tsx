"use client";

import { useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@workspace/ui/components/button';
import Link from 'next/link';

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  return (
    
    <div className="flex min-h-screen items-center justify-center bg-gray-900">
      <div className="w-full max-w-lg rounded-lg border border-gray-700 bg-gray-800/50 p-8">
        <div className="text-center p-4 bg-blue-700 text-white rounded-xl">
            🚀 BlueAlpha Demo 🚀
        </div>
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Welcome</h1>
          <p className="text-lg text-gray-400">Get started with your account</p>
        </div>
        
        <div className="space-y-3">
          <Link href="/login" className="block">
            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" size="lg">
              Login
            </Button>
          </Link>
          <Link href="/register" className="block">
            <Button className="w-full bg-gray-700 hover:bg-gray-600 text-white" size="lg">
              Create Account
            </Button>
          </Link>
        </div>
        
        <div className="mt-8 rounded-lg bg-gray-900/50 p-4">
          <h3 className="mb-2 font-semibold text-white">Features:</h3>
          <ul className="space-y-1 text-sm text-gray-400">
            <li>✓ Secure authentication</li>
            <li>✓ Personal dashboard</li>
            <li>✓ User profile management</li>
          </ul>
        </div>


      </div>
    </div>
  );
}