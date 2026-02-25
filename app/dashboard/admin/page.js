"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import styles from "./adminDashboard.module.css";

export default function AdminDashboard() {
  const router = useRouter();

  const [adminName, setAdminName] = useState("");
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [fullName, setFullName] = useState("");

  const [lectures, setLectures] = useState([]);

  // =========================
  // AUTH CHECK
  // =========================
  useEffect(() => {
    const checkAdmin = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/signin");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .single();

      if (!profile || profile.role !== "admin") {
        router.push("/signin");
        return;
      }

      setAdminName(profile.full_name);
    //   fetchLectures();
      setLoading(false);
    };

    checkAdmin();
  }, []);

  // =========================
  // CREATE ACCOUNT
  // =========================
  const handleCreateAccount = async () => {
    if (!email || !password || !fullName) {
      alert("All fields required");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    await supabase.from("profiles").insert({
      id: data.user.id,
      full_name: fullName,
      role: role,
    });

    alert("Account Created Successfully");

    setEmail("");
    setPassword("");
    setFullName("");
  };

  // =========================
  // FETCH ALL LECTURES
  // =========================
  const fetchLectures = async () => {
    const { data } = await supabase
      .from("sessions")
      .select(`
        session_id,
        created_at,
        class_id (class_name),
        subject_id (subject_name),
        faculty_id (full_name)
      `)
      .order("created_at", { ascending: false });

    setLectures(data || []);
  };

  // =========================
  // DELETE LECTURE
  // =========================
  const deleteLecture = async (id) => {
    await supabase.from("sessions").delete().eq("session_id", id);
    fetchLectures();
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
          <h1 className={styles.pageTitle}>Admin Dashboard</h1>
          <p className={styles.welcomeText}>
            Welcome, {adminName}
          </p>
        </div>

        <button
          className={styles.logoutBtn}
          onClick={handleLogout}
        >
          Logout
        </button>
      </header>

      <div className={styles.container}>
        {/* CREATE ACCOUNT CARD */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>
            👤 Create New Account
          </h2>

          <input
            className={styles.input}
            placeholder="Full Name"
            value={fullName}
            onChange={(e) =>
              setFullName(e.target.value)
            }
          />

          <input
            className={styles.input}
            placeholder="Email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
          />

          <input
            type="password"
            className={styles.input}
            placeholder="Password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
          />

          <select
            className={styles.input}
            value={role}
            onChange={(e) =>
              setRole(e.target.value)
            }
          >
            <option value="student">
              Student
            </option>
            <option value="faculty">
              Faculty
            </option>
            <option value="admin">
              Admin
            </option>
          </select>

          <button
            className={styles.btn}
            onClick={handleCreateAccount}
          >
            Create Account
          </button>
        </div>

        {/* LECTURE MANAGEMENT */}
        <div className={`${styles.card} ${styles.fullWidth}`}>
          <h2 className={styles.cardTitle}>
            📚 Manage All Lectures
          </h2>

          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.tableHeader}>
                  Class
                </th>
                <th className={styles.tableHeader}>
                  Subject
                </th>
                <th className={styles.tableHeader}>
                  Faculty
                </th>
                <th className={styles.tableHeader}>
                  Created At
                </th>
                <th className={styles.tableHeader}>
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {lectures.map((lec) => (
                <tr
                  key={lec.session_id}
                  className={styles.tableRow}
                >
                  <td className={styles.tableCell}>
                    {lec.class_id?.class_name}
                  </td>
                  <td className={styles.tableCell}>
                    {lec.subject_id?.subject_name}
                  </td>
                  <td className={styles.tableCell}>
                    {lec.faculty_id?.full_name ||
                      "N/A"}
                  </td>
                  <td className={styles.tableCell}>
                    {new Date(
                      lec.created_at
                    ).toLocaleString()}
                  </td>
                  <td className={styles.tableCell}>
                    <button
                      className={styles.btn}
                      style={{
                        background:
                          "linear-gradient(135deg,#dc2626,#b91c1c)",
                      }}
                      onClick={() =>
                        deleteLecture(
                          lec.session_id
                        )
                      }
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}

              {lectures.length === 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className={styles.tableCell}
                  >
                    No lectures found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}