"use client";
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
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
    const [createdSessions, setCreatedSessions] = useState([]);
  const [auditData, setAuditData] = useState(null);

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

  const generateDefaulters = async () => {
  if (!selectedClass) {
    alert("Please select a class first");
    return;
  }

  // 1️⃣ Get students of class
  const { data: students } = await supabase
    .from("student_classes")
    .select(`
      student_id,
      profiles (full_name)
    `)
    .eq("class_id", selectedClass);

  if (!students || students.length === 0) {
    alert("No students found");
    return;
  }

  const defaultersList = [];

  // 2️⃣ For each student calculate attendance
  for (const student of students) {
    const res = await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_id: student.student_id,
      }),
    });

    const result = await res.json();

    if (result.overall < 75) {
      defaultersList.push([
        student.profiles.full_name,
        result.overall + "%",
      ]);
    }
  }

  // 3️⃣ Generate PDF
  const doc = new jsPDF();

  doc.setFillColor(17, 24, 39);
  doc.rect(0, 0, 210, 297, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text("DEFAULTER LIST", 105, 20, { align: "center" });

  doc.setFontSize(12);
  doc.text(`Class ID: ${selectedClass}`, 20, 40);
  doc.text(
    `Generated At: ${new Date().toLocaleString()}`,
    20,
    48
  );

  autoTable(doc, {
    startY: 60,
    head: [["Student Name", "Overall Attendance"]],
    body: defaultersList.length
      ? defaultersList
      : [["No Defaulters", "-"]],
    theme: "grid",
    styles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
    },
    headStyles: {
      fillColor: [31, 41, 55],
      textColor: [255, 255, 255],
    },
    alternateRowStyles: {
      fillColor: [17, 24, 39],
    },
  });

  doc.save("Defaulter_List.pdf");
};
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


   // =============================
  // FETCH ALL CREATED SESSIONS
  // =============================
  useEffect(() => {
    if (!userId) return;

    const fetchSessions = async () => {
      const { data } = await supabase
        .from("sessions")
        .select(`
          session_id,
          created_at,
          class_id (class_id, class_name),
          subject_id (subject_id, subject_name)
        `)
        .eq("faculty_id", userId)
        .order("created_at", { ascending: false });

      setCreatedSessions(data || []);
    };

    fetchSessions();
  }, [userId]);

  // =============================
  // GENERATE AUDIT
  // =============================
const generateAudit = async (session) => {
  // 1️⃣ Fetch students of class
  const { data: students } = await supabase
    .from("student_classes")
    .select(`
      student_id,
      profiles (full_name)
    `)
    .eq("class_id", session.class_id.class_id);

  // 2️⃣ Fetch attendance of session
  const { data: attendance } = await supabase
    .from("attendance")
    .select("student_id")
    .eq("session_id", session.session_id);

  const presentIds = attendance?.map((a) => a.student_id) || [];

  const formattedStudents =
    students?.map((s) => [
      s.profiles.full_name,
      presentIds.includes(s.student_id) ? "Present" : "Absent",
    ]) || [];

  // ==========================
  // CREATE PDF
  // ==========================
  const doc = new jsPDF();

  // Dark background
  doc.setFillColor(17, 24, 39); // dark slate
  doc.rect(0, 0, 210, 297, "F");

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text("AUDIT REPORT", 105, 20, { align: "center" });

  // Session Info
  doc.setFontSize(12);
  doc.text(
    `Subject: ${session.subject_id.subject_name}`,
    20,
    40
  );
  doc.text(
    `Class: ${session.class_id.class_name}`,
    20,
    48
  );
  doc.text(
    `Created At: ${new Date(
      session.created_at
    ).toLocaleString()}`,
    20,
    56
  );

  // Attendance Table
  autoTable(doc, {
    startY: 70,
    head: [["Student Name", "Status"]],
    body: formattedStudents,
    theme: "grid",
    styles: {
      fillColor: [30, 41, 59], // row background
      textColor: [255, 255, 255],
    },
    headStyles: {
      fillColor: [31, 41, 55],
      textColor: [255, 255, 255],
    },
    alternateRowStyles: {
      fillColor: [17, 24, 39],
    },
  });

  // Download
  doc.save(
    `Audit_${session.subject_id.subject_name}_${session.class_id.class_name}.pdf`
  );
};



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

          <button className={styles.btn} onClick={generateDefaulters}>
            Generate List
          </button>

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

          {createdSessions.map((session) => (
            <div
              key={session.session_id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "10px",
              }}
            >
              <span>
                {session.subject_id?.subject_name} (
                {session.class_id?.class_name})
              </span>

              <button
                className={styles.btn}
                style={{ width: "140px" }}
                onClick={() => generateAudit(session)}
              >
                View Audit
              </button>
            </div>
          ))}

          {auditData && (
            <div style={{ marginTop: "20px" }}>
              <h3>
                {auditData.subject_name} - {auditData.class_name}
              </h3>
              <p>
                Created At:{" "}
                {new Date(auditData.created_at).toLocaleString()}
              </p>

              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {auditData.students.map((student, i) => (
                    <tr key={i}>
                      <td>{student.name}</td>
                      <td>{student.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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