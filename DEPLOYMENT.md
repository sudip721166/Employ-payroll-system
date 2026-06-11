# Deployment - Render (Quick Guide)

This project can be deployed to Render using Docker. Below are quick steps to get you started.

## Local testing with Docker Compose
1. Ensure Docker Desktop is installed and running.
2. From project root run:
   - docker-compose up --build
3. Services:
   - Backend: http://localhost:3000
   - MySQL: port 3306 (user: root, password: example, DB: employee_payroll_system)

## Deploying to Render (recommended)
1. Create an account at https://render.com and connect your GitHub repository.
2. Add a new **Web Service**:
   - Environment: `Docker`
   - Build command: default (Render will build using the Dockerfile present)
   - Set environment variables (in Render dashboard):
     - `DB_HOST` (use Render managed DB host or connection string)
     - `DB_USER` (root or managed DB user)
     - `DB_PASSWORD`
     - `DB_NAME` (employee_payroll_system)
     - `PORT` (3000)
3. Optionally create a **Managed Database** on Render and set the DB credentials in the service's env.
4. Deploy and view logs in Render dashboard; use `GET /api/health` to verify app.

### GitHub Actions (CI → Deploy to Render)
You can automate deploys on pushes to `main` using the included GitHub Actions workflow: `.github/workflows/deploy-render.yml`.

Required repository secrets (create them in GitHub Settings → Secrets):
- `RENDER_API_KEY` — your Render API key (create a new key in Render dashboard).
- `RENDER_SERVICE_ID` — the target Render service id (found in Render dashboard under the service settings).

How the workflow works:
- On push to `main`, workflow installs backend dependencies, runs tests, builds the Docker image, and triggers a Render deploy via the Render REST API.
- The workflow polls the deploy status and fails if the deploy fails or times out.

Notes and next steps:
- If you use database migrations, add a migration step in the workflow (run `npm run db:migrate` against the managed DB after deploy or as a post-deploy job).
- Keep your API key secret; do not commit it to the repo.

## Notes
- This repo includes `Dockerfile.backend` (used for building the backend image). If you want Render to build from a subdirectory, either move the Dockerfile to repo root or set the build path in Render.
- For production, update the DB password and avoid exposing MySQL port publicly. Use Render managed DB or another managed database provider.
