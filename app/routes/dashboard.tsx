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
  getDoc,
} from "firebase/firestore";
import { removeAndArchiveUser } from "~/utils/telegram";
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
  const [groupByMonth, setGroupByMonth] = useState(true);

  // Broadcast state
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [targetGroup, setTargetGroup] = useState("active");
  const [isSending, setIsSending] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState("");

  // Helper to format dates
  const formatDate = (d: Date) => {
    const day = d.getDate().toString().padStart(2, "0");
    const month = d
      .toLocaleString("en-US", { month: "short" })
      .toUpperCase();
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

  // Auth redirect + initial data fetch
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      if (!u) navigate("/login");
      setUser(u);
    });
    fetchCodes();
    fetchUsers();
    return () => unsub();
  }, [navigate]);

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
    } catch {
      setCodes([]);
    } finally {
      setLoadingCodes(false);
    }
  }

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
      const sorted = list
        .filter((u) => !u.archived)
        .sort((a, b) => a.expiry_date.toMillis() - b.expiry_date.toMillis());
      setUsers(sorted);
    } catch {
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }

  async function archiveUser(docId: string) {
    if (!confirm("Remove this user from the channel?")) return;
    try {
      const userRef = doc(db, "users", docId);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();
      if (userData) {
        try {
          const resp = await fetch("http://localhost:5000/api/remove-user", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-API-Secret": process.env.API_SECRET || "your-secret-key",
            },
            body: JSON.stringify({ user_id: userData.user_id.toString() }),
          });
          const result = await resp.json();
          if (!result.success) throw new Error(result.error);
        } catch {
          if (!confirm("Failed to remove from Telegram. Continue?")) return;
        }
        await updateDoc(userRef, {
          archived: true,
          archivedAt: new Date().toISOString(),
        });
        fetchUsers();
      }
    } catch {
      alert("Failed to remove user. See console.");
    }
  }

  function openModal() {
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    setGeneratedCode(code);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setGeneratedCode("");
    setExpiryDate("");
    setSuccessMessage("");
  }

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
    } catch {
      alert("Failed to save code.");
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteExpiredCode(id: string) {
    try {
      await deleteDoc(doc(db, "access_tokens", id));
      fetchCodes();
    } catch {
      alert("Failed to delete code.");
    }
  }

  // Add this function before the sendBroadcast function
  function getUsersByMonth() {
    const monthGroups: Record<string, User[]> = {};
    
    users.forEach((user) => {
      const date = user.expiry_date.toDate();
      const monthYear = `${date.toLocaleString('en-US', { month: 'long' })} ${date.getFullYear()}`;
      
      if (!monthGroups[monthYear]) {
        monthGroups[monthYear] = [];
      }
      
      monthGroups[monthYear].push(user);
    });
    
    return monthGroups;
  }

  // Add this function inside the Dashboard component, before the return statement
  async function sendBroadcast() {
    if (!broadcastMessage.trim()) {
      alert("Please enter a message to broadcast.");
      return;
    }
    
    setIsSending(true);
    setBroadcastResult("");
    
    try {
      console.log("Sending broadcast to:", targetGroup);
      
      // Fix the URL to use port 5000 instead of 5173
      const response = await fetch('http://localhost:5000/api/broadcast-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Secret': 'your-secret-key'  // Using the default value from bot.py
        },
        body: JSON.stringify({
          message: broadcastMessage,
          target_group: targetGroup
        })
      });
      
      console.log("Response status:", response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("Response data:", result);
      
      if (result.success) {
        setBroadcastResult(`✅ Message sent successfully to ${result.sent_count} users!`);
        setBroadcastMessage("");
      } else {
        setBroadcastResult(`❌ Error: ${result.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Error sending broadcast:", err);
      setBroadcastResult(`❌ Failed to send broadcast: ${err.message}. Make sure the bot is running.`);
    } finally {
      setIsSending(false);
    }
  }
  
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
          <h1 className="mt-4">
            <strong>Access Codes {codes.length}</strong>
          </h1>
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
          <h1 className="mt-4">
            <strong>Active Users {users.length}</strong>
          </h1>
          <div className="table-container">
            {loadingUsers ? (
              <p>Loading users...</p>
            ) : (
              <>
                <div className="view-toggle">
                  <button
                    className="toggle-btn"
                    onClick={() => setGroupByMonth(!groupByMonth)}
                  >
                    {groupByMonth ? "Show List View" : "Group by Month"}
                  </button>
                </div>

                {groupByMonth ? (
                  Object.entries(getUsersByMonth()).map(
                    ([monthYear, monthUsers]) => (
                      <div key={monthYear} className="month-group">
                        <h3>
                          {monthYear} ({monthUsers.length})
                        </h3>
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
                    )
                  )
                ) : (
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

        <section>
          <h1 className="mt-4">
            <strong>Broadcast Message</strong>
          </h1>
          <div className="broadcast-container">
            <div className="form-group">
              <label>Target Users:</label>
              <select
                value={targetGroup}
                onChange={(e) => setTargetGroup(e.target.value)}
                className="select-input"
              >
                <option value="active">Active Users</option>
                <option value="archived">Archived Users</option>
                <option value="all">All Users</option>
              </select>
            </div>

            <div className="form-group">
              <label>Message:</label>
              <textarea
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="Enter your message here..."
                rows={5}
                className="textarea-input"
              />
            </div>

            <button
              onClick={sendBroadcast}
              disabled={isSending || !broadcastMessage.trim()}
              className="broadcast-btn"
            >
              {isSending ? "Sending..." : "Send Broadcast"}
            </button>

            {broadcastResult && (
              <div
                className={`broadcast-result ${
                  broadcastResult.includes("✅") ? "success" : "error"
                }`}
              >
                {broadcastResult}
              </div>
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
            {successMessage && <p className="success">{successMessage}</p>}
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
