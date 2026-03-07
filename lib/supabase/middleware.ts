import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!url || !anonKey) {
    return response;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  const applyRedirect = (url: URL) => {
    const redir = NextResponse.redirect(url);
    response.headers.getSetCookie().forEach((cookie) => {
      redir.headers.append("Set-Cookie", cookie);
    });
    return redir;
  };

  if (pathname.startsWith("/host") && !pathname.startsWith("/host/login")) {
    if (!user) {
      const redirectUrl = new URL("/host/login", request.url);
      redirectUrl.searchParams.set("redirect", pathname);
      return applyRedirect(redirectUrl);
    }
  }

  if (pathname.startsWith("/admin")) {
    if (!user) {
      const redirectUrl = new URL("/host/login", request.url);
      redirectUrl.searchParams.set("redirect", pathname);
      return applyRedirect(redirectUrl);
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role !== "admin") {
      return applyRedirect(new URL("/host/dashboard", request.url));
    }
  }

  return response;
}
