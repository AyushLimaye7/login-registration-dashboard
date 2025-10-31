# shadcn/ui monorepo template

# Login Registration Dashboard

A full-stack web application featuring user authentication and a data visualization dashboard. Built with Next.js, FastAPI, and PostgreSQL.

## Features

- **User Authentication**
  - Secure JWT-based authentication
  - User registration and login
  - Protected routes and API endpoints
  - Password hashing and security

- **Interactive Dashboard**
  - Real-time data visualization
  - Marketing mix model analysis
  - Interactive charts and graphs
  - Responsive design

- **Modern Tech Stack**
  - Frontend: Next.js 14, TypeScript, Tailwind CSS
  - Backend: FastAPI, PostgreSQL
  - Data Visualization: Recharts
  - Development: Docker, Turborepo
- **Modern Tech Stack**
  - Frontend: Next.js 14, TypeScript, Tailwind CSS
  - Backend: FastAPI, PostgreSQL
  - Data Visualization: Recharts
  - Development: Docker, Turborepo



## General structure
- apps
    - api: fastapi
    - web: nextjs frontend
- packages
    - ui: shadcn component library
    - docker: dockerized database setup 

## Getting started
Use the monorepo setup. 
Run: **pnpm turbo run install**  
- installs dependencies for nextjs (/apps/web)
- installs dependencies for fastapi (/apps/api)

Run: **pnpm turbo run dev** 
- spins up docker-compose /packages/docker
    - 5432 for database
    - 8080 for adminer (db ui)
- starts fastapi dev server
- starts next applicaiton in dev
 

## Frontend component library
### Usage

```bash
pnpm dlx shadcn@latest init
```

### Adding components

To add components to your app, run the following command at the root of your `web` app:

```bash
pnpm dlx shadcn@latest add button -c apps/web
```

This will place the ui components in the `packages/ui/src/components` directory.

### Tailwind

Your `tailwind.config.ts` and `globals.css` are already set up to use the components from the `ui` package.

### Using components

To use the components in your app, import them from the `ui` package.

```tsx
import { Button } from "@workspace/ui/components/button"
```



