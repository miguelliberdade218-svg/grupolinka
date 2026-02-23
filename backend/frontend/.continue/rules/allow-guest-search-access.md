---
globs: '["src/apps/main-app/pages/**/*.tsx","src/apps/main-app/pages/**/*.ts"]'
description: This rule ensures that users who are not logged in can still browse
  and search for available rides, hotels, and event spaces. They should only be
  prevented from making actual bookings/reservations, not from viewing search
  results.
alwaysApply: true
---

Allow unauthenticated users to search for rides, hotels, and event spaces. Only restrict booking/reservation actions, not search functionality.