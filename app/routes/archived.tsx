"use client";
import { useEffect, useState } from "react";
import { useNavigate, Link } from "@remix-run/react";
import { auth, db } from "~/utils/firebase";
import { collection, getDocs, doc, Timestamp, query, where, deleteDoc } from "firebase/firestore";
import "~/styles/dashboard.css"; // Import CSS

interface User {
  id: string;
  user_id: string;
  username: string;
  expiry_date: Timestamp;
  archived: boolean;
}

export default function ArchivedUsers() {
  const [user, setUser] = useState(auth.currentUser);
  const navigate = useNavigate();
  const [archivedUsers, setArchivedUsers] = useState<User[]>([]);

  // Add a custom date formatter function
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
    fetchArchivedUsers();
  }, [navigate]);

  // Fetch archived users from Firestore
  async function fetchArchivedUsers() {
    const q = query(collection(db, "users"), where("archived", "==", true));
    const querySnapshot = await getDocs(q);
    const usersList = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      user_id: doc.data().user_id,
      username: doc.data().username || "Unknown",
      expiry_date: doc.data().expiry_date,
      archived: doc.data().archived,
    }));
    setArchivedUsers(usersList);
  }

  // Permanently delete a user
  async function deleteUser(userId: string) {
    if (confirm("Are you sure you want to permanently delete this user?")) {
      try {
        await deleteDoc(doc(db, "users", userId));
        // Refresh the users list
        fetchArchivedUsers();
      } catch (error) {
        console.error("Error deleting user:", error);
        alert("Failed to delete user. Please try again.");
      }
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
        <button onClick={() => auth.signOut()}>Logout</button>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="top-nav">
          <h1>Archived Users</h1>
        </div>

        {/* Archived Users Table */}
        <div className="user-table">
          <h2>Archived Users</h2>
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>User ID</th>
                <th>Expiry Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {archivedUsers.length > 0 ? (
                archivedUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.username}</td>
                    <td>{user.user_id}</td>
                    <td>{formatDate(user.expiry_date.toDate())}</td>
                    <td>
                      <button 
                        className="delete-btn" 
                        onClick={() => deleteUser(user.id)}
                      >
                        Delete Permanently
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: "10px" }}>No archived users available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}