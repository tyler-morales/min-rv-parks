"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface Profile {
  role: "host" | "admin";
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    const load = async () => {
      const {
        data: { user: u },
      } = await supabase.auth.getUser();
      setUser(u);
      if (u) {
        const { data: p } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", u.id)
          .single();
        setProfile(p as Profile | null);
      } else {
        setProfile(null);
      }
      setLoading(false);
    };

    load();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      load();
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return {
    user,
    profile,
    isHost: !!user,
    isAdmin: profile?.role === "admin",
    loading,
    signOut,
  };
}
