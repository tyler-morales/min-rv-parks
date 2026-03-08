"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Shield,
  Eye,
  Users,
  Building,
  ArrowRight,
  ClipboardList,
} from "lucide-react";
import { useAuth } from "@/lib/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDashboardPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [listingStats, setListingStats] = useState({ pending: 0, live: 0 });
  const [appStats, setAppStats] = useState({ pending: 0, total: 0 });

  useEffect(() => {
    if (!isAdmin) return;
    fetch("/api/admin/listings")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: { status: string }[]) => {
        const list = Array.isArray(data) ? data : [];
        setListingStats({
          pending: list.filter((l) => l.status === "PENDING").length,
          live: list.filter((l) => l.status === "LIVE").length,
        });
      })
      .catch(() => {});

    fetch("/api/admin/beta_applications")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: { status: string }[]) => {
        const list = Array.isArray(data) ? data : [];
        setAppStats({
          pending: list.filter((a) => a.status === "PENDING").length,
          total: list.length,
        });
      })
      .catch(() => {});
  }, [isAdmin]);

  const stats = {
    pendingListings: listingStats.pending,
    liveListings: listingStats.live,
    pendingApps: appStats.pending,
    totalApps: appStats.total,
  };

  if (!authLoading && !isAdmin) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
        <Shield className="size-12 text-muted-foreground" />
        <h1 className="text-2xl font-semibold">Access denied</h1>
        <p className="text-muted-foreground">
          You must be an admin to view this page.
        </p>
        <Link
          href="/host/login"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          Go to Host Login
        </Link>
      </main>
    );
  }

  const statCards = [
    {
      label: "Pending Listings",
      value: stats.pendingListings,
      icon: ClipboardList,
      color: "text-yellow-600 bg-yellow-50",
    },
    {
      label: "Live Listings",
      value: stats.liveListings,
      icon: Eye,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "Pending Applications",
      value: stats.pendingApps,
      icon: Users,
      color: "text-yellow-600 bg-yellow-50",
    },
    {
      label: "Total Applications",
      value: stats.totalApps,
      icon: Users,
      color: "text-blue-600 bg-blue-50",
    },
  ];

  return (
    <main className="mx-auto max-w-5xl flex flex-col gap-8 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Manage listings, applications, and platform health.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex-row items-center justify-between pb-1">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {s.label}
              </CardTitle>
              <div className={`rounded-md p-1.5 ${s.color}`}>
                <s.icon className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/admin/listings" className="group">
          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-emerald-50 p-2 text-emerald-600">
                  <Building className="size-5" />
                </div>
                <div>
                  <p className="font-medium">Review Listings</p>
                  <p className="text-sm text-muted-foreground">
                    Approve, suspend, or verify host listings
                  </p>
                </div>
              </div>
              <ArrowRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/applications" className="group">
          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-emerald-50 p-2 text-emerald-600">
                  <Users className="size-5" />
                </div>
                <div>
                  <p className="font-medium">Review Applications</p>
                  <p className="text-sm text-muted-foreground">
                    Approve or reject beta access requests
                  </p>
                </div>
              </div>
              <ArrowRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </main>
  );
}
