#!/bin/bash
# Fill these in. Do not put AWS keys here. The AWS CLI uses your logged-in profile.
BUCKET="quickshare-web"
DISTRIBUTION_ID="E353XCCUGPVMXW"

set -e
export PATH="/c/Program Files/Amazon/AWSCLIV2:$PATH"
cd "$(dirname "$0")/frontend"

npm run build

aws s3 sync out/ "s3://$BUCKET" --delete --exclude "_next/static/*" --cache-control "no-cache"
aws s3 sync out/_next/static/ "s3://$BUCKET/_next/static/" --cache-control "public,max-age=31536000,immutable"

aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION_ID" --paths "/*"
