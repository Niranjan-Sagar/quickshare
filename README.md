# Quick Share

Upload a small file and send someone a link. The link dies after 1 hour or 1 day.

Live site: https://d1td6h67ewnghl.cloudfront.net

## Features
- Max 10 MB
- png, jpg, gif, webp, pdf, txt, zip
- Expiry: 1 hour or 1 day
- Copy share link
- Download page: name, size, time left, download count
- Expired / unknown id shows an error

## AWS (ap-southeast-2)

| Thing | Name |
|---|---|
| DynamoDB | `quickshare-files` (pk `id`, TTL `expiresAt`) |
| Files bucket | private, CORS for PUT/GET, delete objects after 2 days |
| Website bucket | `quickshare-web` |
| Lambda | Function URL, env `TABLE_NAME` and `BUCKET_NAME` |
| CloudFront | `E353XCCUGPVMXW` / `d1td6h67ewnghl.cloudfront.net` |

No EC2. No AWS keys in the repo. Lambda uses its IAM role.

## Run locally
```
cd frontend
npm install
copy .env.example .env.local
```
Put your Function URL in `.env.local`, then `npm run dev`.

## Deploy
Edit `deploy.sh` if the website bucket or CloudFront id changed, then from Git Bash:

```
bash deploy.sh
```

HTML is `no-cache`. `/_next/static` is cached for a year.

## API
- `POST /upload` — name, size, type, expiry. Returns presigned PUT url.
- `GET /info?id=` — file details
- `POST /download` — bumps count, returns presigned GET url
