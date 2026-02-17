"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useState, useEffect } from "react";
import styles from "./parent.module.css";

export default function ParentDashboard() {
     useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/signin");
      }
    };
    checkUser();
  }, []);
  const router = useRouter();
  const [ackMessage, setAckMessage] = useState("");

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/signin");
      }
    };
    checkUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/signin");
  };

  const ackLeave = () => {
    setAckMessage("✅ Leave request acknowledged successfully.");
  };

  return (
    <div className={styles.body}>
      <header className={styles.header}>
        <div>
          <h1>Parent Dashboard</h1>
          <p>Welcome, Mrs. Smith (Parent of John Doe - 22CS001)</p>
        </div>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          Logout
        </button>
      </header>

      <div className={styles.container}>
        <div className={styles.card}>
          <h2 className={styles.heading}>📊 Attendance Overview</h2>
          <p>Child: <strong>John Doe</strong></p>
          <p>Overall Attendance: <strong>78%</strong></p>
          <p>Subjects Below 75%: <strong>AI (68%)</strong></p>
          <p className={styles.alert}>
            ⚠️ Alert: Attendance below threshold!
          </p>
        </div>

        <div className={styles.card}>
          <h2 className={styles.heading}>📅 Monthly Report (October)</h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Subject</th>
                <th>Classes Attended</th>
                <th>Total Classes</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>DBMS</td>
                <td>8</td>
                <td>10</td>
                <td>80%</td>
              </tr>
              <tr>
                <td>AI</td>
                <td>7</td>
                <td>10</td>
                <td>70%</td>
              </tr>
              <tr>
                <td>OS</td>
                <td>9</td>
                <td>10</td>
                <td>90%</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className={styles.card}>
          <h2 className={styles.heading}>📝 Leave Requests</h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Subject</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>12 Oct</td>
                <td>DBMS</td>
                <td>Pending</td>
                <td>
                  <button className={styles.btn} onClick={ackLeave}>
                    Acknowledge
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          {ackMessage && (
            <p className={styles.success}>{ackMessage}</p>
          )}
        </div>
      </div>
    </div>
  );
}
