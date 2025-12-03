import { useState } from "react";
import { User, Lock, ArrowRight, UserPlus } from "lucide-react";
import "./AuthForm.css";

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
		<div className="auth-container">
			<div className="auth-card">
				<div className="auth-header">
					<div className="auth-logo">
						<span>P</span>
					</div>
					<h1 className="auth-title">Welcome to Posty</h1>
					<p className="auth-subtitle">
						{isSignUp
							? "Create an account to get started"
							: "Sign in to manage your scheduled posts"}
					</p>
				</div>

				<div className="auth-tabs">
					<button
						className={`auth-tab ${!isSignUp ? "active" : ""}`}
						onClick={() => setIsSignUp(false)}
					>
						Sign In
					</button>
					<button
						className={`auth-tab ${isSignUp ? "active" : ""}`}
						onClick={() => setIsSignUp(true)}
					>
						Sign Up
					</button>
				</div>

				<form onSubmit={handleSubmit} className="auth-form">
					<div className="input-group">
						<User size={18} className="input-icon" />
						<input
							type="text"
							placeholder="Username"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							className="auth-input"
							required
						/>
					</div>

					<div className="input-group">
						<Lock size={18} className="input-icon" />
						<input
							type="password"
							placeholder="Password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="auth-input"
							required
						/>
					</div>

					{isSignUp && (
						<div className="input-group">
							<Lock size={18} className="input-icon" />
							<input
								type="password"
								placeholder="Confirm Password"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								className="auth-input"
								required
							/>
						</div>
					)}

					<button type="submit" className="auth-submit">
						{isSignUp ? (
							<>
								<UserPlus size={18} />
								Create Account
							</>
						) : (
							<>
								<ArrowRight size={18} />
								Sign In
							</>
						)}
					</button>
				</form>

				<div className="auth-footer">
					<p>
						{isSignUp ? "Already have an account?" : "Don't have an account?"}
						<button
							type="button"
							className="auth-switch"
							onClick={() => setIsSignUp(!isSignUp)}
						>
							{isSignUp ? "Sign In" : "Sign Up"}
						</button>
					</p>
				</div>
			</div>
		</div>
	);
}
