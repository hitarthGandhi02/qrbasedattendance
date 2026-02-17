import { supabase } from "@/lib/supabaseClient";
import { v4 as uuidv4 } from "uuid";

export async function POST(req) {
  try {
    const { faculty_id, class_id, subject_id } = await req.json();

    if (!faculty_id || !class_id || !subject_id) {
      return new Response(
        JSON.stringify({ error: "faculty_id, class_id and subject_id are required" }),
        { status: 400 }
      );
    }
    const session_code = uuidv4();
    const qr_token = uuidv4();

    const expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("sessions")
      .insert([
        {
          faculty_id,
          class_id,
          subject_id,
          session_code,
          qr_token,
          expires_at,        // <-- add this
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error.message);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ session: data }), { status: 200 });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
