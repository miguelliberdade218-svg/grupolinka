---
globs: '["src/apps/main-app/pages/**/*.tsx","src/apps/main-app/pages/**/*.ts","src/shared/components/**/*.tsx"]'
description: This rule ensures that users who are not logged in cannot proceed
  with booking/reservation actions without being prompted to login first. This
  creates a consistent user experience across rides, hotels, and event spaces.
alwaysApply: true
---

For consistency across the platform, all booking/reservation actions should check if the user is logged in before proceeding. Show a toast notification asking the user to login if they are not authenticated.