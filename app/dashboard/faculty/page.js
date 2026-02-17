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

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .single();

      if (!profile || profile.role !== "faculty") {
        router.push("/signin");
        return;
      }

      setFacultyName(profile.full_name);

      const { data: classData, error: classError } = await supabase
        .from("classes")
        .select("class_id, class_name")
        .eq("faculty_id", user.id);

      if (classError) console.error("Error fetching classes:", classError.message);
      else setClasses(classData || []);

      setLoading(false);
    };

    checkUser();
  }, [router]);

  useEffect(() => {
    const fetchSubjects = async () => {
      if (!selectedClass || !userId) return;

      const { data: subjectData, error: subjectError } = await supabase
        .from("faculty_subjects")
        .select("id, subject_id (subject_id, subject_name)")
        .eq("faculty_id", userId)
        .eq("class_id", selectedClass);

      if (subjectError) {
        console.error("Error fetching subjects:", subjectError.message);
      } else {
        setSubjects(subjectData.map((s) => ({
          id: s.id,
          name: s.subject_id.subject_name,
          subject_id: s.subject_id.subject_id,
        })));
        setSelectedSubject("");
      }
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

    const qrData = JSON.stringify({
      session_code: result.session.session_code,
    });

    const qrUrl = await QRCode.toDataURL(qrData);
    setQrImage(qrUrl);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/signin");
  };

  if (loading) return <p className={styles.loading}>Loading...</p>;

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <h1>Faculty Dashboard</h1>
        <p>Welcome, {facultyName}</p>
      </header>

      <div className={styles.container}>
        <div className={styles.card}>
          <h2>Create QR Session</h2>

          <label>Select Class:</label>
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

          <label>Select Subject:</label>
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
            Generate QR
          </button>

          {qrImage && (
            <div className={styles.qrContainer}>
              <img src={qrImage} alt="QR Code" width="250" />
              <p>Valid for 10 minutes</p>
            </div>
          )}
        </div>

        <button className={styles.logoutBtn} onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}
