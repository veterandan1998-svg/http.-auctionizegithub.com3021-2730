# Auctionize Design System

## Brand Identity
Bold, energetic, trustworthy marketplace. Think vibrant street market meets modern tech.

## Colors
```css
--primary: #FF6B00        /* Vivid Orange — CTAs, prices, key actions */
--primary-dark: #E55A00   /* Darker orange for hover states */
--accent: #0066FF         /* Electric Blue — links, badges, info */
--accent-dark: #0052CC    /* Darker blue for hover */
--success: #00C853        /* Green — sold, confirmed, success */
--warning: #FFD600        /* Yellow — promoted badge, warnings */
--danger: #FF3B30         /* Red — errors, remove */
--bg: #0F0F0F             /* Deep charcoal background */
--bg-card: #1A1A1A        /* Card background */
--bg-elevated: #242424    /* Elevated surfaces */
--border: #2E2E2E         /* Subtle borders */
--text-primary: #FFFFFF   /* Primary text */
--text-secondary: #A0A0A0 /* Secondary text */
--text-muted: #606060     /* Muted text */
```

## Typography
- **Display / Headings:** Poppins (700, 800) — bold, punchy
- **Body:** Inter (400, 500) — clean and readable
- **Prices:** Poppins 700 — always orange (#FF6B00)
- Scale: 12 / 14 / 16 / 20 / 24 / 32 / 48 / 64px

## Layout
- Max content width: 1280px
- Grid: 12-col for desktop, 4-col mobile
- Card padding: 16px
- Section spacing: 48-80px
- Border radius: 12px cards, 8px inputs, 999px pills/badges

## Components
- **Listing Card:** Dark bg, orange price, promoted badge (gold gradient), bold title
- **Buttons:** Primary = solid orange, Secondary = outlined blue, Danger = red
- **Badges:** Promoted = gold gradient pill, New = blue, Sold = gray
- **Search Bar:** Full-width, elevated bg, orange focus ring
- **Inputs:** Dark bg, border focus accent
- **Nav:** Dark sticky nav, orange logo accent

## Promoted Listings
- Gold gradient border glow
- "⚡ PROMOTED" badge — top-left gold pill
- Slightly larger card footprint in grid

## Mobile
- Bottom tab navigation
- Full-screen listing cards
- Swipeable image galleries
- Orange FAB for sell button
