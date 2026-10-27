import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { getInfo, getDownloadUrl } from "../lib/api";
import { formatSize, timeLeft } from "../lib/helpers";

export default function Download() {
  const router = useRouter();
  const [info, setInfo] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;
    const id = router.query.id;
    if (!id) {
      setError("This link is missing a file id.");
      setLoading(false);
      return;
    }
    getInfo(id)
      .then((data) => setInfo(data))
      .catch((err) => setError(err.message))
      .then(() => setLoading(false));
  }, [router.isReady]);

  async function handleDownload() {
    setSaving(true);
    try {
      const data = await getDownloadUrl(router.query.id);
      window.location.href = data.url;
      setInfo({ ...info, downloads: info.downloads + 1 });
    } catch (err) {
      setError(err.message);
      setInfo(null);
    }
    setSaving(false);
  }

  return (
    <div className="page">
      <Head>
        <title>Download - Quick Share</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <h1>{info ? "Your file" : "Download"}</h1>
      <p className="sub">
        {info
          ? "Check the name and time left, then save it to your device."
          : "Open a share link to pick up a file."}
      </p>

      <div className="box">
        {loading && <p className="center muted">Looking up this file...</p>}
        {error && (
          <div className="center">
            <p className="error">{error}</p>
            <a href="/">Send a file instead</a>
          </div>
        )}
        {info && (
          <>
            <p className="filename">{info.fileName}</p>
            <div className="stats">
              <div className="stat"><span>Size</span><b>{formatSize(info.size)}</b></div>
              <div className="stat"><span>Time left</span><b>{timeLeft(info.expiresAt)}</b></div>
              <div className="stat"><span>Downloads</span><b>{info.downloads}</b></div>
            </div>
            <button onClick={handleDownload} disabled={saving}>
              {saving ? "Starting..." : "Download file"}
            </button>
            <a href="/">Upload your own file</a>
          </>
        )}
      </div>
    </div>
  );
}
