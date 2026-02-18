"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import QRCode from "qrcode";
import styles from "./facultyDashboard.module.css";

export default function FacultyDashboard() {
  const router = useRouter();

  const [facultyName, setFacultyName] = useState("");
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [qrImage, setQrImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [logs, setLogs] = useState([]);
  const [defaulters, setDefaulters] = useState([]);
  const [facultyStatus, setFacultyStatus] = useState("");

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
  
    // ✅ Redirect to live session page
    router.push(`/dashboard/faculty/session/${result.session.session_id}`);

  };
  

  const addLog = (message) => {
    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const date = new Date().toLocaleDateString();
    setLogs((prev) => [{ message, time, date }, ...prev]);
  };




  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/signin");
  };

  if (loading) return <p className={styles.loading}>Loading...</p>;

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <h1 className={styles.pageTitle}>Faculty Dashboard</h1>
        <p className={styles.welcomeText}>Welcome, {facultyName}</p>
      </header>

      <div className={styles.container}>
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
                <tr className={styles.tableRow}>
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

          {qrImage && (
            <div className={styles.qrContainer}>
              <img
                src={qrImage}
                alt="QR Code"
                className={styles.qrImage}
              />
              <p className={styles.successMsg}>
                QR generated successfully
              </p>
            </div>
          )}
        </div>
        <div className={`${styles.card} ${styles.fullWidth}`}>
          <h2 className={styles.cardTitle}>📜 Audit Logs</h2>
          <div className={styles.logContainer}>
            
          </div>
        </div>
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
        <button className={styles.logoutBtn} onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}
