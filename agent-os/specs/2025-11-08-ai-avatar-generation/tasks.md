# Task Breakdown: AI Avatar Generation

## Overview
**Total Task Groups:** 7
**Estimated Total Tasks:** 35 subtasks across 7 major groups
**Feature Type:** New AI integration feature with Firebase Cloud Functions and Gemini API
**Tech Stack:** React 19, Vite, Tailwind CSS, shadcn/ui, Firebase (Firestore + Storage + Cloud Functions + Secret Manager), Gemini Vision API, TanStack Query

## Execution Strategy

This tasks list follows a strategic backend-first approach, starting with Firebase infrastructure and Cloud Functions before integrating into the frontend. The feature requires secure server-side processing via Cloud Functions to protect the Gemini API key.

**Key Constraints:**
- Firebase Cloud Functions must be deployed and tested before frontend integration
- Gemini API key must be stored in Firebase Secret Manager (never in environment variables)
- Storage trigger must be configured to automatically invoke avatar generation
- All tests should be minimal and focused (2-8 tests per group maximum)
- Maximum 10 additional integration tests in final testing phase

---

## Task List

### Firebase Infrastructure Setup

#### Task Group 1: Firebase Cloud Functions and Secret Manager Configuration
**Dependencies:** None (but requires Firebase project with Blaze plan for Cloud Functions)
**Estimated Effort:** 60-75 minutes
**Assigned To:** Backend/DevOps Engineer

- [x] 1.0 Complete Firebase Cloud Functions infrastructure setup
  - [x] 1.1 Initialize Firebase Cloud Functions in project
    - Run: `firebase init functions` in project root
    - Select JavaScript as language
    - Install dependencies in functions directory
    - Verify functions/package.json created with Firebase SDK
    - Configure Firebase emulator for local testing (optional but recommended)
  - [x] 1.2 Install required Cloud Functions dependencies
    - Navigate to functions/ directory
    - Install Google AI SDK: `npm install @google/generative-ai`
    - Install Firebase Admin SDK (should be included by default)
    - Install sharp for image processing: `npm install sharp`
    - Verify all dependencies in functions/package.json
  - [x] 1.3 Configure Firebase Secret Manager with Gemini API key
    - Obtain Gemini API key from Google AI Studio
    - Store secret using Firebase CLI: `firebase functions:secrets:set GEMINI_API_KEY`
    - Enter API key when prompted (never commit to code)
    - Verify secret stored: `firebase functions:secrets:access GEMINI_API_KEY`
    - Document secret name for Cloud Function configuration
  - [x] 1.4 Configure Firebase Storage security rules
    - Create/update storage.rules file
    - Add rules for player-photos/ directory: authenticated admin write access
    - Add rules for player-avatars/ directory: authenticated admin write access
    - Add public read access for both directories (for displaying images)
    - Deploy storage rules: `firebase deploy --only storage`
  - [x] 1.5 Verify Firebase project billing plan
    - Confirm Firebase project is on Blaze (pay-as-you-go) plan
    - Cloud Functions require Blaze plan to make external API calls
    - Check quota limits for Cloud Functions invocations
    - Document estimated costs for Gemini API usage

**Acceptance Criteria:**
- Firebase Cloud Functions initialized with JavaScript runtime
- Required dependencies installed in functions/ directory
- Gemini API key securely stored in Firebase Secret Manager
- Storage security rules deployed for player-photos/ and player-avatars/ directories
- Firebase project on Blaze plan with sufficient quota
- No test writing required for this infrastructure setup

---

### Firestore Data Model Updates

#### Task Group 2: Settings Collection and Player Schema Updates
**Dependencies:** Task Group 1 (Firebase infrastructure must be configured)
**Estimated Effort:** 30-45 minutes
**Assigned To:** Backend/Database Engineer

- [x] 2.0 Complete Firestore data model updates
  - [x] 2.1 Create settings collection and avatarGeneration document
    - Navigate to Firebase Console > Firestore Database
    - Create collection: `settings`
    - Create document with ID: `avatarGeneration`
    - Add field: `geminiAvatarPrompt` (string): "Transform this photo into a cartoon elf character with holiday theme, maintaining facial features and expression"
    - Add field: `placeholderAvatarUrl` (string): URL to default placeholder avatar image
    - Add field: `enabled` (boolean): true
    - Verify document created successfully
  - [x] 2.2 Update player document schema
    - Document new fields to be added to player documents (via code, not manual)
    - `avatarUrl` (string, nullable): URL to generated avatar in Firebase Storage
    - `generationStatus` (string): values 'pending', 'completed', 'failed'
    - Update existing playerService.js createPlayerDocument to include these fields
    - Default values: avatarUrl = null, generationStatus = 'pending'
  - [x] 2.3 Create migration script for existing player documents
    - Create functions/scripts/migratePlayerAvatarFields.js
    - Import Firebase Admin SDK for Firestore access
    - Query all documents in 'players' collection
    - Add avatarUrl: null and generationStatus: 'pending' to documents missing these fields
    - Log migration results (number of documents updated)
    - Make script idempotent (safe to run multiple times)
  - [x] 2.4 Test Firestore schema updates
    - Run migration script in development environment
    - Verify all existing player documents have new fields
    - Create a new player via PlayerForm and verify fields exist
    - Query settings/avatarGeneration document and verify prompt field accessible
    - Confirm no breaking changes to existing PlayerForm or PlayerSidebar

