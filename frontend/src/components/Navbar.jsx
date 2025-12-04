import { Link, useLocation } from "react-router-dom";
import "./Navbar.css";

export function Navbar() {
	const { pathname } = useLocation();

	return (
		<nav className="navbar">
			<Link
				to="/"
				className={`nav-item ${pathname === "/" ? "active" : ""}`}
			>
				<span className="icon"></span>
				<span>Dashboard</span>
			</Link>

			<Link
				to="/create"
				className={`nav-item ${pathname === "/create" ? "active" : ""}`}
			>
				<span className="icon"></span>
				<span>Create Post</span>
			</Link>
		</nav>
	);
}
