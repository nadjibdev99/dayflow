import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav style={{ display: "flex", gap: 16, padding: 16, borderBottom: "1px solid #ddd" }}>
      <strong>🍅 DayFlow</strong>
      <Link to="/">Dashboard</Link>
      <Link to="/tasks">Tasks</Link>
      <Link to="/notes">Notes</Link>
      <span style={{ marginLeft: "auto" }}>{user?.name}</span>
      <button onClick={logout}>Logout</button>
    </nav>
  );
}