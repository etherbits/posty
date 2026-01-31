import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { FileText, UserCircle } from "lucide-react";
import { RightPanel } from "../components/RightPanel";
import styles from "./AppShell.module.css";

const navItems = [
	{ to: "/", label: "Dashboard", iconSrc: "/vectors/home.svg", end: true },
	{ to: "/posts", label: "Posts", icon: FileText },
	{ to: "/settings", label: "Settings", iconSrc: "/vectors/settings.svg" },
];

export function AppShell({ user, stats, onLogout, onReplayToasts, children }) {
	const [isProfileOpen, setIsProfileOpen] = useState(false);
	const location = useLocation();

	useEffect(() => {
		setIsProfileOpen(false);
	}, [location.pathname]);

	return (
		<div className={styles.shell}>
			<header className={styles.mobileHeader}>
				<div className={styles.mobileLogo}>
					<img src="/vectors/logo.svg" alt="Posty" className={styles.logoImage} />
				</div>
				<nav className={styles.mobileNav}>
					{navItems.map((item) => (
						<NavLink
							key={item.label}
							to={item.to}
							end={item.end}
							className={({ isActive }) =>
								`${styles.mobileNavItem} ${isActive ? styles.mobileNavItemActive : ""}`
							}
							aria-label={item.label}
						>
							{({ isActive }) =>
								item.iconSrc ? (
									<span
										className={`${styles.navIcon} ${isActive ? styles.navIconActive : ""}`}
										style={{
											WebkitMaskImage: `url(${item.iconSrc})`,
											maskImage: `url(${item.iconSrc})`,
										}}
									/>
								) : (
									<item.icon size={20} className={styles.lucideIcon} />
								)
							}
						</NavLink>
					))}
				</nav>
				<button
					type="button"
					className={styles.mobileProfile}
					onClick={() => setIsProfileOpen((prev) => !prev)}
					aria-label="Toggle profile panel"
				>
					<UserCircle size={20} />
				</button>
			</header>

		<aside className={styles.sidebar}>
			<div className={styles.logo}>
				<img src="/vectors/logo.svg" alt="Posty" className={styles.logoImage} />
				<div>
					<p className={styles.logoTitle}>Posty</p>
					<p className={styles.logoSubtitle}>Growth &amp; Marketing</p>
				</div>
			</div>

			<nav className={styles.nav}>
				{navItems.map((item) => (
					<NavLink
						key={item.label}
						to={item.to}
						end={item.end}
						className={({ isActive }) =>
							`${styles.navItem} ${isActive ? styles.navItemActive : ""}`
						}
					>
						{({ isActive }) => (
							<>
								{item.iconSrc ? (
									<span
										className={`${styles.navIcon} ${isActive ? styles.navIconActive : ""}`}
										style={{
											WebkitMaskImage: `url(${item.iconSrc})`,
											maskImage: `url(${item.iconSrc})`,
										}}
									/>
								) : (
									<item.icon size={20} className={styles.lucideIcon} />
								)}
								<span className={styles.navLabel}>{item.label}</span>
							</>
						)}
					</NavLink>
				))}
			</nav>
		</aside>

		<main className={styles.main}>{children}</main>

		<RightPanel
			className={styles.rightPanel}
			isOpen={isProfileOpen}
			user={user}
			stats={stats}
			onLogout={onLogout}
			onReplayToasts={onReplayToasts}
		/>

		{isProfileOpen && (
			<button
				className={styles.overlay}
				type="button"
				onClick={() => setIsProfileOpen(false)}
				aria-label="Close profile panel"
			/>
		)}
		</div>
	);
}
