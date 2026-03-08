"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Truck, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/hooks/use-auth";

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAdmin, signOut } = useAuth();

  const isStays =
    pathname === "/" || pathname.startsWith("/stays") || pathname.startsWith("/book");
  const isStorage =
    pathname.startsWith("/storage") || pathname.startsWith("/store");
  const isHost = pathname.startsWith("/host");
  const isAdminArea = pathname.startsWith("/admin");

  if (isHost || isAdminArea) return <DashboardNav isAdmin={isAdmin} onSignOut={async () => { await signOut(); router.push("/"); }} />;

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <Truck className="size-7 text-primary" data-icon="inline-start" />
            <span className="text-lg font-bold tracking-tight">Mini RV Parks</span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            <Link
              href="/stays"
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                isStays
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              Stays
            </Link>
            <Link
              href="/storage"
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                isStorage
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              Storage
            </Link>
          </div>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/apply"
            className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
          >
            Join Beta
          </Link>
          {user ? (
            <>
              <Link
                href="/host/dashboard"
                className="rounded-full border border-input px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                Dashboard
              </Link>
              <Link
                href={isAdmin ? "/admin" : "/host/dashboard"}
                className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
              >
                {isAdmin ? "Admin" : "My Listings"}
              </Link>
            </>
          ) : (
            <Link
              href="/host/login"
              className="rounded-full border border-input px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              Host Login
            </Link>
          )}
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-md p-2 md:hidden"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X className="size-5" data-icon="inline-start" /> : <Menu className="size-5" data-icon="inline-start" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t px-4 pb-4 pt-2 md:hidden">
          <div className="flex flex-col gap-1">
            <Link
              href="/stays"
              onClick={() => setMobileOpen(false)}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium",
                isStays ? "bg-primary/10 text-primary" : "text-muted-foreground"
              )}
            >
              Stays
            </Link>
            <Link
              href="/storage"
              onClick={() => setMobileOpen(false)}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium",
                isStorage ? "bg-primary/10 text-primary" : "text-muted-foreground"
              )}
            >
              Storage
            </Link>
            <Link
              href="/apply"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground"
            >
              Join Beta
            </Link>
            {user ? (
              <>
                <Link
                  href="/host/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground"
                >
                  Dashboard
                </Link>
                <Link
                  href={isAdmin ? "/admin" : "/host/dashboard"}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground"
                >
                  {isAdmin ? "Admin" : "My Listings"}
                </Link>
              </>
            ) : (
              <Link
                href="/host/login"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground"
              >
                Host Login
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

function DashboardNav({
  isAdmin,
  onSignOut,
}: {
  isAdmin: boolean;
  onSignOut: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <Truck className="size-7 text-primary" data-icon="inline-start" />
            <span className="text-lg font-bold tracking-tight">Mini RV Parks</span>
          </Link>
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {isAdmin ? "Admin" : "Host"}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {isAdmin ? (
            <>
              <NavLink href="/admin" active={pathname === "/admin"}>
                Dashboard
              </NavLink>
              <NavLink
                href="/admin/listings"
                active={pathname.startsWith("/admin/listings")}
              >
                Listings
              </NavLink>
              <NavLink
                href="/admin/applications"
                active={pathname === "/admin/applications"}
              >
                Applications
              </NavLink>
            </>
          ) : (
            <>
              <NavLink href="/host/dashboard" active={pathname === "/host/dashboard"}>
                Dashboard
              </NavLink>
              <NavLink
                href="/host/listings/new"
                active={pathname.startsWith("/host/listings")}
              >
                Listings
              </NavLink>
              <NavLink
                href="/host/requests"
                active={pathname === "/host/requests"}
              >
                Requests
              </NavLink>
            </>
          )}
          <button
            type="button"
            onClick={onSignOut}
            className="ml-4 rounded-full px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Log out
          </button>
        </div>
      </div>
    </nav>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full px-4 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-emerald-50 text-emerald-700"
          : "text-gray-600 hover:bg-gray-100"
      )}
    >
      {children}
    </Link>
  );
}
