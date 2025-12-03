import { Calendar, Eye, Heart, MessageCircle, Edit2, Trash2, X, Check, Link } from "lucide-react";
import "./PostCard.css";

export function PostCard({
  post,
  isEditing,
  editForm,
  setEditForm,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onToggleStatus,
  onDelete,
  isAdmin,
}) {
  const statusColors = {
    sent: "sent",
    pending: "pending",
    canceled: "canceled",
  };

  if (isEditing) {
    return (
      <div className="post-card editing">
        <div className="edit-form">
          <textarea
            value={editForm.content}
            onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
            placeholder="Post content..."
            rows={3}
            className="edit-textarea"
          />

          <div className="edit-row">
            <label className="edit-label">
              <Eye size={14} />
              Visibility
            </label>
            <select
              value={editForm.visibility}
              onChange={(e) => setEditForm({ ...editForm, visibility: e.target.value })}
              className="edit-select"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>

          <div className="edit-row">
            <label className="edit-label">
              <Calendar size={14} />
              Scheduled Time
            </label>
            <input
              type="datetime-local"
              value={editForm.scheduledTime}
              onChange={(e) => setEditForm({ ...editForm, scheduledTime: e.target.value })}
              className="edit-input"
            />
          </div>

          <div className="edit-row">
            <label className="edit-label">Status</label>
            <button
              onClick={onToggleStatus}
              className={`status-toggle ${editForm.status}`}
            >
              {editForm.status === "pending" ? "Pending" : "Canceled"}
            </button>
          </div>

          <div className="edit-actions">
            <button className="btn btn-primary" onClick={() => onSaveEdit(post.id)}>
              <Check size={14} />
              Save
            </button>
            <button className="btn btn-secondary" onClick={onCancelEdit}>
              <X size={14} />
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`post-card ${statusColors[post.status]}`}>
      <div className="post-header">
        {isAdmin && post.username && (
          <span className="post-author">@{post.username}</span>
        )}
        <span className={`post-status ${post.status}`}>{post.status}</span>
      </div>

      <p className="post-content">{post.content}</p>

      <div className="post-meta">
        <div className="meta-item">
          <Calendar size={14} />
          <span>{new Date(post.scheduled_time).toLocaleString()}</span>
        </div>
        <div className="meta-item">
          <Eye size={14} />
          <span>{post.visibility}</span>
        </div>
      </div>

      {(post.replies_count !== undefined || post.favorites_count !== undefined) && (
        <div className="post-stats">
          {post.replies_count !== undefined && (
            <div className="stat-item">
              <MessageCircle size={14} />
              <span>{post.replies_count}</span>
            </div>
          )}
          {post.favorites_count !== undefined && (
            <div className="stat-item">
              <Heart size={14} />
              <span>{post.favorites_count}</span>
            </div>
          )}
        </div>
      )}

      {post.url && (
        <a href={post.url} target="_blank" rel="noopener noreferrer" className="post-link">
          <Link size={14} />
          <span>View on Mastodon</span>
        </a>
      )}

      <div className="post-actions">
        <button
          className="btn btn-icon edit"
          onClick={() => onStartEdit(post)}
          disabled={post.status === "sent"}
          title={post.status === "sent" ? "Sent posts cannot be edited" : "Edit post"}
        >
          <Edit2 size={16} />
        </button>
        <button
          className="btn btn-icon delete"
          onClick={() => onDelete(post.id)}
          title="Delete post"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
