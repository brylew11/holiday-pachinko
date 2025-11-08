# Specification: Player Sidebar Management

## Goal
Create a right-side sidebar component that displays all players from Firestore, enabling administrators to select players for editing, deactivate players (soft delete), or permanently delete players, with all changes synchronized through the existing Player Setup Form.

## User Stories
- As an admin, I want to see all existing players in a sidebar so that I can view and manage the complete player roster
- As an admin, I want to click on a player to edit their name and photo using the same form I used to create them
- As an admin, I want to deactivate players who shouldn't participate in future games while keeping their data, or permanently delete players to completely remove them from the system

## Specific Requirements

**Sidebar Layout and Positioning**
- Position sidebar on right side of screen, adjacent to existing Player Setup Form
- Desktop-only interface with fixed width (no responsive behavior required)
- Display players in vertical list format within Card component container
- Use shadcn/ui Card component for consistent styling with Player Setup Form
- Apply appropriate spacing between sidebar and form using Tailwind utility classes
- Sidebar should span full height of content area

**Player List Display**
- Fetch all players from Firestore 'players' collection using TanStack Query useQuery hook
- Display each player as list item with avatar thumbnail (circular, 48x48 pixels) and name
- Show avatar image from originalPhotoUrl field in Firestore
- Display player name from name field in Firestore
- Visual distinction for inactive players: reduced opacity (50%) and "Inactive" badge
- List items should have hover state with background color change for better UX
- Apply cursor pointer on hover to indicate clickability

**Empty State Display**
- Show centered message when no players exist in database
- Message text: "No players yet. Add your first player using the form."
- Empty state should be visually centered within sidebar Card component
- Use muted text color for empty state message
- Empty state appears when query returns zero players

**Player Selection for Editing**
- Click on player list item to select that player for editing
- Selected player highlighted with distinct border color and background
- Only one player can be selected at a time
- Selection state persists until different player selected or form cleared
- Selected player's data populates Player Setup Form fields (name and image)
- Selection triggers form mode change to "Update" mode

**Player Setup Form Integration - Edit Mode**
- Extend existing PlayerForm component to support both "Add" and "Update" modes
- Track currently selected player ID in component state
- Form title changes from "Add New Player" to "Update Player" when player selected
- Pre-populate playerName field with selected player's name
- Display existing player avatar in image preview section
- Submit button text changes from "Add Player" to "Update Player" in edit mode
- Form validation rules remain identical in both modes

**Player Update Functionality**
- Allow updating both player name AND avatar image when in edit mode
- If new image selected: upload new image to Firebase Storage, delete old image, update originalPhotoUrl in Firestore
- If image not changed: keep existing originalPhotoUrl value
- Update Firestore document with new name and/or originalPhotoUrl
- Use TanStack Query mutation for update operation with loading/error/success states
- After successful update: invalidate 'players' query to refetch list, show success toast, keep form in edit mode with updated data
- Handle errors with user-friendly toast notifications

**Form Mode Switching and Clearing**
- Provide "Cancel" or "Clear" button to exit edit mode and return to add mode
- Clearing edit mode: reset form fields, clear image preview, deselect player in sidebar, change title back to "Add New Player"
- Form should clearly indicate current mode to prevent user confusion
- Mode indicator should be visually prominent (different heading text/color)

**Player Deactivation (Soft Delete)**
- Add "Deactivate" button/icon for each active player in sidebar list
- Deactivation sets status field to 'inactive' in Firestore document
- Keep player document and avatar image in database/storage
- Show confirmation dialog before deactivating with message: "Deactivate [Player Name]? They will remain in the database but won't be added to future games."
- Use shadcn/ui AlertDialog component for confirmation
- After successful deactivation: invalidate 'players' query, show success toast
- Deactivated players remain visible in sidebar with visual indication
- Use TanStack Query mutation for deactivate operation

**Player Deletion (Hard Delete)**
- Add "Delete" button/icon for each player in sidebar list (separate from deactivate)
- Deletion removes player document from Firestore AND avatar image from Firebase Storage
- Show confirmation dialog before deleting with message: "Permanently delete [Player Name]? This cannot be undone."
- Use shadcn/ui AlertDialog component for confirmation with destructive styling
- After successful deletion: invalidate 'players' query, show success toast
- If deleted player was selected for editing, clear form and return to add mode
- Use TanStack Query mutation for delete operation
- Handle Storage deletion errors gracefully (player doc still deleted if Storage fails)

**Data Fetching and Synchronization**
- Use TanStack Query useQuery hook to fetch players collection from Firestore
- Query key: ['players'] for proper cache management
- Manual refetch approach - no real-time Firestore listeners
- Invalidate 'players' query after all mutations: create, update, deactivate, delete
- Query refetch happens automatically after invalidation
- Display loading state in sidebar while fetching players
- Display error state in sidebar if fetch fails
- Stale time and cache settings from existing queryClient configuration

