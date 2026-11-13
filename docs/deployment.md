# Vercel, Cloudflare Pages, and Neon

## Vercel API

Import the repository with **backend** as Root Directory and Django as the framework.
Set `DJANGO_SETTINGS_MODULE=config.vercel`, a strong `DJANGO_SECRET_KEY`,
`DJANGO_ALLOWED_HOSTS` to the explicit Vercel API hostname, and `DATABASE_URL`
to the existing Neon pooled connection URL. Set `DJANGO_CSRF_TRUSTED_ORIGINS`
to the exact HTTPS Cloudflare frontend origin (comma-separated if necessary).
Do not use wildcard preview origins. Set `PUBLIC_REGISTRATION_ENABLED` explicitly.
Vercel discovers the WSGI entrypoint and collects admin static assets.

## Cloudflare Pages

Import the repository with **frontend** as Root Directory, build command
`npm ci && npm run build`, and output directory **dist**. Use Node.js 24.
Pages sets `CLOUDFLARE_PAGES`, selecting root-relative frontend assets.
Set the runtime variable `API_ORIGIN` to the HTTPS Vercel API origin, with no path.
Use the Vercel hostname directly for Django admin.

## Database and cutover

Keep the existing Neon database and credentials outside Git. Use its direct
connection URL for migrations, separately from the pooled application URL.
Run migrations explicitly from a trusted environment, never on every request
or concurrently during preview builds. Preview deployments must use an isolated
synthetic database and their own explicit frontend origin.

Before cutover, verify health, registration policy, sign-in, sign-out, recording,
clearing, reload persistence, CSRF rejection, and ownership with synthetic users.
Verify admin assets on Vercel and desktop/mobile frontend assets on Pages.
Keep Render available until hosted checks pass.

References: [Vercel Django](https://vercel.com/docs/frameworks/full-stack/django),
[Pages advanced mode](https://developers.cloudflare.com/pages/functions/advanced-mode/),
[Neon pooling](https://neon.com/docs/connect/connection-pooling).
