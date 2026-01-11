# The Referee 🏆

A decision-support tool that helps you compare technical options by analyzing trade-offs based on your specific constraints. Unlike static comparison charts, The Referee dynamically adapts recommendations based on budget, scalability needs, and integration requirements.

![The Referee](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Docker](https://img.shields.io/badge/docker-ready-blue.svg)

## Features

- **Dynamic Comparisons**: Compare technical options with weighted scoring based on your constraints
- **AI-Powered Analysis**: Get intelligent comparisons using Google Gemini (free) or OpenAI
- **Trade-Off Analysis**: Understand strengths and weaknesses of each option
- **Pivot Guidance**: Get conditional recommendations ("If X matters more than Y, choose A")
- **Integration Filtering**: Filter options by required integrations
- **Dark Theme UI**: Modern, clean interface built with React and shadcn/ui
- **Admin Panel**: Add, edit, and delete options and integrations dynamically
- **AI-Powered Descriptions**: Generate descriptions using Wikipedia API (free, no API keys required)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL 15 |
| Containerization | Docker, Docker Compose |

## Quick Start

### Option 1: Docker (Recommended)

The fastest way to get started. Runs everything in containers.

```bash
# Clone the repository
git clone <repository-url>
cd the-referee

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

Access the application:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/api/health

### Option 2: Local Development

For development with hot-reload.

```bash
# Start only the database in Docker
docker-compose -f docker-compose.dev.yml up -d

# Install backend dependencies and start
cd backend
npm install
npm run dev

# In a new terminal, install frontend dependencies and start
cd frontend
npm install
npm run dev
```

## Project Structure

```
the-referee/
├── backend/                 # Express API server
│   ├── src/
│   │   ├── db/             # Database connection and queries
│   │   ├── middleware/     # Express middleware (validation, errors)
│   │   ├── routes/         # API route handlers
│   │   ├── services/       # Business logic (comparison, explanations)
│   │   └── types/          # TypeScript type definitions
│   ├── Dockerfile
│   └── package.json
├── frontend/                # React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities and API client
│   │   └── types/          # TypeScript type definitions
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── database/                # SQL scripts
│   ├── schema.sql          # Database schema
│   └── seed.sql            # Sample data
├── docker-compose.yml       # Production compose file
├── docker-compose.dev.yml   # Development compose file (DB only)
└── README.md
```

## Commands Reference

### Quick Start Scripts

Helper scripts are provided in the `scripts/` folder for easy startup.

**Windows (Command Prompt or PowerShell):**
```cmd
# Production mode (all services in Docker)
scripts\start.bat

# Development mode (only database in Docker)
scripts\start.bat dev
```

**Linux/Mac (Terminal):**
```bash
# First, make the script executable (one-time)
chmod +x scripts/start.sh

# Production mode (all services in Docker)
./scripts/start.sh

# Development mode (only database in Docker)
./scripts/start.sh dev
```

| Script | Mode | What it does |
|--------|------|--------------|
| `start.bat` / `start.sh` | `prod` (default) | Starts all services (DB, backend, frontend) in Docker containers |
| `start.bat dev` / `start.sh dev` | `dev` | Starts only the database in Docker, you run backend/frontend locally with hot-reload |

### Docker Commands

| Command | Description |
|---------|-------------|
| `docker-compose up -d` | Start all services in background |
| `docker-compose up --build` | Rebuild and start all services |
| `docker-compose down` | Stop all services |
| `docker-compose down -v` | Stop and remove volumes (reset DB) |
| `docker-compose logs -f` | Follow logs from all services |
| `docker-compose logs -f backend` | Follow backend logs only |
| `docker-compose ps` | List running containers |
| `docker-compose exec db psql -U referee -d the_referee` | Connect to database |

### Development Commands

**Backend:**
```bash
cd backend
npm install          # Install dependencies
npm run dev          # Start with hot-reload
npm run build        # Build for production
npm start            # Run production build
```

**Frontend:**
```bash
cd frontend
npm install          # Install dependencies
npm run dev          # Start with hot-reload
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Database Commands

```bash
# Connect to database (when using Docker)
docker-compose exec db psql -U referee -d the_referee

# Reset database (removes all data)
docker-compose down -v
docker-compose up -d

# View database logs
docker-compose logs -f db
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check with database status |
| GET | `/api/options` | List all available options |
| GET | `/api/options/integrations` | List all available integrations |
| POST | `/api/compare` | Compare two options with constraints |

### Example: Compare Request

```bash
curl -X POST http://localhost:3000/api/compare \
  -H "Content-Type: application/json" \
  -d '{
    "constraints": {
      "budgetMin": 0,
      "budgetMax": 50000,
      "scalabilityPriority": "high",
      "requiredIntegrations": []
    },
    "optionIds": [
      "11111111-1111-1111-1111-111111111111",
      "22222222-2222-2222-2222-222222222222"
    ]
  }'