**Player Data Model**
- Firestore 'players' collection document structure includes: id (document ID), name (string), originalPhotoUrl (string), status (string: 'active' or 'inactive')
- Default status to 'active' for newly created players
- Ensure existing PlayerForm sets status='active' when creating players
- Query should fetch all players regardless of status (show both active and inactive)
- Filter or sort logic can be added client-side if needed

**Confirmation Dialog Pattern**
- Use shadcn/ui AlertDialog component for both deactivate and delete confirmations
- AlertDialog should be accessible with proper ARIA attributes
- Include cancel and confirm actions in dialog
- Deactivate dialog: neutral styling with "Cancel" and "Deactivate" buttons
- Delete dialog: destructive styling with "Cancel" and "Delete" buttons
- Dialog should display player name in confirmation message
- Close dialog after confirmation action completes

## Visual Design

No mockups provided. Implementation should follow shadcn/ui component styling patterns and Tailwind CSS conventions established in Player Setup Form.

**Sidebar Structure**
- Card component container with header "Players" and content area for list
- Player list items with flex layout: avatar on left, name in center, action buttons on right
- Avatar images displayed as circular thumbnails using rounded-full class
- Player names in medium font weight, truncated if too long
- Action buttons (deactivate, delete) appear on hover or always visible with icon-only design
- Selected player has border-2 and distinct background color

**Visual Hierarchy**
- Sidebar header clearly labeled "Players" in CardTitle
- Empty state centered with muted color
- Active players displayed with full opacity
- Inactive players displayed with 50% opacity and "Inactive" badge
- Selected player highlighted with primary color border
- Hover states provide visual feedback for interactivity

**Layout Integration**
- App.jsx updated to display PlayerForm and PlayerSidebar side-by-side
- Use CSS Grid or Flexbox for side-by-side layout with appropriate gap
- Form on left side, sidebar on right side
- Container should accommodate both components with proper spacing
- Maintain existing responsive container and padding from App.jsx

## Existing Code to Leverage

**PlayerForm Component (src/components/PlayerForm.jsx)**
- Extend existing component to support edit mode by adding selectedPlayer prop or internal state
- Reuse form validation with playerFormSchema
- Reuse image preview logic for displaying existing player avatar
- Reuse form reset logic when clearing edit mode
- Reuse TanStack Query mutation pattern for update operation
- Reuse toast notification patterns for success/error messages

**Player Service (src/services/playerService.js)**
- Reuse uploadPlayerImage function for uploading new avatar when updating
- Create new function fetchPlayers to query Firestore 'players' collection
- Create new function updatePlayer to update existing Firestore document
- Create new function deactivatePlayer to set status='inactive'
- Create new function deletePlayer to remove Firestore doc and Storage file
- Create new function deletePlayerImage to remove image from Firebase Storage
- Follow existing error handling patterns with user-friendly messages

**Firebase Integration (src/firebase.js)**
- Use existing db export for Firestore operations
- Use existing storage export for Storage operations
- Import necessary Firestore functions: collection, getDocs, doc, updateDoc, deleteDoc
- Import necessary Storage functions: ref, deleteObject
- Follow existing Firebase SDK modular import patterns

**TanStack Query Setup (src/lib/queryClient.js)**
- Use existing queryClient configuration for default options
- Leverage existing staleTime, retry, and refetchOnWindowFocus settings
- Use queryClient.invalidateQueries(['players']) to trigger refetch after mutations
- Follow existing mutation retry configuration (retry: 0)

**shadcn/ui Components**
- Reuse Card, CardContent, CardHeader, CardTitle from existing ui/card.jsx
- Reuse Button component from existing ui/button.jsx for action buttons
- Reuse Toast from sonner for notifications
- Install and use AlertDialog component from shadcn/ui for confirmations (if not already present)
- Reuse Label component if needed for any additional form elements

**Tailwind CSS Styling Patterns**
- Follow existing spacing patterns (space-y-6, p-4, etc.) from PlayerForm
- Use existing color scheme and utility classes for consistency
- Apply rounded-full for circular avatar thumbnails
- Use opacity-50 for inactive player visual indication
- Apply border-2 and border-primary for selected state

## Out of Scope
- Search or filter functionality in player list
- Real-time synchronization using Firestore onSnapshot listeners
- Responsive design or mobile layout for sidebar
- Bulk operations (select multiple players, bulk delete, bulk deactivate)
- Player reactivation UI (changing status from inactive back to active)
- Drag-and-drop reordering of players in sidebar
- Pagination or infinite scroll for large player lists
- Sorting capabilities (alphabetical, by date created, etc.)
- Player statistics or game history display in sidebar
- Undo delete functionality or trash/archive system
- Player duplication or clone feature
- Export players to CSV or other formats
- Integration with actual game session creation logic
- Image cropping or editing tools within the form
- Multiple image uploads per player
- Batch player import from CSV or JSON
