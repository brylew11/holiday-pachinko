# Task Breakdown: Player Sidebar Management

## Overview
**Total Task Groups:** 6
**Estimated Total Tasks:** 28 subtasks across 6 major groups
**Feature Type:** Enhancement to existing Player Setup Form feature
**Tech Stack:** React 19, Vite, Tailwind CSS, shadcn/ui, Firebase (Firestore + Storage), TanStack Query

## Execution Strategy

This tasks list builds upon the existing Player Setup Form implementation. It adds player list management, edit capabilities, and deletion features. The approach follows a strategic layer-by-layer implementation, starting with service functions, then state management, component development, and integration.

**Key Dependencies:**
- Existing PlayerForm component must support "Add" and "Update" modes
- Existing playerService.js must be extended with fetch, update, deactivate, and delete operations
- shadcn/ui AlertDialog component must be installed for confirmations
- Firestore data migration required to add 'status' field to existing player documents

**Key Constraints:**
- All tests should be minimal and focused (2-8 tests per group maximum)
- Maximum 10 additional integration tests in final testing phase
- Build on existing patterns from PlayerForm component
- No real-time Firestore listeners - use manual refetch with query invalidation

---

## Task List

### Data Migration & Preparation

#### Task Group 1: Firestore Data Schema Update
**Dependencies:** None (but requires existing player documents in Firestore)
**Estimated Effort:** 20-30 minutes
**Assigned To:** Backend/Database Engineer

- [ ] 1.0 Complete Firestore schema migration
  - [ ] 1.1 Create data migration script
    - Create src/scripts/migratePlayerStatus.js
    - Import Firestore functions: collection, getDocs, doc, updateDoc
    - Query all documents in 'players' collection
    - Check each document for 'status' field
    - Add status: 'active' to documents missing the field
    - Log migration results (number of documents updated)
  - [ ] 1.2 Run migration script manually
    - Execute migration script in development environment
    - Verify all existing player documents now have 'status' field
    - Document any errors or edge cases encountered
    - Confirm migration can be safely re-run (idempotent)
  - [ ] 1.3 Update PlayerForm createPlayer to set default status
    - Modify src/services/playerService.js createPlayerDocument function
    - Change status from 'processing' to 'active' for new players
    - This aligns with sidebar feature requirements
    - Verify change doesn't break existing PlayerForm functionality
  - [ ] 1.4 Test migration results
    - Query Firestore console to verify all players have status field
    - Create a new player via PlayerForm and verify status='active'
    - Confirm no existing functionality broken by status field change

**Acceptance Criteria:**
- All existing player documents have status: 'active' field
- New players created via PlayerForm automatically have status: 'active'
- Migration script is idempotent (safe to run multiple times)
- No breaking changes to existing PlayerForm functionality
- No test writing required for this data migration task

---

### Service Layer Enhancement

#### Task Group 2: Player Service CRUD Operations
**Dependencies:** Task Group 1 (status field must exist in schema)
**Estimated Effort:** 60-75 minutes
**Assigned To:** Backend/Integration Engineer

