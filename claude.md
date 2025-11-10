# Holiday Pachinko Admin Panel - Context Guide

## Project Overview

React-based admin panel for managing Holiday Pachinko game players with AI-powered avatar generation.

**Tech Stack:**
- Frontend: React 19 + Vite, TanStack Query, shadcn/ui components
- Backend: Firebase (Firestore, Storage, Hosting, Cloud Functions Gen2)
- AI: Google Cloud Vertex AI (Gemini 1.5 Flash)
- Testing: Vitest + React Testing Library

**Project Structure:**
```
admin-panel/
├── src/                    # React frontend
├── functions/              # Cloud Functions (Node.js 20)
├── agent-os/              # Specification system
│   └── specs/             # Feature specs with tasks.md
├── firebase.json          # Firebase config
├── firestore.rules        # Firestore security rules
└── storage.rules          # Storage security rules
```

## Critical Deployment Information

### Firebase Configuration
- **Project ID:** `holiday-pachinko`
- **Project Number:** `995852540189`
- **Region:** `us-central1` (Cloud Functions, Vertex AI)
- **Firestore:** `nam5` (North America)
- **Plan:** Blaze (pay-as-you-go) - REQUIRED for Cloud Functions

### Service Accounts

**Compute Service Account** (Runtime)
- Email: `995852540189-compute@developer.gserviceaccount.com`
- Used by: Cloud Functions at runtime
- Required Roles:
  - `roles/aiplatform.user` - Vertex AI access
  - `roles/artifactregistry.reader` - Read build artifacts
  - `roles/artifactregistry.writer` - Write build artifacts
  - `roles/eventarc.eventReceiver` - Receive Storage events
  - `roles/run.invoker` - Invoke Cloud Run services
  - `roles/logging.logWriter` - Write logs
  - Storage Object Viewer on `gs://gcf-v2-sources-995852540189-us-central1`

**Cloud Build Service Account**
- Email: `995852540189@cloudbuild.gserviceaccount.com`
- Used by: Building Cloud Functions
- Required Roles:
  - `roles/artifactregistry.writer`
  - `roles/cloudbuild.builds.builder`
  - `roles/cloudfunctions.developer`
  - `roles/logging.logWriter`
  - `roles/storage.admin`
  - `roles/iam.serviceAccountUser` on compute service account

**Eventarc Service Account**
- Email: `service-995852540189@gcp-sa-eventarc.iam.gserviceaccount.com`
- Used by: Storage event triggers
- Required Roles:
  - `roles/eventarc.serviceAgent`
  - `roles/storage.admin` (project-level)
  - `roles/storage.objectAdmin` on `gs://holiday-pachinko.firebasestorage.app`
  - `roles/storage.objectViewer` (project-level)

## Common Deployment Issues & Solutions

### Issue 1: "Changing from HTTPS to background triggered function not allowed"

**Symptom:**
```
Error: Changing from an HTTPS function to a background triggered function is not allowed.
Please delete your function and create a new one instead.
```

**Cause:** Firebase caches function configuration. If you previously deployed as HTTP and changed to event-driven, Firebase sees it as incompatible.

**Solution:**
```bash
# Delete the function first
firebase functions:delete FUNCTION_NAME --region=us-central1 --force

# Then deploy
firebase deploy --only functions
```

**Prevention:** Always use Firebase CLI (not gcloud) for event-driven functions to avoid type mismatches.

### Issue 2: Cloud Build Permission Errors

**Symptom:**
```
Build failed with status: FAILURE. Could not build the function due to a missing
permission on the build service account.
```

**Root Cause:** The compute service account needs multiple permissions that aren't automatically granted.

**Solution Steps:**

1. **Grant Storage Object Viewer on source bucket:**
```bash
gsutil iam ch serviceAccount:995852540189-compute@developer.gserviceaccount.com:roles/storage.objectViewer \
  gs://gcf-v2-sources-995852540189-us-central1
```

2. **Grant Artifact Registry permissions:**
```bash
gcloud projects add-iam-policy-binding holiday-pachinko \
  --member=serviceAccount:995852540189-compute@developer.gserviceaccount.com \
  --role=roles/artifactregistry.writer
```

