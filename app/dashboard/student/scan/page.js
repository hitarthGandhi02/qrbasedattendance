"use client";

import { Html5QrcodeScanner } from "html5-qrcode";
import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ScanQR() {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: 250 },
      false
    );

    scanner.render(async (decodedText) => {
      const parsed = JSON.parse(decodedText);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      await fetch("/api/mark-attendance", {
        method: "POST",
        body: JSON.stringify({
          session_code: parsed.session_code,
          student_id: user.id,
        }),
      });

      alert("Attendance Marked!");
      scanner.clear();
    });
  }, []);

  return (
    <div>
      <h2>Scan QR Code</h2>
      <div id="reader" />
    </div>
  );
}
