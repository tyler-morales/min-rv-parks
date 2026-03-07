"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Caravan, AlertCircle } from "lucide-react";

export default function HostLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/host/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email) {
      setError("Email is required.");
      setLoading(false);
      return;
    }

    if (!password) {
      setError("Password is required.");
      setLoading(false);
      return;
    }

    if (isSignUp && !fullName.trim()) {
      setError("Name is required for sign up.");
      setLoading(false);
      return;
    }

    const supabase = createClient();

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email: email.toLowerCase(),
          password,
          options: { data: { full_name: fullName.trim() } },
        });
        if (signUpError) throw signUpError;
        router.push(redirect);
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.toLowerCase(),
          password,
        });
        if (signInError) throw signInError;
        router.push(redirect);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign in failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <div className="flex items-center gap-2 text-emerald-600">
            <Caravan className="size-7" />
            <span className="text-xl font-bold tracking-tight">
              Mini RV Parks
            </span>
          </div>
          <CardTitle className="mt-2 text-xl">
            {isSignUp ? "Create host account" : "Host Login"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {isSignUp && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Your name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoComplete="name"
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isSignUp ? "new-password" : "current-password"}
              />
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400"
              >
                <AlertCircle className="size-4 shrink-0" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="mt-1 h-10 bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-600/50"
            >
              {isSignUp ? "Sign Up" : "Sign In"}
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
              }}
              className="underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {isSignUp ? "Already have an account? Sign in" : "New host? Sign up"}
            </button>
          </p>

          <div className="mt-6 border-t pt-4 text-center">
            <a
              href="/admin"
              className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Admin? Login here
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
