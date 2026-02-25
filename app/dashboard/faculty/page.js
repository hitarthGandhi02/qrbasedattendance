"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import styles from "./facultyDashboard.module.css";

export default function FacultyDashboard() {
  const router = useRouter();

  const [facultyName, setFacultyName] = useState("");
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  const [defaulters, setDefaulters] = useState([]);
  const [logs, setLogs] = useState([]);
  const [facultyStatus, setFacultyStatus] = useState("");
  const [ongoingSessions, setOngoingSessions] = useState([]);

  // -----------------------------
  // AUTH CHECK
  // -----------------------------
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/signin");
        return;
      }

      setUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .single();

      if (!profile || profile.role !== "faculty") {
        router.push("/signin");
        return;
      }

      setFacultyName(profile.full_name);

      const { data: classData } = await supabase
        .from("classes")
        .select("class_id, class_name")
        .eq("faculty_id", user.id);

      setClasses(classData || []);
      setLoading(false);
    };

    checkUser();
  }, [router]);

  // -----------------------------
  // FETCH SUBJECTS
  // -----------------------------
  useEffect(() => {
    const fetchSubjects = async () => {
      if (!selectedClass || !userId) return;

      const { data } = await supabase
        .from("faculty_subjects")
        .select("id, subject_id (subject_id, subject_name)")
        .eq("faculty_id", userId)
        .eq("class_id", selectedClass);

      setSubjects(
        data?.map((s) => ({
          id: s.id,
          name: s.subject_id.subject_name,
          subject_id: s.subject_id.subject_id,
        })) || []
      );

      setSelectedSubject("");
    };

    fetchSubjects();
  }, [selectedClass, userId]);

  // -----------------------------
  // FETCH ONGOING SESSIONS
  // -----------------------------
  useEffect(() => {
    if (!userId) return;

    const fetchOngoing = async () => {
      const { data } = await supabase
        .from("sessions")
        .select(`
          session_id,
          expires_at,
          class_id (class_name),
          subject_id (subject_name)
        `)
        .eq("faculty_id", userId)
        .gt("expires_at", new Date().toISOString());

      setOngoingSessions(data || []);
    };

    fetchOngoing();

    const interval = setInterval(fetchOngoing, 10000);
    return () => clearInterval(interval);
  }, [userId]);

  // -----------------------------
  // CREATE SESSION
  // -----------------------------
  const generateQR = async () => {
    if (!selectedClass || !selectedSubject) {
      alert("Please select class and subject");
      return;
    }

    const res = await fetch("/api/create-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        faculty_id: userId,
        class_id: selectedClass,
        subject_id: selectedSubject,
      }),
    });

    const result = await res.json();

    if (result.error) {
      alert(result.error);
      return;
    }

    router.push(`/dashboard/faculty/session/${result.session.session_id}`);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/signin");
  };

  if (loading) return <p className={styles.loading}>Loading...</p>;

  return (
    <div className={styles.wrapper}>
      {/* HEADER */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Faculty Dashboard</h1>
          <p className={styles.welcomeText}>Welcome, {facultyName}</p>
        </div>

        <button className={styles.logoutBtn} onClick={handleLogout}>
          Logout
        </button>
      </header>

      <div className={styles.container}>
        {/* ONGOING SESSION CARD */}
        {ongoingSessions.length > 0 && (
          <div className={`${styles.card} ${styles.fullWidth}`}>
            <h2 className={styles.cardTitle}>🟢 Ongoing Sessions</h2>

            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.tableHeader}>Class</th>
                  <th className={styles.tableHeader}>Subject</th>
                  <th className={styles.tableHeader}>Status</th>
                  <th className={styles.tableHeader}>Action</th>
                </tr>
              </thead>
              <tbody>
                {ongoingSessions.map((session) => (
                  <tr key={session.session_id} className={styles.tableRow}>
                    <td className={styles.tableCell}>
                      {session.class_id?.class_name}
                    </td>
                    <td className={styles.tableCell}>
                      {session.subject_id?.subject_name}
                    </td>
                    <td className={styles.tableCell}>
                      <span className={styles.successMsg}>
                        Active
                      </span>
                    </td>
                    <td className={styles.tableCell}>
                      <button
                        className={styles.btn}
                        onClick={() =>
                          router.push(
                            `/dashboard/faculty/session/${session.session_id}`
                          )
                        }
                      >
                        Go to QR
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* AUTO DEFAULTER */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>
            📉 Auto-Defaulter List Generator
          </h2>

          <button className={styles.btn}>
            Generate List
          </button>

          {defaulters.length > 0 && (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.tableHeader}>Name</th>
                  <th className={styles.tableHeader}>Roll</th>
                  <th className={styles.tableHeader}>Attendance</th>
                  <th className={styles.tableHeader}>Status</th>
                </tr>
              </thead>
              <tbody>
                {defaulters.map((d, i) => (
                  <tr key={i} className={styles.tableRow}>
                    <td className={styles.tableCell}>{d.name}</td>
                    <td className={styles.tableCell}>{d.roll}</td>
                    <td className={styles.tableCell}>{d.att}</td>
                    <td className={styles.tableCell}>
                      <span
                        className={`${styles.chip} ${styles.chipDefaulter}`}
                      >
                        Defaulter
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* CREATE SESSION */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>
            📲 Create New Lecture Session
          </h2>

          <select
            className={styles.input}
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="">-- Select Class --</option>
            {classes.map((cls) => (
              <option key={cls.class_id} value={cls.class_id}>
                {cls.class_name}
              </option>
            ))}
          </select>

          <select
            className={styles.input}
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            <option value="">-- Select Subject --</option>
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.subject_id}>
                {sub.name}
              </option>
            ))}
          </select>

          <button className={styles.btn} onClick={generateQR}>
            Generate QR Code
          </button>
        </div>

        {/* AUDIT LOGS */}
        <div className={`${styles.card} ${styles.fullWidth}`}>
          <h2 className={styles.cardTitle}>📜 Audit Logs</h2>
          <div className={styles.logContainer}>
            {logs.length === 0 ? (
              <p>No logs yet...</p>
            ) : (
              logs.map((log, i) => (
                <div key={i} className={styles.logItem}>
                  {log.message}
                </div>
              ))
            )}
          </div>
        </div>

        {/* FACULTY ATTENDANCE */}
        <div className={`${styles.card} ${styles.fullWidth}`}>
          <h2 className={styles.cardTitle}>
            👩‍🏫 Faculty Attendance
          </h2>

          <button className={styles.btn}>
            Scan QR to Mark Attendance
          </button>

          {facultyStatus && (
            <p className={styles.successMsg}>
              {facultyStatus}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}