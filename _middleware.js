// import { createServerClient } from "@supabase/ssr";
// import { NextResponse } from "next/server";

// export async function middleware(req) {
//   const res = NextResponse.next();

//   if (req.nextUrl.pathname.startsWith("/_next")) {
//   return res;
// }


//   const supabase = createServerClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL,
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
//     {
//       cookies: {
//         get(name) {
//           return req.cookies.get(name)?.value;
//         },
//         set(name, value, options) {
//           res.cookies.set({ name, value, ...options });
//         },
//         remove(name, options) {
//           res.cookies.set({ name, value: "", ...options });
//         },
//       },
//     }
//   );

//   const {
//     data: { user },
//   } = await supabase.auth.getUser();

//   const url = req.nextUrl.pathname;

//   // 🔒 Not logged in
//   if (!user) {
//     if (url !== "/signin") {
//       return NextResponse.redirect(new URL("/signin", req.url));
//     }
//     return res;
//   }

//   // ✅ Logged in → get role
//   const { data: profile } = await supabase
//     .from("profiles")
//     .select("role")
//     .eq("id", user.id)
//     .maybeSingle();

//   if (!profile?.role) {
//     return NextResponse.redirect(new URL("/signin", req.url));
//   }

//   const role = profile.role;

//   // Redirect root or signin to correct dashboard
//   if (url === "/" || url === "/signin") {
//     return NextResponse.redirect(
//       new URL(`/dashboard/${role}`, req.url)
//     );
//   }

//   // Prevent wrong dashboard access
//   if (url.startsWith("/dashboard")) {
//     if (!url.startsWith(`/dashboard/${role}`)) {
//       return NextResponse.redirect(
//         new URL(`/dashboard/${role}`, req.url)
//       );
//     }
//   }

//   return res;
// }

// export const config = {
//   matcher: ["/", "/signin", "/dashboard/:path*"],
// };
