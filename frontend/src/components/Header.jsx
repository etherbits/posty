import "./Header.css";

export function Header({ user, onLogout }) {
	return (
		<header className="header">
			<h1 className="header-logo">
				<a href="/">Posty</a>
			</h1>
			<div className="header-right">
				<div className="user-profile">
					<div className="user-avatar">
						{user?.username?.[0]?.toUpperCase() || "U"}
					</div>
					<div className="user-info">
						<span className="user-name">{user?.username || "User"}</span>
						<span className="user-role">
							{user?.role === "admin" ? "Administrator" : "Personal Account"}
						</span>
					</div>
					<button className="logout-btn" onClick={onLogout}>
						Logout
					</button>
				</div>
			</div>
		</header>
	);
}
