"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import QRCode from "qrcode";
import { useRouter } from "next/router";

export default function LiveSession() {
  const { id } = useParams();
  const router = useRouter;
  const [timeLeft, setTimeLeft] = useState(0);
  const [qrImage, setQrImage] = useState("");
  const [students, setStudents] = useState([]);
  const [expiresAt, setExpiresAt] = useState(null);

  // 🔹 Fetch session details (including expires_at)
  
  useEffect(() => {
  if (timeLeft === 0 && expiresAt) {
    const endSession = async () => {
      await supabase
        .from("sessions")
        .update({ status: "expired" })
        .eq("session_id", id);

      router.push("/dashboard/faculty");
    };

    const timeout = setTimeout(endSession, 1500);
    return () => clearTimeout(timeout);
  }
}, [timeLeft, expiresAt, id, router]);
  
  
  
  useEffect(() => {
    if (!id) return;

    const fetchSession = async () => {
      const { data: session } = await supabase
        .from("sessions")
        .select("session_code, expires_at")
        .eq("session_id", id)
        .single();

      if (!session) return;
      console.log("session : ", session)

      // Generate QR
      const qrData = JSON.stringify({
        session_code: session.session_code,
      });

      const qrUrl = await QRCode.toDataURL(qrData);
      setQrImage(qrUrl);

      setExpiresAt(session.expires_at);
    };

    fetchSession();
  }, [id]);

  // 🔥 Dynamic Timer Based on expires_at
  useEffect(() => {
    if (!expiresAt) return;

const updateTimer = () => {
  const now = Date.now();

  const expiry = new Date(
    expiresAt.endsWith("Z") ? expiresAt : expiresAt + "Z"
  ).getTime();

  const remaining = Math.floor((expiry - now) / 1000);

  setTimeLeft(remaining > 0 ? remaining : 0);
};
    updateTimer(); // Run immediately

    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // 🔹 Fetch attendance
  const fetchAttendance = async () => {
    const { data } = await supabase
      .from("attendance")
      .select(`
        attendance_id,
        student_id,
        profiles (
          full_name
        )
      `)
      .eq("session_id", id);

    setStudents(data || []);
  };

  useEffect(() => {
    if (!id) return;

    fetchAttendance();

    const interval = setInterval(fetchAttendance, 2000);

    return () => clearInterval(interval);
  }, [id]);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#1e293b",
        color: "white",
        padding: "40px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <h1 style={{ marginBottom: "30px", fontSize: "28px" }}>
        Live Attendance Session
      </h1>

      {/* 🔥 Dynamic Timer */}
      <div
        style={{
          fontSize: "42px",
          fontWeight: "bold",
          marginBottom: "20px",
          padding: "12px 25px",
          borderRadius: "12px",
          background: "#0f172a",
          letterSpacing: "2px",
          boxShadow: "0 5px 15px rgba(0,0,0,0.4)",
          color: timeLeft === 0 ? "#ef4444" : "#38bdf8",
          transition: "0.3s ease",
        }}
      >
        {formatTime(timeLeft)}
      </div>

      {qrImage && (
        <div
          style={{
            background: "#0f172a",
            padding: "20px",
            borderRadius: "16px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.4)",
            marginBottom: "40px",
          }}
        >
          <img
            src={qrImage}
            alt="QR Code"
            width={250}
            style={{ display: "block", margin: "0 auto" }}
          />
        </div>
      )}

      <h2 style={{ marginBottom: "20px" }}>
        Students Attended ({students.length})
      </h2>

      <ul
        style={{
          listStyle: "none",
          padding: 0,
          width: "100%",
          maxWidth: "400px",
        }}
      >
        {students.map((s) => (
          <li
            key={s.attendance_id}
            style={{
              padding: "12px",
              marginBottom: "12px",
              background: "#334155",
              borderRadius: "10px",
              textAlign: "center",
            }}
          >
            {s.profiles?.full_name}
          </li>
        ))}
      </ul>
    </div>
  );
}