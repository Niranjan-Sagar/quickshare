const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

async function request(path, options) {
  const res = await fetch(API + path, options);
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error("Could not talk to the API");
  }
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export function createUpload(fileName, size, type, expiry) {
  return request("/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileName, size, type, expiry }),
  });
}

export function getInfo(id) {
  return request("/info?id=" + encodeURIComponent(id));
}

export function getDownloadUrl(id) {
  return request("/download", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
}

export async function uploadToS3(uploadUrl, file, type) {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": type || file.type },
    body: file,
  });
  if (!res.ok) throw new Error("Could not upload the file");
}
