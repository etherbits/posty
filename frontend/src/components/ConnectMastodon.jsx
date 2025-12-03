import { ExternalLink } from "lucide-react";
import "./ConnectMastodon.css";

export function ConnectMastodon({ onConnect }) {
  return (
    <div className="connect-mastodon">
      <div className="connect-icon">
        <span>🐘</span>
      </div>
      <div className="connect-content">
        <h3 className="connect-title">Connect to Mastodon</h3>
        <p className="connect-description">
          Connect your Mastodon account to schedule and manage posts.
        </p>
      </div>
      <button className="connect-button" onClick={onConnect}>
        <ExternalLink size={16} />
        Connect Now
      </button>
    </div>
  );
}
