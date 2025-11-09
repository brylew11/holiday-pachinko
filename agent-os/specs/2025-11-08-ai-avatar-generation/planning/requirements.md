# Spec Requirements: AI Avatar Generation

## Initial Description
Take the uploaded image of each player and run it through Gemini to create a cartoon elf version of the player that becomes their in-game avatar.

This feature will:
- Use Gemini AI to transform player photos into cartoon elf avatars
- Generate stylized, holiday-themed character representations
- Store the generated avatar for use in the game

## Requirements Discussion

### First Round Questions

**Q1:** When does the avatar generation happen - during initial player registration, or is there a dedicated upload flow after account creation? I'm assuming this happens during the player setup/registration flow in the public game (not the admin panel), where users upload their photo as part of creating their game profile. Is that correct?

**Answer:** During the initial player setup/registration in the PUBLIC GAME (not the admin panel).

**Q2:** For storage, I'm thinking we should store BOTH the original photo and the generated avatar in Firebase Storage. The original would allow regeneration if needed, while the avatar is what displays in-game. Should we keep both, or just the generated avatar?

**Answer:** Store BOTH the original photo (in `player-photos/`) AND the generated avatar (in `player-avatars/`) in Firebase Storage. Both URLs will be referenced in the player's Firestore document.

**Q3:** If Gemini generation fails (API error, timeout, etc.), should we block the player from completing registration, or let them proceed with a default/placeholder avatar and show an error message?

**Answer:** Registration is NOT blocked. The user sees an error toast, a default placeholder avatar is assigned, and the error is logged for admin review.

**Q4:** For the Gemini API integration, I assume we'll need to call it from a Firebase Cloud Function (to keep the API key secure server-side) rather than directly from the client. Should this spec include setting up that Cloud Function with secure API key management via Firebase Secret Manager?

**Answer:** A Firebase Cloud Function will call the Gemini API. The function will securely access the API key from Firebase Secret Manager. The spec MUST include setting this up.

**Q5:** Where will the generated avatar be displayed? I'm assuming at minimum: (1) in the admin panel's player list/sidebar, and (2) in the public game as the player's profile picture. Are there other locations we need to support?

**Answer:**
- **Admin Panel**: Player sidebar and player lists
- **Public Game**: Player's main profile picture (in the header, on their profile page, and on leaderboards)

