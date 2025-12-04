import { useState } from "react";
import { Send, Image, Calendar, Eye, Upload, X } from "lucide-react";
import "./CreatePostForm.css";

export function CreatePostForm({ onSchedule, onUploadMedia }) {
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [scheduledTime, setScheduledTime] = useState("");
  const [file, setFile] = useState(null);
  const [mediaIds, setMediaIds] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content || !scheduledTime) return;

    const success = await onSchedule(content, visibility, scheduledTime, mediaIds);
    if (success) {
      setContent("");
      setScheduledTime("");
      setMediaIds([]);
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    const mediaId = await onUploadMedia(file);
    if (mediaId) {
      setMediaIds((ids) => [...ids, mediaId]);
      setFile(null);
    }
    setIsUploading(false);
  };

  const removeMedia = (index) => {
    setMediaIds((ids) => ids.filter((_, i) => i !== index));
  };

  return (
    <div className="create-post-form">
      <div className="form-header">
        <h3 className="form-title">Schedule New Post</h3>
        <p className="form-subtitle">Create and schedule your posts!</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            rows={4}
            className="form-textarea"
          />
          <span className="char-count">{content.length} characters</span>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">
              <Eye size={14} />
              Visibility
            </label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="form-select"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              <Calendar size={14} />
              Schedule Time
            </label>
            <input
              type="datetime-local"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="form-input"
            />
          </div>
        </div>

        <div className="media-section">
          <label className="form-label">
            <Image size={14} />
            Media
          </label>
          <div className="media-upload">
            <input
              type="file"
              id="media-file"
              onChange={(e) => setFile(e.target.files[0])}
              className="file-input"
              accept="image/*,video/*"
            />
            <label htmlFor="media-file" className="file-label">
              <Upload size={16} />
              <span>{file ? file.name : "Choose file..."}</span>
            </label>
            <button
              type="button"
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="btn btn-upload"
            >
              {isUploading ? "Uploading..." : "Upload"}
            </button>
          </div>

          {mediaIds.length > 0 && (
            <div className="media-list">
              {mediaIds.map((id, index) => (
                <div key={id} className="media-item">
                  <span>Media #{index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeMedia(index)}
                    className="media-remove"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={!content || !scheduledTime}
          className="btn btn-submit"
        >
          <Send size={16} />
          Schedule Post
        </button>
      </form>
    </div>
  );
}
