"use client";
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "~/utils/firebase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = "/dashboard";
    } catch (err) {
      setError("Invalid credentials. Please try again.");
    }
  };

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      width: "100%",
      backgroundColor: "#F3F4F6",
    }}>
      {/* Left Side - Form */}
      <div style={{
        flex: "1",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "white",
        padding: "40px",
        borderRadius: "10px",
        boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
        maxWidth: "400px",
        margin: "auto"
      }}>
        <h2 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "20px" }}>Welcome Back</h2>
        <p style={{ color: "#6B7280", marginBottom: "20px" }}>Sign in to your account</p>

        {error && <p style={{ color: "red", marginBottom: "10px" }}>{error}</p>}

        <form onSubmit={handleSubmit} style={{ width: "100%" }}>
          <input
            type="email"
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "15px",
              border: "1px solid #D1D5DB",
              borderRadius: "5px",
              fontSize: "16px"
            }}
          />
          <input
            type="password"
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "20px",
              border: "1px solid #D1D5DB",
              borderRadius: "5px",
              fontSize: "16px"
            }}
          />
          <button type="submit"
            style={{
              width: "100%",
              padding: "12px",
              backgroundColor: "#2563EB",
              color: "white",
              fontSize: "16px",
              fontWeight: "bold",
              borderRadius: "5px",
              border: "none",
              cursor: "pointer"
            }}>
            Login
          </button>
        </form>

       
      </div>

      {/* Right Side - Image & Branding */}
      <div style={{
        flex: "1",
        backgroundColor: "#1E293B",
        color: "white",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        padding: "40px"
      }}>
        <h1 style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "20px" }}>
          Secure Access to Your Dashboard
        </h1>
        <p style={{ fontSize: "16px", color: "#CBD5E1" }}>
          Manage your users, generate access codes, and send messages with ease.
        </p>
      </div>
    </div>
  );
}
