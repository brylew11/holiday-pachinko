# Spec Requirements: Player Setup Form

## Initial Description
Create a player setup form with the following requirements:

1. **React Component** (src/App.jsx):
   - Simple form with text input for 'Player Name'
   - File input for 'Player Image'
   - Show preview of selected image
   - Use Tailwind CSS for styling

2. **onSubmit Function:**
   - Show loading state during submission
   - Upload image file to Firebase Storage in `uploads/` folder
   - Get the image's downloadURL
   - Create new document in Firestore `players` collection with:
     - `name`: player name from form
     - `originalPhotoUrl`: the downloadURL from Firebase Storage
     - `status`: set to 'processing'

**Context:**
- This is for the Holiday Pachinko Admin Panel
- Tech stack: React 19, Vite, Tailwind CSS, shadcn/ui, Firebase (Firestore + Storage)
- State management: TanStack Query for server state

## Requirements Discussion

### Complete Requirements Provided

**Component Location:**
Main content should be implemented in `src/App.jsx`

**File Validation:**
- Maximum file size: 5MB
- Accepted formats: JPEG, PNG, WebP only
- Validation performed before upload attempt

**Required Fields:**
- Player Name: Required field
- Player Image: Required field
- Validation trigger: On blur (when user leaves field)

**Error Handling:**
- Field validation errors: Display inline below the field
- Server/upload errors: Display using Toast notification
- Clear, user-friendly error messages

**Success State:**
- Display success Toast notification
- Reset form to empty state
- Clear image preview

**UI Components (shadcn/ui):**
- Input component
- Button component
- Label component
- Form component (with field validation)
- Card component (for form container)
- Toast component (for notifications)

**Note:** shadcn/ui components are NOT yet installed or configured in the project

**Image Preview:**
- Thumbnail size: 200x200 pixels
- Display filename
- Include Remove button to clear selection

**Loading State:**
- Disable submit button during submission
- Display spinner/loading indicator on button
- Prevent duplicate submissions

**Scope:**
- Create Player form only (no edit, delete, or list functionality)
- Single standalone form interface

### Existing Code to Reference

No similar existing features identified for reference. This is the first feature being built for the Holiday Pachinko Admin Panel.

### Follow-up Questions

No follow-up questions were required. All necessary requirements were provided upfront.

## Visual Assets

### Files Provided:
No visual assets provided.

### Visual Insights:
No visual design specifications provided. Implementation should follow:
- shadcn/ui component styling patterns
- Tailwind CSS utility classes
- Standard form layout conventions
- Accessible form design principles

## Requirements Summary

### Prerequisites

**CRITICAL - Must be completed before implementation:**
- shadcn/ui installation and configuration
- shadcn/ui components to install: Input, Button, Label, Form, Card, Toast
- Verify Firebase SDK is properly configured
- Verify TanStack Query is properly configured

### Functional Requirements

**Form Fields:**
- Player Name text input (required)
- Player Image file upload (required)
- Both fields validate on blur
- Clear validation error messages displayed inline

**Image Upload:**
- File selection via input field
- Client-side validation (5MB max, JPEG/PNG/WebP only)
- Upload to Firebase Storage in `uploads/` folder
- Retrieve downloadURL after successful upload

**Image Preview:**
- 200x200px thumbnail display
- Show selected filename
- Remove button to clear selection
- Preview updates immediately on file selection

**Form Submission:**
- Upload image to Firebase Storage
- Create Firestore document in `players` collection:
  - `name`: string (from form input)
  - `originalPhotoUrl`: string (Firebase Storage downloadURL)
  - `status`: string (hardcoded to 'processing')
- Handle submission via TanStack Query mutation
- Prevent duplicate submissions during processing

**Loading State:**
- Disabled submit button during submission
- Loading spinner displayed on submit button
- All form fields remain interactive but submission blocked

**Error Handling:**
- Field validation errors: Inline display below field
- File type validation: Inline error if wrong format
- File size validation: Inline error if over 5MB
- Firebase Storage errors: Toast notification
- Firestore errors: Toast notification
- Network errors: Toast notification
- User-friendly error messages (no technical details exposed)

**Success State:**
- Success Toast notification displayed
- Form fields reset to empty
- Image preview cleared
- Form ready for next submission

### Reusability Opportunities

No existing components identified for reuse. However, this implementation should follow patterns that enable future reuse:
- Form validation logic could be extracted for reuse in Prize Management forms
- Image upload logic could be reused for Prize image uploads
- Toast notification patterns should be consistent for future features
- Loading state patterns should be consistent across forms

### Scope Boundaries

**In Scope:**
- Create Player form interface in src/App.jsx
- Player Name text input with validation
- Player Image file upload with validation
- Image preview with Remove functionality
- Firebase Storage upload to `uploads/` folder
- Firestore document creation in `players` collection
- Client-side validation (file type, size, required fields)
- Loading state during submission
- Error handling (inline for fields, Toast for server)
- Success state with Toast and form reset
- shadcn/ui component integration
- Tailwind CSS styling

**Out of Scope:**
- Player list/table view (future: Prize Management pattern)
- Edit existing player functionality
- Delete player functionality
- Search/filter players
- Player details view
- Authentication/authorization (handled by parent app)
- Image optimization or processing (status set to 'processing' for future backend processing)
- Multiple image uploads
- Drag-and-drop file upload
- Image cropping or editing
- Progressive upload with progress bar
- Batch player creation

**Future Enhancements Mentioned:**
- None explicitly stated, but natural progression includes:
  - Player list view (similar to Prize Management roadmap item)
  - Player details with prize history
  - Edit/delete player functionality
  - Integration with broader admin panel navigation

### Technical Considerations

**Product Alignment:**
- This form serves as a foundation for future player management features
- Aligns with admin panel mission: "efficiently manage their digital pachinko game"
- Follows roadmap pattern of starting with create operations before list/edit/delete
- Enables future "User List with Prize History" roadmap feature

**Integration Points:**
- Firebase Storage: `uploads/` folder for image storage
- Firestore: `players` collection for player documents
- TanStack Query: Mutation for form submission with loading/error states
- shadcn/ui: Component library for form elements and notifications

**Existing System Constraints:**
- React 19.1.1 as JavaScript framework
- Vite 7.1.7 as build tool
- Tailwind CSS for styling (utility-first approach)
- Firebase as backend (Firestore + Storage)
- No backend API layer (direct Firebase SDK integration)
- TanStack Query for server state management

**Technology Preferences:**
- shadcn/ui for UI components (accessible, customizable, built on Radix UI)
- Tailwind CSS for styling (utility classes)
- TanStack Query for async state (loading, error, success)
- Direct Firebase SDK usage (no REST API wrapper)

**Standards Compliance:**
- Validation: Client-side for UX, validate file type/size before upload
- Error Handling: User-friendly messages, no technical details exposed
- Component Design: Single responsibility (form), reusable patterns
- State Management: Use TanStack Query for server state (upload/create)
- Fail Fast: Validate file before attempting upload

**Similar Code Patterns to Follow:**
- None identified (first feature implementation)
- Establish patterns for future Prize Management forms
- Set conventions for image upload flows
- Define Toast notification standards