- [ ] 2.0 Complete player service layer enhancements
  - [ ] 2.1 Write 2-8 focused tests for new service functions
    - Limit to 2-8 highly focused tests maximum
    - Test only critical operations: fetchPlayers returns array, updatePlayer updates document, deactivatePlayer sets status to 'inactive', deletePlayer removes document
    - Use Firebase emulator or mock Firebase SDK for isolated testing
    - Skip exhaustive edge case testing
    - Extend existing test file: src/services/__tests__/playerService.test.js
  - [ ] 2.2 Implement fetchPlayers function
    - Add function to src/services/playerService.js
    - Import getDocs, collection, query from firebase/firestore
    - Create query to fetch all documents from 'players' collection
    - Return array of player objects with id, name, originalPhotoUrl, status fields
    - Map Firestore document snapshots to plain JavaScript objects
    - Handle empty collection (return empty array)
    - Throw user-friendly error on fetch failure
  - [ ] 2.3 Implement updatePlayer function
    - Accept { playerId, name, originalPhotoUrl } as parameters
    - Import doc, updateDoc from firebase/firestore
    - Update Firestore document with new name and/or originalPhotoUrl
    - Return updated player data
    - Throw user-friendly error on update failure
    - Follow same error handling pattern as createPlayer
  - [ ] 2.4 Implement deactivatePlayer function
    - Accept playerId as parameter
    - Import doc, updateDoc from firebase/firestore
    - Update player document to set status: 'inactive'
    - Return updated player data
    - Throw user-friendly error on update failure
    - Do NOT delete player document or image from storage
  - [ ] 2.5 Implement deletePlayerImage function
    - Accept imageUrl (Firebase Storage URL) as parameter
    - Import ref, deleteObject from firebase/storage
    - Extract storage path from full URL
    - Delete image from Firebase Storage
    - Handle gracefully if image doesn't exist (don't throw error)
    - Throw descriptive error if deletion fails for other reasons
  - [ ] 2.6 Implement deletePlayer function
    - Accept { playerId, imageUrl } as parameters
    - Import doc, deleteDoc from firebase/firestore
    - First attempt to delete image using deletePlayerImage
    - Then delete Firestore document (even if image deletion fails)
    - Return success confirmation
    - Throw user-friendly error on critical failures
    - Log warning if image deletion fails but document deleted
  - [ ] 2.7 Ensure service layer tests pass
    - Run ONLY the 2-8 tests written in 2.1
    - Verify fetchPlayers returns correct data structure
    - Verify updatePlayer updates fields correctly
    - Verify deactivatePlayer sets status to 'inactive'
    - Verify deletePlayer removes document and image
    - Do NOT run entire test suite at this stage

**Acceptance Criteria:**
- The 2-8 tests written in 2.1 pass successfully
- fetchPlayers function returns array of all players with correct schema
- updatePlayer function updates name and/or photo successfully
- deactivatePlayer function sets status to 'inactive' without deleting data
- deletePlayer function removes both Firestore document and Storage image
- deletePlayerImage handles missing images gracefully
- All functions follow existing error handling patterns (user-friendly messages)
- Functions use Firebase v9+ modular SDK patterns

---

### PlayerForm Mode Enhancement

#### Task Group 3: Add Update Mode to PlayerForm Component
**Dependencies:** Task Group 2 (updatePlayer service function must exist)
**Estimated Effort:** 60-75 minutes
**Assigned To:** Frontend Engineer

- [ ] 3.0 Complete PlayerForm edit mode functionality
  - [ ] 3.1 Write 2-8 focused tests for edit mode behavior
    - Limit to 2-8 highly focused tests maximum
    - Test only critical edit behaviors: form populates with player data, title changes to "Update Player", submit button text changes, update mutation triggers on submit
    - Use React Testing Library with mock TanStack Query
    - Skip exhaustive testing of all mode switching scenarios
    - Extend existing test file: src/components/__tests__/PlayerForm.test.jsx
  - [ ] 3.2 Add mode and selectedPlayer props to PlayerForm
    - Modify src/components/PlayerForm.jsx function signature
    - Add mode prop: 'add' or 'update' (default: 'add')
    - Add selectedPlayer prop: object with { id, name, originalPhotoUrl } or null
    - Add onCancel prop: callback function to exit edit mode
    - Add onUpdateSuccess prop: callback to handle successful update
    - Use PropTypes or TypeScript interface for documentation
  - [ ] 3.3 Implement conditional form title based on mode
    - Change CardTitle from static "Add New Player" to dynamic
    - Show "Add New Player" when mode === 'add'
    - Show "Update Player" when mode === 'update'
    - Apply visual distinction (optional): different color or icon for update mode
  - [ ] 3.4 Implement form pre-population for edit mode
    - Add useEffect hook that triggers when selectedPlayer changes
    - Populate playerName field with selectedPlayer.name
    - Set imagePreview to selectedPlayer.originalPhotoUrl
    - Store originalPhotoUrl in component state for comparison
    - Do NOT set selectedFile (only needed for new uploads)
    - Use form.setValue to populate react-hook-form state
  - [ ] 3.5 Create separate TanStack Query mutation for update
    - Import updatePlayer from playerService
    - Create updateMutation using useMutation hook
    - Set mutationFn to call updatePlayer service function
    - Configure onSuccess: invalidate 'players' query, show success toast, call onUpdateSuccess prop
    - Configure onError: show error toast with user-friendly message
    - Keep existing createMutation for add mode
  - [ ] 3.6 Implement conditional submit logic
    - Modify onSubmit function to check current mode
    - If mode === 'add': call createMutation.mutate (existing logic)
    - If mode === 'update': call updateMutation.mutate with playerId, name, and originalPhotoUrl
    - Determine if image changed: selectedFile !== null means new image uploaded
    - If new image: upload new image, delete old image, update originalPhotoUrl
    - If no new image: keep existing originalPhotoUrl value
  - [ ] 3.7 Add Cancel/Clear button for edit mode
    - Conditionally render Cancel button when mode === 'update'
    - Place Cancel button next to Submit button
    - Use Button variant="outline" for secondary action styling
    - onClick triggers onCancel prop callback
    - onCancel should clear form, reset mode to 'add', deselect player
  - [ ] 3.8 Update submit button text based on mode
    - Change button text from static "Add Player" to dynamic
    - Show "Add Player" when mode === 'add' and not pending
    - Show "Adding Player..." when mode === 'add' and pending
    - Show "Update Player" when mode === 'update' and not pending
    - Show "Updating Player..." when mode === 'update' and pending
  - [ ] 3.9 Handle image upload for update mode
    - When new image selected in update mode, upload to Storage
    - After successful upload, delete old image using deletePlayerImage
    - Update Firestore with new originalPhotoUrl
    - Handle errors gracefully: if upload fails, keep old image
    - Show appropriate loading states during image operations
  - [ ] 3.10 Ensure PlayerForm edit mode tests pass
    - Run ONLY the 2-8 tests written in 3.1
    - Verify form populates correctly when selectedPlayer prop provided
    - Verify title and button text change based on mode
    - Verify update mutation triggers correctly on submit
    - Do NOT run entire test suite at this stage

