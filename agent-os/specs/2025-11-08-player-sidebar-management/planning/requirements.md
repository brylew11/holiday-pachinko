# Spec Requirements: Player Sidebar Management

## Initial Description
Add a sidebar to the user set-up screen that shows all current users in Firestore. Users should be able to use the sidebar to edit and remove users.

This is an enhancement to the existing Player Setup Form (spec: `agent-os/specs/2025-11-08-player-setup-form/`) which currently allows adding new players with avatar images stored in Firebase Storage.

## Requirements Discussion

### First Round Questions

**Q1: Sidebar positioning** - Should the sidebar be positioned on the left or right side of the screen?
**Answer:** Yes, right side of the screen (Player Setup Form on the left)

**Q2: Responsive behavior** - For smaller screens, should the sidebar collapse into a drawer/modal, or is this feature desktop-only?
**Answer:** No need to worry about responsive behavior - this will always be used on desktop or larger screens

**Q3: Player list display** - What information should be displayed for each player in the sidebar list? (e.g., avatar thumbnail, name, email, status indicator?)
**Answer:** Show avatar thumbnail and name. IMPORTANT: Allow both the name AND image to be updated from the sidebar

**Q4: Search/filter functionality** - With potentially many players in the list, should there be search or filter capabilities?
**Answer:** No search/filter functionality needed

**Q5: Edit approach** - When a user clicks to edit a player from the sidebar, should we: (A) Populate the existing Player Setup Form with that player's data, OR (B) Open an inline edit form within the sidebar?
**Answer:** Take the easier approach (populate the Player Setup Form with existing data)

**Q6: Form mode indication** - When editing a player via the form, should there be a visual indication that we're in "edit mode" vs "add new player mode"?
**Answer:** Yes, show "Update Player" instead of "Add Player" when editing

**Q7: Delete confirmation** - Should there be a confirmation dialog before deleting a player, or should deletion be immediate?
**Answer:** Yes, show confirmation dialog before deletion

**Q8: Delete scope** - When deleting a player, should we remove just the Firestore record, or also delete their avatar image from Firebase Storage?
**Answer:** Delete entire record (Firestore + Storage). HOWEVER, also add NEW functionality: ability to **deactivate** players, which keeps them in the database but marks them as inactive so they won't be added to the next game when that feature is implemented

**Q9: Real-time updates** - Should the sidebar player list update in real-time if another admin adds/edits/deletes a player, or is manual reload acceptable?
**Answer:** No fancy real-time listeners needed - manual reload is fine

**Q10: Selection highlighting** - When a player is selected for editing, should they be highlighted in the sidebar to show which player is currently active?
**Answer:** Yes, show visual indication of which player is currently selected/being edited

**Q11: Empty state** - What should be displayed in the sidebar when there are no players in the database?
**Answer:** Show a message telling the admin they need to add players

### Existing Code to Reference

**Similar Features Identified:**
- Feature: Player Setup Form - Path: `agent-os/specs/2025-11-08-player-setup-form/`
- Components to potentially reuse:
  - Firebase configuration and initialization patterns
  - shadcn/ui component patterns (Card, Button, Input, Label, Toast, Dialog)
  - TanStack Query mutation patterns for async operations
  - Tailwind CSS utility classes for styling
  - Form validation with react-hook-form integration
  - Firebase Storage upload/delete patterns
  - Firestore document creation patterns
  - Error handling with Toast notifications
  - Loading state management patterns
- Backend logic to reference:
  - Firebase Storage operations (upload to 'uploads/' folder, getDownloadURL)
  - Firestore 'players' collection structure
  - Firebase error handling approaches
  - File validation logic (image formats, file size limits)

### Follow-up Questions

No follow-up questions were necessary - all requirements were clearly specified.

## Visual Assets

### Files Provided:
No visual files found.

### Visual Insights:
No visual assets provided.

## Requirements Summary

### Functional Requirements

**Sidebar Display:**
- Position sidebar on the right side of the screen alongside existing Player Setup Form
- Display all players from Firestore in a list format
- Each player list item shows: avatar thumbnail + player name
- Desktop-only interface (no responsive/mobile considerations needed)
- Empty state message when no players exist: "No players yet. Add your first player using the form."
- Manual refresh pattern (no real-time Firestore listeners required)

**Player Selection & Editing:**
- Click on a player in sidebar to select them for editing
- Selected player is visually highlighted in the sidebar
- Player Setup Form populates with selected player's existing data
- Form header changes from "Add Player" to "Update Player" when in edit mode
- Both name AND avatar image can be updated from the form
- Form submission updates the existing player record in Firestore
- Avatar image updates are saved to Firebase Storage
- After update, refetch player list to show current state

