"use client";

import { SignInButton, UserButton, useAuth } from "@clerk/nextjs";
import DropZone from "../components/DropZone";

export default function Page() {
  const { isSignedIn } = useAuth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-900 text-white">
      <div className="absolute top-8 right-8">
        {isSignedIn ? (
          <UserButton afterSignOutUrl="/" />
        ) : (
          <SignInButton mode="modal">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
              Sign In
            </button>
          </SignInButton>
        )}
      </div>

      <h1 className="text-4xl font-bold mb-4">Web App</h1>
      <p className="text-gray-300 mb-8">Turborepo + Next.js + Tailwind CSS + Clerk</p>

      {isSignedIn && (
        <div className="w-full max-w-2xl mt-8">
          <DropZone onSuccess={(contractId) => console.log("Success! Contract ID:", contractId)} />
        </div>
      )}
    </main>
  );
}
