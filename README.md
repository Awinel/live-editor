# Payload CMS Vercel Postgres Tailwind Template

This project is a template for building applications with Payload CMS, Vercel Postgres, Vercel Blob, and Tailwind CSS.

## Stack

| Dependency | Package | Purpose |
| --- | --- | --- |
| Payload CMS | `payload`, `@payloadcms/next`, `@payloadcms/ui`, `@payloadcms/richtext-lexical` | CMS, admin UI, and Lexical rich text |
| Vercel Postgres | `@payloadcms/db-vercel-postgres` | Database adapter |
| Vercel Blob | `@payloadcms/storage-vercel-blob` | Media / file storage for the Media collection |
| Next.js | `next` | App framework |
| Tailwind CSS | `tailwindcss`, `@tailwindcss/postcss` | Utility-first styling (v4) |
| Tailwind Animations | `tailwind-animations` | Ready-made animation utilities (imported in `styles.css`) |
| Lucide React | `lucide-react` | Icon library for React applications |

Frontend styles live in `src/app/(frontend)/styles.css`:

```css
@import 'tailwindcss';
@import 'tailwind-animations';
```

Vercel Blob is wired in `src/payload.config.ts` via `vercelBlobStorage` and stores Media uploads when `BLOB_READ_WRITE_TOKEN` is set.

## Quick start

This template can be deployed on Vercel with Vercel Postgres and Vercel Blob for the database and media storage.

## Quick Start - local setup

To spin up this template locally, follow these steps:

### Clone

After you click the `Deploy` button above, you'll want to have standalone copy of this repo on your machine. If you've already cloned this repo, skip to [Development](#development).

### Development

1. First [clone the repo](#clone) if you have not done so already
2. `cd my-project && cp .env.example .env` to copy the example environment variables. Set at least:
   - `PAYLOAD_SECRET` — random secret for Payload
   - `POSTGRES_URL` — your Vercel Postgres / Neon connection string
   - `BLOB_READ_WRITE_TOKEN` — Vercel Blob read/write token (required for Media uploads)

3. `pnpm install && pnpm dev` to install dependencies and start the dev server
4. open `http://localhost:3000` to open the app in your browser

That's it! Changes made in `./src` will be reflected in your app. Follow the on-screen instructions to login and create your first admin user. Then check out [Production](#production) once you're ready to build and serve your app, and [Deployment](#deployment) when you're ready to go live.

#### Docker (Optional)

If you prefer to use Docker for local development, the provided `docker-compose.yml` file can be used for a local database. Update `POSTGRES_URL` in your `.env` to match the compose service, then run `docker-compose up` (optionally with `-d`).

## How it works

The Payload config is tailored specifically to the needs of most websites. It is pre-configured in the following ways:

### Collections

See the [Collections](https://payloadcms.com/docs/configuration/collections) docs for details on how to extend this functionality.

- #### Users (Authentication)

  Users are auth-enabled collections that have access to the admin panel.

  For additional help, see the official [Auth Example](https://github.com/payloadcms/payload/tree/3.x/examples/auth) or the [Authentication](https://payloadcms.com/docs/authentication/overview#authentication-overview) docs.

- #### Media

  This is the uploads enabled collection. It features pre-configured sizes, focal point and manual resizing to help you manage your pictures. Files are stored in Vercel Blob via `@payloadcms/storage-vercel-blob`.

### Docker

Alternatively, you can use [Docker](https://www.docker.com) to spin up this template locally. To do so, follow these steps:

1. Follow [steps 1 and 2 from above](#development), the docker-compose file will automatically use the `.env` file in your project root
1. Next run `docker-compose up`
1. Follow [steps 4 and 5 from above](#development) to login and create your first admin user

That's it! The Docker instance will help you get up and running quickly while also standardizing the development environment across your teams.

## Questions

If you have any issues or questions, reach out to us on [Discord](https://discord.com/invite/payload) or start a [GitHub discussion](https://github.com/payloadcms/payload/discussions).