3. **Grant service account user permission:**
```bash
gcloud iam service-accounts add-iam-policy-binding \
  995852540189-compute@developer.gserviceaccount.com \
  --member=serviceAccount:995852540189@cloudbuild.gserviceaccount.com \
  --role=roles/iam.serviceAccountUser \
  --project=holiday-pachinko
```

4. **Grant Cloud Build roles:**
```bash
gcloud projects add-iam-policy-binding holiday-pachinko \
  --member=serviceAccount:995852540189@cloudbuild.gserviceaccount.com \
  --role=roles/cloudbuild.builds.builder

gcloud projects add-iam-policy-binding holiday-pachinko \
  --member=serviceAccount:995852540189@cloudbuild.gserviceaccount.com \
  --role=roles/cloudfunctions.developer
```

### Issue 3: Eventarc Storage Bucket Validation Error

**Symptom:**
```
Permission "storage.buckets.get" denied on "Bucket \"holiday-pachinko.firebasestorage.app\"
could not be validated.
```

**Cause:** Eventarc service account cannot validate the Storage bucket exists.

**Solution:**
```bash
# Grant bucket-level permissions to Eventarc
gsutil iam ch serviceAccount:service-995852540189@gcp-sa-eventarc.iam.gserviceaccount.com:roles/storage.objectAdmin \
  gs://holiday-pachinko.firebasestorage.app
```

### Issue 4: Artifact Registry Access Denied

**Symptom:**
```
ERROR: failed to initialize analyzer: validating registry write access:
DENIED: Permission "artifactregistry.repositories.uploadArtifacts" denied
```

**Cause:** Compute service account needs write access to Artifact Registry for build cache.

**Solution:**
```bash
gcloud projects add-iam-policy-binding holiday-pachinko \
  --member=serviceAccount:995852540189-compute@developer.gserviceaccount.com \
  --role=roles/artifactregistry.writer
```

### Issue 5: Empty Cloud Build Logs

**Symptom:** Build fails but `gcloud builds log BUILD_ID` shows no output.

**Cause:** Permission error occurs before build starts, preventing log creation.

**Solution:** Check IAM permissions for the service account in GCP Console:
1. Visit https://console.cloud.google.com/iam-admin/iam?project=holiday-pachinko
2. Search for the service account email
3. Verify all required roles are present

## Deployment Checklist

### First-Time Setup

- [ ] Project on Blaze plan (required for Cloud Functions)
- [ ] Enable APIs:
  ```bash
  gcloud services enable cloudfunctions.googleapis.com
  gcloud services enable cloudbuild.googleapis.com
  gcloud services enable artifactregistry.googleapis.com
  gcloud services enable run.googleapis.com
  gcloud services enable eventarc.googleapis.com
  gcloud services enable aiplatform.googleapis.com
  gcloud services enable storage.googleapis.com
  ```
- [ ] Grant all IAM permissions (see "Service Accounts" section above)
- [ ] Create Firestore database (nam5 region)
- [ ] Initialize Firebase in project: `firebase init`

### Before Each Deployment

- [ ] Run tests: `npm test`
- [ ] Check for TypeScript errors: `npm run build`
- [ ] Verify firebase.json is correct
- [ ] Check current directory matches firebase.json structure

### Deploying Functions

**ALWAYS use Firebase CLI, not gcloud:**

```bash
# Deploy only functions
firebase deploy --only functions

# Deploy everything
firebase deploy

# Force deploy if cached
firebase deploy --only functions --force
```

**CRITICAL: After deployment, ALWAYS verify traffic routing:**

Gen2 Cloud Functions run on Cloud Run, which maintains multiple revisions. Sometimes old revisions continue serving traffic even after deployment. **You must verify and force traffic to the latest revision:**

```bash
# Check current revisions and traffic distribution
gcloud run revisions list --service=FUNCTION_NAME --region=us-central1 --platform=managed

# Force ALL traffic to the latest revision
gcloud run services update-traffic FUNCTION_NAME --region=us-central1 --to-latest --platform=managed
```

**Example:**
```bash
# After deploying generatePlayerAvatar
gcloud run revisions list --service=generateplayeravatar --region=us-central1 --platform=managed
gcloud run services update-traffic generateplayeravatar --region=us-central1 --to-latest --platform=managed
```

