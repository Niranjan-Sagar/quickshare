import { useState } from "react";
import { createUpload, uploadToS3 } from "../lib/api";
import { formatSize } from "../lib/helpers";

const MAX_SIZE = 10 * 1024 * 1024;
const okTypes = [
  "image/png", "image/jpeg", "image/gif", "image/webp",
  "application/pdf", "text/plain",
  "application/zip", "application/x-zip-compressed",
];

function guessType(f) {
  if (f.type) return f.type;
  const n = f.name.toLowerCase();
  if (n.endsWith(".png")) return "image/png";
  if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
  if (n.endsWith(".gif")) return "image/gif";
  if (n.endsWith(".webp")) return "image/webp";
  if (n.endsWith(".pdf")) return "application/pdf";
  if (n.endsWith(".txt")) return "text/plain";
  if (n.endsWith(".zip")) return "application/zip";
  return "";
}

export default function UploadForm({ onDone }) {
  const [file, setFile] = useState(null);
  const [expiry, setExpiry] = useState("1h");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [over, setOver] = useState(false);

  function takeFile(f) {
    setError("");
    if (!f) return;
    if (f.size > MAX_SIZE) {
      setError("File is bigger than 10 MB");
      setFile(null);
      return;
    }
    if (!okTypes.includes(guessType(f))) {
      setError("Only images, pdf, txt and zip files are allowed");
      setFile(null);
      return;
    }
    setFile(f);
  }

  function pickFile(e) {
    takeFile(e.target.files[0]);
    e.target.value = "";
  }

  function onDrop(e) {
    e.preventDefault();
    setOver(false);
    takeFile(e.dataTransfer.files[0]);
  }

  async function handleUpload() {
    if (!file) {
      setError("Please choose a file first");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const type = guessType(file);
      const data = await createUpload(file.name, file.size, type, expiry);
      await uploadToS3(data.uploadUrl, file, type);
      onDone(data.id);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  const dropClass = "drop" + (over ? " over" : "") + (file ? " ready" : "");

  return (
    <div className="box">
      <div
        className={dropClass}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
      >
        {!file && (
          <input
            type="file"
            accept=".png,.jpg,.jpeg,.gif,.webp,.pdf,.txt,.zip"
            onChange={pickFile}
          />
        )}
        {file ? (
          <>
            <p className="file-name">{file.name}</p>
            <p className="file-meta">{formatSize(file.size)}</p>
            <button className="plain" type="button" onClick={() => setFile(null)}>
              Choose a different file
            </button>
          </>
        ) : (
          <>
            <p className="drop-title">{over ? "Drop it here" : "Drop a file here"}</p>
            <p className="hint">or click to browse · max 10 MB · png, jpg, gif, webp, pdf, txt, zip</p>
          </>
        )}
      </div>

      <label>Link expires in</label>
      <div className="pills">
        <button
          type="button"
          className={expiry === "1h" ? "pill on" : "pill"}
          onClick={() => setExpiry("1h")}
        >
          1 hour
        </button>
        <button
          type="button"
          className={expiry === "1d" ? "pill on" : "pill"}
          onClick={() => setExpiry("1d")}
        >
          1 day
        </button>
      </div>

      <button onClick={handleUpload} disabled={loading}>
        {loading ? "Uploading..." : "Get a share link"}
      </button>

      {error && <p className="error">{error}</p>}
    </div>
  );
}
