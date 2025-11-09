# AI Avatar Generation - Deployment Guide

## Prerequisites

Before deploying, ensure you have:
1. Firebase project on Blaze (pay-as-you-go) plan
2. Gemini API key from Google AI Studio (https://makersuite.google.com/app/apikey)
3. Firebase CLI installed and authenticated

## Step-by-Step Deployment

### Step 1: Set Up Gemini API Key in Secret Manager

```bash
# Navigate to project root
cd /path/to/admin-panel

# Store the Gemini API key securely
firebase functions:secrets:set GEMINI_API_KEY
# When prompted, paste your Gemini API key
```

**Verify the secret:**
```bash
firebase functions:secrets:access GEMINI_API_KEY
```

### Step 2: Create Firestore Settings Document

**Option A: Via Firebase Console**
1. Navigate to Firebase Console > Firestore Database
2. Click "Start collection"
3. Collection ID: `settings`
4. Document ID: `avatarGeneration`
5. Add the following fields:
   - **geminiAvatarPrompt** (string):
     ```
     Transform this photo into a cartoon elf character with holiday theme, maintaining facial features and expression
     ```
   - **placeholderAvatarUrl** (string):
     ```
     https://via.placeholder.com/512
     ```
   - **enabled** (boolean): `true`

**Option B: Via Firebase CLI Script**
```bash
# You can also create this via a script
firebase firestore:set settings/avatarGeneration '{
  "geminiAvatarPrompt": "Transform this photo into a cartoon elf character with holiday theme, maintaining facial features and expression",
  "placeholderAvatarUrl": "https://via.placeholder.com/512",
  "enabled": true
}'
```

### Step 3: Run Data Migration (If Existing Players)

If you have existing player documents in Firestore:

```bash
cd functions
node scripts/migratePlayerAvatarFields.js
cd ..
```

This script adds `avatarUrl` and `generationStatus` fields to existing players.

### Step 4: Deploy Firebase Storage Rules

```bash
firebase deploy --only storage
```

This deploys the updated storage.rules that allow:
- Public read access for player-photos/ and player-avatars/
- Authenticated write access for admins

### Step 5: Deploy Cloud Functions

```bash
firebase deploy --only functions
```

This deploys the `generatePlayerAvatar` Cloud Function that:
- Triggers on Storage uploads to player-photos/
- Generates avatars using Gemini API
- Uploads results to player-avatars/

**Expected output:**
```
✔ functions[generatePlayerAvatar(us-central1)] Successful update operation.
```

### Step 6: Build and Deploy Admin Panel

```bash
# Build the React app
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

### Step 7: Verify Deployment

**Test the deployment:**

1. **Access Admin Panel**
   - Navigate to your Firebase hosting URL
   - Should see "Holiday Pachinko Admin Panel" with tabs

2. **Test Configuration Tab**
   - Click "Configuration" tab
   - Verify AI Avatar Settings section loads
   - Edit the prompt and save
   - Confirm success toast appears

3. **Test Player Creation**
   - Click "Players" tab
   - Add a new player with photo
   - Verify:
     - Photo uploads successfully
     - Player appears in sidebar
     - Status shows "Generating avatar..."

4. **Check Cloud Function Logs**
   ```bash
   firebase functions:log --only generatePlayerAvatar
   ```
   - Look for successful avatar generation logs
   - Verify no errors

5. **Test Avatar Display**
   - After generation completes (30-60 seconds)
   - Refresh players list
   - Verify avatar displays in sidebar
   - Select player to view details
   - Confirm side-by-side display works

6. **Test Regeneration**
   - Select a player with generated avatar
   - Click "Regenerate Avatar" button
   - Verify loading state appears
   - Confirm new avatar displays after completion

## Firestore Security Rules (Optional Enhancement)

Consider adding Firestore security rules for the settings collection:

```javascript
// In firestore.rules
match /settings/{document} {
  allow read: if true;  // Public read
  allow write: if request.auth != null;  // Authenticated admin write
}
```

Deploy with:
```bash
firebase deploy --only firestore:rules
```

## Monitoring and Troubleshooting

### View Cloud Function Logs
```bash
# All logs
firebase functions:log

# Specific function
firebase functions:log --only generatePlayerAvatar

# Real-time streaming
firebase functions:log --only generatePlayerAvatar --follow
```

### Check Function Execution
```bash
# View function details
firebase functions:list
```

### Common Issues

**Issue: Cloud Function not triggering**
- Check Storage rules are deployed
- Verify files are uploaded to player-photos/ directory
- Check function logs for errors

**Issue: "Missing required API key"**
- Verify GEMINI_API_KEY secret is set
- Redeploy function after setting secret

**Issue: Avatar generation fails**
- Check Gemini API quota and billing
- Verify API key is valid
- Check function logs for specific error messages

**Issue: Placeholder avatar shows**
- This means generation failed
- Check function logs for error details
- Common causes: API rate limits, invalid image format

## Cost Estimation

### Firebase Costs
- **Cloud Functions**: ~$0.40 per 1M invocations + compute time
- **Firestore**: Minimal (settings doc + player updates)
- **Storage**: ~$0.026 per GB/month

### Gemini API Costs
- Check current pricing at https://ai.google.dev/pricing
- Typical: $0.002-0.01 per image generation

### Estimated Monthly Cost for 100 Players
- Cloud Functions: < $1
- Storage: < $1
- Gemini API: $1-2
- **Total: ~$3-4/month**

## Rollback Plan

If you need to rollback:

```bash
# Rollback functions to previous version
firebase functions:rollback generatePlayerAvatar --revision <revision-id>

# Rollback hosting
firebase hosting:rollback

# Rollback storage rules
firebase deploy --only storage  # (after reverting storage.rules file)
```

## Support

For issues or questions:
1. Check Cloud Function logs first
2. Verify all deployment steps completed
3. Review IMPLEMENTATION_SUMMARY.md for architecture details
4. Check Firebase Console for quota/billing issues

## Next Steps After Deployment

1. **Replace Image Generation API**
   - Current implementation uses placeholder
   - Integrate DALL-E, Imagen, or Stability AI
   - Update generateAvatarWithGemini function in functions/index.js

2. **Add Authentication**
   - Implement Firebase Authentication for admin users
   - Restrict admin panel access

3. **Add Monitoring**
   - Set up Firebase Performance Monitoring
   - Configure alerts for function failures

4. **Optimize Costs**
   - Implement caching for settings
   - Add rate limiting for regeneration
   - Consider batch processing
