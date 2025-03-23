"use client";
import { useEffect, useState } from "react";
import { useNavigate } from "@remix-run/react";
import { auth, db } from "~/utils/firebase";
import { signOut } from "firebase/auth";
import { collection, setDoc, getDocs, deleteDoc, doc, Timestamp } from "firebase/firestore";
import "~/styles/dashboard.css"; // Import CSS

// Define TypeScript types
interface AccessCode {
  id: string;
  token: string;
  expiry_date: Timestamp;
  used: boolean;
}

interface User {
  id: string;
  user_id: string;
  username: string;
  expiry_date: Timestamp;
}

export default function Dashboard() {
  const [user, setUser] = useState(auth.currentUser);
  const navigate = useNavigate();
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    auth.onAuthStateChanged((user) => {
      if (!user) navigate("/login");
      setUser(user);
    });
    fetchCodes();
    fetchUsers();
  }, [navigate]);

  // Fetch Access Codes from Firestore
  async function fetchCodes() {
    const querySnapshot = await getDocs(collection(db, "access_tokens"));
    const codesList = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as AccessCode));
    setCodes(codesList);
  }

  // Fetch Users from Firestore
  async function fetchUsers() {
    const querySnapshot = await getDocs(collection(db, "users"));
    const usersList = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      user_id: doc.data().user_id,
      username: doc.data().username || "Unknown", // Ensure username is shown correctly
      expiry_date: doc.data().expiry_date,
    }));
    setUsers(usersList);
  }

  // Open Modal & Generate Random Code
  function openModal() {
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    setGeneratedCode(newCode);
    setShowModal(true);
  }

  // Close Modal
  function closeModal() {
    setShowModal(false);
    setGeneratedCode("");
    setExpiryDate("");
    setSuccessMessage(""); // Clear success message
  }

  // Save Code with Expiry Date & Show Feedback
  async function saveCode() {
    if (!expiryDate) {
      alert("Please select an expiry date.");
      return;
    }

    setIsSaving(true); // Show loading state

    try {
      // ✅ Set Firestore document ID to match the generated code
      await setDoc(doc(db, "access_tokens", generatedCode), {
        token: generatedCode, // Store the token inside the document
        expiry_date: Timestamp.fromDate(new Date(expiryDate)),
        used: false,
      });

      setSuccessMessage("✅ Code saved successfully!"); // Show success message
      fetchCodes(); // Refresh table

      // Close modal after 2 seconds
      setTimeout(() => {
        closeModal();
      }, 2000);
    } catch (error) {
      console.error("Error saving code:", error);
      alert("❌ Failed to save code. Try again.");
    } finally {
      setIsSaving(false);
    }
  }

  // Delete an Expired Access Code
  async function deleteExpiredCode(id: string) {
    await deleteDoc(doc(db, "access_tokens", id));
    fetchCodes(); // Refresh table
  }

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className="sidebar">
        <h2>Admin Panel</h2>
        <button onClick={() => signOut()}>Logout</button>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="top-nav">
          <h1>Welcome, {user?.email}</h1>
        </div>

        <h2>Generate Access Code</h2>
        <button className="generate-btn" onClick={openModal}>
          Generate Code
        </button>

        <h2>Access Codes</h2>
        <div className="table-container">
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
              {codes.length > 0 ? (
                codes.map((code) => (
                  <tr key={code.id}>
                    <td>{code.token}</td>
                    <td>{new Date(code.expiry_date.toDate()).toLocaleDateString()}</td>
                    <td>
                      <span className={`status-badge ${code.used ? "status-used" : "status-active"}`}>
                        {code.used ? "Used" : "Active"}
                      </span>
                    </td>
                    <td>
                      <button className="delete-btn" onClick={() => deleteExpiredCode(code.id)}>
                        🗑 Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: "10px" }}>No codes available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 🌟 User List Section */}
        <div className="user-table">
          <h2>Active Users</h2>
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>User ID</th>
                <th>Expiry Date</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.username}</td>
                    <td>{user.user_id}</td>
                    <td>{new Date(user.expiry_date.toDate()).toLocaleDateString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} style={{ textAlign: "center", padding: "10px" }}>No users available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🌟 Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Generated Code: {generatedCode}</h2>
            <input className="modal-input" type="date" onChange={(e) => setExpiryDate(e.target.value)} />

            {/* Show success message */}
            {successMessage && <p style={{ color: "green", marginTop: "10px" }}>{successMessage}</p>}

            <div className="modal-buttons">
              <button className="modal-save" onClick={saveCode} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save"}
              </button>
              <button className="modal-cancel" onClick={closeModal} disabled={isSaving}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
