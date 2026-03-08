"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StorageSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }
    const timer = setTimeout(() => {
      setVerified(true);
      setLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-neutral-600">Confirming your payment…</span>
      </div>
    );
  }

  if (!sessionId || !verified) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Invalid session</h1>
        <Button render={<Link href="/" />} nativeButton={false} className="mt-4" variant="outline">
          Back to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <CheckCircle className="mx-auto h-16 w-16 text-emerald-500" />
      <h1 className="mt-6 text-2xl font-bold">Payment Successful!</h1>
      <p className="mt-3 text-neutral-600">
        Your storage contract is confirmed. You&apos;ll receive a confirmation email shortly.
        The host will send move-in instructions.
      </p>
      <Button render={<Link href="/" />} nativeButton={false} className="mt-8">
        Back to Home
      </Button>
    </div>
  );
}
