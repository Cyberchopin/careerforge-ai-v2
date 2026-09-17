#!/usr/bin/env bash
set -euo pipefail

: "${GOOGLE_CLOUD_PROJECT:?Set GOOGLE_CLOUD_PROJECT first.}"
: "${GEMINI_SECRET_NAME:=careerforge-gemini-key}"
: "${GOOGLE_CLOUD_REGION:=us-central1}"

gcloud config set project "${GOOGLE_CLOUD_PROJECT}"
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com

gcloud run deploy careerforge-ai \
  --source . \
  --region "${GOOGLE_CLOUD_REGION}" \
  --allow-unauthenticated \
  --port 8080 \
  --cpu 1 \
  --memory 512Mi \
  --concurrency 20 \
  --min 0 \
  --max 1 \
  --timeout 90s \
  --set-secrets "GEMINI_API_KEY=${GEMINI_SECRET_NAME}:latest" \
  --set-env-vars "GEMINI_MODEL=gemini-3.5-flash"

service_url="$(gcloud run services describe careerforge-ai --region "${GOOGLE_CLOUD_REGION}" --format='value(status.url)')"
curl --fail --silent --show-error "${service_url}/api/healthz"
printf '\nCareerForge AI: %s\n' "${service_url}"
