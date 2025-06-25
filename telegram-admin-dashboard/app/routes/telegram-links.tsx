"use client";
import { useEffect, useState } from "react";
import { useNavigate, Link } from "@remix-run/react";
import { auth, db } from "~/utils/firebase";
import { collection, getDocs } from "firebase/firestore";
import "~/styles/dashboard.css";

interface User {
  id: string;
  user_id: string;
  username: string;
  invite_link?: string;
  access_code?: string;
}

export default function TelegramLinks() {
  const [user, setUser] = useState(auth.currentUser);
  const navigate = useNavigate();
  const [links, setLinks] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    auth.onAuthStateChanged((user) => {
      if (!user) navigate("/login");
      setUser(user);
    });
    fetchLinks();
  }, [navigate]);

  async function fetchLinks() {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const usersList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        user_id: doc.data().user_id,
        username: doc.data().username || "Unknown",
        invite_link: doc.data().invite_link || "",
        access_code: doc.data().access_code || "",
      }));
      setLinks(usersList.filter(u => u.invite_link));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="dashboard-container">
      <div className="sidebar">
        <h2>Admin Panel</h2>
        <Link to="/dashboard" className="nav-link">Dashboard</Link>
        <Link to="/all-users" className="nav-link">All Users</Link>
        <Link to="/archived" className="nav-link">Archived Users</Link>
        <Link to="/telegram-links" className="nav-link active">Telegram Links</Link>
        <button onClick={() => auth.signOut()}>Logout</button>
      </div>
      <div className="main-content">
        <div className="top-nav">
          <h1>Telegram Invite Links</h1>
        </div>
        <div className="user-table">
          <h2>All Invite Links</h2>
          {loading ? (
            <p>Loading links...</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Invite Link</th>
                  <th>Access Code</th>
                  <th>User</th>
                </tr>
              </thead>
              <tbody>
                {links.length > 0 ? (
                  links.map((u) => (
                    <tr key={u.id}>
                      <td><a href={u.invite_link} target="_blank" rel="noopener noreferrer">{u.invite_link}</a></td>
                      <td>{u.access_code || "N/A"}</td>
                      <td>{u.username}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} style={{ textAlign: "center", padding: "10px" }}>No links available</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}