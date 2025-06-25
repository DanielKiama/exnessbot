import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "~/utils/firebase";
import { Link } from "@remix-run/react";
import "~/styles/dashboard.css";

export default function ArchivedUsers() {
  const [archivedUsers, setArchivedUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArchivedUsers();
  }, []);

  async function fetchArchivedUsers() {
    setLoading(true);
    try {
      const q = query(
        collection(db, "users"),
        where("archived", "==", true)
      );
      
      const querySnapshot = await getDocs(q);
      const users = [];
      
      querySnapshot.forEach((doc) => {
        users.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setArchivedUsers(users);
    } catch (error) {
      console.error("Error fetching archived users:", error);
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

      <main className="main-content">
        <header className="top-nav">
          <h1>Archived Users</h1>
        </header>
        
        {loading ? (
          <p>Loading archived users...</p>
        ) : archivedUsers.length === 0 ? (
          <p>No archived users found.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>User ID</th>
                  <th>Expiry Date</th>
                  <th>Archived At</th>
                </tr>
              </thead>
              <tbody>
                {archivedUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.username || 'N/A'}</td>
                    <td>{user.user_id}</td>
                    <td>{user.expiry_date?.toDate ? new Date(user.expiry_date.toDate()).toLocaleDateString() : 'Unknown'}</td>
                    <td>
                      {user.archivedAt ? new Date(user.archivedAt).toLocaleString() : 'Unknown'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}