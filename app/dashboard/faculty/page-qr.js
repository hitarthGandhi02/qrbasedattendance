// "use client";

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import { supabase } from "@/lib/supabaseClient";
// import QRCode from "qrcode";
// import styles from "./facultyDashboard.module.css";

// export default function FacultyDashboardQR() {
//   const router = useRouter();

//   const [facultyName, setFacultyName] = useState("");
//   const [subject, setSubject] = useState("");
//   const [qrImage, setQrImage] = useState("");
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const checkUser = async () => {
//       const {
//         data: { user },
//       } = await supabase.auth.getUser();

//       if (!user) {
//         router.push("/signin");
//         return;
//       }

//       const { data: profile } = await supabase
//         .from("profiles")
//         .select("full_name, role")
//         .eq("id", user.id)
//         .single();

//       if (!profile || profile.role !== "faculty") {
//         router.push("/signin");
//         return;
//       }

//       setFacultyName(profile.full_name);
//       setLoading(false);
//     };

//     checkUser();
//   }, [router]);

//   const generateQR = async () => {
//     if (!subject) return alert("Enter subject");

//     const {
//       data: { user },
//     } = await supabase.auth.getUser();

//     const res = await fetch("/api/create-session", {
//       method: "POST",
//       body: JSON.stringify({
//         faculty_id: user.id,
//         subject,
//       }),
//     });

//     const result = await res.json();

//     if (result.error) {
//       alert(result.error);
//       return;
//     }

//     const qrData = JSON.stringify({
//       session_code: result.session.session_code,
//     });

//     const qrUrl = await QRCode.toDataURL(qrData);
//     setQrImage(qrUrl);
//   };

//   const handleLogout = async () => {
//     await supabase.auth.signOut();
//     router.push("/signin");
//   };

//   if (loading) return <p className={styles.loading}>Loading...</p>;

//   return (
//     <div className={styles.wrapper}>
//       <header className={styles.header}>
//         <h1>Faculty Dashboard (Quick QR)</h1>
//         <p>Welcome, {facultyName}</p>
//       </header>

//       <div className={styles.container}>
//         <div className={styles.card}>
//           <h2>Create QR Session</h2>

//           <input
//             className={styles.input}
//             placeholder="Enter Subject"
//             value={subject}
//             onChange={(e) => setSubject(e.target.value)}
//           />

//           <button className={styles.btn} onClick={generateQR}>
//             Generate QR
//           </button>

//           {qrImage && (
//             <div className={styles.qrContainer}>
//               <img src={qrImage} alt="QR Code" width="250" />
//               <p>Valid for 10 minutes</p>
//             </div>
//           )}
//         </div>

//         <button className={styles.logoutBtn} onClick={handleLogout}>
//           Logout
//         </button>
//       </div>
//     </div>
//   );
// }
