# Product Mission

## Pitch
The Holiday Pachinko Admin Panel is a secure control center that helps game owners and marketing managers efficiently manage their digital pachinko game by providing complete control over prizes, game settings, and player analytics without requiring code deployments.

## Users

### Primary Customers
- **Developer/Owner**: The creator and operator of the Holiday Pachinko game who needs full control over game configuration and business metrics
- **Business Partners**: Future stakeholders who need secure access to manage prizes and monitor game performance
- **Marketing Managers**: Team members responsible for promotional campaigns, prize management, and player engagement strategies

### User Personas

**Solo Game Owner** (25-45 years)
- **Role:** Independent developer/entrepreneur running Holiday Pachinko
- **Context:** Managing the game as a side project or small business venture, balancing development with operations
- **Pain Points:** Needs to update game settings and prizes quickly without redeploying code; wants immediate visibility into player engagement and prize distribution
- **Goals:** Streamline operations, make data-driven decisions about prize inventory and game difficulty, minimize technical overhead

**Marketing Manager** (28-40 years)
- **Role:** Campaign manager for holiday promotions
- **Context:** Running seasonal marketing campaigns tied to prize giveaways and special events
- **Pain Points:** Depends on developers to update prizes and game settings; lacks real-time visibility into campaign performance; can't respond quickly to inventory changes
- **Goals:** Autonomously manage prize catalogs, adjust game economics to hit engagement targets, track ROI on promotional prizes

## The Problem

### Managing a Live Game Requires Agility Without Technical Dependencies
Operating a digital pachinko game means constantly adjusting to player behavior, inventory levels, and seasonal themes. Currently, every prize update, probability tweak, or configuration change requires code modifications and redeployment. This creates a bottleneck that prevents rapid response to business needs, slows down marketing campaigns, and increases operational costs.

**Our Solution:** A dedicated admin panel that separates game operations from code development. Administrators can manage prizes (including images), adjust game parameters, and monitor performance in real-time through a straightforward interface that reads from and writes to Firebase—no deployments necessary.

## Differentiators

### Real-Time Game Configuration Without Code Deployments
Unlike traditional game management systems that require developer intervention for every parameter change, we provide direct Firebase integration that allows instant updates to game settings. Adjust daily free plays, game costs, or prize probabilities and see changes reflected immediately in the live game. This results in faster iteration cycles, reduced developer dependency, and the ability to respond to player feedback within minutes instead of days.

### Comprehensive Prize Lifecycle Management
We go beyond basic CRUD operations by tracking the complete prize journey—from creation and inventory management through distribution and winner tracking. Upload prize images directly to Cloud Storage, monitor inventory levels, see exactly which users won which prizes, and identify popular rewards. This results in better inventory planning, reduced waste from over-provisioning, and data-driven prize selection strategies.

### Unified Player Intelligence Dashboard
Rather than piecing together data from Firebase Authentication, Firestore collections, and manual analysis, we consolidate player information into a single view. See user credentials, high scores, gameplay history, and prize wins all in one place. This results in faster customer support responses, better understanding of player segments, and the ability to identify and reward top players.

## Key Features

### Core Features
- **Dashboard with Key Metrics:** See total users, daily games played, and total prizes awarded at a glance to quickly assess game health and engagement trends
- **Full CRUD Prize Management:** Create, view, update, and delete prizes with inventory tracking, image uploads to Firebase Storage, and visibility into which prizes have been won by players
- **Dynamic Game Configuration:** Update critical game parameters (daily free plays, game cost, prize probabilities) directly in Firestore without code deployments, enabling rapid experimentation and tuning
- **User List with Prize History:** View all registered players with their email, UID, all-time high score, and complete list of prizes won for comprehensive player intelligence

### Analytics Features
- **Daily Player Count Tracking:** Monitor day-over-day player growth and engagement patterns to identify successful promotional periods
- **Total Games Played Metrics:** Track cumulative and daily gameplay volume to understand player retention and game popularity
- **Prize Distribution Analytics:** See which prizes are being awarded, at what frequency, and identify inventory shortages or surplus before they become problems

### Security Features
- **Firebase Authentication Integration:** Leverage Firebase's secure authentication system to ensure only authorized administrators can access the panel
- **Straightforward, Secure Interface:** Clean, minimal UI design that prioritizes clarity and reduces the risk of accidental misconfigurations or data exposure
