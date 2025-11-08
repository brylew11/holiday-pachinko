# Spec Initialization: Player Sidebar Management

## Feature Description
Add a sidebar to the user set-up screen that shows all current users in Firestore. Users should be able to use the sidebar to edit and remove users.

## Context
- Enhancement to existing Player Setup Form
- Project: Holiday Pachinko Admin Panel
- Existing spec: `agent-os/specs/2025-11-08-player-setup-form/` (completed and deployed)

## Tech Stack
- React 19, Vite, Tailwind CSS, shadcn/ui
- Firebase (Firestore + Storage)
- TanStack Query

## Initial Requirements
- Display all current players from Firestore in a sidebar
- Allow editing existing players
- Allow removing/deleting players
- Integration with existing Player Setup Form screen