**Acceptance Criteria:**
- The 2-8 tests written in 3.1 pass successfully
- PlayerForm accepts mode, selectedPlayer, onCancel, and onUpdateSuccess props
- Form title changes dynamically: "Add New Player" vs "Update Player"
- Form fields pre-populate with selectedPlayer data in update mode
- Submit button text changes based on mode: "Add Player" vs "Update Player"
- Cancel button appears only in update mode and triggers onCancel callback
- Update mutation successfully updates player name and/or image
- Image replacement workflow: upload new, delete old, update Firestore
- TanStack Query invalidates 'players' query after successful update
- Form follows existing validation and error handling patterns

---

### PlayerSidebar Component Development

#### Task Group 4: Player List Sidebar UI
**Dependencies:** Task Group 2 (fetchPlayers service must exist)
**Estimated Effort:** 75-90 minutes
**Assigned To:** UI/Frontend Designer

- [ ] 4.0 Complete PlayerSidebar component implementation
  - [ ] 4.1 Write 2-8 focused tests for PlayerSidebar component
    - Limit to 2-8 highly focused tests maximum
    - Test only critical sidebar behaviors: players list renders, player selection triggers callback, empty state displays when no players
    - Use React Testing Library with mock TanStack Query
    - Skip exhaustive testing of all UI states and interactions
    - Create test file: src/components/__tests__/PlayerSidebar.test.jsx
  - [ ] 4.2 Create PlayerSidebar component structure
    - Create new file: src/components/PlayerSidebar.jsx
    - Set up component with props: selectedPlayerId, onSelectPlayer
    - Import shadcn/ui Card, CardContent, CardHeader, CardTitle components
    - Import Button component for action buttons
    - Follow same Card-based layout pattern as PlayerForm
  - [ ] 4.3 Implement TanStack Query for fetching players
    - Import useQuery from @tanstack/react-query
    - Import fetchPlayers from playerService
    - Create query with queryKey: ['players']
    - Set queryFn to fetchPlayers
    - Destructure data, isLoading, isError, error from useQuery
    - Follow existing queryClient configuration (no custom staleTime needed)
  - [ ] 4.4 Implement loading state display
    - Show loading message or spinner while isLoading === true
    - Center loading state within Card component
    - Use muted text color for loading message
    - Display: "Loading players..." or use Spinner component if available
  - [ ] 4.5 Implement error state display
    - Show error message when isError === true
    - Display user-friendly error text (not technical details)
    - Center error state within Card component
    - Use error/destructive text color
    - Display: "Failed to load players. Please try again."
  - [ ] 4.6 Implement empty state display
    - Show empty state when data is empty array
    - Display centered message: "No players yet. Add your first player using the form."
    - Use muted text color
    - Center within Card component
    - Match empty state styling from spec requirements
  - [ ] 4.7 Implement player list rendering
    - Map over players array to render list items
    - Each list item displays: circular avatar thumbnail (48x48px), player name
    - Use avatar image from originalPhotoUrl field
    - Apply rounded-full class for circular thumbnail
    - Use medium font weight for player name
    - Truncate long names with text-ellipsis
  - [ ] 4.8 Implement player selection interaction
    - Add onClick handler to each list item
    - Call onSelectPlayer prop callback with player object
    - Apply visual highlight to selected player: border-2, border-primary, distinct background
    - Compare player.id with selectedPlayerId prop to determine selected state
    - Apply cursor-pointer on hover
    - Add hover state with background color change
  - [ ] 4.9 Implement inactive player visual distinction
    - Check player.status field for each player
    - If status === 'inactive', apply opacity-50 class
    - Add "Inactive" badge next to player name
    - Use small, muted badge styling
    - Keep inactive players clickable (can still edit/delete)
  - [ ] 4.10 Add PlayerSidebar to App.jsx layout
    - Import PlayerSidebar component in src/App.jsx
    - Modify layout to display PlayerForm and PlayerSidebar side-by-side
    - Use CSS Grid or Flexbox for two-column layout
    - PlayerForm on left, PlayerSidebar on right
    - Add appropriate gap between columns (e.g., gap-6 or gap-8)
    - Maintain existing container and padding from App.jsx
  - [ ] 4.11 Ensure PlayerSidebar component tests pass
    - Run ONLY the 2-8 tests written in 4.1
    - Verify players list renders correctly
    - Verify player selection triggers onSelectPlayer callback
    - Verify empty state displays when no players
    - Do NOT run entire test suite at this stage

