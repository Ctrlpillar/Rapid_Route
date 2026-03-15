# RapidRoute - Package Tracking SaaS

  A modern package tracking platform for Goa, India, built with React, Vite, and TypeScript.

  ## Quick Start

  ```bash
  npm install
  npm run dev
  ```

  Visit http://localhost:5173 in your browser.

  ## Features

  - Home Page with hero section and tracking search
  - Track Page with interactive Leaflet map of Goa routes
  - Admin Panel at /admin with full management suite
  - Contacts Page with dynamic team roster
  - Settings & Notifications for users
  - Mock authentication via localStorage

  ## Admin Panel Features

  - Dashboard with stats and pending alerts
  - Users management (approve/delete)
  - Orders management (create, view, update status, delete)
  - Team management (add/remove members synced to Contacts page)

  ## Technologies

  React 19 + Vite + TypeScript + Tailwind CSS + Leaflet + Framer Motion

  ## Production Build

  ```bash
  npm run build
  ```

  ## Notes

  All data stored in browser localStorage. No backend required.
  