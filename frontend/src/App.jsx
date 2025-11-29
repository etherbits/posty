import { useState } from "react";
import "./App.css";

function App() {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [content, setContent] = useState("");
	const [visibility, setVisibility] = useState("public");
	const [scheduledTime, setScheduledTime] = useState("");
	const [file, setFile] = useState(null);
	const [mediaIds, setMediaIds] = useState([]);

	function handleUsernameChange(event) {
		setUsername(event.target.value);
	}

	function handlePasswordChange(event) {
		setPassword(event.target.value);
	}

	function handleContentChange(event) {
		setContent(event.target.value);
	}

	function handleVisibilityChange(event) {
		setVisibility(event.target.value);
	}

	function handleFileChange(event) {
		setFile(event.target.files[0]);
	}

	function handleScheduledTimeChange(event) {
		setScheduledTime(event.target.value);
	}

	async function signIn() {
		try {
			const response = await fetch("http://localhost:3000/auth/sign-in", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
				body: JSON.stringify({ username, password }),
			});

			if (!response.ok) {
				throw new Error("Sign-in failed");
			}

			const data = await response.json();
			localStorage.setItem("user", JSON.stringify(data));
		} catch (error) {
			console.error(error);
		}
	}

	function connectMastodon() {
		window.location.href = "http://localhost:3000/auth/oauth/mastodon";
	}

	async function schedulePost() {
		const isoScheduledTime = new Date(scheduledTime).toISOString();

		const response = await fetch("http://localhost:3000/post/schedule", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			credentials: "include",
			body: JSON.stringify({
				content,
				visibility,
				scheduledTime: isoScheduledTime,
				mediaIds,
			}),
		});

		if (!response.ok) {
			const errorMessage = await response.text();
			throw new Error(`Scheduling post failed: ${errorMessage}`);
		}

		const data = await response.json();
		console.log(data);
	}

	async function addMedia() {
		const formData = new FormData();
		formData.append("file", file);

		const response = await fetch("http://localhost:3000/post/upload-media", {
			method: "POST",
			credentials: "include",
			body: formData,
		});

		if (!response.ok) {
			console.error("Image upload failed");
		}

		const data = await response.json();
		setMediaIds((ids) => [...ids, data.id]);
	}

	return (
		<>
			<form>
				<input
					type="text"
					placeholder="Username"
					value={username}
					onChange={handleUsernameChange}
				/>
				<input
					type="password"
					placeholder="Password"
					value={password}
					onChange={handlePasswordChange}
				/>
				<button type="button" onClick={signIn}>
					Sign In
				</button>
			</form>
			<div style={{ marginTop: "20px" }}>
				<button type="button" onClick={connectMastodon}>
					Connect to Mastodon
				</button>
			</div>
			<input
				type="text"
				placeholder="content"
				value={content}
				onChange={handleContentChange}
			/>
			{/* visibility picker from "public", "private" */}
			<select value={visibility} onChange={handleVisibilityChange}>
				<option value="public">Public</option>
				<option value="private">Private</option>
			</select>
			<button type="button" onClick={schedulePost}>
				Post to Mastodon
			</button>
			<input type="file" onChange={handleFileChange} />
			<input
				type="datetime-local"
				value={scheduledTime}
				onChange={handleScheduledTimeChange}
			/>
			<button type="button" onClick={addMedia}>
				Add media
			</button>
		</>
	);
}

export default App;
