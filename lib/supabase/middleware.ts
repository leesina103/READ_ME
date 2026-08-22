import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "@/lib/supabase/config";

function copyCookies(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((cookie) => target.cookies.set(cookie));
  return target;
}

export async function updateSession(request: NextRequest) {
  const config = getSupabaseConfig();
  let response = NextResponse.next({ request });

  if (!config) return response;

  const supabase = createServerClient(config.url, config.key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      }
    }
  });

  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  if (!user && (pathname.startsWith("/my") || pathname.startsWith("/onboarding") || pathname.startsWith("/admin"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return copyCookies(response, NextResponse.redirect(url));
  }

  if (pathname.startsWith("/admin") && user?.app_metadata?.role !== "admin") {
    const url = request.nextUrl.clone();
    url.pathname = "/my";
    url.search = "";
    return copyCookies(response, NextResponse.redirect(url));
  }

  if (user && (pathname === "/login" || pathname === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/onboarding";
    url.search = "";
    return copyCookies(response, NextResponse.redirect(url));
  }

  return response;
}
