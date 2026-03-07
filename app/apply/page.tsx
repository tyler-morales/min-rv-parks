"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/lib/store";

export default function ApplyPage() {
  const router = useRouter();
  const addBetaApplication = useAppStore((s) => s.addBetaApplication);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    addBetaApplication({
      id: `app-${Date.now()}`,
      name,
      email,
      phone,
      notes,
      status: "PENDING",
      createdAt: new Date().toISOString().split("T")[0],
    });

    router.push("/apply/success");
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <h1 className="text-2xl font-bold">Apply for Beta Access</h1>
      <p className="mt-2 text-neutral-600">
        Mini RV Parks is in private beta. Apply below and we&apos;ll be in
        touch.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(555) 555-0000"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notes">Why are you interested?</Label>
          <Textarea
            id="notes"
            required
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Tell us about your RV lifestyle and what you're looking for…"
            rows={4}
          />
        </div>

        <Button
          type="submit"
          className="w-full bg-emerald-600 hover:bg-emerald-700"
        >
          Submit Application
        </Button>
      </form>
    </div>
  );
}
