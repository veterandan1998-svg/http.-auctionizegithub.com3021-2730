# Auctionize Build Progress

## Done
- [x] app_init
- [x] Install deps (better-auth, aws-sdk, stripe, expo-secure-store)
- [x] design.md
- [x] auth-schema generated
- [x] Full DB schema (listings, orders, conversations, messages, reviews, promotions, userProfile)
- [x] DB pushed

## In Progress
- [ ] API routes (auth mount, listings, orders, messages, reviews, promotions, dashboard, admin, upload)
- [ ] Web pages
- [ ] Mobile screens

## API Routes TODO
- auth mount in index.ts
- /upload/presign
- /listings CRUD
- /orders (create checkout, webhook)
- /conversations + /messages
- /reviews
- /promotions (checkout)
- /dashboard/seller
- /dashboard/buyer
- /admin/*

## Web Pages TODO
- / homepage
- /sign-in, /sign-up
- /listings (browse+filter)
- /listings/:id
- /sell (create listing)
- /messages
- /dashboard/seller
- /dashboard/buyer
- /admin
- /profile/:id

## Mobile Screens TODO
- (auth)/sign-in, sign-up
- (tabs)/index (home)
- (tabs)/browse
- (tabs)/sell
- (tabs)/messages
- (tabs)/profile
- listing/[id]
