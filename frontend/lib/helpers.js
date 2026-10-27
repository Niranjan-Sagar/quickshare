export function formatSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export function timeLeft(expiresAt) {
  const secs = expiresAt - Math.floor(Date.now() / 1000);
  if (secs <= 0) return "Expired";
  const hours = Math.floor(secs / 3600);
  const mins = Math.floor((secs % 3600) / 60);
  if (hours > 0) return hours + "h " + mins + "m left";
  return mins + "m left";
}
