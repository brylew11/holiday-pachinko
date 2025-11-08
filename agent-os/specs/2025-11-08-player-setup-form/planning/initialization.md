# Spec Initialization: Player Setup Form

## Raw Idea from User

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

## Spec Metadata

- **Spec Name**: player-setup-form
- **Created**: 2025-11-08
- **Status**: Requirements Gathering
- **Spec Path**: `/Users/bryanlewis/Dropbox/WIP (in Dropbox)/Holiday Pachinko/admin-panel/agent-os/specs/2025-11-08-player-setup-form`
