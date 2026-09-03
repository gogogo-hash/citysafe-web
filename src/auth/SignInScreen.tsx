import { useEffect, useState } from "react";
import { getRedirectResult } from "firebase/auth";
import { Navigate } from "react-router-dom";

import citySafeLogo from "@/assets/icons/CitySafe.png";
import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { continueAsGuest, signInWithGoogle } from "@/services/authService";
import { auth } from "@/services/firebase";

type Provider = "google" | "guest";

function messageFor(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Sign-in failed. Please try again.";
}

export default function SignInScreen() {
  const { user, loading } = useAuth();
  const [pending, setPending] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getRedirectResult(auth).catch((err: unknown) => {
      setError(messageFor(err));
    });
  }, []);

  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  async function handleSignIn(provider: Provider, action: () => Promise<unknown>) {
    setError(null);
    setPending(provider);
    try {
      await action();
    } catch (err) {
      setError(messageFor(err));
      setPending(null);
    }
  }

  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-6 px-6">
      <img src={citySafeLogo} alt="CitySafe" className="h-16 w-16" />

      <div className="text-center">
        <h1 className="text-xl font-semibold">CitySafe</h1>
        <p className="text-muted-foreground text-sm">
          Sign in to see and report safety incidents nearby.
        </p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-2">
        <Button
          onClick={() => handleSignIn("google", signInWithGoogle)}
          disabled={pending !== null}
        >
          {pending === "google" ? "Redirecting…" : "Continue with Google"}
        </Button>
        <Button
          variant="ghost"
          onClick={() => handleSignIn("guest", continueAsGuest)}
          disabled={pending !== null}
        >
          {pending === "guest" ? "Signing in…" : "Continue as Guest"}
        </Button>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}