**Acceptance Criteria:**
- The 2-8 tests written in 4.1 pass successfully
- PlayerSidebar component renders in Card container matching PlayerForm styling
- Players list displays all players with circular avatar thumbnails and names
- Loading state shows while fetching players
- Error state displays user-friendly message on fetch failure
- Empty state displays when no players exist
- Clicking a player triggers onSelectPlayer callback with player data
- Selected player has visual highlight (border and background)
- Inactive players show reduced opacity and "Inactive" badge
- PlayerSidebar integrated into App.jsx layout alongside PlayerForm

---

### Confirmation Dialogs & Delete Actions

#### Task Group 5: Deactivate and Delete Functionality
**Dependencies:** Task Groups 2, 4 (service functions and PlayerSidebar must exist)
**Estimated Effort:** 60-75 minutes
**Assigned To:** Frontend Engineer

- [ ] 5.0 Complete deactivate and delete functionality
  - [ ] 5.1 Write 2-8 focused tests for deactivate/delete actions
    - Limit to 2-8 highly focused tests maximum
    - Test only critical behaviors: deactivate mutation triggers, delete mutation triggers, confirmation dialogs appear before actions
    - Use React Testing Library with mock TanStack Query mutations
    - Skip exhaustive testing of all dialog states
    - Extend test file: src/components/__tests__/PlayerSidebar.test.jsx
  - [ ] 5.2 Install shadcn/ui AlertDialog component
    - Run: npx shadcn@latest add alert-dialog
    - Verify component installed in src/components/ui/alert-dialog.jsx
    - Import AlertDialog components: AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction
  - [ ] 5.3 Create TanStack Query mutation for deactivate
    - Add deactivateMutation to PlayerSidebar component
    - Import deactivatePlayer from playerService
    - Use useMutation hook with mutationFn: deactivatePlayer
    - Configure onSuccess: invalidate 'players' query, show success toast
    - Configure onError: show error toast with user-friendly message
    - Follow existing mutation patterns from PlayerForm
  - [ ] 5.4 Create TanStack Query mutation for delete
    - Add deleteMutation to PlayerSidebar component
    - Import deletePlayer from playerService
    - Use useMutation hook with mutationFn: deletePlayer
    - Configure onSuccess: invalidate 'players' query, show success toast, clear form if deleted player was selected
    - Configure onError: show error toast
    - Handle clearing selected player in parent App component
  - [ ] 5.5 Implement deactivate confirmation dialog
    - Add AlertDialog for deactivate action
    - Trigger opens dialog with player name in confirmation message
    - Message: "Deactivate [Player Name]? They will remain in the database but won't be added to future games."
    - Two buttons: Cancel (closes dialog) and Deactivate (triggers mutation)
    - Use neutral styling (not destructive variant)
    - Close dialog after mutation completes
  - [ ] 5.6 Implement delete confirmation dialog
    - Add separate AlertDialog for delete action
    - Trigger opens dialog with player name in confirmation message
    - Message: "Permanently delete [Player Name]? This cannot be undone."
    - Two buttons: Cancel (closes dialog) and Delete (triggers mutation)
    - Use destructive styling for Delete button (variant="destructive")
    - Close dialog after mutation completes
  - [ ] 5.7 Add action buttons to player list items
    - Add Deactivate and Delete icon buttons to each player list item
    - Position buttons on right side of list item (flex layout)
    - Use icon-only buttons (Trash icon for delete, Ban icon for deactivate)
    - Show buttons on hover OR always visible with subtle styling
    - Apply proper ARIA labels: aria-label="Deactivate [Player Name]"
    - Disabled buttons during pending mutations
  - [ ] 5.8 Handle selected player deletion
    - When delete mutation succeeds, check if deleted player was selected
    - If selected player deleted, call onCancel in parent App to clear form
    - Reset form mode back to 'add'
    - Clear selectedPlayer state in App component
    - Ensure form returns to pristine add mode state
  - [ ] 5.9 Ensure deactivate/delete tests pass
    - Run ONLY the 2-8 tests written in 5.1
    - Verify deactivate confirmation dialog appears and triggers mutation
    - Verify delete confirmation dialog appears and triggers mutation
    - Verify mutations invalidate 'players' query on success
    - Do NOT run entire test suite at this stage

