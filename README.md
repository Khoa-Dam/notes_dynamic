<div align=center>

# Notes Dynamic

### 🚀 A modern note-taking app, a Notion.so replica, featuring real-time collaboration and customizable workspaces

**[<kbd> <br> &nbsp;**Live Demo**&nbsp; <br> </kbd>][site]**

</div>

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Database Setup](#-database-setup)
- [OAuth Configuration](#-oauth-configuration)
- [Deployment](#-deployment)
- [Project Structure](#-project-structure)

## ✨ Features

- **📝 Rich Text Editor**: Powered by BlockNote with full formatting support
- **📁 Workspace Management**: Create and organize multiple workspaces
- **🗂️ Folder & File System**: Nested folder structure for better organization
- **🎨 Customizable**: Custom icons, headers, and themes for workspaces
- **🌙 Dark Mode**: Beautiful dark mode with system preference support
- **🔐 Authentication**: Multiple auth methods (Email/Password, Google OAuth, GitHub OAuth)
- **👥 User Management**: Profile management with avatar support
- **🗑️ Trash System**: Soft delete with restore functionality
- **📱 Responsive Design**: Fully responsive with mobile sidebar
- **⚡ Real-time Updates**: Optimistic UI updates with server sync
- **🔒 Secure**: Password hashing with bcrypt, secure session management

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Utility-first CSS framework
- **shadcn/ui** - High-quality component library
- **BlockNote** - Rich text editor
- **Valtio** - Proxy-based state management
- **React Hook Form** - Form management
- **Zod** - Schema validation

### Backend
- **Next.js API Routes** - Server-side API
- **NextAuth.js v5** - Authentication
- **Drizzle ORM** - Type-safe SQL ORM
- **PostgreSQL** - Database
- **bcryptjs** - Password hashing

### Tools & Libraries
- **Drizzle Kit** - Database migrations and studio
- **Lucide React** - Icon library
- **Sonner** - Toast notifications
- **date-fns** - Date utilities
- **next-themes** - Theme management
- **react-resizable-panels** - Resizable layout panels

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ or Bun
- PostgreSQL database
- pnpm, npm, yarn, or bun

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/Khoa-Dam/notes_dynamic
cd notes_dynamic
```

2. **Install dependencies**

```bash
pnpm install
# or
npm install
# or
bun install
```

3. **Set up environment variables**

```bash
cp .env.example .env
```

Then edit `.env` and add your own environment variables (see [Environment Variables](#-environment-variables) section)

4. **Set up the database**

```bash
# Generate migration files
pnpm db:generate

# Push schema to database
pnpm db:push

# Or open Drizzle Studio to manage database
pnpm db:studio
```

5. **Run the development server**

```bash
pnpm dev
# or
npm run dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.


### Generating NEXTAUTH_SECRET

You can generate a secret using:

```bash
openssl rand -base64 32
```

## 🗄️ Database Setup

1. **Create a PostgreSQL database**

```sql
CREATE DATABASE notes_db;
```

2. **Update DATABASE_URL in `.env`**

```env
DATABASE_URL=postgresql://user:password@localhost:5432/notes_db
```

3. **Run migrations**

```bash
pnpm db:push
```

Or use Drizzle Studio to manage your database:

```bash
pnpm db:studio
```

## 🔑 OAuth Configuration

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://your-domain.com/api/auth/callback/google` (production)
6. Copy Client ID and Client Secret to `.env`

### GitHub OAuth

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in the form:
   - **Application name**: Notes Dynamic
   - **Homepage URL**: `http://localhost:3000` (or your production URL)
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Copy Client ID and generate Client Secret
5. Add them to `.env`

## 🚢 Deployment

### Deploy to Vercel

1. **Push your code to GitHub**

2. **Import project to Vercel**
   - Go to [Vercel](https://vercel.com)
   - Click **New Project**
   - Import your GitHub repository

3. **Configure Environment Variables**
   - Add all environment variables from `.env`
   - Set `NEXTAUTH_URL` to your production URL: `https://your-domain.vercel.app`

4. **Update OAuth Redirect URIs**
   - Google: Add `https://your-domain.vercel.app/api/auth/callback/google`
   - GitHub: Add `https://your-domain.vercel.app/api/auth/callback/github`

5. **Deploy**
   - Vercel will automatically deploy on every push to main branch

### Database on Production

For production, use a managed PostgreSQL service:
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
- [Supabase](https://supabase.com)
- [Neon](https://neon.tech)
- [Railway](https://railway.app)

Update `DATABASE_URL` in Vercel environment variables with your production database URL.

## 📁 Project Structure

```
notes_dynamic/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Authentication pages
│   │   ├── (lobby)/           # Landing page
│   │   ├── api/               # API routes
│   │   └── dashboard/         # Dashboard pages
│   ├── components/            # React components
│   │   ├── editor/           # BlockNote editor
│   │   ├── sidebar/          # Sidebar components
│   │   ├── ui/               # shadcn/ui components
│   │   └── workspace/        # Workspace components
│   ├── config/               # Configuration files
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utility functions
│   │   ├── db/              # Database setup & queries
│   │   └── validations/     # Zod schemas
│   └── types/               # TypeScript types
├── public/                   # Static assets
└── package.json
```

## 📝 Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm db:generate` - Generate database migrations
- `pnpm db:push` - Push schema to database
- `pnpm db:studio` - Open Drizzle Studio

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 🔗 Links

- **Live Demo**: [https://notes-dynamic.vercel.app](https://notes-dynamic.vercel.app)
- **GitHub Repository**: [https://github.com/Khoa-Dam/notes_dynamic](https://github.com/Khoa-Dam/notes_dynamic)

---

<div align=center>

Made with ❤️ by [Kaito](https://github.com/Khoa-Dam)

</div>

[site]: https://notes-dynamic.vercel.app
