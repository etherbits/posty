import { useState } from "react";
import { User, Lock } from "lucide-react";
import styles from "./AuthForm.module.css";

export function AuthForm({ onSignIn, onSignUp }) {
	const [isSignUp, setIsSignUp] = useState(false);
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (isSignUp) {
			const success = await onSignUp(username, password, confirmPassword);
			if (success) {
				setUsername("");
				setPassword("");
				setConfirmPassword("");
			}
		} else {
			const success = await onSignIn(username, password);
			if (success) {
				setUsername("");
				setPassword("");
			}
		}
	};

	return (
		<div className={styles.page}>
			<div className={styles.card}>
				<div className={styles.brand}>
					<img src="/vectors/logo.svg" alt="Posty" className={styles.logo} />
					<div>
						<h1 className={styles.title}>Welcome to Posty</h1>
						<p className={styles.subtitle}>
							{isSignUp
								? "Create your account to get started"
								: "Sign in to manage social media"}
						</p>
					</div>
				</div>

				<div className={styles.tabs}>
					<button
						type="button"
						className={`${styles.tab} ${!isSignUp ? styles.tabActive : ""}`}
						onClick={() => setIsSignUp(false)}
					>
						Sign In
					</button>
					<button
						type="button"
						className={`${styles.tab} ${isSignUp ? styles.tabActive : ""}`}
						onClick={() => setIsSignUp(true)}
					>
						Sign Up
					</button>
				</div>

				<form onSubmit={handleSubmit} className={styles.form}>
					<div className={styles.field}>
						<label className={styles.label} htmlFor="username">
							Username
						</label>
						<div className={styles.inputWrap}>
							<User size={16} className={styles.inputIcon} />
							<input
								id="username"
								type="text"
								autoComplete="username"
								placeholder="Enter your username"
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								className={styles.input}
								required
							/>
						</div>
					</div>

					<div className={styles.field}>
						<label className={styles.label} htmlFor="password">
							Password
						</label>
						<div className={styles.inputWrap}>
							<Lock size={16} className={styles.inputIcon} />
							<input
								id="password"
								type="password"
								autoComplete={isSignUp ? "new-password" : "current-password"}
								placeholder="Enter your password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								className={styles.input}
								required
							/>
						</div>
					</div>

					{isSignUp && (
						<div className={styles.field}>
							<label className={styles.label} htmlFor="confirm-password">
								Confirm Password
							</label>
							<div className={styles.inputWrap}>
								<Lock size={16} className={styles.inputIcon} />
								<input
									id="confirm-password"
									type="password"
									autoComplete="new-password"
									placeholder="Confirm your password"
									value={confirmPassword}
									onChange={(e) => setConfirmPassword(e.target.value)}
									className={styles.input}
									required
								/>
							</div>
						</div>
					)}

					<button type="submit" className={styles.submit}>
						{isSignUp ? "Create Account" : "Sign In"}
					</button>
				</form>

				<div className={styles.footer}>
					{isSignUp ? "Already have an account?" : "Don't have an account?"}
					<button
						type="button"
						className={styles.switch}
						onClick={() => setIsSignUp(!isSignUp)}
					>
						{isSignUp ? "Sign In" : "Sign Up"}
					</button>
				</div>
			</div>
		</div>
	);
}
