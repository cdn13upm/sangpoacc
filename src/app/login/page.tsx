"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      window.location.href = "/dashboard";
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#f9fafb"
    }}>
      <div style={{
        backgroundColor: "white",
        padding: "2rem",
        borderRadius: "0.5rem",
        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
        width: "100%",
        maxWidth: "28rem"
      }}>
        <h1 style={{
          fontSize: "1.5rem",
          fontWeight: "bold",
          marginBottom: "1.5rem",
          textAlign: "center"
        }}>
          Sangpo Account Tracking
        </h1>
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#374151" }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                marginTop: "0.25rem",
                display: "block",
                width: "100%",
                borderRadius: "0.375rem",
                border: "1px solid #d1d5db",
                padding: "0.5rem 0.75rem"
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#374151" }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                marginTop: "0.25rem",
                display: "block",
                width: "100%",
                borderRadius: "0.375rem",
                border: "1px solid #d1d5db",
                padding: "0.5rem 0.75rem"
              }}
            />
          </div>
          {error && <p style={{ color: "#ef4444", fontSize: "0.875rem" }}>{error}</p>}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              backgroundColor: "#2563eb",
              color: "white",
              padding: "0.5rem 1rem",
              borderRadius: "0.375rem",
              border: "none",
              cursor: "pointer",
              opacity: loading ? 0.5 : 1
            }}
          >
            {loading ? "Loading..." : "Login"}
          </button>
          <p style={{ textAlign: "center", marginTop: "1rem" }}>
            <a href="/register" style={{ color: "#2563eb", textDecoration: "none" }}>
              Register User
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