**Player Deactivation (SOFT DELETE - NEW FEATURE):**
- Provide "Deactivate" action for players
- Deactivation is a soft delete that:
  - Keeps player record in Firestore
  - Sets status field to 'inactive' (or similar)
  - Prevents player from being added to future games (when that feature is implemented)
- Show confirmation dialog before deactivating
- Deactivated players remain visible in sidebar with visual indication of inactive status
- After deactivation, refetch player list to show updated status

**Player Deletion (HARD DELETE):**
- Provide "Delete" action for complete removal
- Deletion removes:
  - Player record from Firestore
  - Avatar image from Firebase Storage
- Show confirmation dialog before deletion
- Player is removed from sidebar after deletion
- After deletion, refetch player list

**Data Synchronization:**
- Manual reload/refresh approach (no real-time listeners)
- After adding a new player, refetch the player list
- After updating a player, refetch the player list
- After deactivating a player, refetch the player list
- After deleting a player, refetch the player list
- Use TanStack Query's invalidation/refetch mechanisms

### Reusability Opportunities

**Components to build on:**
- Existing Player Setup Form (from spec `agent-os/specs/2025-11-08-player-setup-form/`)
- Existing Firebase Storage integration for avatar uploads
- Existing Firestore players collection structure

**Patterns to follow:**
- TanStack Query for data fetching and mutations
- shadcn/ui components for consistent UI elements (Card, Button, Dialog, Toast)
- Firebase SDK for Firestore and Storage operations
- Tailwind CSS for styling
- react-hook-form for form validation
- Error handling with Toast notifications

**Technical considerations:**
- Player Setup Form needs to support two modes: "Add New" and "Update Existing"
- Form state management must handle switching between modes
- Players collection in Firestore needs a 'status' field to track active/inactive state
- Clear/reset form when switching from edit mode back to add mode

### Scope Boundaries

**In Scope:**
- Sidebar UI component displaying player list
- Player selection and visual highlighting
- Edit mode that populates Player Setup Form
- Update player functionality (name + avatar)
- Deactivate player functionality (soft delete with status change to 'inactive')
- Delete player functionality (hard delete from Firestore + Storage)
- Confirmation dialogs for deactivate and delete actions
- Form mode indicator ("Add Player" vs "Update Player")
- Empty state messaging
- Manual data refresh after mutations using TanStack Query invalidation
- Visual indication of inactive/deactivated players in sidebar

**Out of Scope:**
- Search or filter functionality in player list
- Real-time synchronization across multiple admin sessions (using Firestore listeners)
- Responsive design for mobile/tablet screens
- Bulk operations (select multiple players, bulk delete, bulk deactivate)
- Player reactivation interface (can be added later if needed)
- Integration with game session logic (future functionality)
- Player statistics or gameplay history in sidebar
- Sorting capabilities in player list
- Pagination (assumes reasonable number of players)
- Drag-and-drop reordering
- Undo delete functionality
- Player duplication feature

### Technical Considerations

**Integration Points:**
- Extends existing Player Setup Form screen
- Reads from existing Firestore `players` collection
- Uses existing Firebase Storage bucket for avatar images
- Requires adding 'status' field to player documents if not already present

**Data Model Updates:**
- Players in Firestore must include:
  - `status` field (string: 'active' or 'inactive', defaults to 'active')
  - Existing fields: name, originalPhotoUrl (or avatarUrl), etc.
- Ensure new players created have status='active' by default

**State Management:**
- Track currently selected player for editing (player ID or null)
- Track form mode (add vs update)
- Manage sidebar player list via TanStack Query (useQuery)
- Handle form state for editing vs creating
- Invalidate/refetch player list after mutations

**User Experience:**
- Clear visual feedback for selected player (border, background color)
- Clear visual feedback for inactive/deactivated players (opacity, badge, strikethrough, etc.)
- Confirmation dialogs prevent accidental deletions/deactivations
- Form mode clearly indicated to prevent confusion
- Smooth transitions between add and edit modes
- Ability to cancel/clear edit mode and return to "add new" mode

**Mutation Operations:**
- Update player: TanStack Query mutation that updates Firestore doc and Storage if image changed
- Deactivate player: TanStack Query mutation that updates status field to 'inactive'
- Delete player: TanStack Query mutation that deletes Firestore doc and Storage file
- All mutations trigger query invalidation to refresh player list

**Technology Stack:**
- React 19.1.1
- Vite build tool
- Tailwind CSS for styling
- shadcn/ui for UI components
- TanStack Query for server state management
- Firebase Firestore for database
- Firebase Storage for avatar images
- react-hook-form for form validation (if applicable)

**Desktop-Only Considerations:**
- No need for mobile breakpoints or responsive sidebar
- Can assume adequate screen width for side-by-side layout
- Sidebar can have fixed width without collapse behavior
