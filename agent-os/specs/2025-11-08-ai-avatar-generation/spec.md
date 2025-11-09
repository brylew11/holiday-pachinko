# Specification: AI Avatar Generation

## Goal
Enable automatic transformation of player photos into cartoon elf avatars using Gemini AI during registration, with secure server-side processing via Firebase Cloud Functions and configurable prompts managed through the admin panel.

## User Stories
- As a player, I want my uploaded photo automatically transformed into a fun cartoon elf avatar so that I have a unique in-game character without extra effort
- As an admin, I want to configure the AI prompt that generates avatar styles so that I can adjust the artistic direction without redeploying code
- As an admin, I want to regenerate a player's avatar with the current prompt so that I can update their appearance if the prompt is improved

## Specific Requirements

**Player Registration Avatar Generation Flow**
- Photo upload triggers Firebase Cloud Function automatically when saved to Firebase Storage
- Display loading message "Elf-ifying your photo..." during generation process
- No preview or approval step - generated avatar applied immediately upon completion
- Original photo stored in `player-photos/{playerId}.jpg` path in Firebase Storage
- Generated avatar stored in `player-avatars/{playerId}.jpg` path in Firebase Storage
- Both originalPhotoUrl and avatarUrl fields saved to player's Firestore document
- If generation fails, assign default placeholder avatar and allow registration to proceed
- Display error toast notification to user if generation fails

**Firebase Cloud Function Architecture**
- Function triggered by Firebase Storage upload event on `player-photos/` path
- Retrieve Gemini API key securely from Firebase Secret Manager (not environment variables)
- Read current Gemini prompt from Firestore `settings` collection document
- Download uploaded player photo from Firebase Storage
- Call Gemini API with photo and prompt to generate cartoon elf avatar
- Upload generated image to Firebase Storage at `player-avatars/{playerId}.jpg`
- Update player's Firestore document with avatarUrl field containing generated image URL
- Log all errors with player ID, timestamp, and error details for admin review

**Gemini API Integration**
- Use Gemini Vision API endpoint to process image transformation
- Send original photo as base64-encoded image data in API request
- Include configurable prompt from Firestore settings in generation request
- Handle API rate limits and timeout errors gracefully with appropriate retries
- Parse API response to extract generated image data
- Convert API response image format to JPEG for consistent storage
- Implement exponential backoff retry strategy for transient API failures

**Admin Panel Prompt Configuration**
- Add "AI Avatar Settings" section to existing Game Configuration page
- Display textarea input field for editing Gemini prompt text
- Prompt stored in Firestore `settings` collection under `geminiAvatarPrompt` field
- Provide default prompt: "Transform this photo into a cartoon elf character with holiday theme, maintaining facial features and expression"
- Save button updates Firestore settings document and shows success toast
- Display character count and recommended length guidance (100-500 characters)

**Admin Panel Avatar Regeneration**
- Add "Regenerate Avatar" button to player details view in admin panel
- Button triggers Cloud Function manually using player's existing originalPhotoUrl
- Function uses current prompt from Firestore settings (not original generation prompt)
- Display loading state on button during regeneration process
- Show success toast and refresh player data when regeneration completes
- Handle errors gracefully with user-friendly error toast messages

**Avatar Display Integration**
- Update PlayerSidebar component to display avatarUrl instead of originalPhotoUrl
- Fallback to originalPhotoUrl if avatarUrl is null or undefined
- Display both original photo and generated avatar in player details modal/view
- Admin panel lists show generated avatar thumbnail with player name
- Public game header displays generated avatar for logged-in player
- Public game profile page shows generated avatar prominently
- Leaderboard entries display generated avatar next to player name and score

**Error Handling and Logging Strategy**
- Cloud Function logs errors to Firebase Cloud Functions logs with structured format
- Error log includes: timestamp, playerId, errorType, errorMessage, stackTrace
- Player document updated with generationStatus field: 'pending', 'completed', 'failed'
- Failed generations trigger admin notification (email or in-app notification system)
- Retry failed generations up to 3 times with exponential backoff before marking as failed
- Default placeholder avatar URL stored in Firestore settings for fallback scenarios
- Frontend displays user-friendly messages without exposing technical error details

