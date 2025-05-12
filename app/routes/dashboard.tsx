

import { useEffect, useState } from "react";
import { useNavigate, Link } from "@remix-run/react";
import { auth, db } from "~/utils/firebase";
import { signOut } from "firebase/auth";
import {
  collection,
  setDoc,
  getDocs,
  deleteDoc,
  doc,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import "~/styles/dashboard.css";

interface AccessCode {
  id: string;
  token: string;
  expiry_date: Timestamp;
  used: boolean;
}

interface User {
  id: string;
  user_id: number;
  username: string;
  expiry_date: Timestamp;
  archived?: boolean;
}

export default function Dashboard() {
  const [user, setUser] = useState(auth.currentUser);
  const navigate = useNavigate();

  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCodes, setLoadingCodes] = useState(true); 
  const [loadingUsers, setLoadingUsers] = useState(true); 

  const [showModal, setShowModal] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [groupByMonth, setGroupByMonth] = useState(true); // Changed from false to true
  
  // Format YYYY-MM-DD → "DD MON YYYY"
  const formatDate = (d: Date) => {
    const day = d.getDate().toString().padStart(2, "0");
    const month = d
      .toLocaleString("en-US", { month: "short" })
      .toUpperCase();
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };
  

  // Auth redirect + data fetch
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      if (!u) navigate("/login");
      setUser(u);
    });
    
    // Fetch data independently
    
    fetchCodes();
    fetchUsers();
      
    return () => unsub();
  }, [navigate]);

  // Load access codes
  async function fetchCodes() {
    setLoadingCodes(true);
    try {
      const snap = await getDocs(collection(db, "access_tokens"));
      const list = snap.docs.map((d) => ({
        id: d.id,
        token: d.data().token as string,
        expiry_date: d.data().expiry_date as Timestamp,
        used: d.data().used as boolean,
      }));
      setCodes(list);
    } catch (err) {
      console.error("Error fetching codes:", err);
      setCodes([]);
    } finally {
      setLoadingCodes(false);
    }
  }

  // Load users & filter out archived
  async function fetchUsers() {
    setLoadingUsers(true);
    try {
      const snap = await getDocs(collection(db, "users"));
      const list = snap.docs.map((d) => ({
        id: d.id,
        user_id: d.data().user_id as number,
        username: d.data().username as string || "Unknown",
        expiry_date: d.data().expiry_date as Timestamp,
        archived: d.data().archived as boolean || false,
      }));
      
      // Sort users by expiry date (ascending - earliest expiry first)
      const sortedUsers = list
        .filter((u) => !u.archived)
        .sort((a, b) => a.expiry_date.toMillis() - b.expiry_date.toMillis());
      
      setUsers(sortedUsers);
    } catch (err) {
      console.error("Error fetching users:", err);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }

  // Archive (soft-delete) a user
  async function archiveUser(docId: string) {
    if (!confirm("Remove this user from the channel?")) return;
    try {
      await updateDoc(doc(db, "users", docId), { archived: true });
      fetchUsers();
    } catch (err) {
      console.error("Error archiving user:", err);
      alert("Failed to remove user. See console.");
    }
  }

  // Open "generate code" modal
  function openModal() {
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    setGeneratedCode(code);
    setShowModal(true);
  }

  // Close modal
  function closeModal() {
    setShowModal(false);
    setGeneratedCode("");
    setExpiryDate("");
    setSuccessMessage("");
  }

  // Save new access code
  async function saveCode() {
    if (!expiryDate) {
      alert("Please select an expiry date.");
      return;
    }
    setIsSaving(true);
    try {
      await setDoc(doc(db, "access_tokens", generatedCode), {
        token: generatedCode,
        expiry_date: Timestamp.fromDate(new Date(expiryDate)),
        used: false,
      });
      setSuccessMessage("✅ Code saved!");
      fetchCodes();
      setTimeout(closeModal, 2000);
    } catch (err) {
      console.error("Error saving code:", err);
      alert("Failed to save code.");
    } finally {
      setIsSaving(false);
    }
  }

  // Delete an access code
  async function deleteExpiredCode(id: string) {
    try {
      await deleteDoc(doc(db, "access_tokens", id));
      fetchCodes();
    } catch (err) {
      console.error("Error deleting code:", err);
      alert("Failed to delete code.");
    }
  }

  // Update the loading state when both data fetching operations are complete
  useEffect(() => {
    setLoading(loadingCodes || loadingUsers);
  }, [loadingCodes, loadingUsers]);

  // Group users by month
  const getUsersByMonth = () => {
    const groupedUsers: Record<string, User[]> = {};
    
    users.forEach(user => {
      const date = user.expiry_date.toDate();
      const monthYear = `${date.toLocaleString('en-US', { month: 'long' })} ${date.getFullYear()}`;
      
      if (!groupedUsers[monthYear]) {
        groupedUsers[monthYear] = [];
      }
      
      groupedUsers[monthYear].push(user);
    });
    
    return groupedUsers;
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <h2>Admin Panel</h2>
        <Link to="/dashboard" className="nav-link">
          Dashboard
        </Link>
        <Link to="/all-users" className="nav-link">
          All Users
        </Link>
        <Link to="/archived" className="nav-link">
          Archived Users
        </Link>
        <button onClick={() => signOut(auth)}>Logout</button>
      </aside>

      <main className="main-content">
        <header className="top-nav">
          <h1>Welcome, {user?.email}</h1>
        </header>

        <section>
          <h2>Generate Access Code</h2>
          <button className="generate-btn" onClick={openModal}>
            Generate Code
          </button>
        </section>

        <section>
          <h1 className="mt-4"><strong>Access Codes {codes.length}</strong></h1>
          <div className="table-container">
            {loadingCodes ? (
              <p>Loading codes...</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Expiry</th>
                    <th>Status</th>
                    <th>Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {codes.length ? (
                    codes.map((c) => (
                      <tr key={c.id}>
                        <td>{c.token}</td>
                        <td>{formatDate(c.expiry_date.toDate())}</td>
                        <td>
                          <span
                            className={`status-badge ${
                              c.used ? "status-used" : "status-active"
                            }`}
                          >
                            {c.used ? "Used" : "Active"}
                          </span>
                        </td>
                        <td>
                          <button
                            className="delete-btn"
                            onClick={() => deleteExpiredCode(c.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="empty">
                        No codes available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section>
          <h1 className="mt-4"><strong>Active Users {users.length}</strong></h1>
          <div className="table-container">
            {loadingUsers ? (
              <p>Loading users...</p>
            ) : (
              <>
                {/* Option to toggle between list view and grouped view */}
                <div className="view-toggle">
                  <button 
                    className="toggle-btn"
                    onClick={() => setGroupByMonth(!groupByMonth)}
                  >
                    {groupByMonth ? "Show List View" : "Group by Month"}
                  </button>
                </div>
                
                {groupByMonth ? (
                  // Grouped by month view
                  Object.entries(getUsersByMonth()).map(([monthYear, monthUsers]) => (
                    <div key={monthYear} className="month-group">
                      <h3>{monthYear} ({monthUsers.length})</h3>
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
                          {monthUsers.map((u) => (
                            <tr key={u.id}>
                              <td>{u.username}</td>
                              <td>{u.user_id}</td>
                              <td>{formatDate(u.expiry_date.toDate())}</td>
                              <td>
                                <button
                                  className="delete-btn"
                                  onClick={() => archiveUser(u.id)}
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))
                ) : (
                  // Regular list view
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
                      {users.length ? (
                        users.map((u) => (
                          <tr key={u.id}>
                            <td>{u.username}</td>
                            <td>{u.user_id}</td>
                            <td>{formatDate(u.expiry_date.toDate())}</td>
                            <td>
                              <button
                                className="delete-btn"
                                onClick={() => archiveUser(u.id)}
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="empty">
                            No users available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </>
            )}
          </div>
        </section>
      </main>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Generated Code: {generatedCode}</h2>
            <input
              type="date"
              onChange={(e) => setExpiryDate(e.target.value)}
            />
            {successMessage && (
              <p className="success">{successMessage}</p>
            )}
            <div className="modal-buttons">
              <button onClick={saveCode} disabled={isSaving}>
                {isSaving ? "Saving…" : "Save"}
              </button>
              <button onClick={closeModal} disabled={isSaving}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