**Q6:** For the Gemini prompt that creates the "cartoon elf" style, should this be hardcoded in the Cloud Function, or configurable (perhaps in the admin panel's Game Configuration page)? This would allow you to adjust the art style without redeploying code.

**Answer:** The prompt will NOT be hardcoded. It will be stored in a Firestore document (e.g., in a `settings` collection) and managed via a text area on the admin panel's "Game Configuration" page. The Cloud Function will read this prompt from Firestore before every call.

**Q7:** Regarding processing time and user experience - should we show a loading state during generation (e.g., "Generating your elf avatar...")? And should the user see a preview/approval step before the avatar is finalized, or does it get saved and applied automatically?

**Answer:**
- **For Players (Registration)**: A loading message (e.g., "Elf-ifying your photo...") is shown. There is NO preview/approval step; the avatar is saved and used immediately.
- **For Admins (Panel)**: A "Regenerate Avatar" button will be added to the player details view. This button re-runs the Cloud Function using the player's original photo and the current prompt from settings.

**Q8:** What should we explicitly exclude from this feature? For example: manual editing tools for the avatar, batch regeneration for all players at once, or multiple avatar style options for users to choose from?

**Answer:**
- Any preview, approval, or multiple-choice selection for the user
- Any manual editing or cropping tools
- A batch processing function to regenerate avatars for all players at once

### Existing Code to Reference

**Similar Features Identified:**
- Feature: Player photo upload during registration
  - Path: `src/components/PlayerForm.jsx`
  - Path: `src/services/playerService.js`
- Components to potentially reuse: Existing player setup form pattern that handles photo uploads to Firebase Storage
- Backend logic to reference: Firebase Storage upload patterns already implemented in playerService

### Follow-up Questions
No follow-up questions were needed. All requirements were clearly specified in the initial responses.

## Visual Assets

### Files Provided:
No visual files found.

### Visual Insights:
No visual assets provided.

## Requirements Summary

### Functional Requirements

**Player Registration Flow (Public Game):**
- Player uploads a photo during initial setup/registration
- Original photo is uploaded to Firebase Storage (`player-photos/` directory)
- A Firebase Cloud Function is triggered automatically upon photo upload
- Cloud Function retrieves the Gemini prompt from Firestore (`settings` collection)
- Cloud Function calls Gemini API with the photo and prompt to generate cartoon elf avatar
- Generated avatar is saved to Firebase Storage (`player-avatars/` directory)
- Both original photo URL and avatar URL are stored in the player's Firestore document
- Loading message displayed to user (e.g., "Elf-ifying your photo...")
- No preview/approval step - avatar is applied immediately upon generation
- If generation fails: user sees error toast, default placeholder avatar is assigned, error is logged for admin review, and registration proceeds

**Admin Panel Avatar Management:**
- Display generated avatars in player sidebar
- Display generated avatars in player lists
- Add "Regenerate Avatar" button to player details view
- Regenerate button triggers Cloud Function with player's original photo and current prompt from settings

**Public Game Avatar Display:**
- Player's main profile picture in header
- Player profile page
- Leaderboards

**Gemini Prompt Management (Admin Panel):**
- Text area field added to "Game Configuration" page
- Prompt stored in Firestore (`settings` collection)
- Cloud Function reads prompt from Firestore before each generation call
- Allows art style adjustments without code redeployment

**Security & API Key Management:**
- Gemini API key stored in Firebase Secret Manager
- Cloud Function securely accesses API key from Secret Manager
- No client-side exposure of API credentials

**Error Handling & Logging:**
- Failed generation attempts logged for admin review
- Error details captured (timestamp, player ID, error message)
- User-friendly error messaging (toast notification)
- Graceful fallback to placeholder avatar

### Reusability Opportunities
- Components that might exist already:
  - `PlayerForm.jsx` - existing player setup form with photo upload functionality
  - `playerService.js` - existing Firebase Storage upload patterns
- Backend patterns to investigate:
  - Firebase Storage upload implementation in playerService
  - Form validation and error handling patterns from PlayerForm
- Similar features to model after:
  - Player photo upload flow during registration
  - Firebase Storage integration patterns
  - Error handling and user feedback mechanisms

### Scope Boundaries

**In Scope:**
- Firebase Cloud Function for Gemini API integration
- Secure API key management via Firebase Secret Manager
- Storage of both original photos and generated avatars in Firebase Storage
- Automatic avatar generation during player registration
- Loading state with user-friendly message
- Error handling with fallback to placeholder avatar
- Gemini prompt configuration in admin panel
- "Regenerate Avatar" functionality in admin panel player details
- Avatar display in admin panel (sidebar and lists)
- Avatar display in public game (header, profile page, leaderboards)
- Error logging for admin review

**Out of Scope:**
- Preview/approval step for generated avatars
- Multiple avatar style options or user choice
- Manual editing or cropping tools
- Batch regeneration for all players at once
- Custom avatar uploads (bypassing Gemini generation)
- Avatar history or versioning
- User-initiated regeneration from public game interface

### Technical Considerations

**Integration Points:**
- Firebase Cloud Functions (new function for Gemini API calls)
- Firebase Secret Manager (for API key storage)
- Firebase Storage (two directories: `player-photos/` and `player-avatars/`)
- Firestore (player documents for URL storage, settings collection for prompt)
- Gemini API (external third-party service)
- Existing player registration flow in public game
- Existing admin panel "Game Configuration" page
- Existing admin panel player details view

**Existing System Constraints:**
- Firebase as backend platform (serverless architecture)
- React frontend with TanStack Query for state management
- Firestore as NoSQL database
- Firebase Storage for file hosting
- Firebase Authentication for admin access

**Technology Preferences Stated:**
- Use Firebase Cloud Functions for secure server-side API calls
- Use Firebase Secret Manager for sensitive credential storage
- Follow existing patterns from `PlayerForm.jsx` and `playerService.js`
- Store configuration in Firestore for dynamic updates without redeployment

**Similar Code Patterns to Follow:**
- Firebase Storage upload patterns from `playerService.js`
- Form handling and validation from `PlayerForm.jsx`
- Error handling and toast notifications from existing components
- TanStack Query for Firebase data fetching and mutations
- Tailwind CSS for styling
- shadcn/ui components for consistent UI elements
