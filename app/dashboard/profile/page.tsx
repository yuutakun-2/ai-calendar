"use client";

import axios from "axios";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProfileSettingsPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    axios
      .get("/api/user/me")
      .then((res) => {
        if (!isMounted) return;
        setEmail(res.data?.email ?? "");
        setLoading(false);
      })
      .catch(() => {
        if (isMounted) router.replace("/login");
      });

    return () => {
      isMounted = false;
    };
  }, [router]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.25 }}
        className="glass"
        style={{
          width: "100%",
          maxWidth: "420px",
          padding: "40px 36px",
          borderRadius: "16px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "88px",
            height: "88px",
            borderRadius: "50%",
            background: "rgba(128,128,128,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "3rem",
            margin: "0 auto 20px",
          }}
        >
          👤
        </div>

        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: 700,
            marginBottom: "24px",
          }}
        >
          Profile Settings
        </h1>

        <label
          className="field-label"
          style={{ display: "block", textAlign: "left", marginBottom: "6px" }}
        >
          Email
        </label>
        <input
          type="email"
          className="input-field"
          value={email}
          readOnly
          aria-label="Email"
        />

        <button
          type="button"
          className="btn-primary"
          onClick={() => router.push("/dashboard")}
          style={{ width: "100%", marginTop: "24px" }}
        >
          Back to Dashboard
        </button>
      </motion.div>
    </div>
  );
}