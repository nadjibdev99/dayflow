import { Link } from "react-router-dom";
import { Logo } from "../components/Icon";

export default function NotFound() {
  return (
    <div className="not-found-page">
      <div className="not-found-card">
        <div className="brand" style={{ padding: "0 0 24px", justifyContent: "center" }}>
          <Logo />
          DayFlow
        </div>
        <div className="not-found-code">404</div>
        <h1 className="not-found-title">Page not found</h1>
        <p className="not-found-sub">
          Looks like this page went on a focus break and never came back.
        </p>
        <Link to="/" className="btn btn-primary" style={{ marginTop: 8 }}>
          Back to home
        </Link>
      </div>
    </div>
  );
}
