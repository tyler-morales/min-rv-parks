"use client";

import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ApplySuccessPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <CheckCircle className="mx-auto size-16 text-primary" />
      <h1 className="mt-6 text-2xl font-bold">Application Submitted!</h1>
      <p className="mt-3 text-muted-foreground">
        Thanks for your interest. We&apos;ll call you within 48 hours to get
        you set up.
      </p>
      <Button render={<Link href="/" />} nativeButton={false} className="mt-8">
        Back to Home
      </Button>
    </div>
  );
}
