# Product Roadmap

1. [ ] Dashboard with Key Metrics — Build the main landing page showing total registered users (from Firebase Auth), games played today (from Firestore query), and total prizes awarded (from Firestore aggregation). Includes basic navigation structure and authenticated layout. `S`

2. [ ] Prize Management - List & View — Create a table view displaying all prizes from Firestore with columns for name, description, inventory count, and number of times won. Include pagination and basic search/filter capabilities. `S`

3. [ ] Prize Management - Create & Image Upload — Build a form to create new prizes with fields for name, description, and inventory count. Integrate Firebase Storage upload for prize images with preview functionality and validation. `M`

4. [ ] Prize Management - Update & Delete — Implement edit functionality allowing updates to existing prizes including image replacement. Add delete functionality with confirmation dialog and cascade handling for prizes that have been won. `S`

5. [ ] Prize Winner Tracking — Extend prize list view to show which users have won each prize. Create a detail view or modal that displays winner information (username/email, date won) per prize. `S`

6. [ ] Game Configuration Page — Build a settings interface to display and update Firestore game configuration values (dailyFreePlays, gameCost, prize probabilities). Include real-time validation, change preview, and confirmation before saving to prevent accidental misconfigurations. `M`

7. [ ] User List with Scores — Create a read-only user management page that fetches all users from Firebase Authentication and enriches each record with Firestore data showing their all-time high score. Include sorting and filtering capabilities. `S`

8. [ ] User Prize History — Extend the user list to display a complete history of prizes won per user. Add a detail view or expandable row showing prize name, date won, and prize image for comprehensive player intelligence. `M`

> Notes
> - Order items by technical dependencies and product architecture
> - Each item should represent an end-to-end (frontend + backend) functional and testable feature
