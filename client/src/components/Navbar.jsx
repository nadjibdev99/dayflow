import { useEffect } from "react";
import { NavLink, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import Icon, { Logo } from "./Icon";
import MiniTimer from "./MiniTimer";

const ITEMS = [
  { to: "/", label: "Home", icon: "home", end: true },
  { to: "/tasks", label: "Tasks", icon: "tasks" },
  { to: "/notes", label: "Notes", icon: "notes" },
  { to: "/pomodoro", label: "Timer", icon: "timer" },
];

const linkClass = ({ isActive }) => `nav-link${isActive ? " active" : ""}`;

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    document.body.classList.add("has-shell");
    return () => document.body.classList.remove("has-shell");
  }, []);

  const dark = theme === "dark";
  const themeLabel = dark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <>
      <aside className="sidebar">
        <Link to="/" className="brand">
          <Logo />
          DayFlow
        </Link>

        <nav aria-label="Main">
          {ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
              <Icon name={item.icon} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <MiniTimer />
        <div className="sidebar-spacer" />

        <div className="user-row">
          <div className="avatar">{user?.name?.[0]?.toUpperCase() || "?"}</div>
          <div className="user-name">{user?.name}</div>
          <button className="icon-btn" onClick={toggleTheme} aria-label={themeLabel} title={themeLabel}>
            <Icon name={dark ? "sun" : "moon"} />
          </button>
          <button className="icon-btn" onClick={logout} aria-label="Log out" title="Log out">
            <Icon name="logout" />
          </button>
        </div>
      </aside>

      <header className="mobile-top">
        <Link to="/" className="brand">
          <Logo />
          DayFlow
        </Link>
        <MiniTimer />
        <button className="icon-btn" onClick={toggleTheme} aria-label={themeLabel}>
          <Icon name={dark ? "sun" : "moon"} />
        </button>
        <button className="icon-btn" onClick={logout} aria-label="Log out">
          <Icon name="logout" />
        </button>
      </header>

      <nav className="bottom-nav" aria-label="Main">
        {ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
            <Icon name={item.icon} />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </>
  );
}