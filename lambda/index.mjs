import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

const db = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const s3 = new S3Client({});

const TABLE = process.env.TABLE_NAME;
const BUCKET = process.env.BUCKET_NAME;
const MAX_SIZE = 10 * 1024 * 1024;

const allowedTypes = [
  "image/png", "image/jpeg", "image/gif", "image/webp",
  "application/pdf", "text/plain",
  "application/zip", "application/x-zip-compressed",
];

function guessType(name, type) {
  if (type && allowedTypes.includes(type)) return type;
  const n = (name || "").toLowerCase();
  if (n.endsWith(".png")) return "image/png";
  if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
  if (n.endsWith(".gif")) return "image/gif";
  if (n.endsWith(".webp")) return "image/webp";
  if (n.endsWith(".pdf")) return "application/pdf";
  if (n.endsWith(".txt")) return "text/plain";
  if (n.endsWith(".zip")) return "application/zip";
  return type;
}

function reply(status, data) {
  return {
    statusCode: status,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  };
}

async function createUpload(body) {
  const { fileName, size, expiry } = body;
  const type = guessType(fileName, body.type);

  if (!fileName || !size || !type) return reply(400, { error: "Missing file details" });
  if (size > MAX_SIZE) return reply(400, { error: "File is bigger than 10 MB" });
  if (!allowedTypes.includes(type)) return reply(400, { error: "This file type is not allowed" });
  if (expiry !== "1h" && expiry !== "1d") return reply(400, { error: "Expiry must be 1h or 1d" });

  const id = randomUUID().replace(/-/g, "").slice(0, 10);
  const cleanName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const s3Key = "files/" + id + "/" + cleanName;

  const seconds = expiry === "1h" ? 3600 : 86400;
  const expiresAt = Math.floor(Date.now() / 1000) + seconds;

  await db.send(new PutCommand({
    TableName: TABLE,
    Item: { id, fileName, size, s3Key, expiresAt, downloads: 0 },
  }));

  const uploadUrl = await getSignedUrl(
    s3,
    new PutObjectCommand({ Bucket: BUCKET, Key: s3Key, ContentType: type, ContentLength: size }),
    { expiresIn: 300 }
  );

  return reply(200, { id, uploadUrl, expiresAt });
}

async function getValidItem(id) {
  if (!id) return null;
  const result = await db.send(new GetCommand({ TableName: TABLE, Key: { id } }));
  const item = result.Item;
  if (!item) return null;
  if (item.expiresAt * 1000 < Date.now()) return null;
  return item;
}

async function getInfo(id) {
  const item = await getValidItem(id);
  if (!item) return reply(404, { error: "Link expired or file not found" });

  return reply(200, {
    fileName: item.fileName,
    size: item.size,
    expiresAt: item.expiresAt,
    downloads: item.downloads,
  });
}

async function download(id) {
  const item = await getValidItem(id);
  if (!item) return reply(404, { error: "Link expired or file not found" });

  await db.send(new UpdateCommand({
    TableName: TABLE,
    Key: { id },
    UpdateExpression: "ADD downloads :one",
    ExpressionAttributeValues: { ":one": 1 },
  }));

  const url = await getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: item.s3Key,
      ResponseContentDisposition: 'attachment; filename="' + item.fileName.replace(/"/g, "") + '"',
    }),
    { expiresIn: 60 }
  );

  return reply(200, { url });
}

export const handler = async (event) => {
  try {
    const method = event.requestContext.http.method;
    const path = event.rawPath;
    const body = event.body ? JSON.parse(event.body) : {};

    if (method === "POST" && path === "/upload") return await createUpload(body);
    if (method === "GET" && path === "/info") return await getInfo(event.queryStringParameters?.id);
    if (method === "POST" && path === "/download") return await download(body.id);

    return reply(404, { error: "Route not found" });
  } catch (err) {
    console.log(err);
    return reply(500, { error: "Something went wrong" });
  }
};