**Acceptance Criteria:**
- settings/avatarGeneration document created with geminiAvatarPrompt, placeholderAvatarUrl, and enabled fields
- Player document schema documented with avatarUrl and generationStatus fields
- Migration script created and tested for existing player documents
- All existing players have avatarUrl: null and generationStatus: 'pending'
- New players automatically get avatarUrl and generationStatus fields
- No test writing required for this data model update

---

### Cloud Function Development

#### Task Group 3: Gemini API Integration Cloud Function
**Dependencies:** Task Groups 1, 2 (Firebase Functions initialized, Firestore schema updated)
**Estimated Effort:** 90-120 minutes
**Assigned To:** Backend/Cloud Function Engineer

- [x] 3.0 Complete generatePlayerAvatar Cloud Function
  - [x] 3.1 Write 2-8 focused tests for Cloud Function logic
    - Limit to 2-8 highly focused tests maximum
    - Test only critical behaviors: Gemini API call success, image upload to Storage, Firestore update with avatarUrl
    - Use Firebase Functions Test SDK or mock Gemini API
    - Skip exhaustive testing of all error scenarios
    - Create test file: functions/test/generatePlayerAvatar.test.js
  - [x] 3.2 Create generatePlayerAvatar Cloud Function structure
    - Create functions/index.js or functions/src/generatePlayerAvatar.js
    - Import Firebase Admin SDK: admin.firestore(), admin.storage()
    - Import Google Generative AI SDK: GoogleGenerativeAI
    - Import onObjectFinalized from firebase-functions/v2/storage
    - Set up function to trigger on Storage object finalized in player-photos/ path
  - [x] 3.3 Implement Gemini API configuration and secret retrieval
    - Import defineSecret from firebase-functions/params
    - Define GEMINI_API_KEY secret: const geminiApiKey = defineSecret('GEMINI_API_KEY')
    - Configure function to require secret in runWith options
    - Initialize GoogleGenerativeAI client with API key
    - Get gemini-1.5-flash-latest model for image processing
  - [x] 3.4 Implement prompt retrieval from Firestore settings
    - In function handler, query settings/avatarGeneration document
    - Extract geminiAvatarPrompt field value
    - Handle case where document or field doesn't exist (use default prompt)
    - Log prompt being used for generation
    - Cache prompt for duration of function execution
  - [x] 3.5 Implement player photo download from Storage
    - Extract playerId from Storage object metadata or file path
    - Download uploaded photo file from player-photos/{playerId}.jpg
    - Convert file to base64-encoded string for Gemini API
    - Validate image format (JPEG, PNG, WebP)
    - Handle download errors gracefully
  - [x] 3.6 Implement Gemini Vision API call for avatar generation
    - Create Gemini prompt combining settings prompt + base64 image
    - Call model.generateContent() with prompt and image
    - Parse response to extract generated image data
    - Implement exponential backoff retry strategy for transient failures (max 3 retries)
    - Handle API rate limits with appropriate wait times
    - Handle API timeout errors (set timeout to 60 seconds)
  - [x] 3.7 Implement image format conversion to JPEG
    - Use sharp library to convert Gemini response to JPEG format
    - Set quality to 80% for consistent file size
    - Resize if necessary to reasonable dimensions (e.g., max 512x512px)
    - Convert to buffer for Firebase Storage upload
    - Handle conversion errors
  - [x] 3.8 Implement avatar upload to Firebase Storage
    - Create storage reference to player-avatars/{playerId}.jpg
    - Upload converted JPEG image buffer
    - Set content type to image/jpeg
    - Make file publicly readable (or use signed URL based on security rules)
    - Retrieve and return download URL using getDownloadURL
  - [x] 3.9 Implement Firestore player document update
    - Query player document by playerId
    - Update document with avatarUrl (download URL from Storage)
    - Update generationStatus to 'completed'
    - Handle case where player document doesn't exist
    - Log successful update
  - [x] 3.10 Implement error handling and logging
    - Wrap entire function in try-catch block
    - Log errors with structured format: timestamp, playerId, errorType, errorMessage, stackTrace
    - Update player document with generationStatus: 'failed' on error
    - Set avatarUrl to placeholderAvatarUrl from settings on failure
    - Return appropriate error response (don't throw to avoid function retry storms)
    - Use Firebase Functions logger for consistent logging
  - [x] 3.11 Deploy Cloud Function to Firebase
    - Run: `firebase deploy --only functions:generatePlayerAvatar`
    - Verify function deployed successfully in Firebase Console
    - Check function logs for any initialization errors
    - Verify function has access to GEMINI_API_KEY secret
    - Test Storage trigger configuration
  - [x] 3.12 Ensure Cloud Function tests pass
    - Run ONLY the 2-8 tests written in 3.1
    - Verify Gemini API call integration works
    - Verify image upload to player-avatars/ succeeds
    - Verify Firestore update with avatarUrl completes
    - Do NOT run entire test suite at this stage

**Acceptance Criteria:**
- The 2-8 tests written in 3.1 pass successfully
- generatePlayerAvatar Cloud Function triggers on Storage upload to player-photos/
- Function retrieves Gemini API key securely from Secret Manager
- Function reads current prompt from settings/avatarGeneration document
- Function downloads player photo from Storage successfully
- Function calls Gemini Vision API with photo and prompt
- Function converts Gemini response to JPEG format
- Function uploads generated avatar to player-avatars/{playerId}.jpg
- Function updates player document with avatarUrl and generationStatus: 'completed'
- Function handles errors gracefully and sets generationStatus: 'failed' with placeholder
- Function implements exponential backoff retry for transient Gemini API failures
- Function logs all operations with structured format
- Function deployed successfully to Firebase

---

### Service Layer Updates

#### Task Group 4: Admin Panel Service Functions for Avatar Operations
**Dependencies:** Task Group 3 (Cloud Function must be deployed)
**Estimated Effort:** 45-60 minutes
**Assigned To:** Frontend/Integration Engineer

- [x] 4.0 Complete admin panel service layer for avatar operations
  - [x] 4.1 Write 2-8 focused tests for avatar service functions
    - Limit to 2-8 highly focused tests maximum
    - Test only critical operations: updateAvatarPrompt saves to Firestore, regenerateAvatar triggers Cloud Function, fetchAvatarSettings retrieves settings document
    - Use Firebase emulator or mock Firebase SDK
    - Skip exhaustive edge case testing
    - Create or extend test file: src/services/__tests__/avatarService.test.js
  - [x] 4.2 Create avatarService.js module
    - Create new file: src/services/avatarService.js
    - Import necessary Firestore functions: doc, getDoc, updateDoc, setDoc
    - Import Firebase Storage functions if needed
    - Import Firebase Functions SDK: getFunctions, httpsCallable
    - Follow modular SDK import pattern for tree-shaking
  - [x] 4.3 Implement fetchAvatarSettings function
    - Accept no parameters
    - Create reference to settings/avatarGeneration document
    - Fetch document using getDoc()
    - Return object with geminiAvatarPrompt, placeholderAvatarUrl, enabled fields
    - Handle case where document doesn't exist (return default values)
    - Throw user-friendly error on fetch failure
  - [x] 4.4 Implement updateAvatarPrompt function
    - Accept { geminiAvatarPrompt } as parameter
    - Create reference to settings/avatarGeneration document
    - Update document with new prompt using updateDoc()
    - If document doesn't exist, create it using setDoc()
    - Return updated settings object
    - Throw user-friendly error on update failure
  - [x] 4.5 Implement regenerateAvatar function
    - Accept { playerId, originalPhotoUrl } as parameters
    - This function manually triggers avatar regeneration by calling Cloud Function
    - Use httpsCallable to invoke Cloud Function with playerId
    - Wait for function completion and return result
    - Handle Cloud Function errors and timeouts gracefully
    - Throw user-friendly error messages for admin UI
  - [x] 4.6 Update playerService.js to handle avatar fields
    - Modify fetchPlayers to include avatarUrl and generationStatus in returned data
    - Modify updatePlayer to handle avatarUrl field updates if needed
    - Ensure createPlayer still sets generationStatus: 'pending' (Cloud Function will update)
    - No breaking changes to existing playerService functions
  - [x] 4.7 Ensure avatar service tests pass
    - Run ONLY the 2-8 tests written in 4.1
    - Verify fetchAvatarSettings retrieves settings document
    - Verify updateAvatarPrompt saves prompt to Firestore
    - Verify regenerateAvatar triggers Cloud Function call
    - Do NOT run entire test suite at this stage

**Acceptance Criteria:**
- The 2-8 tests written in 4.1 pass successfully
- avatarService.js created with fetch, update, and regenerate functions
- fetchAvatarSettings function retrieves settings/avatarGeneration document
- updateAvatarPrompt function updates Firestore settings document
- regenerateAvatar function invokes Cloud Function with playerId
- playerService.js updated to include avatarUrl and generationStatus in queries
- All functions use Firebase v9+ modular SDK patterns
- Error handling follows existing user-friendly message patterns

---

### Admin Panel: Prompt Configuration UI

#### Task Group 5: Game Configuration Page - AI Avatar Settings Section
**Dependencies:** Task Group 4 (avatarService.js must exist)
**Estimated Effort:** 60-75 minutes
**Assigned To:** Frontend/UI Designer

- [x] 5.0 Complete AI Avatar Settings UI in Game Configuration page
  - [x] 5.1 Write 2-8 focused tests for prompt configuration UI
    - Limit to 2-8 highly focused tests maximum
    - Test only critical behaviors: prompt loads from Firestore, save button updates settings, character count displays correctly
    - Use React Testing Library with mock TanStack Query
    - Skip exhaustive testing of all UI states
    - Create test file: src/components/__tests__/GameConfiguration.test.jsx
  - [x] 5.2 Create or locate GameConfiguration component
    - Check if src/components/GameConfiguration.jsx exists
    - If not, create new component with shadcn/ui Card layout
    - If exists, prepare to add new section for AI Avatar Settings
    - Import Card, CardHeader, CardTitle, CardContent components
    - Set up component structure with header "Game Configuration"
  - [x] 5.3 Implement TanStack Query for fetching avatar settings
    - Import useQuery from @tanstack/react-query
    - Import fetchAvatarSettings from avatarService
    - Create query with queryKey: ['avatarSettings']
    - Set queryFn to fetchAvatarSettings
    - Destructure data, isLoading, isError from useQuery
    - Handle loading and error states
  - [x] 5.4 Implement prompt form state management
    - Use useState to manage prompt text value
    - Initialize with data.geminiAvatarPrompt from query
    - Use useEffect to update state when query data changes
    - Track "dirty" state to enable/disable Save button
    - Calculate character count from prompt text length
  - [x] 5.5 Implement AI Avatar Settings section UI
    - Add new Card section within GameConfiguration component
    - CardTitle: "AI Avatar Settings"
    - Add descriptive text: "Configure the AI prompt used to generate player avatars"
    - Use Textarea component from shadcn/ui for prompt input
    - Set textarea rows={4} for multi-line editing
    - Apply proper spacing with Tailwind utilities
  - [x] 5.6 Implement character count display
    - Display character count below textarea: "{count} characters"
    - Show recommended length guidance: "Recommended: 100-500 characters"
    - Use muted text color for guidance text
    - Apply conditional styling if count is outside recommended range
    - Update count in real-time as user types
  - [x] 5.7 Implement Save button with mutation
    - Create mutation using useMutation hook
    - Import updateAvatarPrompt from avatarService
    - Set mutationFn to updateAvatarPrompt
    - Configure onSuccess: invalidate 'avatarSettings' query, show success toast
    - Configure onError: show error toast with user-friendly message
    - Place Save button below textarea, aligned to right
  - [x] 5.8 Implement save button state management
    - Disable Save button when prompt hasn't changed (not dirty)
    - Disable Save button when mutation.isPending
    - Show loading state on button during save: "Saving..." with spinner
    - Enable button only when prompt is modified
    - Use Button variant="default" for primary action styling
  - [x] 5.9 Implement toast notifications
    - Success toast: "AI avatar prompt updated successfully"
    - Error toast: Display error message from mutation
    - Use existing toast system (Sonner) from shadcn/ui
    - Configure toast duration (4-5 seconds)
  - [x] 5.10 Add GameConfiguration to App routing/navigation
    - If using routing, add route to GameConfiguration component
    - If not using routing, add navigation link or tab to access configuration page
    - Ensure component is accessible from admin panel navigation
    - Test navigation to and from GameConfiguration page
  - [x] 5.11 Ensure prompt configuration UI tests pass
    - Run ONLY the 2-8 tests written in 5.1
    - Verify prompt loads from Firestore on component mount
    - Verify Save button triggers updateAvatarPrompt mutation
    - Verify character count updates as user types
    - Do NOT run entire test suite at this stage

**Acceptance Criteria:**
- The 2-8 tests written in 5.1 pass successfully
- GameConfiguration component created or updated with AI Avatar Settings section
- Prompt loads from Firestore settings/avatarGeneration document
- Textarea allows editing of Gemini prompt with multi-line support
- Character count displays below textarea and updates in real-time
- Recommended length guidance shown (100-500 characters)
- Save button disabled when prompt unchanged or mutation pending
- Save button shows loading state during mutation
- Successful save shows success toast and invalidates query
- Error handling shows user-friendly error toast
- GameConfiguration accessible from admin panel navigation

---

### Admin Panel: Avatar Regeneration & Display

#### Task Group 6: Player Details Avatar Regeneration and Display Updates
**Dependencies:** Task Groups 4, 5 (avatarService.js and prompt configuration must exist)
**Estimated Effort:** 75-90 minutes
**Assigned To:** Frontend/UI Designer

- [x] 6.0 Complete avatar regeneration and display updates
  - [x] 6.1 Write 2-8 focused tests for avatar regeneration feature
    - Limit to 2-8 highly focused tests maximum
    - Test only critical behaviors: Regenerate button triggers mutation, loading state displays during regeneration, avatar updates after regeneration
    - Use React Testing Library with mock TanStack Query
    - Skip exhaustive testing of all scenarios
    - Create or extend test file: src/components/__tests__/PlayerDetails.test.jsx
  - [x] 6.2 Create or locate PlayerDetails component
    - Check if player details view exists (modal or separate page)
    - If not, create src/components/PlayerDetails.jsx
    - Import Card, Button components from shadcn/ui
    - Set up component to receive selectedPlayer prop
    - Follow existing admin panel design patterns
  - [x] 6.3 Implement side-by-side avatar display layout
    - Create two-column layout for original photo and generated avatar
    - Left column: Original Photo section
    - Right column: Generated Avatar section
    - Each image displayed at 200x200 pixels
    - Apply rounded corners (rounded-lg) and border
    - Use CSS Grid or Flexbox for responsive layout
  - [x] 6.4 Implement original photo display
    - Display label: "Original Photo"
    - Show image from player.originalPhotoUrl
    - Apply 200x200px sizing with object-fit: cover
    - Add alt text: "Original photo of {player.name}"
    - Handle case where originalPhotoUrl is null (show placeholder)
  - [x] 6.5 Implement generated avatar display
    - Display label: "Generated Avatar"
    - Show image from player.avatarUrl
    - Apply 200x200px sizing with object-fit: cover
    - Add alt text: "Generated avatar of {player.name}"
    - Fallback to originalPhotoUrl if avatarUrl is null
    - Show "generating..." badge if generationStatus === 'pending'
    - Show "failed" badge if generationStatus === 'failed'
  - [x] 6.6 Implement regenerate avatar mutation
    - Create mutation using useMutation hook
    - Import regenerateAvatar from avatarService
    - Set mutationFn to call regenerateAvatar with playerId and originalPhotoUrl
    - Configure onSuccess: invalidate 'players' query, show success toast
    - Configure onError: show error toast with user-friendly message
    - Follow existing mutation patterns from PlayerForm
  - [x] 6.7 Implement Regenerate Avatar button
    - Place button below generated avatar image
    - Button text: "Regenerate Avatar"
    - Use Button variant="outline" for secondary action
    - Show loading state when mutation.isPending: "Regenerating..." with spinner
    - Disable button during mutation
    - Add proper ARIA label for accessibility
  - [x] 6.8 Update PlayerSidebar to display generated avatars
    - Modify src/components/PlayerSidebar.jsx
    - Change avatar source from originalPhotoUrl to avatarUrl
    - Fallback to originalPhotoUrl if avatarUrl is null
    - Maintain existing circular avatar thumbnail styling (48x48px)
    - Show "generating..." overlay badge if generationStatus === 'pending'
    - No breaking changes to existing sidebar functionality
  - [x] 6.9 Update player lists to show generated avatars
    - If other player list components exist, update them to use avatarUrl
    - Follow same fallback pattern: avatarUrl || originalPhotoUrl
    - Maintain consistent avatar styling across all lists
    - Ensure no breaking changes to existing list functionality
  - [x] 6.10 Handle regeneration loading state
    - During regeneration, update player.generationStatus to 'pending' in UI
    - Show loading indicator on avatar image in sidebar
    - Disable Regenerate button during processing
    - Poll or refetch player data after regeneration completes
    - Update UI when generationStatus changes to 'completed'
  - [x] 6.11 Ensure avatar regeneration tests pass
    - Run ONLY the 2-8 tests written in 6.1
    - Verify Regenerate button triggers regenerateAvatar mutation
    - Verify loading state displays during regeneration
    - Verify avatar updates after successful regeneration
    - Do NOT run entire test suite at this stage

**Acceptance Criteria:**
- The 2-8 tests written in 6.1 pass successfully
- PlayerDetails component displays original photo and generated avatar side-by-side
- Each image displayed at 200x200px with labels
- Regenerate Avatar button below generated avatar
- Button shows loading state during regeneration
- Successful regeneration invalidates players query and shows success toast
- Error handling shows user-friendly error toast
- PlayerSidebar updated to show avatarUrl with fallback to originalPhotoUrl
- Circular avatars (48x48px) maintained in sidebar
- "generating..." badge shown for pending generation status
- Player lists updated to show generated avatars
- No breaking changes to existing PlayerSidebar or list functionality

---

### Integration Testing & End-to-End Workflow

#### Task Group 7: Integration Testing and Manual Testing
**Dependencies:** Task Groups 1-6 (All implementation must be complete)
**Estimated Effort:** 60-75 minutes
**Assigned To:** QA/Integration Engineer

- [x] 7.0 Review existing tests and fill critical gaps only
  - [x] 7.1 Review tests from Task Groups 3-6
    - Review the 2-8 tests written for Cloud Function (Task 3.1)
    - Review the 2-8 tests written for avatarService (Task 4.1)
    - Review the 2-8 tests written for prompt configuration UI (Task 5.1)
    - Review the 2-8 tests written for avatar regeneration (Task 6.1)
    - Total existing tests: approximately 8-32 tests
    - Document what workflows are currently covered
  - [x] 7.2 Analyze test coverage gaps for AI Avatar Generation feature only
    - Identify critical end-to-end user workflows that lack test coverage
    - Focus ONLY on gaps related to this spec's feature requirements
    - Prioritize integration points: Storage trigger → Cloud Function → Firestore update
    - Do NOT assess entire application test coverage
    - Do NOT test exhaustive edge cases or error scenarios
  - [x] 7.3 Write up to 10 additional strategic integration tests maximum
    - Add maximum 10 new integration tests to fill identified critical gaps
    - Focus on end-to-end workflows: player registration → avatar generation → display
    - Test integration between Cloud Function trigger and Storage upload
    - Test prompt configuration → Cloud Function reads updated prompt
    - Test regeneration → Cloud Function re-processes with new prompt
    - Do NOT write comprehensive unit test coverage for all functions
    - Skip performance tests, accessibility audits, and edge case scenarios
    - Create test file: src/__tests__/integration/ai-avatar-generation.test.jsx
  - [x] 7.4 Run feature-specific tests only
    - Run ONLY tests related to AI Avatar Generation feature
    - Expected total: approximately 18-42 tests maximum
    - Verify critical workflows pass
    - Do NOT run entire application test suite
    - Verify Cloud Function deployment tests pass
  - [x] 7.5 Manual testing: Player registration with avatar generation
    - Create new player via PlayerForm with photo upload
    - Verify photo uploads to player-photos/{playerId}.jpg in Storage
    - Verify Cloud Function triggers automatically
    - Verify loading message displays: "Elf-ifying your photo..."
    - Wait for Cloud Function to complete (check logs)
    - Verify generated avatar appears in player-avatars/{playerId}.jpg
    - Verify player document updated with avatarUrl and generationStatus: 'completed'
    - Verify generated avatar displays in PlayerSidebar
  - [x] 7.6 Manual testing: Prompt configuration
    - Navigate to GameConfiguration page
    - Verify current prompt loads from Firestore
    - Edit prompt text in textarea
    - Verify character count updates in real-time
    - Click Save button and verify success toast
    - Refresh page and verify updated prompt persists
    - Verify no console errors
  - [x] 7.7 Manual testing: Avatar regeneration
    - Select a player in PlayerSidebar with existing avatar
    - Open player details view
    - Verify original photo and generated avatar display side-by-side
    - Click "Regenerate Avatar" button
    - Verify loading state displays on button
    - Wait for regeneration to complete
    - Verify avatar updates with newly generated image
    - Verify success toast displays
    - Verify updated avatar appears in PlayerSidebar immediately
  - [x] 7.8 Manual testing: Error handling scenarios
    - Test with invalid Gemini API key (temporarily): verify generationStatus: 'failed' and placeholder avatar
    - Test with missing settings/avatarGeneration document: verify default prompt used
    - Test with network disconnection during regeneration: verify error toast
    - Test with extremely long prompt (>1000 chars): verify character count warning
    - Verify all error messages are user-friendly (no technical details exposed)
  - [x] 7.9 Manual testing: Cloud Function logs review
    - Navigate to Firebase Console > Functions > Logs
    - Verify structured logs for avatar generation: timestamp, playerId, status
    - Check for any error logs with stack traces
    - Verify retry logic logs for transient failures
    - Confirm no sensitive data (API keys) logged
  - [x] 7.10 Manual testing: End-to-end workflow checklist
    - Complete player registration → avatar generation → display in sidebar (full workflow)
    - Update AI prompt → regenerate avatar → verify new style applied
    - Delete player → verify both original photo and avatar removed from Storage
    - Create player with invalid image format → verify error handling and placeholder
    - Test with Gemini API rate limit → verify exponential backoff retry
    - Verify no console errors or warnings during normal usage
    - Verify Firebase Storage costs are reasonable for expected usage

**Acceptance Criteria:**
- All feature-specific tests pass (approximately 28-52 tests total)
- Critical user workflows for AI Avatar Generation are covered by tests
- No more than 10 additional tests added when filling in testing gaps
- Testing focused exclusively on this spec's feature requirements
- Manual testing checklist completed with all items passing
- Player registration automatically triggers avatar generation
- Generated avatars display correctly in PlayerSidebar and player details
- Prompt configuration saves and applies to subsequent generations
- Avatar regeneration uses current prompt from Firestore settings
- Error handling gracefully falls back to placeholder avatar
- Cloud Function logs show structured error and success messages
- No console errors or warnings in development mode
- No sensitive data exposed in logs or client-side code

---

## Summary of Execution Order

**Recommended implementation sequence:**

1. **Task Group 1: Firebase Infrastructure Setup** (60-75 min)
   - Initialize Cloud Functions, install dependencies, configure Secret Manager
   - CRITICAL: Must be completed before Cloud Function development

2. **Task Group 2: Firestore Data Model Updates** (30-45 min)
   - Create settings collection, update player schema
   - Establishes data foundation for avatar generation

3. **Task Group 3: Cloud Function Development** (90-120 min)
   - Build generatePlayerAvatar Cloud Function with Gemini API integration
   - Deploy and test Cloud Function independently
   - Longest and most complex backend task group

4. **Task Group 4: Service Layer Updates** (45-60 min)
   - Create avatarService.js for admin panel operations
   - Update playerService.js to handle avatar fields

5. **Task Group 5: Prompt Configuration UI** (60-75 min)
   - Build Game Configuration page with AI Avatar Settings section
   - Enable admin to manage Gemini prompt

6. **Task Group 6: Avatar Regeneration & Display** (75-90 min)
   - Add Regenerate Avatar button to player details
   - Update PlayerSidebar and lists to display generated avatars

7. **Task Group 7: Integration Testing** (60-75 min)
   - Fill critical test gaps, run all feature tests, manual testing
   - Final verification before feature completion

**Total Estimated Effort:** 7 - 9 hours

---

## Key Technical Decisions

### Security Architecture
- **API Key Storage:** Gemini API key stored in Firebase Secret Manager (never in code or environment variables)
- **Cloud Function Access:** Only authenticated admin users can trigger manual regeneration
- **Storage Security:** Firebase Storage rules restrict write access to authenticated admins
- **Public Read Access:** Generated avatars publicly readable for display in public game

### Avatar Generation Workflow
1. Player uploads photo via PlayerForm
2. Photo saves to Storage: player-photos/{playerId}.jpg
3. Storage upload triggers generatePlayerAvatar Cloud Function automatically
4. Cloud Function downloads photo from Storage
5. Cloud Function fetches current prompt from Firestore settings/avatarGeneration
6. Cloud Function calls Gemini Vision API with photo + prompt
7. Cloud Function converts response to JPEG format
8. Cloud Function uploads generated avatar to player-avatars/{playerId}.jpg
9. Cloud Function updates player document: avatarUrl, generationStatus: 'completed'
10. Frontend refetches players query and displays updated avatar

### Regeneration Workflow
1. Admin clicks "Regenerate Avatar" button in player details
2. Frontend calls regenerateAvatar from avatarService
3. Service invokes Cloud Function manually with playerId
4. Cloud Function uses current prompt from Firestore (not original generation prompt)
5. Same generation workflow as above (steps 4-9)
6. Frontend invalidates players query and refetches
7. Updated avatar displays immediately in UI

### Error Handling Strategy
- **Transient Failures:** Exponential backoff retry (max 3 attempts)
- **Permanent Failures:** Set generationStatus: 'failed', use placeholder avatar
- **User Experience:** Registration proceeds even if avatar generation fails
- **Admin Notification:** Error logs in Cloud Function logs for admin review
- **Fallback Display:** Always show originalPhotoUrl if avatarUrl is null

### Image Processing Pipeline
1. Download original photo from Storage
2. Validate format (JPEG, PNG, WebP)
3. Convert to base64 for Gemini API
4. Receive generated image from Gemini
5. Convert response to JPEG format using sharp
6. Resize to max 512x512px if needed
7. Set quality to 80% for consistent file size
8. Upload to player-avatars/ directory

---

## Testing Strategy Summary

### Test Distribution
- **Task Group 3:** 2-8 tests for Cloud Function logic
- **Task Group 4:** 2-8 tests for avatarService functions
- **Task Group 5:** 2-8 tests for prompt configuration UI
- **Task Group 6:** 2-8 tests for avatar regeneration UI
- **Task Group 7:** Maximum 10 integration tests
- **Total Expected:** Approximately 18-42 tests (well within limits)

### Focus Areas
- Cloud Function Gemini API integration
- Storage upload and download operations
- Firestore settings and player document updates
- Prompt configuration UI save functionality
- Avatar regeneration trigger and display update
- End-to-end player registration with avatar generation
- Error handling and fallback to placeholder avatar

### Testing Constraints
- Mock Gemini API in tests (no real API calls)
- Use Firebase Functions Test SDK for Cloud Function tests
- Mock Firebase SDK for admin panel service tests
- Focus on user workflows, not implementation details
- Skip exhaustive edge case testing during development
- Manual testing checklist for final validation

---

## Files to Create

### Cloud Functions
- `/functions/index.js` or `/functions/src/generatePlayerAvatar.js` - Cloud Function for avatar generation
- `/functions/test/generatePlayerAvatar.test.js` - Cloud Function tests
- `/functions/scripts/migratePlayerAvatarFields.js` - Data migration script
- `/functions/package.json` - Cloud Functions dependencies

### Admin Panel Services
- `/src/services/avatarService.js` - Avatar settings and regeneration service
- `/src/services/__tests__/avatarService.test.js` - Avatar service tests

### Admin Panel Components
- `/src/components/GameConfiguration.jsx` - Game configuration page with AI Avatar Settings
- `/src/components/__tests__/GameConfiguration.test.jsx` - Configuration page tests
- `/src/components/PlayerDetails.jsx` - Player details with avatar regeneration (if doesn't exist)
- `/src/components/__tests__/PlayerDetails.test.jsx` - Player details tests

### Integration Tests
- `/src/__tests__/integration/ai-avatar-generation.test.jsx` - End-to-end integration tests

### Configuration Files
- `/storage.rules` - Firebase Storage security rules (update existing or create)

## Files to Modify

- `/src/services/playerService.js` - Add avatarUrl and generationStatus to player queries
- `/src/services/__tests__/playerService.test.js` - Update tests for new player fields
- `/src/components/PlayerSidebar.jsx` - Update to display avatarUrl instead of originalPhotoUrl
- `/src/components/__tests__/PlayerSidebar.test.jsx` - Add tests for avatar display
- `/src/App.jsx` - Add navigation/route to GameConfiguration component
- `/src/firebase.js` - Import Firebase Functions SDK: getFunctions

## Dependencies to Install

### Cloud Functions (in functions/ directory)
- `@google/generative-ai` - Gemini AI SDK
- `sharp` - Image processing library
- Firebase Admin SDK (included by default)

### Admin Panel (in root directory)
- No new dependencies required (Firebase Functions SDK already available)

---

## Out of Scope Reminders

- Do NOT implement preview or approval step for generated avatars
- Do NOT implement multiple avatar style options or user choice between variations
- Do NOT implement manual editing, cropping, or annotation tools for avatars
- Do NOT implement batch regeneration function to process all players at once
- Do NOT implement user-initiated regeneration from public game interface (admin-only)
- Do NOT implement avatar history or versioning to track previous generations
- Do NOT implement custom avatar uploads bypassing Gemini generation
- Do NOT implement real-time generation status updates using Firestore listeners (use query refetch)
- Do NOT implement A/B testing different prompts with analytics
- Do NOT implement avatar quality rating or feedback system
- generationStatus is set by Cloud Function only, not manually by admin

---

## Standards Compliance Checklist

### Tech Stack Alignment
- Firebase Cloud Functions for serverless backend processing
- Firebase Secret Manager for API key security
- Firebase Storage for file hosting (player-photos/ and player-avatars/)
- Firestore for settings and player document storage
- React 19 + Vite for admin panel frontend
- TanStack Query for async state management
- shadcn/ui components for consistent UI design
- Tailwind CSS for styling

### Error Handling Standards
- User-friendly error messages (no technical details exposed)
- Fail fast with clear error messages
- Graceful degradation (registration proceeds even if avatar generation fails)
- Exponential backoff retry for transient Gemini API failures
- Structured error logging in Cloud Function logs

### Testing Standards
- Minimal focused tests (2-8 per task group)
- Test only core user flows during development
- Defer edge case testing to dedicated testing phase
- Mock external dependencies (Gemini API, Firebase SDK)
- Fast execution (unit tests in milliseconds)

### Security Standards
- API key stored in Firebase Secret Manager (never in code)
- Cloud Function validates trigger source
- Storage security rules restrict write access to authenticated admins
- Public read access for generated avatars (required for public game display)
- No sensitive data logged in Cloud Function logs