**If deployment fails:**
1. Check the error message carefully
2. Delete function if type changed: `firebase functions:delete FUNCTION_NAME --force`
3. Check Cloud Build logs: `gcloud builds list --limit=1`
4. Verify IAM permissions in GCP Console
5. **Ensure traffic is routed to latest revision** (see above)

### Deploying Frontend

```bash
# Build first
npm run build

# Deploy hosting
firebase deploy --only hosting

# Or deploy hosting + storage rules
firebase deploy --only hosting,storage
```

## Troubleshooting Commands

### Check Function Status
```bash
gcloud functions list --project=holiday-pachinko
```

### View Function Logs
```bash
# Real-time
firebase functions:log --only FUNCTION_NAME --follow

# Last 100 lines
firebase functions:log --only FUNCTION_NAME --lines 100
```

### Check Cloud Build Logs
```bash
# List recent builds
gcloud builds list --limit=5 --project=holiday-pachinko

# View specific build
gcloud builds log BUILD_ID --region=us-central1 --project=holiday-pachinko
```

### Check IAM Permissions
```bash
# List all roles for a service account
gcloud projects get-iam-policy holiday-pachinko \
  --flatten="bindings[].members" \
  --format="table(bindings.role)" \
  --filter="bindings.members:SERVICE_ACCOUNT_EMAIL"
```

### Check Firestore Collections
```bash
# Via Firebase CLI (if available)
firebase firestore:get COLLECTION/DOCUMENT

# Via Node script in functions/ directory
node -e "
const admin = require('firebase-admin');
admin.initializeApp();
admin.firestore().collection('COLLECTION').get()
  .then(snapshot => console.log(snapshot.size, 'documents'))
  .then(() => process.exit(0));
"
```

### Check Storage Bucket Permissions
```bash
gsutil iam get gs://holiday-pachinko.firebasestorage.app
```

## Key Architecture Decisions

### Why Vertex AI instead of Google AI Studio?

**Decision:** Use Vertex AI API with Application Default Credentials (ADC)

**Rationale:**
- Production-grade, enterprise solution
- Integrates with GCP IAM (no API keys to manage)
- Better for Cloud Functions (uses service account identity)
- Scales better for production workloads

**Implementation:**
```javascript
const { VertexAI } = require('@google-cloud/vertexai');
const vertexAI = new VertexAI({
  project: process.env.GCLOUD_PROJECT,
  location: 'us-central1'
});
```

### Cloud Functions Gen2 vs Gen1

**Using:** Gen2 (required for Eventarc)

**Differences:**
- Gen2 uses Cloud Run under the hood
- Gen2 required for Eventarc triggers (like Storage events)
- Gen2 has different IAM requirements
- Gen2 supports longer timeouts (up to 60 minutes)

### Storage Event Triggers

**Pattern:**
```javascript
const { onObjectFinalized } = require('firebase-functions/v2/storage');

exports.generatePlayerAvatar = onObjectFinalized(
  { timeoutSeconds: 300, memory: '512MiB' },
  async (event) => {
    const filePath = event.data.name; // e.g., "player-photos/abc123.jpg"
    // Process file...
  }
);
```

**Important:** Filter by path prefix in the function code, not in the trigger config.

## Known Limitations

1. **Image Generation Not Implemented Yet**
   - Current code uses Gemini (text-only model)
   - Gemini returns descriptions, not images
   - Need to integrate Imagen for actual image generation
   - See: functions/index.js:178-183 for TODO

2. **No Admin Authentication**
   - Admin panel is publicly accessible
   - Need to add Firebase Auth
   - Restrict access with authentication rules

3. **Settings Document Creation**
   - Must be created manually or via script
   - Not automatically initialized on first deploy
   - Run: `node functions/createSettings.js` after first deployment

## Performance Considerations

- **Cold starts:** ~3-5 seconds for first invocation
- **Warm execution:** ~500ms-2s depending on image size
- **Vertex AI latency:** ~5-15 seconds per generation
- **Total time:** 30-60 seconds from upload to avatar ready

**Optimization opportunities:**
- Cache Firestore settings in memory
- Use Cloud Run with min instances to reduce cold starts
- Batch process multiple images
- Implement request throttling

## Cost Estimates (per 100 players/month)

