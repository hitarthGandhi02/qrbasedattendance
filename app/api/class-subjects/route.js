// import { NextResponse } from "next/server";
// import { supabase } from "@/lib/supabaseClient";

// export async function POST(req) {
//   try {
//     const { faculty_id, class_id } = await req.json();

//     const { data, error } = await supabase
//       .from("class_subjects")
//       .select(`
//         subject_id ( id, name )
//       `)
//       .in(
//         "subject_id",
//         supabase
//           .from("faculty_subjects")
//           .select("subject_id")
//           .eq("faculty_id", faculty_id)
//       )
//       .eq("class_id", class_id);

//     if (error) throw error;

//     return NextResponse.json({ subjects: data.map((d) => d.subject_id) });
//   } catch (err) {
//     console.error(err);
//     return NextResponse.json({ error: "Server error" }, { status: 500 });
//   }
// }
