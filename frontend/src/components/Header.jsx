import "./Header.css";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export function Header({ user, onLogout }) {
	const navigate = useNavigate();

	// Load theme on page load
	useEffect(() => {
		const saved = localStorage.getItem("theme");
		if (saved === "light") {
			document.documentElement.classList.add("light-theme");
		}
	}, []);

	const toggleTheme = () => {
		document.documentElement.classList.toggle("light-theme");

		localStorage.setItem(
			"theme",
			document.documentElement.classList.contains("light-theme")
				? "light"
				: "dark"
		);
	};

	return (
		<header className="header">
			<h1 className="header-logo" onClick={() => navigate("/")}>
				Posty
			</h1>

			<div className="header-right">

				{/* THEME TOGGLE */}
				<button className="theme-toggle" onClick={toggleTheme}>
					🌓
				</button>

				{/* USER PROFILE */}
				<div
					className="user-profile"
					onClick={() => navigate("/profile")}
				>
					<div className="user-avatar">
						{user?.username?.[0]?.toUpperCase() || "U"}
					</div>

					<div className="user-info">
						<span className="user-name">{user?.username || "User"}</span>
						<span className="user-role">
							{user?.role === "admin" ? "Administrator" : "Personal Account"}
						</span>
					</div>
				</div>

				{/* LOGOUT BUTTON */}
				<button className="logout-btn" onClick={onLogout}>
					Logout
				</button>
			</div>
		</header>
	);
}
