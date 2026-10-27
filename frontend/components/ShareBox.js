import { useState } from "react";

export default function ShareBox({ id, onReset }) {
  const [copied, setCopied] = useState(false);
  const page = window.location.hostname === "localhost" ? "/download" : "/download.html";
  const link = window.location.origin + page + "?id=" + id;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
    } catch (e) {
      const box = document.createElement("textarea");
      box.value = link;
      document.body.appendChild(box);
      box.select();
      document.execCommand("copy");
      document.body.removeChild(box);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="box">
      <p className="ok">Your file is up.</p>
      <p className="muted">Anyone with this link can download it until it expires.</p>
      <label>Share link</label>
      <div className="link-row">
        <input type="text" value={link} readOnly onClick={(e) => e.target.select()} />
        <button className={copied ? "copied" : ""} onClick={copyLink}>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <button className="plain" onClick={onReset}>Upload another file</button>
    </div>
  );
}