- Cloud Functions: <$1 (invocations + compute)
- Firestore: <$1 (reads/writes)
- Storage: <$1 (~1GB images)
- Vertex AI Gemini: $0-2 (text generation is cheap)
- **Total: ~$3-4/month**

Note: Actual image generation (Imagen) would cost more (~$0.02-0.10 per image).

## Quick Reference: File Locations

**Important Configuration:**
- `firebase.json` - Firebase project config
- `firestore.rules` - Firestore security rules
- `storage.rules` - Storage security rules
- `functions/package.json` - Cloud Functions dependencies
- `functions/index.js` - Cloud Function code

**Frontend:**
- `src/components/PlayerSetupForm.jsx` - Player creation form
- `src/components/PlayerSidebar.jsx` - Player list sidebar
- `src/components/PlayerDetails.jsx` - Avatar display
- `src/components/GameConfiguration.jsx` - AI prompt config
- `src/services/playerService.js` - Firestore operations
- `src/services/avatarService.js` - Avatar regeneration

**Deployment Guides:**
- `agent-os/specs/2025-11-08-ai-avatar-generation/DEPLOYMENT_GUIDE.md`
- `agent-os/specs/2025-11-08-ai-avatar-generation/IMPLEMENTATION_SUMMARY.md`

## Environment Variables

**Cloud Functions (set automatically by Firebase):**
- `GCLOUD_PROJECT` - Project ID
- `FIREBASE_CONFIG` - Firebase config JSON
- `PORT` - Port for Cloud Run (8080)

**No secrets required** - Uses Application Default Credentials (ADC)

## Testing After Deployment

1. **Verify function is deployed:**
   ```bash
   gcloud functions list --project=holiday-pachinko
   ```

2. **Check settings document exists:**
   ```bash
   cd functions && node -e "
   const admin = require('firebase-admin');
   admin.initializeApp();
   admin.firestore().collection('settings').doc('avatarGeneration').get()
     .then(doc => console.log('Settings:', doc.data()))
     .then(() => process.exit(0));
   "
   ```

3. **Test upload trigger:**
   - Upload a test image to Storage: `player-photos/test.jpg`
   - Check function logs: `firebase functions:log --follow`
   - Verify avatar created in: `player-avatars/test.jpg`

4. **Test admin panel:**
   - Open hosting URL
   - Create a player with photo
   - Verify avatar generates automatically
   - Check Configuration tab works

## Git Workflow

**Branch Strategy:** Main branch only (simple project)

**Commit Format:**
```
<type>: <description>

<details>

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

**Pre-commit checklist:**
- [ ] Tests pass (`npm test`)
- [ ] No TypeScript errors (`npm run build`)
- [ ] No console.log statements in production code
- [ ] Updated relevant documentation

## When Things Go Wrong

### "Function won't deploy at all"
1. Check Blaze plan is active
2. Verify all APIs are enabled
3. Review all IAM permissions (see Service Accounts section)
4. Try deleting function and redeploying fresh

### "Function deploys but doesn't trigger"
1. Check Cloud Run service exists: `gcloud run services list`
2. Verify Eventarc trigger: `gcloud eventarc triggers list`
3. Check Storage rules allow writes to `player-photos/`
4. Test with manual upload via Firebase Console

### "Function triggers but fails"
1. Check logs: `firebase functions:log --follow`
2. Verify settings document exists in Firestore
3. Check Vertex AI quota: https://console.cloud.google.com/apis/api/aiplatform.googleapis.com/quotas
4. Verify compute service account has `aiplatform.user` role

### "Can't read build logs"
This means permission error before build starts. Check:
1. Cloud Build service account has all required roles
2. Compute service account has storage.objectViewer on source bucket
3. No organization policies blocking builds

### "Frontend builds but shows errors at runtime"
1. Check browser console for errors
2. Verify Firebase config in environment
3. Check Firestore rules allow reads
4. Ensure all required collections exist

## Additional Resources

- **Firebase Console:** https://console.firebase.google.com/project/holiday-pachinko
- **GCP Console:** https://console.cloud.google.com/?project=holiday-pachinko
- **Cloud Functions Troubleshooting:** https://cloud.google.com/functions/docs/troubleshooting
- **Vertex AI Docs:** https://cloud.google.com/vertex-ai/docs
- **Agent-OS Specs:** See `agent-os/specs/` for detailed feature documentation
