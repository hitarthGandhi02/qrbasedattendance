"use client";

import { Scanner } from "@yudiel/react-qr-scanner";
import { supabase } from "@/lib/supabaseClient";

export default function ScanQR() {

  const handleScan = async (result) => {
    if (!result) return;

    try {
      const parsed = JSON.parse(result[0].rawValue);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      await fetch("/api/mark-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_code: parsed.session_code,
          student_id: user?.id,
        }),
      });
      await navigator.mediaDevices.getUserMedia({ video: true });


      alert("Attendance Marked!");
    } catch (err) {
      console.error(err);
      alert("Invalid QR Code");
    }
  };

  return (
    <div>
      <h2>Scan QR Code</h2>

      <Scanner
        onScan={handleScan}
        onError={(err) => console.log(err)}
        constraints={{ facingMode: "environment" }}
        styles={{ container: { width: "100%" } }}
      />
    </div>
  );
}
