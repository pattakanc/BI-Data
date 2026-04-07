#!/bin/bash
set -e

# ========================================
# BI DataAnalytic - Cloud Run Deploy Script
# ========================================
# Prerequisites:
#   gcloud auth login pattakancpop@gmail.com
#   gcloud config set project <YOUR_PROJECT_ID>
# ========================================

PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
REGION="asia-southeast1"
BACKEND_SERVICE="bi-data-api"
FRONTEND_SERVICE="bi-data-web"

echo "=== Project: $PROJECT_ID ==="
echo "=== Region: $REGION ==="

# Enable required APIs
echo "[1/6] Enabling Cloud Run API..."
gcloud services enable run.googleapis.com containerregistry.googleapis.com cloudbuild.googleapis.com

# Deploy Backend
echo "[2/6] Building & deploying Backend..."
cd backend
gcloud builds submit --tag gcr.io/$PROJECT_ID/$BACKEND_SERVICE .
gcloud run deploy $BACKEND_SERVICE \
  --image gcr.io/$PROJECT_ID/$BACKEND_SERVICE \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --set-env-vars "DB_HOST=203.146.170.89,DB_PORT=5432,DB_NAME=BI_DataAnalytic,DB_USER=postgres,DB_PASSWORD=AutoFast@2025,JWT_SECRET=bi-dataanalytic-jwt-secret-2026,JWT_REFRESH_SECRET=bi-dataanalytic-refresh-secret-2026,PORT=8080"
cd ..

# Get backend URL
BACKEND_URL=$(gcloud run services describe $BACKEND_SERVICE --region $REGION --format 'value(status.url)' 2>/dev/null)
echo "=== Backend URL: $BACKEND_URL ==="

# Deploy Frontend
echo "[3/6] Building & deploying Frontend..."
cd frontend
gcloud builds submit \
  --tag gcr.io/$PROJECT_ID/$FRONTEND_SERVICE \
  --substitutions="_NEXT_PUBLIC_API_URL=${BACKEND_URL}/api" .

# Use cloudbuild with build arg
cat > /tmp/cloudbuild-frontend.yaml << EOFCB
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '--build-arg'
      - 'NEXT_PUBLIC_API_URL=${BACKEND_URL}/api'
      - '-t'
      - 'gcr.io/$PROJECT_ID/$FRONTEND_SERVICE'
      - '.'
images:
  - 'gcr.io/$PROJECT_ID/$FRONTEND_SERVICE'
EOFCB

gcloud builds submit --config=/tmp/cloudbuild-frontend.yaml .

gcloud run deploy $FRONTEND_SERVICE \
  --image gcr.io/$PROJECT_ID/$FRONTEND_SERVICE \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --set-env-vars "NEXT_PUBLIC_API_URL=${BACKEND_URL}/api"
cd ..

# Update backend CORS with frontend URL
FRONTEND_URL=$(gcloud run services describe $FRONTEND_SERVICE --region $REGION --format 'value(status.url)' 2>/dev/null)
echo "[4/6] Updating backend CORS..."
gcloud run services update $BACKEND_SERVICE \
  --region $REGION \
  --update-env-vars "CORS_ORIGIN=${FRONTEND_URL},http://localhost:3000"

echo ""
echo "========================================="
echo "  Deploy Complete!"
echo "========================================="
echo "  Backend:  $BACKEND_URL"
echo "  Frontend: $FRONTEND_URL"
echo "  Database: 203.146.170.89:5432/BI_DataAnalytic"
echo "========================================="
