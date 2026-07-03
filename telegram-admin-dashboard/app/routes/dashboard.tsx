import { useEffect, useState } from "react";
import { useNavigate, Link } from "@remix-run/react";
import { auth, db } from "~/utils/firebase";
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
  used_by_id?: number | null;
  used_by_username?: string | null;
}

interface User {
  id: string;
  user_id: number;
  username: string;
  expiry_date: Timestamp;
  archived?: boolean;
  access_code?: string;
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
  const [expiryTime, setExpiryTime] = useState("23:59"); // Add new state for time
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [groupByMonth, setGroupByMonth] = useState(true);
  const [showAccessCodes, setShowAccessCodes] = useState(true);

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
        used_by_id: d.data().used_by_id as number | null ?? null,
        used_by_username: d.data().used_by_username as string | null ?? null,
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
        username: (d.data().username as string) || "",
        expiry_date: d.data().expiry_date as Timestamp,
        archived: (d.data().archived as boolean) || false,
        access_code: (d.data().access_code as string) || "",
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

  // Expire a user by setting their expiry_date to 1 minute from now so the
  // bot's next hourly check will remove them automatically from the channel.
  async function expireUserByTelegramId(telegramId: number, docId: string) {
    const oneMinuteFromNow = new Date(Date.now() + 60 * 1000);
    const userRef = doc(db, "users", docId);
    await updateDoc(userRef, {
      expiry_date: Timestamp.fromDate(oneMinuteFromNow),
      archiveReason: "admin_manual",
    });
  }

  const [removingUserId, setRemovingUserId] = useState<string | null>(null);

  async function archiveUser(docId: string, telegramId: number) {
    if (!confirm("Remove this user from the channel? Their expiry will be set to the next minute so the bot removes them.")) return;

    setRemovingUserId(docId);
    try {
      // Set expiry to next minute — bot's hourly job will pick this up and
      // ban/unban them from the channel then mark archived.
      await expireUserByTelegramId(telegramId, docId);

      // Also try immediate removal via the Flask API (best-effort)
      try {
        const resp = await fetch("http://localhost:5000/api/remove-user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Secret": "your-secret-key",
          },
          body: JSON.stringify({ user_id: telegramId.toString() }),
        });
        const result = await resp.json();
        if (result.success) {
          console.log("Immediately removed from channel via API.");
        } else {
          console.warn("API removal not successful, bot will handle on next cycle.", result.error);
        }
      } catch (err) {
        console.warn("Could not reach bot API — bot will remove on next hourly cycle.", err);
      }

