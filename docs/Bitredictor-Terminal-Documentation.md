# Bitredictor Terminal - "Neural Hub" Documentation

## 1. Purpose & Overview
The **Terminal** (located at `/dashboard`) serves as the central command center for users within the Bitredictor ecosystem. It is designed as a "Neural Interface" where users can monitor their predictive performance, manage their financial portfolio, and scan for market opportunities across various sectors (Crypto, Sports, Gaming, etc.).

The primary goal of the Terminal is to provide a high-end, data-driven experience that empowers users with real-time telemetry and advanced analytics to optimize their prediction strategies on the Somnia Network.

---

## 2. Visual Aesthetic & Theme
The Terminal adheres to a **Premium Cyberpunk Aesthetic**, characterized by:
- **Glassmorphism**: Transparent, frosted-glass cards (`glass-card` class) with backdrop blurring.
- **Color Palette**: Deep space backgrounds with high-contrast accents in `somnia-cyan`, `somnia-violet`, and `somnia-magenta`.
- **Typography**: Heavy, uppercase headers with wide tracking to evoke a "high-tech readout" feel.
- **Animations**: Subtle pulse effects, sliding transitions, and gradient flows (using `framer-motion`) to make the interface feel "alive."

---

## 3. Component Functionalities

### A. Dashboard Hub (Neural Terminal)
- **Hero Section**: Welcomes the user and provides quick actions to "Create Pool" or "Scan Sectors."
- **Telemetry Stats**: 4-column grid showing real-time network and personal metrics:
    - *Network Throughput*: Total STT volume.
    - *Active Nodes*: Current active markets.
    - *Linked Identities*: Total unique users.
    - *Protocol Yield*: Total rewards distributed.
- **Sector Intelligence Stream**: A filtered list of prediction pools categorized by industry. Users can toggle frequencies (categories) to find specific signals.
- **Prediction Pool Cards**: High-detail cards showing title, accumulated load (CREATOR STAKE), synced nodes (BETTOR COUNT), and a "Neural Progress Bar" representing the Yes/No sentiment balance.

### B. Side Menu (Neural Node Navigator)
Located on the left in wide screens, it provides persistent access to:
- **Core Streams**: Navigation links (Neural Hub, Inventory, Analytics, Signal Pulses, Settings).
- **Bio-Telemetry**: Quick stats for the current user (Success Prob, Net Yield, Signal Count) fetched directly from their profile.

### C. Performance Charts (Quantum Analytics)
Located at `/dashboard/performance-charts`:
- **Deep Analytics**: Visualizes win/loss ratios and profit/loss trends.
- **Timeframe Filtering**: Allows users to scan historical data over 7d, 30d, 90d, or lifetime.
- **Sector Performance**: Breaks down performance by market category (e.g., how successful is the user in "Sports" vs "Crypto").

### D. Financial Summary (Market Portfolio)
Located at `/dashboard/financial-summary`:
- **Asset Overview**: Total invested vs. unrealized P&L.
- **Lifecycle Tracking**: Lists all active and settled positions with detailed transaction logs.
- **Export Control**: Functionality to generate a cryptographic PDF report of the portfolio.

### E. Notifications (Signal Pulses)
Located at `/dashboard/notifications`:
- **Real-time Alerts**: In-app notifications for settled markets, won bets, and community interactions.
- **Categorization**: Grouped by "Market State" and "Neural Updates."

---

## 4. Backend Structure & Data Layer

### A. Services
- **`communityService.ts`**: Handles discussion threads, comments, and community statistics.
- **`optimizedPoolService.ts`**: Optimized fetching and caching of prediction pool data from the backend.
- **`gaunletService.ts`**: The primary interface for interacting with the **Gauntlet Smart Contract** on the Somnia Network.

### B. Hooks & State
- **`useProfileStore`**: A Zustand store managing the user's global profile state, including username, bio, and avatar.
- **`usePortfolio`**: Fetches comprehensive financial data for the connected wallet.
- **`useUserPerformance`**: Aggregates betting history into analytical metrics.
- **`useTrendingPools`**: Streamlines the delivery of high-volume markets to the dashboard.

### C. Contract Integration
The terminal interfaces with the following contracts:
- **Bitredictor (Gauntlet)**: For placing slips (bets), settling markets, and claiming rewards.
- **STT Token**: For managing stakes and platform currency interactions.

---

## 5. Required Backend APIs
To fully support the Terminal, the backend must provide the following endpoints:
1. `GET /api/v1/pools/trending`: To populate the Sector Intelligence Stream.
2. `GET /api/v1/user/portfolio/{address}`: Aggregated investment data.
3. `GET /api/v1/user/stats/{address}`: Win rates, profit/loss, and activity counts.
4. `GET /api/v1/notifications/{address}`: User-specific notification stream.
5. `POST /api/v1/user/profile`: Update neural identity parameters (bio, handles).

---

*This documentation is part of the Somnia Network Neural Nexus development suite.*
