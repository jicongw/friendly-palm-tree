# Trip Planner

A comprehensive Next.js 15 trip planning application with TypeScript, Tailwind CSS, shadcn/ui, Prisma ORM, PostgreSQL, and NextAuth.js v5 authentication. Designed for deployment on Google Cloud Run with Cloud SQL.

## Features

- **Modern Stack**: Next.js 15 with App Router and TypeScript
- **Authentication**: NextAuth.js v5 with Google OAuth
- **Database**: Prisma ORM with PostgreSQL
- **UI**: Tailwind CSS with shadcn/ui components
- **Cloud Ready**: Docker configuration for Google Cloud Run
- **Database Models**: Complete schema for trips, destinations, and activities

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm (recommended package manager)
- PostgreSQL database
- Google OAuth credentials

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd friendly-palm-tree
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```
Edit `.env` with your database URL and OAuth credentials.

4. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

5. Run the development server:
```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## Development Commands

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm db:push` - Push schema to database
- `pnpm db:migrate` - Run database migrations
- `pnpm db:generate` - Generate Prisma client
- `pnpm db:studio` - Open Prisma Studio

## Environment Variables

Copy `.env.example` to `.env` and configure:

- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_URL` - Your app URL (http://localhost:3000 for development)
- `NEXTAUTH_SECRET` - Random secret for NextAuth.js
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret

## Database Schema

The application includes models for:

- **Users**: Authentication and user data
- **Trips**: Main trip entities with dates and descriptions
- **Destinations**: Locations within trips
- **Activities**: Planned activities at destinations

## Google Cloud Deployment

### Prerequisites

- Google Cloud Project with billing enabled
- Cloud SQL PostgreSQL instance
- Cloud Build API enabled
- Cloud Run API enabled

### Setup

1. Create a Cloud SQL PostgreSQL instance
2. Update `DATABASE_URL` in your production environment
3. Build and deploy using Cloud Build:

```bash
gcloud builds submit --config cloudbuild.yaml
```

Or deploy manually:

```bash
# Build the Docker image
docker build -t gcr.io/YOUR_PROJECT_ID/trip-planner .

# Push to Container Registry
docker push gcr.io/YOUR_PROJECT_ID/trip-planner

# Deploy to Cloud Run
gcloud run deploy trip-planner \
  --image gcr.io/YOUR_PROJECT_ID/trip-planner \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Environment Variables for Production

Set these in Cloud Run:

- `DATABASE_URL` - Cloud SQL connection string
- `NEXTAUTH_URL` - Your production URL
- `NEXTAUTH_SECRET` - Production secret
- `GOOGLE_CLIENT_ID` - OAuth client ID
- `GOOGLE_CLIENT_SECRET` - OAuth client secret

## Technology Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Authentication**: NextAuth.js v5
- **Database**: PostgreSQL with Prisma ORM
- **Deployment**: Docker, Google Cloud Run, Cloud SQL
- **Icons**: Lucide React

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── api/auth/       # NextAuth.js API routes
│   ├── auth/           # Authentication pages
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Home page
├── components/         # React components
│   └── ui/            # shadcn/ui components
└── lib/               # Utility functions
    ├── auth.ts        # NextAuth.js configuration
    ├── db.ts          # Prisma client
    └── utils.ts       # General utilities

prisma/
└── schema.prisma      # Database schema

Docker files:
├── Dockerfile         # Production Docker image
├── .dockerignore     # Docker ignore rules
└── cloudbuild.yaml   # Google Cloud Build configuration
```