**Acceptance Criteria:**
- The 2-8 tests written in 5.1 pass successfully
- shadcn/ui AlertDialog component installed and importable
- Deactivate button appears on each player list item
- Delete button appears on each player list item
- Clicking Deactivate opens confirmation dialog with player name
- Deactivate confirmation dialog triggers deactivateMutation on confirm
- Clicking Delete opens confirmation dialog with player name
- Delete confirmation dialog triggers deleteMutation on confirm
- Delete button uses destructive variant styling
- Successful deactivate invalidates 'players' query and shows toast
- Successful delete invalidates 'players' query and shows toast
- Deleting selected player clears form and returns to add mode
- Action buttons have proper ARIA labels for accessibility

---

### Integration & State Management

#### Task Group 6: App-Level Integration and State Coordination
**Dependencies:** Task Groups 3, 4, 5 (All components must be complete)
**Estimated Effort:** 45-60 minutes
**Assigned To:** Frontend/Integration Engineer

- [ ] 6.0 Complete App-level integration
  - [ ] 6.1 Write up to 10 integration tests for complete feature workflow
    - Add maximum 10 integration tests to fill critical gaps
    - Test end-to-end workflows: select player, edit player, deactivate player, delete player
    - Test state coordination between PlayerForm and PlayerSidebar
    - Test query invalidation and refetch after mutations
    - Focus on integration points, not unit-level details
    - Create test file: src/__tests__/integration/player-sidebar-management.test.jsx
  - [ ] 6.2 Implement App component state management
    - Add state for selected player: useState(null)
    - Add state for form mode: useState('add')
    - Create handleSelectPlayer function: sets selected player, changes mode to 'update'
    - Create handleCancelEdit function: clears selected player, resets mode to 'add'
    - Create handleUpdateSuccess function: clears selection, keeps mode in 'update' for further edits OR resets to 'add'
  - [ ] 6.3 Wire up PlayerForm with App state
    - Pass mode prop from App state to PlayerForm
    - Pass selectedPlayer prop from App state to PlayerForm
    - Pass onCancel={handleCancelEdit} to PlayerForm
    - Pass onUpdateSuccess={handleUpdateSuccess} to PlayerForm
    - Ensure PlayerForm mode switches correctly on player selection
  - [ ] 6.4 Wire up PlayerSidebar with App state
    - Pass selectedPlayerId prop (selectedPlayer?.id) to PlayerSidebar
    - Pass onSelectPlayer={handleSelectPlayer} to PlayerSidebar
    - Ensure player selection highlights correctly in sidebar
    - Ensure clicking different player switches form to new player's data
  - [ ] 6.5 Handle delete action clearing form state
    - Modify handleDeleteSuccess (in PlayerSidebar or App) to check if deleted player was selected
    - If deleted player matches selectedPlayer.id, call handleCancelEdit
    - This ensures form clears and returns to add mode after deleting selected player
    - Test edge case: delete player while editing them
  - [ ] 6.6 Implement queryClient invalidation coordination
    - Verify all mutations (create, update, deactivate, delete) invalidate ['players'] query
    - Ensure PlayerSidebar automatically refetches after any mutation
    - Test that sidebar updates immediately after: adding player, updating player, deactivating player, deleting player
    - Confirm no stale data issues between form and sidebar
  - [ ] 6.7 Test side-by-side layout responsiveness
    - Verify two-column layout displays correctly on desktop (1024px+)
    - Ensure columns have appropriate width distribution
    - Test with various window sizes to ensure no overflow
    - Confirm sidebar scrolls independently if player list is long
    - Note: Responsive mobile layout is out of scope per spec
  - [ ] 6.8 Run all feature-specific integration tests
    - Run the 10 integration tests written in 6.1
    - Verify end-to-end workflows function correctly
    - Test player selection → form population → update → sidebar refresh
    - Test player deactivation → sidebar visual update
    - Test player deletion → form clears if was selected
    - Do NOT run entire application test suite
  - [ ] 6.9 Manual integration testing checklist
    - Test complete edit workflow: select player, change name, submit, see updated name in sidebar
    - Test complete image update workflow: select player, upload new image, submit, see new image in sidebar
    - Test deactivate workflow: deactivate player, see "Inactive" badge and reduced opacity
    - Test delete workflow: delete player, verify removed from sidebar
    - Test delete selected player: select player, delete them, verify form clears and returns to add mode
    - Test query invalidation: add new player, verify immediately appears in sidebar
    - Test error states: simulate network failure, verify error toasts display
    - Verify no console errors or warnings during normal usage

