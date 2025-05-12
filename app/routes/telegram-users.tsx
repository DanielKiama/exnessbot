"use client";
import { useEffect, useState } from "react";
import { useNavigate, Link } from "@remix-run/react";
import { auth } from "~/utils/firebase";
import axios from "axios";
import "~/styles/dashboard.css";

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  is_bot: boolean;
  status?: string;
}

export default function TelegramUsers() {
  const [user, setUser] = useState(auth.currentUser);
  const navigate = useNavigate();
  const [telegramUsers, setTelegramUsers] = useState<TelegramUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    auth.onAuthStateChanged((user) => {
      if (!user) navigate("/login");
      setUser(user);
    });
    fetchTelegramUsers();
  }, [navigate]);

  // Fetch users directly from Telegram API
  async function fetchTelegramUsers() {
    setLoading(true);
    setError(null);
    
    try {
      // Use the API route we've already created instead of direct API calls
      const response = await axios.get('/api/telegram-admins');
      
      if (response.data.admins) {
        // Transform the admin data to match our expected format
        const users = response.data.admins.map((admin: any) => ({
          id: admin.user.id,
          first_name: admin.user.first_name,
          last_name: admin.user.last_name,
          username: admin.user.username,
          is_bot: admin.user.is_bot,
          status: admin.status
        }));
        setTelegramUsers(users);
      } else if (response.data.error) {
        throw new Error(response.data.error);
      }
    } catch (error) {
      console.error("Error fetching Telegram users:", error);
      setError(error instanceof Error ? error.message : "Unknown error occurred");
      setTelegramUsers([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className="sidebar">
        <h2>Admin Panel</h2>
        <Link to="/dashboard" className="nav-link">Dashboard</Link>
        <Link to="/all-users" className="nav-link">All Users</Link>
        <Link to="/telegram-users" className="nav-link">Telegram Users</Link>
        <Link to="/archived" className="nav-link">Archived Users</Link>
        <button onClick={() => auth.signOut()}>Logout</button>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="top-nav">
          <h1>Telegram Channel Users</h1>
        </div>

        {/* Telegram Users Table */}
        <div className="user-table">
          <h2>Telegram Users</h2>
          {loading ? (
            <p>Loading Telegram users...</p>
          ) : error ? (
            <div className="error-message">
              <p>Error: {error}</p>
              <p>Note: To use this feature, you need to configure your Telegram Bot Token and Chat ID in environment variables.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Username</th>
                  <th>Name</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {telegramUsers.length > 0 ? (
                  telegramUsers.map((user) => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.username || "N/A"}</td>
                      <td>{`${user.first_name} ${user.last_name || ""}`}</td>
                      <td>{user.status || "Member"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: "10px" }}>No Telegram users available</td>
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