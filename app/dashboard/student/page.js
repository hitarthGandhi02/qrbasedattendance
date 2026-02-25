"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import styles from "./studentDashboard.module.css";

export default function StudentDashboard() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState("");
  const [attendancePercent, setAttendancePercent] = useState(0);
  const [subjectAttendance, setSubjectAttendance] = useState([]);
  const [recentAttendance, setRecentAttendance] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/signin");
        return;
      }

      // 🔹 Validate student
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

      // 🔹 Get student subjects
      const { data: studentSubjects } = await supabase
        .from("student_classes")
        .select(`
          subject_id,
          subjects (
            subject_name
          )
        `)
        .eq("student_id", user.id);
          console.log("Student subject : ",studentSubjects) 
      // 🔹 Get attendance records

// 🔹 Get all sessions of student's subjects
const { data: allSessions } = await supabase
  .from("sessions")
  .select("session_id, subject_id");

// 🔹 Get student's attendance records
const { data: attendanceData } = await supabase
  .from("attendance")
  .select(`
    session_id,
    marked_at,
    sessions (
      subject_id,
      subjects (
        subject_name
      )
    )
  `)
  .eq("student_id", user.id);
const subjectStats =
  studentSubjects?.map((sub) => {
    const subjectSessions = allSessions?.filter(
      (s) => s.subject_id === sub.subject_id
    ) || [];
    

    const presentCount = attendanceData?.filter((a) =>
      subjectSessions.some((s) => s.session_id === a.session_id)
    ).length || 0;
    const totalSessions = subjectSessions.length;
    
    const percent =
      totalSessions > 0
        ? Math.round((presentCount / totalSessions) * 100)
        : 0;

    return {
      subject_name: sub.subjects.subject_name,
      percent,
    };
  }) || [];

      setSubjectAttendance(subjectStats);

      // 🔹 Overall average
      const avg =
        subjectStats.length > 0
          ? Math.round(
              subjectStats.reduce((acc, s) => acc + s.percent, 0) /
                subjectStats.length
            )
          : 0;

      setAttendancePercent(avg);

      // 🔹 Recent Attendance (latest 5)
const recent = attendanceData
  ?.sort(
    (a, b) =>
      new Date(b.marked_at) - new Date(a.marked_at)
  )
  .slice(0, 5)
  .map((a) => ({
    date: a.marked_at
      ? new Date(a.marked_at).toLocaleDateString()
      : "—",
    subject:
      a.sessions?.subjects?.subject_name || "Unknown",
    status: "present",
  })) || [];

setRecentAttendance(recent);

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
  <div>
    <h1 className={styles.pageTitle}>Student Dashboard</h1>
    <p className={styles.welcomeText}>
      Welcome, {studentName}
    </p>
  </div>

  {/* Desktop Logout */}
  <button
    className={styles.logoutBtn}
    onClick={handleLogout}
  >
    Logout
  </button>

  {/* Mobile Menu Button */}
  <button
    className={styles.menuBtn}
    onClick={() => setSidebarOpen(!sidebarOpen)}
  >
    ☰
  </button>
</header>

{/* Overlay */}
<div
  className={`${styles.overlay} ${
    sidebarOpen ? styles.overlayOpen : ""
  }`}
  onClick={() => setSidebarOpen(false)}
/>

{/* Sidebar */}
<div
  className={`${styles.sidebar} ${
    sidebarOpen ? styles.sidebarOpen : ""
  }`}
>
  <button
    className={styles.logoutBtn}
    onClick={() => {
      setSidebarOpen(false);
      handleLogout();
    }}
  >
    Logout
  </button>
</div>


      <div className={styles.container}>
        {/* 📊 Attendance Summary */}
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
              ⚠️ Below 75% Attendance Requirement
            </div>
          )}

          {/* Subject-wise */}
          <div style={{ marginTop: "25px" }}>
            {subjectAttendance.map((sub, index) => (
              <div key={index} style={{ marginBottom: "15px" }}>
                <strong>{sub.subject_name}</strong>
                <div
                  style={{
                    height: "8px",
                    background: "#4a5568",
                    borderRadius: "4px",
                    overflow: "hidden",
                    marginTop: "5px",
                  }}
                >
                  <div
                    style={{
                      width: `${sub.percent}%`,
                      height: "100%",
                      background:
                        sub.percent >= 75
                          ? "#22c55e"
                          : "#ef4444",
                      transition: "0.3s",
                    }}
                  />
                </div>
                <span style={{ fontSize: "12px" }}>
                  {sub.percent}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 🎯 Mark Attendance */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>🎯 Mark Attendance</h2>
          <div className={styles.qrIcon}>🔳</div>
          <button
            className={styles.btn}
            onClick={() =>
              router.push("/dashboard/student/scan")
            }
          >
            Scan QR Code
          </button>
        </div>

        {/* 🧾 Recent Attendance */}
        <div className={`${styles.card} ${styles.recentCard}`}>
          <h2 className={styles.cardTitle}>
            🧾 Recent Attendance
          </h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Subject</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentAttendance.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ textAlign: "center" }}>
                    No records found
                  </td>
                </tr>
              ) : (
                recentAttendance.map((item, index) => (
                  <tr key={index}>
                    <td>{item.date}</td>
                    <td>{item.subject}</td>
                    <td>
                      <span
                        className={`${styles.badge} ${
                          item.status === "present"
                            ? styles.present
                            : styles.absent
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}