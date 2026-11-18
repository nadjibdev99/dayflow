import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 600, margin: "40px auto" }}>
        <h1>Welcome, {user.name} 👋</h1>
        <p>{user.email}</p>
      </div>
    </>
  );
}