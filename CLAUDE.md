# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Trip Planner is a comprehensive Next.js 15 application for planning and managing travel itineraries. Built with modern web technologies and designed for deployment on Google Cloud Platform.

## Technology Stack

- **Framework**: Next.js 15 with App Router and TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js v5 with Google OAuth
- **Deployment**: Docker containers on Google Cloud Run
- **Database Hosting**: Google Cloud SQL (PostgreSQL)

## Development Commands

- `pnpm dev` - Start development server on localhost:3000
- `pnpm build` - Build production bundle
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint linting
- `pnpm db:migrate` - Create and run database migrations (development)
- `pnpm db:migrate:deploy` - Run database migrations (production)
- `pnpm db:generate` - Generate Prisma client
- `pnpm db:studio` - Open Prisma Studio database GUI

## Database Schema

The application uses Prisma ORM with these main models:
- `User` - Authentication and user profiles
- `Trip` - Main trip entities with dates and descriptions
- `Destination` - Locations within trips (ordered)
- `Activity` - Planned activities at destinations with categories

## Architecture Notes

- Uses Next.js App Router with server components
- Authentication handled by NextAuth.js v5 with Prisma adapter
- Database operations through Prisma Client singleton
- UI components from shadcn/ui with consistent theming
- Environment variables for database and OAuth configuration

## Key File Locations

- Database schema: `prisma/schema.prisma`
- Auth configuration: `src/lib/auth.ts`
- Database client: `src/lib/db.ts`
- Main layout: `src/app/layout.tsx`
- Home page: `src/app/page.tsx`
- Sign-in page: `src/app/auth/signin/page.tsx`

## Deployment Configuration

- Dockerfile optimized for Next.js production builds
- Cloud Build configuration in `cloudbuild.yaml`
- Environment variables template in `.env.example`
- Docker ignore rules in `.dockerignore`

## Development Setup Requirements

1. Node.js 18+
2. pnpm package manager
3. PostgreSQL database
4. Google OAuth credentials (client ID and secret)
5. Environment variables configured from `.env.example`