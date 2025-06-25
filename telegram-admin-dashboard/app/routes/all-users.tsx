"use client";
import { useEffect, useState } from "react";
import { useNavigate, Link } from "@remix-run/react";
import { auth, db } from "~/utils/firebase";
import { collection, getDocs, Timestamp } from "firebase/firestore";
import axios from "axios";
import "~/styles/dashboard.css";

interface User {
  id: string;
  user_id: string;
  username: string;
  expiry_date: Timestamp;
  archived?: boolean;
}

interface TelegramAdmin {
  user: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    is_bot: boolean;
  };
  status: string;
}

export default function AllUsers() {
  const [user, setUser] = useState(auth.currentUser);
  const navigate = useNavigate();
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [telegramAdmins, setTelegramAdmins] = useState<TelegramAdmin[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Date formatter function
  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };
  
  useEffect(() => {
    auth.onAuthStateChanged((user) => {
      if (!user) navigate("/login");
      setUser(user);
    });
    
    // Fetch both database users and Telegram admins separately
    fetchAllUsers();
    fetchTelegramAdmins();
  }, [navigate]);

  // Fetch all users from Firestore
  async function fetchAllUsers() {
    setLoadingUsers(true);
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const usersList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        user_id: doc.data().user_id,
        username: doc.data().username || "Unknown",
        expiry_date: doc.data().expiry_date,
        archived: doc.data().archived || false,
      }));
      setAllUsers(usersList);
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Failed to load users. Please try again.");
    } finally {
      setLoadingUsers(false);
    }
  }
  
  // Fetch Telegram channel admins
  async function fetchTelegramAdmins() {
    setLoadingAdmins(true);
    try {
      const response = await axios.get('/api/telegram-admins');
      if (response.data.admins) {
        setTelegramAdmins(response.data.admins);
      } else if (response.data.error) {
        setError(response.data.error);
      }
    } catch (error) {
      console.error("Error fetching Telegram admins:", error);
      setError(error instanceof Error ? error.message : "Unknown error occurred");
    } finally {
      setLoadingAdmins(false);
    }
  }

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className="sidebar">
        <h2>Admin Panel</h2>
        <Link to="/dashboard" className="nav-link">Dashboard</Link>
        <Link to="/all-users" className="nav-link">All Users</Link>
        <Link to="/archived" className="nav-link">Archived Users</Link>
        <Link to="/telegram-links" className="nav-link active">Telegram Links</Link>
        <button onClick={() => auth.signOut()}>Logout</button>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="top-nav">
          <h1>Telegram Channel Users</h1>
        </div>

        {/* Telegram API Limitations Notice */}
        <div className="info-box">
          <h3>About Telegram Channel Members</h3>
          <p>Your channel has 68 members, but due to Telegram API limitations, bots cannot retrieve a full list of channel members.</p>
          <p>Only channel administrators can be fetched through the Bot API.</p>
        </div>

        {/* Telegram Admins Table */}
        <div className="user-table">
          <h2>Telegram Channel Administrators</h2>
          {loadingAdmins ? (
            <p>Loading admins...</p>
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
                {telegramAdmins.length > 0 ? (
                  telegramAdmins.map((admin) => (
                    <tr key={admin.user.id}>
                      <td>{admin.user.id}</td>
                      <td>{admin.user.username || "N/A"}</td>
                      <td>{`${admin.user.first_name} ${admin.user.last_name || ""}`}</td>
                      <td>{admin.status}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: "10px" }}>No admin data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Database Users Table */}
        <div className="user-table">
          <h2>Database Users ({allUsers.length})</h2>
          {loadingUsers ? (
            <div>
              <p>Loading users...</p>
              <p className="loading-hint">If this takes too long, there might be an issue with the database connection.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>User ID</th>
                  <th>Expiry Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {allUsers.length > 0 ? (
                  allUsers.map((user) => (
                    <tr key={user.id}>
                      <td>{user.username}</td>
                      <td>{user.user_id}</td>
                      <td>{formatDate(user.expiry_date.toDate())}</td>
                      <td>
                        <span className={`status-badge ${user.archived ? "status-used" : "status-active"}`}>
                          {user.archived ? "Archived" : "Active"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: "10px" }}>No users available</td>
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