**Acceptance Criteria:**
- Maximum 10 integration tests written and all pass
- App component manages selected player and form mode state
- PlayerForm receives correct props and mode switches when player selected
- PlayerSidebar highlights selected player correctly
- Selecting different player in sidebar switches form to that player's data
- Cancel button in PlayerForm clears selection and returns to add mode
- Deleting selected player clears form and returns to add mode
- All mutations (create, update, deactivate, delete) invalidate 'players' query
- PlayerSidebar refetches and updates after all mutations
- Two-column layout displays correctly on desktop
- Manual integration testing checklist completed with all items passing
- No console errors or warnings during feature usage

---

## Summary of Execution Order

**Recommended implementation sequence:**

1. **Task Group 1: Firestore Data Schema Update** (20-30 min)
   - Migrate existing player documents to include 'status' field
   - CRITICAL: Must be completed before service layer enhancements

2. **Task Group 2: Player Service CRUD Operations** (60-75 min)
   - Build service functions for fetch, update, deactivate, delete operations
   - Establishes backend integration foundation

3. **Task Group 3: Add Update Mode to PlayerForm** (60-75 min)
   - Enhance existing PlayerForm to support edit mode
   - Enables player data modification workflow

4. **Task Group 4: Player List Sidebar UI** (75-90 min)
   - Build PlayerSidebar component with player list and selection
   - Longest task group - complex UI with multiple states

5. **Task Group 5: Deactivate and Delete Functionality** (60-75 min)
   - Add confirmation dialogs and action buttons
   - Implement deactivate and delete mutations

6. **Task Group 6: App-Level Integration** (45-60 min)
   - Coordinate state between PlayerForm and PlayerSidebar
   - Final integration testing and validation

