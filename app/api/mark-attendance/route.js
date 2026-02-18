import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value;
          },
          set() {},
          remove() {},
        },
      }
    );

    const { session_code, student_id } = await req.json();

    if (!session_code) {
      return NextResponse.json(
        { error: "Missing session_code" },
        { status: 400 }
      );
    }

    // const {
    //   data: { user },
    //   error: userError,
    // } = await supabase.auth.getUser();

      // if (userError || !user) {
      //   console.log("ESER : " + user);
      //   return NextResponse.json(
      //     { error: "Unauthorized" },
      //     { status: 401 }
      //   );
      // }

    const { data: session } = await supabase
      .from("sessions")
      .select("session_id")
      .eq("session_code", session_code.trim())
      .maybeSingle();

    if (!session) {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 400 }
      );
    }
    console.log("SESSION ID : "+ JSON.stringify(session));

    const { error: insertError } = await supabase
      .from("attendance")
      .insert([
        {
          session_id: session.session_id,
          student_id: student_id,
          marked_at: new Date(),
        },
      ]);

    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json(
          { error: "Attendance already marked" },
          { status: 409 }
        );
      }
      throw insertError;
    }

    return NextResponse.json(
      { message: "Attendance marked successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Server Error:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
