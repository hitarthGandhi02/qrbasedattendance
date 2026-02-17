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
        <h1 className={styles.pageTitle}>Student Dashboard</h1>
        <p className={styles.welcomeText}>Welcome, {studentName}</p>
      </header>

      <div className={styles.container}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>📊 Attendance Summary</h2>

          <div
            className={styles.progressCircle}
            style={{
              background: `conic-gradient(#f6ad55 0% ${attendancePercent}%, #4a5568 ${attendancePercent}% 100%)`,
            }}
          >
            <span className={styles.progressText}>
              {attendancePercent}%
            </span>
          </div>

          {attendancePercent < 75 && (
            <div className={styles.warningBanner}>
              ⚠️ Warning: Below 75% Attendance Requirement
            </div>
          )}
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>🎯 Mark Attendance</h2>
          <div className={styles.qrIcon}>🔳</div>
          <button
            className={styles.btn}
            onClick={() => router.push("/dashboard/student/scan")}
          >
            Scan QR Code
          </button>
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>📅 Today's Schedule</h2>
          <ul className={styles.scheduleList}>

          </ul>
        </div>

        <div className={`${styles.card} ${styles.recentCard}`}>
          <h2 className={styles.cardTitle}>🧾 Recent Attendance</h2>

          <table className={styles.table}>
            <thead>
              <tr className={styles.tableRow}>
                <th className={styles.tableHeader}>Date</th>
                <th className={styles.tableHeader}>Subject</th>
                <th className={styles.tableHeader}>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className={styles.tableRow}>
                <td className={styles.tableCell}>10 Oct</td>
                <td className={styles.tableCell}>DBMS</td>
                <td className={styles.tableCell}>
                  <span className={`${styles.badge} ${styles.present}`}>
                    Present
                  </span>
                </td>
              </tr>
              <tr className={styles.tableRow}>
                <td className={styles.tableCell}>11 Oct</td>
                <td className={styles.tableCell}>AI</td>
                <td className={styles.tableCell}>
                  <span className={`${styles.badge} ${styles.absent}`}>
                    Absent
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <button className={styles.logoutBtn} onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}
