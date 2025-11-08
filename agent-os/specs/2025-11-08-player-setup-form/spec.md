# Specification: Player Setup Form

## Goal
Create a player registration form in the Holiday Pachinko Admin Panel that allows administrators to add new players with name and photo, uploading images to Firebase Storage and creating player records in Firestore with initial 'processing' status.

## User Stories
- As an admin, I want to create a new player with a name and photo so that they can participate in the Holiday Pachinko game
- As an admin, I want to see immediate validation feedback so that I can correct errors before submitting the form

## Specific Requirements

**Form Input Fields**
- Player Name text input (required field)
- Player Image file upload input (required field)
- Both fields validate on blur to provide immediate feedback
- Clear, user-friendly error messages display inline below each field
- Form prevents submission when validation errors exist

**File Upload Validation**
- Accept only JPEG, PNG, and WebP image formats
- Enforce maximum file size of 5MB
- Validate file type and size client-side before upload attempt
- Display inline error message if file type is invalid
- Display inline error message if file size exceeds 5MB
- Fail fast by validating before any Firebase operations

**Image Preview Component**
- Display selected image as 200x200 pixel thumbnail after file selection
- Show the selected filename below thumbnail
- Provide Remove button to clear image selection
- Preview updates immediately when user selects new file
- Preview clears when form is reset or image is removed

**Form Submission Process**
- Upload image file to Firebase Storage in 'uploads/' folder
- Retrieve downloadURL from Firebase Storage after successful upload
- Create new document in Firestore 'players' collection with name, originalPhotoUrl, and status fields
- Use TanStack Query mutation to handle async submission with loading/error/success states
- Prevent duplicate submissions by disabling submit button during processing

**Loading State Management**
- Disable submit button during form submission
- Display loading spinner on submit button during processing
- Keep form fields interactive but prevent form resubmission
- Clear loading state after success or error

**Error Handling Strategy**
- Field validation errors: Display inline below the specific field
- File type validation: Display inline error at file input
- File size validation: Display inline error at file input
- Firebase Storage upload errors: Display Toast notification with user-friendly message
- Firestore write errors: Display Toast notification with user-friendly message
- Network errors: Display Toast notification with retry guidance
- Never expose technical details or error stack traces to users

**Success State Behavior**
- Display success Toast notification confirming player creation
- Reset all form fields to empty state
- Clear image preview and file selection
- Clear any previous error messages
- Form ready for next player submission

**UI Component Architecture**
- Use shadcn/ui Card component as form container
- Use shadcn/ui Form component with react-hook-form integration for field validation
- Use shadcn/ui Input component for text input
- Use shadcn/ui Label component for field labels
- Use shadcn/ui Button component for submit and remove actions
- Use shadcn/ui Toast component for success and error notifications
- Apply Tailwind CSS utility classes for layout and spacing

**Firebase Integration**
- Initialize Firebase app using configuration from src/firebase.js
- Use Firebase Storage SDK to upload images to 'uploads/' folder with unique filenames
- Use Firestore SDK to create document in 'players' collection
- Document structure: name (string), originalPhotoUrl (string), status (string set to 'processing')
- Handle Firebase errors gracefully with user-friendly messages

**Accessibility Requirements**
- Use semantic HTML with proper form elements
- Provide descriptive labels for all form inputs using Label component
- Ensure keyboard navigation works for all interactive elements
- Display visible focus indicators on all focusable elements
- Include descriptive alt text for image preview
- Announce validation errors to screen readers

## Visual Design

No mockups provided. Implementation should follow shadcn/ui component styling patterns and Tailwind CSS conventions.

**Layout Structure**
- Center-aligned Card component as main container
- Vertical form layout with consistent spacing
- Player Name input at top
- Player Image upload below name
- Image preview (when file selected) below upload input
- Submit button at bottom of form

**Visual Hierarchy**
- Clear form title at top of Card
- Grouped form fields with consistent spacing
- Inline error messages in red text below fields
- Submit button prominently styled with loading state
- Toast notifications positioned in top-right corner

## Existing Code to Leverage

**React 19 with Vite Setup**
- Project already uses React 19.1.1 with Vite 7.1.7 as build tool
- StrictMode enabled in src/main.jsx
- Hot Module Replacement (HMR) configured for development
- Follow existing import patterns from App.jsx and main.jsx

**Firebase SDK Installation**
- Firebase 12.5.0 already installed in package.json dependencies
- Empty firebase.js file exists at src/firebase.js ready for configuration
- Use Firebase Storage for image uploads and Firestore for data persistence
- Follow Firebase v9+ modular SDK patterns (import specific functions)

**Tailwind CSS Setup**
- Tailwind CSS referenced in index.css (existing project configuration)
- Use utility-first approach with Tailwind classes for all styling
- Leverage Tailwind's responsive modifiers if needed for mobile layout
- Follow minimal custom CSS principle from CSS standards

**Component State Management Pattern**
- App.jsx demonstrates useState hook usage for local state
- Follow same pattern for form field state management
- Use react-hook-form for form validation state (via shadcn/ui Form)
- TanStack Query manages server state for async operations

**Project File Structure**
- All source code in src/ directory
- Main component in src/App.jsx (replace boilerplate content)
- Firebase configuration in src/firebase.js (needs initialization code)
- Global styles in src/index.css
- Entry point in src/main.jsx (no changes needed)

## Out of Scope
- Player list or table view to display all created players
- Edit existing player functionality
- Delete player functionality
- Search or filter players
- Player details view or modal
- Authentication or authorization logic (assumed handled by parent application)
- Image optimization, cropping, or editing features
- Backend image processing (status set to 'processing' for future backend service)
- Multiple image uploads per player
- Drag-and-drop file upload interface
- Upload progress bar or percentage indicator
- Batch player creation or CSV import
- Player export functionality
- TanStack Query installation and configuration (prerequisite)
- Tailwind CSS installation and configuration (prerequisite)
