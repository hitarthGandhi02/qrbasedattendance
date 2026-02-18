"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import QRCode from "qrcode";

export default function LiveSession() {
  const { id } = useParams();
  const [qrImage, setQrImage] = useState("");
  const [students, setStudents] = useState([]);

  // 🔹 Fetch session + generate QR
  useEffect(() => {
    if (!id) return;

    const fetchSession = async () => {
      const { data: session } = await supabase
        .from("sessions")
        .select("session_code")
        .eq("session_id", id)
        .single();

      if (!session) return;

      const qrData = JSON.stringify({
        session_code: session.session_code,
      });

      const qrUrl = await QRCode.toDataURL(qrData);
      setQrImage(qrUrl);
    };

    fetchSession();
  }, [id]);

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

  // 🔥 POLLING (instead of realtime)
  useEffect(() => {
    if (!id) return;

    fetchAttendance(); // initial load

    const interval = setInterval(() => {
      fetchAttendance();
    }, 2000); // every 2 seconds

    return () => clearInterval(interval);
  }, [id]);

  return (
    <div style={{ textAlign: "center", padding: "40px" }}>
      <h1>Live Attendance Session</h1>

      {qrImage && (
        <div style={{ marginBottom: "40px" }}>
          <img src={qrImage} alt="QR Code" width={250} />
        </div>
      )}

      <h2>Students Attended</h2>

      <ul style={{ listStyle: "none", padding: 0 }}>
        {students.map((s) => (
          <li
            key={s.attendance_id}
            style={{
              padding: "10px",
              margin: "8px auto",
              width: "300px",
              background: "blue",
              borderRadius: "8px",
            }}
          >
            {s.profiles?.full_name}
          </li>
        ))}
      </ul>
    </div>
  );
}
