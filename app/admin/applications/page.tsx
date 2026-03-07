"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Shield, ChevronDown, ChevronUp } from "lucide-react";
import { useAppStore } from "@/lib/store";
import type { ApplicationStatus, BetaApplication } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

type FilterTab = "ALL" | ApplicationStatus;

const STATUS_BADGE: Record<ApplicationStatus, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "bg-yellow-100 text-yellow-800" },
  APPROVED: { label: "Approved", className: "bg-emerald-100 text-emerald-800" },
  REJECTED: { label: "Rejected", className: "bg-red-100 text-red-800" },
};

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

export default function AdminApplicationsPage() {
  const isAdmin = useAppStore((s) => s.isAdmin);
  const betaApplications = useAppStore((s) => s.betaApplications);
  const updateApplicationStatus = useAppStore((s) => s.updateApplicationStatus);

  const [filter, setFilter] = useState<FilterTab>("ALL");

  const sorted = useMemo(
    () =>
      [...betaApplications].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [betaApplications],
  );

  const filtered = useMemo(
    () => (filter === "ALL" ? sorted : sorted.filter((a) => a.status === filter)),
    [sorted, filter],
  );

  if (!isAdmin) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
        <Shield className="size-12 text-muted-foreground" />
        <h1 className="text-2xl font-semibold">Access denied</h1>
        <Link
          href="/host/login"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          Go to Host Login
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Beta Applications</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} application{filtered.length !== 1 && "s"}
          </p>
        </div>
        <Link
          href="/admin"
          className="text-sm text-emerald-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        >
          Back to Dashboard
        </Link>
      </div>

      <nav aria-label="Filter applications by status" className="flex gap-1 rounded-lg bg-muted p-1">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            aria-pressed={filter === tab.value}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:outline-none ${
              filter === tab.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <p className="py-12 text-center text-muted-foreground">
            No applications match this filter.
          </p>
        )}

        {filtered.map((app) => (
          <ApplicationRow
            key={app.id}
            application={app}
            onStatusChange={updateApplicationStatus}
          />
        ))}
      </div>
    </main>
  );
}

function ApplicationRow({
  application,
  onStatusChange,
}: {
  application: BetaApplication;
  onStatusChange: (id: string, status: ApplicationStatus) => void;
}) {
  const [notesExpanded, setNotesExpanded] = useState(false);
  const badge = STATUS_BADGE[application.status];
  const truncateNotes = application.notes.length > 80;

  return (
    <Card className="gap-0 py-0">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{application.name}</span>
            <Badge className={badge.className}>{badge.label}</Badge>
          </div>

          <div className="space-y-1 text-sm text-muted-foreground">
            <p>{application.email}</p>
            <p>{application.phone}</p>
            <p className="text-xs">
              Applied {new Date(application.createdAt).toLocaleDateString()}
            </p>
          </div>

          {application.notes && (
            <div className="text-sm">
              <p>
                {truncateNotes && !notesExpanded
                  ? `${application.notes.slice(0, 80)}...`
                  : application.notes}
              </p>
              {truncateNotes && (
                <button
                  onClick={() => setNotesExpanded(!notesExpanded)}
                  className="mt-1 inline-flex items-center gap-0.5 text-xs text-emerald-600 hover:underline focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  {notesExpanded ? (
                    <>
                      Show less <ChevronUp className="size-3" />
                    </>
                  ) : (
                    <>
                      Show more <ChevronDown className="size-3" />
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {application.status === "PENDING" && (
          <div className="flex shrink-0 gap-2 sm:self-center">
            <Button
              size="sm"
              className="bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={() => onStatusChange(application.id, "APPROVED")}
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onStatusChange(application.id, "REJECTED")}
            >
              Reject
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