      // Refresh the user list
      await fetchUsers();
      alert("✅ User queued for removal. They will be kicked within the next minute.");
    } catch (error) {
      console.error("Error in archiveUser:", error);
      alert("❌ Failed to queue user for removal. Please check the console for details.");
    } finally {
      setRemovingUserId(null);
    }
  }

  // Remove a user directly from the codes table (by their Telegram ID stored on the code)
  async function removeUserByCode(telegramId: number) {
    // Find the Firestore doc for this user
    const snap = await getDocs(collection(db, "users"));
    const userDoc = snap.docs.find((d) => d.data().user_id === telegramId);
    if (!userDoc) {
      alert("❌ Could not find this user in the database.");
      return;
    }
    await archiveUser(userDoc.id, telegramId);
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
    if (!expiryTime) {
      alert("Please select an expiry time.");
      return;
    }
    setIsSaving(true);
    try {
      // Combine date and time
      const [hours, minutes] = expiryTime.split(":");
      const expiry = new Date(expiryDate);
      expiry.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      await setDoc(doc(db, "access_tokens", generatedCode), {
        token: generatedCode,
        expiry_date: Timestamp.fromDate(expiry),
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

  // Add these new state variables after the existing broadcast state variables
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("");

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
    
    // Sort users by day within each month
    Object.keys(monthGroups).forEach(month => {
      monthGroups[month].sort((a, b) => {
        return a.expiry_date.toDate().getDate() - b.expiry_date.toDate().getDate();
      });
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
      console.log("Sending broadcast to:", targetGroup === "specific" ? "specific users" : targetGroup);
      
      // Fix the URL to use port 5000 instead of 5173
      const response = await fetch('http://localhost:5000/api/broadcast-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Secret': 'your-secret-key'  // Using the default value from bot.py
        },
        body: JSON.stringify({
          message: broadcastMessage,
          target_group: targetGroup,
          user_ids: targetGroup === "specific" ? selectedUsers : []
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
        if (targetGroup === "specific") {
          setSelectedUsers([]);
        }
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

  // Add this function inside the Dashboard component, before the return statement
  // Add this function to handle user selection
  function toggleUserSelection(userId: string) {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  }

  // Add this function to handle month selection
  function selectAllInMonth(month: string, select: boolean) {
    const monthUsers = getUsersByMonth()[month] || [];
    
    if (select) {
      // Add all users from this month that aren't already selected
      const userIds = monthUsers.map(u => u.id);
      setSelectedUsers(prev => {
        const newSelection = [...prev];
        userIds.forEach(id => {
          if (!newSelection.includes(id)) {
            newSelection.push(id);
          }
        });
        return newSelection;
      });
    } else {
      // Remove all users from this month
      const userIds = monthUsers.map(u => u.id);
      setSelectedUsers(prev => prev.filter(id => !userIds.includes(id)));
    }
  }

  // Modify the sendBroadcast function to handle specific users
  async function sendBroadcast() {
    if (!broadcastMessage.trim()) {
      alert("Please enter a message to broadcast.");
      return;
    }
    
    setIsSending(true);
    setBroadcastResult("");
    
    try {
      // Add detailed logging
      console.log("Selected users:", selectedUsers);
      console.log("Target group:", targetGroup);
      
      const requestBody = {
        message: broadcastMessage,
        target_group: targetGroup,
        user_ids: targetGroup === "specific" ? selectedUsers : []
      };
      
      console.log("Sending request with body:", requestBody);
      
      const response = await fetch('http://localhost:5000/api/broadcast-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Secret': 'your-secret-key'  // Using the default value from bot.py
        },
        body: JSON.stringify(requestBody)
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
          <h1>Welcome, {user?.email}</h1>
        </header>

        <section>
          <h2>Generate Access Code</h2>
          <button className="generate-btn" onClick={openModal}>
            Generate Code
          </button>
        </section>

        <section>
          <div className="flex justify-between items-center mb-4">
            <h1 className="mt-4">
              <strong>Access Codes {codes.length}</strong>
            </h1>
            <button
              onClick={() => setShowAccessCodes(!showAccessCodes)}
              className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
            >
              {showAccessCodes ? 'Hide' : 'Show'} Access Codes
            </button>
          </div>
          
          {showAccessCodes && (
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
                      <th>Used By</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {codes.length ? (
                      codes.map((c) => (
                        <tr key={c.id}>
                          <td><strong>{c.token}</strong></td>
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
                            {c.used && c.used_by_id ? (
                              <div className="code-used-by">
                                <img
                                  className="user-avatar"
                                  src={`http://localhost:5000/api/user-photo/${c.used_by_id}`}
                                  alt="avatar"
                                  onError={(e) => {
                                    const name = encodeURIComponent(c.used_by_username || 'U');
                                    (e.currentTarget as HTMLImageElement).src =
                                      `https://ui-avatars.com/api/?name=${name}&background=1e293b&color=fff&size=64&bold=true`;
                                  }}
                                />
                                <div className="user-name">
                                  <span className={c.used_by_username ? "used-by-name" : "used-by-unknown"}>
                                    {c.used_by_username ? `@${c.used_by_username}` : "Unknown user"}
                                  </span>
                                  <span className="user-id-label">ID: {c.used_by_id}</span>
                                </div>
                              </div>
                            ) : (
                              <span style={{ color: "#94a3b8", fontSize: "13px" }}>—</span>
                            )}
                          </td>
                          <td style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                            {c.used && c.used_by_id && (
                              <button
                                className="remove-btn"
                                onClick={() => removeUserByCode(c.used_by_id!)}
                              >
                                Remove User
                              </button>
                            )}
                            <button
                              className="delete-btn"
                              onClick={() => deleteExpiredCode(c.id)}
                            >
                              Delete Code
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="empty">
                          No codes available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )}
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
                              <th>User</th>
                              <th>Access Code</th>
                              <th>Expiry Date</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {monthUsers.map((u) => (
                              <tr key={u.id}>
                                <td>
                                  <div className="user-info-cell">
                                    <img
                                      className="user-avatar"
                                      src={`http://localhost:5000/api/user-photo/${u.user_id}`}
                                      alt="avatar"
                                      onError={(e) => {
                                        const name = encodeURIComponent(u.username || 'U');
                                        (e.currentTarget as HTMLImageElement).src =
                                          `https://ui-avatars.com/api/?name=${name}&background=1e293b&color=fff&size=64&bold=true`;
                                      }}
                                    />
                                    <div className="user-name">
                                      <span>
                                        {u.username ? `@${u.username}` : "Unknown"}
                                      </span>
                                      <span className="user-id-label">ID: {u.user_id}</span>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <code style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px", fontSize: "12px" }}>
                                    {u.access_code || "—"}
                                  </code>
                                </td>
                                <td>{formatDate(u.expiry_date.toDate())}</td>
                                <td>
                                  <button
                                    className="remove-btn"
                                    disabled={removingUserId === u.id}
                                    onClick={() => archiveUser(u.id, u.user_id)}
                                  >
                                    {removingUserId === u.id ? "Removing…" : "Remove"}
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
                        <th>User</th>
                        <th>Access Code</th>
                        <th>Expiry Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.length ? (
                        users.map((u) => (
                          <tr key={u.id}>
                            <td>
                              <div className="user-info-cell">
                                <img
                                  className="user-avatar"
                                  src={`http://localhost:5000/api/user-photo/${u.user_id}`}
                                  alt="avatar"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).src =
                                      `https://ui-avatars.com/api/?name=${encodeURIComponent(u.username || "U")}&background=1e293b&color=fff&size=64&bold=true`;
                                  }}
                                />
                                <div className="user-name">
                                  <span>
                                    {u.username ? `@${u.username}` : "Unknown"}
                                  </span>
                                  <span className="user-id-label">ID: {u.user_id}</span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <code style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px", fontSize: "12px" }}>
                                {u.access_code || "—"}
                              </code>
                            </td>
                            <td>{formatDate(u.expiry_date.toDate())}</td>
                            <td>
                              <button
                                className="remove-btn"
                                disabled={removingUserId === u.id}
                                onClick={() => archiveUser(u.id, u.user_id)}
                              >
                                {removingUserId === u.id ? "Removing…" : "Remove"}
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
                onChange={(e) => {
                  setTargetGroup(e.target.value);
                  if (e.target.value !== "specific") {
                    setSelectedUsers([]);
                  }
                }}
                className="select-input"
              >
                <option value="active">All Active Users</option>
                <option value="archived">All Archived Users</option>
                <option value="all">All Users</option>
                <option value="specific">Specific Users</option>
              </select>
            </div>

            {targetGroup === "specific" && (
              <div className="user-selection-container">
                <h3>Select Users by Expiry Month</h3>
                {Object.entries(getUsersByMonth()).map(([monthYear, monthUsers]) => (
                  <div key={monthYear} className="month-group">
                    <div className="month-header">
                      <h4>
                        {monthYear} ({monthUsers.length})
                      </h4>
                      <label className="select-all-label">
                        <input
                          type="checkbox"
                          checked={monthUsers.every(u => selectedUsers.includes(u.id))}
                          onChange={(e) => selectAllInMonth(monthYear, e.target.checked)}
                        />
                        Select All
                      </label>
                    </div>
                    <table>
                      <thead>
                        <tr>
                          <th>Select</th>
                          <th>User</th>
                          <th>Access Code</th>
                          <th>Expiry Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthUsers.map((u) => (
                          <tr key={u.id}>
                            <td>
                              <input
                                type="checkbox"
                                checked={selectedUsers.includes(u.id)}
                                onChange={() => toggleUserSelection(u.id)}
                              />
                            </td>
                            <td>
                              <div className="user-info-cell">
                                <img
                                  className="user-avatar"
                                  src={`http://localhost:5000/api/user-photo/${u.user_id}`}
                                  alt="avatar"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).src =
                                      `https://ui-avatars.com/api/?name=${encodeURIComponent(u.username || "U")}&background=1e293b&color=fff&size=64&bold=true`;
                                  }}
                                />
                                <div className="user-name">
                                  <span>{u.username ? `@${u.username}` : "Unknown"}</span>
                                  <span className="user-id-label">ID: {u.user_id}</span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <code style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px", fontSize: "12px" }}>
                                {u.access_code || "—"}
                              </code>
                            </td>
                            <td>{formatDate(u.expiry_date.toDate())}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
                <div className="selection-summary">
                  Selected {selectedUsers.length} users
                </div>
              </div>
            )}

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
              disabled={isSending || !broadcastMessage.trim() || (targetGroup === "specific" && selectedUsers.length === 0)}
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
            <div className="input-group">
              <label>Expiry Date:</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>Expiry Time:</label>
              <input
                type="time"
                value={expiryTime}
                onChange={(e) => setExpiryTime(e.target.value)}
              />
            </div>
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
