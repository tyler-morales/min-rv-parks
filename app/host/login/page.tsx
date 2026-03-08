"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Caravan, AlertCircle } from "lucide-react";

function HostLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/host/dashboard";
  // #region agent log
  const log = (location: string, message: string, data: Record<string, unknown>) => {
    fetch("http://127.0.0.1:7572/ingest/1e0e0845-8718-44af-9373-9d3c4ef1f913", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "b4eda1" },
      body: JSON.stringify({
        sessionId: "b4eda1",
        location,
        message,
        data,
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  };
  useEffect(() => {
    log("app/host/login/page.tsx:mount", "Login page loaded", {
      redirect,
      rawRedirect: searchParams.get("redirect"),
      hypothesisId: "H4,H5",
    });
  }, [redirect, searchParams]);
  // #endregion
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

    // #region agent log
    log("app/host/login/page.tsx:handleSubmit", "Submit path", {
      isSignUp,
      emailLen: email.length,
      hasPassword: !!password,
      hypothesisId: "H1,H2,H3",
    });
    // #endregion
    let supabase: ReturnType<typeof createClient>;
    try {
      supabase = createClient();
    } catch (clientErr: unknown) {
      // #region agent log
      log("app/host/login/page.tsx:createClient", "createClient threw", {
        errMsg: clientErr instanceof Error ? clientErr.message : String(clientErr),
        errName: clientErr instanceof Error ? clientErr.name : undefined,
        hypothesisId: "H1,H4",
      });
      // #endregion
      throw clientErr;
    }
    // #region agent log
    log("app/host/login/page.tsx:afterCreateClient", "Client created", {
      hasAuth: !!(supabase && (supabase as { auth?: unknown }).auth),
      hypothesisId: "H1",
    });
    // #endregion
    try {
      if (isSignUp) {
        // #region agent log
        log("app/host/login/page.tsx:beforeSignUp", "About to call signUp", { hypothesisId: "H2,H3" });
        // #endregion
        const result = await supabase.auth.signUp({
          email: email.toLowerCase(),
          password,
          options: { data: { full_name: fullName.trim() } },
        });
        // #region agent log
        log("app/host/login/page.tsx:signUpResult", "signUp returned", {
          errorMsg: result.error?.message ?? null,
          errorCode: result.error?.code ?? null,
          hasUser: !!result.data?.user,
          userId: result.data?.user?.id ?? null,
          hypothesisId: "H2,H3",
        });
        // #endregion
        const signUpError = result.error;
        if (signUpError) throw signUpError;
        router.push(redirect);
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.toLowerCase(),
          password,
        });
        if (signInError) throw signInError;
        // #region agent log
        log("app/host/login/page.tsx:redirect-after-signin", "Sign-in success", { redirect });
        // #endregion
        router.push(redirect);
      }
    } catch (err: unknown) {
      // #region agent log
      log("app/host/login/page.tsx:catch", "handleSubmit catch", {
        errMsg: err instanceof Error ? err.message : String(err),
        errName: err instanceof Error ? err.name : undefined,
        stack: err instanceof Error ? (err.stack ?? "").slice(0, 500) : undefined,
        hypothesisId: "H2,H3,H5",
      });
      // #endregion
      const message = err instanceof Error ? err.message : "Sign in failed.";
      const isNetworkError =
        message === "Failed to fetch" ||
        (err instanceof Error && err.name === "AuthRetryableFetchError");
      setError(
        isNetworkError
          ? "Cannot reach Supabase. Check that NEXT_PUBLIC_SUPABASE_URL is correct and that your Supabase project is running (or use a hosted project URL)."
          : message
      );
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
            {isSignUp
              ? "Create host account"
              : redirect === "/admin"
                ? "Admin Login"
                : "Host Login"}
          </CardTitle>
          {!isSignUp && redirect === "/admin" && (
            <p className="mt-1 text-sm text-muted-foreground">
              You&apos;ll go to the admin dashboard after sign-in.
            </p>
          )}
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
            {redirect === "/admin" ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Redirect set to admin. Sign in above.
                </p>
                <a
                  href="/host/login"
                  className="mt-1 inline-block text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-label="Sign in as host instead (go to host dashboard)"
                >
                  Sign in as host instead
                </a>
              </>
            ) : (
              <>
                <p className="text-xs text-muted-foreground mb-1">
                  Admin? Use the form above to sign in — you&apos;ll be taken to the admin area.
                </p>
                <a
                  href="/admin"
                  onClick={() => {
                    // #region agent log
                    log("app/host/login/page.tsx:admin-link-click", "Admin link clicked", {
                      currentRedirect: redirect,
                    });
                    // #endregion
                  }}
                  className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-label="Set redirect to admin area (use form above to sign in)"
                >
                  Set redirect to /admin
                </a>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function HostLoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">Loading…</div>}>
      <HostLoginForm />
    </Suspense>
  );
}