**Total Estimated Effort:** 5.5 - 7 hours

---

## Key Technical Decisions

### State Management Strategy
- **Selected Player State:** Managed at App component level (lifted state)
- **Form Mode State:** Managed at App component level ('add' vs 'update')
- **Query State:** Managed by TanStack Query with ['players'] queryKey
- **Invalidation Strategy:** Invalidate ['players'] after all mutations for automatic refetch

### Component Communication Pattern
- **PlayerForm ← App:** Props for mode, selectedPlayer, onCancel, onUpdateSuccess
- **PlayerSidebar ← App:** Props for selectedPlayerId, onSelectPlayer
- **Mutations → Query:** All mutations invalidate ['players'] query for data sync

### Image Update Workflow
1. User selects new image in edit mode
2. Upload new image to Firebase Storage
3. Delete old image from Firebase Storage (using deletePlayerImage)
4. Update Firestore document with new originalPhotoUrl
5. Handle errors gracefully: if upload fails, keep old image

### Delete Workflow Safety
1. Show confirmation dialog with player name and destructive styling
2. On confirm, delete player image from Storage
3. Delete player document from Firestore (even if image deletion fails)
4. If deleted player was selected, clear form and return to add mode
5. Invalidate ['players'] query to refresh sidebar

### Error Handling Consistency
- All service functions throw user-friendly error messages
- All mutations show error toasts on failure
- Image deletion failures logged but don't block document deletion
- Network errors provide retry guidance in toast messages

---

## Testing Strategy Summary

### Test Distribution
- **Task Group 2:** 2-8 tests for service functions
- **Task Group 3:** 2-8 tests for PlayerForm edit mode
- **Task Group 4:** 2-8 tests for PlayerSidebar component
- **Task Group 5:** 2-8 tests for deactivate/delete actions
- **Task Group 6:** Maximum 10 integration tests
- **Total Expected:** Approximately 18-42 tests (well within limits)

### Focus Areas
- Critical CRUD operations (fetch, update, deactivate, delete)
- PlayerForm mode switching and data pre-population
- PlayerSidebar player selection and visual states
- Confirmation dialogs and mutation triggers
- End-to-end integration workflows
- Query invalidation and automatic refetch

### Testing Constraints
- Mock Firebase SDK in all tests (no real network calls)
- Mock TanStack Query for predictable mutation states
- Focus on user workflows, not implementation details
- Skip exhaustive edge case testing during development
- Manual testing checklist for final validation

---

## Files to Create

- `/src/scripts/migratePlayerStatus.js` - Data migration script
- `/src/components/PlayerSidebar.jsx` - Player list sidebar component
- `/src/components/__tests__/PlayerSidebar.test.jsx` - PlayerSidebar tests
- `/src/__tests__/integration/player-sidebar-management.test.jsx` - Integration tests

## Files to Modify

- `/src/services/playerService.js` - Add fetch, update, deactivate, delete, deletePlayerImage functions
- `/src/services/__tests__/playerService.test.js` - Add tests for new service functions
- `/src/components/PlayerForm.jsx` - Add mode prop, selectedPlayer prop, edit mode logic
- `/src/components/__tests__/PlayerForm.test.jsx` - Add tests for edit mode behavior
- `/src/App.jsx` - Add PlayerSidebar, state management, two-column layout

## Dependencies to Install

- shadcn/ui AlertDialog component: `npx shadcn@latest add alert-dialog`
- No additional npm packages required (all dependencies already installed)

---

## Out of Scope Reminders

- Do NOT implement search or filter functionality in player list
- Do NOT implement real-time synchronization with Firestore onSnapshot listeners
- Do NOT implement responsive design or mobile layout for sidebar
- Do NOT implement bulk operations (select multiple players, bulk delete, etc.)
- Do NOT implement player reactivation UI (changing status from inactive back to active)
- Do NOT implement drag-and-drop reordering of players
- Do NOT implement pagination or infinite scroll for player list
- Do NOT implement sorting capabilities (alphabetical, by date, etc.)
- Do NOT implement player statistics or game history in sidebar
- Do NOT implement undo delete or trash/archive system
- Status field change from 'processing' to 'active' is intentional for this feature