**Firebase Storage Organization**
- `player-photos/` directory stores original uploaded photos with {playerId}.jpg naming
- `player-avatars/` directory stores AI-generated avatars with {playerId}.jpg naming
- Both directories require Firebase Storage security rules for authenticated admin access
- Use consistent JPEG format with 80% quality for all stored images
- Implement automatic cleanup of old images when player is deleted
- Maximum file size limit of 5MB for original photos enforced client-side

**Firestore Data Model Updates**
- Player document schema adds avatarUrl (string, nullable) field
- Player document schema adds generationStatus (string) field with values: 'pending', 'completed', 'failed'
- Settings collection contains document with id 'avatarGeneration' containing:
  - geminiAvatarPrompt (string) - current prompt text
  - placeholderAvatarUrl (string) - fallback avatar URL
  - enabled (boolean) - feature toggle to disable generation
- Add Firestore indexes if queries filter by generationStatus field

**Security and API Key Management**
- Store Gemini API key in Firebase Secret Manager as 'GEMINI_API_KEY' secret
- Cloud Function accesses secret using Secret Manager SDK at runtime
- Never expose API key in client-side code or environment variables
- Implement Firebase Storage security rules to restrict access to player-photos and player-avatars
- Validate Cloud Function trigger source to prevent unauthorized invocations
- Rate limit Cloud Function invocations per player to prevent abuse

## Visual Design

No mockups provided. Implementation should follow existing admin panel design patterns with shadcn/ui components and Tailwind CSS.

**Admin Panel Game Configuration Section**
- Card component containing "AI Avatar Settings" heading
- Full-width textarea for prompt editing with border and padding
- Character count display below textarea in muted text color
- Save button aligned to right below textarea with primary styling
- Success message displayed in toast notification after save

**Player Details Avatar Display**
- Side-by-side layout showing original photo (left) and generated avatar (right)
- Each image 200x200 pixels with rounded corners and border
- Labels "Original Photo" and "Generated Avatar" above each image
- "Regenerate Avatar" button below generated avatar with loading spinner state

**Player List Avatar Integration**
- Replace current originalPhotoUrl display with avatarUrl in PlayerSidebar
- Circular avatar thumbnails (48x48 pixels) with generated avatar image
- Maintain existing hover states and selection behavior
- Show "generating..." badge if generationStatus is 'pending'

## Existing Code to Leverage

**Firebase Storage Upload Pattern (src/services/playerService.js)**
- Reuse uploadPlayerImage function pattern for uploading generated avatars
- Follow same error handling approach with user-friendly messages
- Use existing timestamp-based filename generation pattern adapted for playerId naming
- Leverage getDownloadURL pattern to retrieve avatar URL after upload
- Apply same try-catch structure for Storage operations

**Player Service CRUD Operations (src/services/playerService.js)**
- Extend updatePlayer function to handle avatarUrl and generationStatus fields
- Follow existing Firestore document update pattern with updateDoc
- Reuse fetchPlayers query pattern to include new avatar fields
- Apply same error message formatting for consistency
- Maintain existing TanStack Query invalidation pattern after updates

**PlayerForm Component State Management (src/components/PlayerForm.jsx)**
- Reference image preview logic for displaying both original and generated avatars
- Follow existing mutation pattern with useMutation hook for regenerate action
- Reuse loading state management approach for regeneration button
- Apply same toast notification pattern for success and error messages
- Maintain form validation and reset patterns for consistency

**Firebase Configuration (src/firebase.js)**
- Use existing db export for Firestore operations in new service functions
- Use existing storage export for new avatar upload operations
- Add Firebase Functions SDK import: import { getFunctions } from 'firebase/functions'
- Add Secret Manager access in Cloud Function (not client-side)
- Follow modular SDK import patterns for all new Firebase operations

**TanStack Query Mutation Pattern**
- Follow existing mutation structure from createMutation and updateMutation
- Use queryClient.invalidateQueries(['players']) after avatar regeneration
- Implement same retry: 0 configuration for mutations
- Apply consistent onSuccess and onError callback patterns
- Maintain loading state tracking with isPending flag

## Out of Scope

- Preview or approval step for generated avatars before saving
- Multiple avatar style options or user choice between variations
- Manual editing, cropping, or annotation tools for avatars
- Batch regeneration function to process all players at once
- User-initiated regeneration from public game interface (admin-only in this version)
- Avatar history or versioning to track previous generations
- Custom avatar uploads bypassing Gemini generation entirely
- Real-time generation status updates using Firestore listeners
- A/B testing different prompts with analytics
- Avatar quality rating or feedback system
