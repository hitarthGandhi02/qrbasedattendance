"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import "./signin.css"

export default function Signin() {
  const router = useRouter()

  const [role, setRole] = useState("student")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

const handleLogin = async (e) => {
  e.preventDefault();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    alert(error.message);
    return;
  }

  const userId = data.user.id;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (!profile?.role) {
    alert("Profile not found");
    return;
  }

  router.push(`/dashboard/${profile.role}`);
};



  return (
    <div className="form-container">
      <h2>Login</h2>

    

      <form onSubmit={handleLogin} className="login-form">
        <input
          type="email"
          placeholder="Email ID"
          required
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          required
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit">Login</button>
      </form>

      <p className="register-link">
        New student? <a href="/signup/student">Register here</a>
      </p>
    </div>
  )
}
