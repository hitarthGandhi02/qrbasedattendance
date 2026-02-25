import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(req) {
  try {
    const { student_id } = await req.json();

    if (!student_id) {
      return NextResponse.json(
        { error: "Missing student_id" },
        { status: 400 }
      );
    }

    // 🔹 Get student subjects
    const { data: studentSubjects, error: subjectError } = await supabase
      .from("student_classes")
      .select(`
        subject_id,
        subjects (
          subject_name
        )
      `)
      .eq("student_id", student_id);
    if (subjectError) throw subjectError;
    if (!studentSubjects || studentSubjects.length === 0) {
      return NextResponse.json({
        subjects: [],
        overall: 0,
      });
    }

    const subjectsResult = [];

    for (const sub of studentSubjects) {
      // 🔹 Get all sessions of this subject
      const { data: sessions } = await supabase
        .from("sessions")
        .select("session_id")
        .eq("subject_id", sub.subject_id);

      const totalSessions = sessions?.length || 0;

      let percent = 0;
      let presentCount = 0;

      if (totalSessions > 0) {
        const sessionIds = sessions.map((s) => s.session_id);

        const { data: attendance } = await supabase
          .from("attendance")
          .select("session_id")
          .eq("student_id", student_id)
          .in("session_id", sessionIds);
        
        presentCount = attendance?.length || 0;

        

        percent = Math.round(
          (presentCount / totalSessions) * 100
        );
      }

      subjectsResult.push({
        subject_id: sub.subject_id,
        subject_name: sub.subjects.subject_name,
        percent,
        presentCount,
        totalSessions,
      });
    }

    const overall =
      subjectsResult.length > 0
        ? Math.round(
            subjectsResult.reduce((acc, s) => acc + s.percent, 0) /
              subjectsResult.length
          )
        : 0;
    return NextResponse.json({
      subjects: subjectsResult,
      overall,
    });
  } catch (error) {
    console.error("Attendance API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}