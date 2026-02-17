"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import styles from "./studentDashboard.module.css";

export default function StudentDashboard() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState("");
  const [attendancePercent, setAttendancePercent] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/signin");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .single();

      if (!profile || profile.role !== "student") {
        router.push("/signin");
        return;
      }

      setStudentName(profile.full_name);

      const { data: attendance } = await supabase
        .from("attendance")
        .select("status")
        .eq("student_id", user.id);

      if (attendance) {
        const total = attendance.length;
        const present = attendance.filter(
          (a) => a.status === "present"
        ).length;

        const percent = total > 0 ? Math.round((present / total) * 100) : 0;
        setAttendancePercent(percent);
      }

      setLoading(false);
    };

    fetchData();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/signin");
  };

  if (loading) return <p className={styles.loading}>Loading...</p>;

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <h1>Student Dashboard</h1>
        <p>Welcome, {studentName}</p>
      </header>

      <div className={styles.container}>
        <div className={styles.card}>
          <h2>Attendance Summary</h2>

          <div
            className={styles.progressCircle}
            style={{
              background: `conic-gradient(#38b2ac 0% ${attendancePercent}%, #4a5568 ${attendancePercent}% 100%)`,
            }}
          >
            <span>{attendancePercent}%</span>
          </div>

          {attendancePercent < 75 && (
            <p className={styles.warning}>
              ⚠ Below 75% Attendance Requirement
            </p>
          )}

          <button
            className={styles.btn}
            onClick={() => router.push("/dashboard/student/scan")}
          >
            Scan QR to Mark Attendance
          </button>
        </div>

        <button className={styles.logoutBtn} onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}
