# Backlog

## Phase 5 — AWS Deployment

Deploy the app to a public URL on AWS.

**Decisions already made:**
- Region: `ap-southeast-1` (Singapore) — needs to be enabled in Account settings first
- EC2: `t2.micro` (free tier, ~$8-9/mo after free tier expires)
- Database: Postgres in Docker on EC2 (same as local, no RDS)
- Domain: EC2 public URL only (no custom domain for now)
- Images: Pull from ghcr.io (already built by CI) — don't build on EC2
- No HTTPS for now

**What needs to be done:**
1. Enable Singapore region in AWS Account settings
2. Launch t2.micro EC2 instance (Amazon Linux 2023, 20GB EBS)
3. Open ports 22 (SSH), 80 (frontend), 8080 (Java API) in Security Group
4. SSH in, install Docker + Docker Compose
5. Create `docker-compose.prod.yml` that pulls images from ghcr.io instead of building
6. Copy `.env` to the server (with real GEMINI_API_KEY, DB creds)
7. Run `docker compose -f docker-compose.prod.yml up -d`
8. Set up a budget alert at $20/mo in AWS Budgets
9. (Optional) Add a deploy step to GitHub Actions that SSHes in and restarts containers on push to main

**Cost:** ~$8-9/mo for EC2 after free tier. Everything else is free at this scale.

---

## S3 File Storage

Store uploaded files in S3 instead of keeping them in memory/container.

**What needs to change:**

**Java API:**
- Add AWS SDK v2 dependency to `build.gradle` (`software.amazon.awssdk:s3`)
- New `S3Service` class — wraps `S3Client`, handles `upload(key, bytes)`, `getPresignedUrl(key)`
- `DocumentService.uploadDocument()` — upload file to S3, store the S3 key
- `Document` entity — add `s3_key VARCHAR(500)` column
- Flyway migration — `V2__add_s3_key.sql`
- New endpoint `GET /api/documents/{id}/download` — returns a presigned URL (15 min expiry)
- `DocumentResponse` DTO — add optional `downloadUrl` field
- New env vars: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `S3_BUCKET_NAME`

**Python AI service:** No changes — Java still passes file as base64.

**Frontend:**
- Add download button on `DocumentDetail` that hits `/api/documents/{id}/download` and opens the URL

**Infrastructure:**
- `.env` — add AWS credentials
- `docker-compose.yml` — pass new env vars to `java-api` service
- GitHub Actions secrets — add `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `S3_BUCKET_NAME`
- Create an S3 bucket + IAM user with least-privilege policy (s3:PutObject, s3:GetObject on the bucket)