```

## Environment Variables

### Backend (.env)

```env
DATABASE_URL=postgresql://referee:referee123@localhost:5433/the_referee
PORT=3000
FRONTEND_URL=http://localhost:5173

# AI Comparison (Optional - enables AI-powered analysis)
# Get free Gemini API key from: https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# Alternative: OpenAI (requires paid credits)
# OPENAI_API_KEY=your_openai_api_key_here
```

### Frontend (.env)

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

## Configuration

### Changing the Database Password

1. Update `docker-compose.yml`:
   ```yaml
   db:
     environment:
       POSTGRES_PASSWORD: your_new_password
   backend:
     environment:
       DATABASE_URL: postgresql://referee:your_new_password@db:5432/the_referee
   ```

2. Update `backend/.env` for local development:
   ```env
   DATABASE_URL=postgresql://referee:your_new_password@localhost:5432/the_referee
   ```

### Adding New Options

Edit `database/seed.sql` to add new technical options:

```sql
INSERT INTO options (id, name, description, category) VALUES
  ('your-uuid-here', 'New Option', 'Description here', 'category');

INSERT INTO attributes (option_id, attribute_type, value, rating, description) VALUES
  ('your-uuid-here', 'cost_model', 'Value', 'low|medium|high', 'Description'),
  ('your-uuid-here', 'scalability', 'Value', 'low|medium|high', 'Description'),
  ('your-uuid-here', 'complexity', 'Value', 'low|medium|high', 'Description'),
  ('your-uuid-here', 'maintenance', 'Value', 'low|medium|high', 'Description');
```

Then reset the database:
```bash
docker-compose down -v
docker-compose up -d
```

## Troubleshooting

### Port 5432 already in use

If you have PostgreSQL installed locally, port 5432 may be in use. The Docker setup uses port **5433** instead.

If you need to change ports, update:
1. `docker-compose.yml` - the `ports` mapping for `db` service
2. `backend/.env` - the `DATABASE_URL` port number

### Backend won't start

1. Check if database is running:
   ```bash
   docker-compose ps
   ```

2. Check database connection:
   ```bash
   docker-compose logs db
   ```

3. Verify DATABASE_URL is correct in `.env`

### Frontend can't connect to backend

1. Check if backend is healthy:
   ```bash
   curl http://localhost:3000/api/health
   ```

2. Verify CORS settings in backend (FRONTEND_URL env var)

3. Check VITE_API_BASE_URL in frontend `.env`

### Database connection refused

1. Wait for database to be ready (check health):
   ```bash
   docker-compose exec db pg_isready -U referee
   ```

2. Check if port 5432 is available:
   ```bash
   netstat -an | grep 5432
   ```

### Reset everything

```bash
# Stop all containers and remove volumes
docker-compose down -v

# Remove all images (optional)
docker-compose down --rmi all

# Start fresh
docker-compose up --build
```

## Development Tips

### Hot Reload Setup

For the best development experience:

1. Run database in Docker:
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

2. Run backend with ts-node-dev (auto-restarts on changes):
   ```bash
   cd backend && npm run dev
   ```

3. Run frontend with Vite (instant HMR):
   ```bash
   cd frontend && npm run dev
   ```

### Debugging

**Backend debugging:**
- Logs are printed to console
- Use `console.log()` or attach a debugger to port 9229

**Frontend debugging:**
- Use React DevTools browser extension
- Check browser console for errors
- Network tab shows API requests

### Code Style

- TypeScript strict mode enabled
- ESLint configured for React
- Prettier recommended for formatting

## License

MIT License - feel free to use this project for learning or building your own tools.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

Built with ❤️ for developers who need to make tough technical decisions.
