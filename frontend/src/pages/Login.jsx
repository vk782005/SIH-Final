import { useState } from "react";
import LoginGlobe from "../components/LoginGlobe";
import "./Login.css";

function Login({ onLogin }) {
    // Student is selected by default
    const [role, setRole] = useState("student");

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!role) return;

        onLogin(role);
    };

    return (
        <div className="login-page">

            {/* =================================================
                LEFT — GLOBE
               ================================================= */}

            <section className="login-globe-section">

                <LoginGlobe />

                <div className="globe-brand">
                    <div className="globe-brand-title">
                        OCEAN-X
                    </div>

                    <div className="globe-brand-subtitle">
                        OCEAN DATA VISUALIZATION PLATFORM
                    </div>
                </div>

                <div className="globe-status">
                    <span className="status-dot"></span>
                    LIVE OCEAN ENVIRONMENT
                </div>

            </section>


            {/* =================================================
                RIGHT — LOGIN
               ================================================= */}

            <section className="login-panel-section">

                <div className="login-panel">

                    {/* ===============================
                        WELCOME
                       =============================== */}

                    <div className="login-heading">

                        <h2>
                            Welcome to Ocean-X
                        </h2>

                        <p>
                            Select your account type to continue.
                        </p>

                    </div>


                    {/* ===============================
                        ACCESS LEVEL
                       =============================== */}

                    <div className="role-section">

                        <div className="section-label">
                            SELECT ACCESS LEVEL
                        </div>


                        {/* STUDENT */}

                        <button
                            type="button"
                            className={`role-card ${
                                role === "student" ? "selected" : ""
                            }`}
                            onClick={() => setRole("student")}
                        >

                            <div className="role-icon">
                                🎓
                            </div>

                            <div className="role-content">

                                <strong>
                                    Student
                                </strong>

                                <span>
                                    Explore and analyze ocean data
                                </span>

                                <small>
                                    RESEARCH ACCESS
                                </small>

                            </div>

                            <div className="role-arrow">
                                →
                            </div>

                        </button>


                        {/* ADMINISTRATOR */}

                        <button
                            type="button"
                            className={`role-card ${
                                role === "admin" ? "selected" : ""
                            }`}
                            onClick={() => setRole("admin")}
                        >

                            <div className="role-icon">
                                ⚙
                            </div>

                            <div className="role-content">

                                <strong>
                                    Administrator
                                </strong>

                                <span>
                                    Manage datasets and platform
                                </span>

                                <small>
                                    SYSTEM ACCESS
                                </small>

                            </div>

                            <div className="role-arrow">
                                →
                            </div>

                        </button>

                    </div>


                    {/* ===============================
                        LOGIN FORM
                       =============================== */}

                    {role && (
                        <form
                            className="login-form"
                            onSubmit={handleSubmit}
                        >

                            <div className="form-header">

                                {role === "student"
                                    ? "STUDENT ACCESS"
                                    : "ADMINISTRATOR ACCESS"}

                            </div>


                            {/* ID */}

                            <div className="input-group">

                                <label>
                                    {role === "student"
                                        ? "Student ID"
                                        : "Administrator ID"}
                                </label>

                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) =>
                                        setUsername(e.target.value)
                                    }
                                    placeholder="Enter your ID"
                                    required
                                />

                            </div>


                            {/* PASSWORD */}

                            <div className="input-group">

                                <label>
                                    Password
                                </label>

                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    placeholder="Enter your password"
                                    required
                                />

                            </div>


                            {/* CONTINUE */}

                            <button
                                type="submit"
                                className="login-button"
                            >
                                Continue
                                <span>→</span>
                            </button>

                        </form>
                    )}


                    {/* ===============================
                        SYSTEM INFO
                       =============================== */}

                    <div className="system-info">

                        <div className="system-info-item">

                            <span className="info-value">
                                GLOBAL
                            </span>

                            <span className="info-label">
                                DATA COVERAGE
                            </span>

                        </div>


                        <div className="system-info-item">

                            <span className="info-value">
                                3D
                            </span>

                            <span className="info-label">
                                VISUALIZATION
                            </span>

                        </div>


                        <div className="system-info-item">

                            <span className="info-value">
                                LIVE
                            </span>

                            <span className="info-label">
                                DATA ACCESS
                            </span>

                        </div>

                    </div>


                    {/* ===============================
                        FOOTER
                       =============================== */}

                    <div className="login-footer">

                        <span>
                            SMART INDIA HACKATHON 2026
                        </span>

                        <span>
                            OCEAN-X v0.1
                        </span>

                    </div>

                </div>

            </section>

        </div>
    );
}

export default Login;