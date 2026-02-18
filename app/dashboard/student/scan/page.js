"use client";

import { useState, useEffect } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { supabase } from "@/lib/supabaseClient";

export default function ScanQR() {
  const [scanning, setScanning] = useState(true);
  const [user, setUser] = useState(null);

  // ✅ Fetch user after component mounts
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("You must be logged in.");
        return;
      }

      setUser(user);
    };

    getUser();
  }, []);

  const handleScan = async (result) => {
    if (!result || !scanning || !user) return;

    setScanning(false);

    try {
      const parsed = JSON.parse(result[0].rawValue);

      if (!parsed?.session_code) {
        throw new Error("Invalid QR format");
      }

      const response = await fetch("/api/mark-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_code: parsed.session_code.trim(),
          student_id: user.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      alert("Attendance Marked Successfully!");
    } catch (err) {
      console.error(err);
      alert(err.message || "Invalid QR Code");
      setScanning(true);
    }
  };

  return (
    <div>
      <h2>Scan QR Code</h2>

      {scanning && (
        <Scanner
          onScan={handleScan}
          constraints={{ facingMode: "environment" }}
          styles={{ container: { width: "100%" } }}
        />
      )}
    </div>
  );
}
