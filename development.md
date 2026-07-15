# Development Guide

Complete setup and development workflow for ApiSpi.

## Prerequisites

- **PHP**: 8.2 or higher
- **Composer**: Latest version
- **Node.js**: 18 or higher
- **npm**: Latest version
- **MySQL**: 8.0+ or MariaDB 10.4+
- **Git**: For version control

## Initial Setup (5 Steps)

### 1. Clone Repository

```bash
git clone https://github.com/yourorg/as-website1-laravel.git
cd as-website1-laravel
```

### 2. Install PHP Dependencies

```bash
composer install
```

This installs all PHP packages defined in `composer.json` into the `vendor/` directory.

### 3. Setup Environment

```bash
cp .env.example .env
php artisan key:generate
```

This creates your `.env` configuration file and generates a unique application encryption key.

### 4. Setup Database

Create a local MySQL database:

```bash
mysql -u root -p
> CREATE DATABASE apispi_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
> EXIT;
```

Update `.env` with your database credentials:

```ini
DB_DATABASE=apispi_dev
DB_USERNAME=root
DB_PASSWORD=your_password
```

Run migrations:

```bash
php artisan migrate
```

(Optional) Seed sample data:

```bash
php artisan db:seed                    # Seed all seeders
php artisan db:seed --class=AgentSeeder  # Seed specific seeder
```

### 5. Setup Frontend

```bash
npm install
npm run build
```

This installs Node dependencies and builds frontend assets to `public_html/build/`.

## Environment Configuration

Create or edit `.env` with these key variables:

```ini
# Application
APP_NAME="APISPI"
APP_ENV=local
APP_KEY=base64:XXXXX              # Generated via php artisan key:generate
APP_DEBUG=true                    # Set to false in production
APP_URL=http://localhost:8000

# Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=apispi_dev
DB_USERNAME=root
DB_PASSWORD=

# Session (REQUIRED for multi-page apps)
SESSION_DRIVER=database

# AI Chatbot (Optional for local development)
ANTHROPIC_API_KEY=sk-ant-...      # From Anthropic console
ANTHROPIC_MODEL=claude-sonnet-4-5

# Email (use 'log' driver during development)
MAIL_MAILER=log
MAIL_FROM_ADDRESS=noreply@apispi.local
```

## Running Locally

Open two terminal windows/tabs:

**Terminal 1: Start Laravel development server**

```bash
php artisan serve
# Runs on http://localhost:8000
```

**Terminal 2: Start Vite development server (with HMR)**

```bash
npm run dev
# Runs on http://localhost:5173
# Assets served from http://localhost:8000 via Vite manifest
```

**Browser**: Visit `http://localhost:8000`

You should see the ApiSpi home page. Changes to Vue components and CSS will hot-reload in your browser.

## Development Commands

### Laravel/PHP Commands

#### Server & Caching

```bash
# Start development server
php artisan serve
# Default: http://localhost:8000
# Use --port=3000 to change port

# Clear application caches
php artisan cache:clear
php artisan config:clear
php artisan view:clear
php artisan optimize:clear    # Clear all optimization files

# Check application status
php artisan tinker            # Interactive REPL shell
php artisan down              # Put app in maintenance mode
php artisan up                # Bring app back up
```

#### Database

```bash
# Run pending migrations
php artisan migrate

# Roll back last batch of migrations
php artisan migrate:rollback

# Rollback all + re-run migrations
php artisan migrate:refresh

# Drop all tables + re-run migrations (⚠️ Destructive!)
php artisan migrate:fresh

# List migration status
php artisan migrate:status

# Run seeders
php artisan db:seed
php artisan db:seed --class=AgentSeeder    # Specific seeder

# Create new migration
php artisan make:migration create_table_name
php artisan make:migration add_column_to_table --table=table_name
```

#### Code Formatting & Linting

```bash
# Format code with Laravel Pint
./vendor/bin/pint

# Check code without changing
./vendor/bin/pint --check

# Format specific directory
./vendor/bin/pint app/Models
./vendor/bin/pint app/Http/Controllers
```

#### Testing

```bash
# Run all tests
composer test

# Run specific test class
composer test -- tests/Feature/AuthTest.php

# Run specific test method
composer test -- tests/Feature/AuthTest.php --filter testLoginSuccess

# Generate code coverage report
composer test -- --coverage-html coverage/
```

#### Interactive Shell (Tinker)

```bash
php artisan tinker

# Examples:
> $user = User::first()
> $user->is_admin = true
> $user->save()

> $agents = Agent::active()->get()
> $agents->count()

> Subscription::where('status', 'active')->count()

> exit
```

### Node/Frontend Commands

```bash
# Install dependencies
npm install

# Development server with HMR (runs on http://localhost:5173)
npm run dev

# Production build (outputs to public_html/build/)
npm run build

# Preview production build locally
npm run preview

# Check bundle size
npm run build -- --analyze
```

## Project Structure

### Key Directories

```
app/
├── Http/
│   ├── Controllers/
│   │   ├── Admin/              # Admin-only controllers
│   │   ├── AuthController.php
│   │   ├── AgentController.php
│   │   └── ...
│   ├── Middleware/
│   │   └── IsAdmin.php         # Admin access check
│   └── Resources/              # JSON API responses
├── Models/
│   ├── User.php
│   ├── Agent.php
│   ├── Skill.php
│   ├── Connector.php
│   ├── Subscription.php
│   ├── UserConnector.php
│   └── ActivityLog.php
├── Services/
│   ├── OAuthService.php
│   └── ChatService.php
└── Providers/

resources/
├── js/
│   ├── app.js                  # Global entry
│   ├── admin.js                # Admin app
│   ├── dashboard.js            # User dashboard
│   ├── catalog.js              # Agent catalog
│   ├── agents-list.js          # User's subscriptions
│   ├── agent-detail.js         # Individual subscription
│   ├── profile.js              # User profile
│   └── components/
│       ├── admin/              # Admin Vue components
│       ├── dashboard/          # Dashboard components
│       └── ...
├── views/
│   ├── layouts/
│   │   └── master.blade.php    # Main layout
│   ├── dashboard.blade.php
│   ├── agents/
│   │   ├── index.blade.php     # Agent catalog page
│   │   └── show.blade.php      # Dynamic agent detail
│   ├── contact.blade.php
│   └── ...
└── css/
    └── app.css                 # Global styles

database/
├── migrations/                 # Schema changes
├── seeders/                    # Sample data generators
│   ├── DatabaseSeeder.php
│   ├── AgentSeeder.php
│   ├── SkillSeeder.php
│   └── ...
└── factories/                  # Test data factories

routes/
└── web.php                     # All web routes

tests/
├── TestCase.php                # Base test class
├── Feature/                    # Feature/integration tests
│   ├── AuthTest.php
│   ├── AgentTest.php
│   └── ...
└── Unit/                       # Unit tests
    └── ...
```

## Common Development Tasks

### Adding a New Admin Page

1. **Create Vue component** in `resources/js/components/admin/YourPage.vue`

2. **Register in admin.js**:
   ```javascript
   import YourPage from './components/admin/YourPage.vue'
   
   const pages = {
     'your-page': YourPage,
     // ... other pages
   }
   ```

3. **Create Blade view** at `resources/views/admin/your-page.blade.php`:
   ```blade
   <div id="admin-app" data-page="your-page" data-props='{{ json_encode($data) }}'></div>
   ```

4. **Add route** in `routes/web.php`:
   ```php
   Route::get('/admin/your-page', [AdminController::class, 'yourPage'])->middleware(['auth', 'admin']);
   ```

5. **Create controller method** in `app/Http/Controllers/Admin/AdminController.php`:
   ```php
   public function yourPage() {
       return view('admin.your-page', [
           'data' => [...]
       ]);
   }
   ```

### Creating a New Model

```bash
# Create model with migration
php artisan make:model YourModel -m

# Create model with migration and controller
php artisan make:model YourModel -mrc
```

Edit migration in `database/migrations/` and run:

```bash
php artisan migrate
```

### Adding a Blade View

1. Create file in `resources/views/your-view.blade.php`
2. Use `@extends('layouts.master')` to inherit layout
3. Define `@section('content')` block
4. Reference in controller: `return view('your-view', ['data' => $data])`

### Running Migrations

```bash
# Run pending migrations
php artisan migrate

# Rollback last batch
php artisan migrate:rollback

# Fresh DB (drop all + migrate)
php artisan migrate:fresh

# Refresh (rollback all + migrate)
php artisan migrate:refresh
```

## Testing

### Structure

Tests are organized into:
- **Feature tests** (`tests/Feature/`) — integration tests
- **Unit tests** (`tests/Unit/`) — isolated component tests

### Running Tests

```bash
# Run all tests
composer test

# Run specific test file
composer test tests/Feature/AuthTest.php

# Run specific test method
composer test tests/Feature/AuthTest.php --filter testLoginSuccess

# Run with coverage
composer test -- --coverage-html coverage/

# Run tests in parallel
composer test -- --parallel
```

### Frontend Tests (Vitest)

A Vitest harness (with `@vue/test-utils`) covers Vue regressions — specs live in `tests/js/` (e.g. `user-profile-governance.spec.js`, pinning the July 2026 governance-tab regressions):

```bash
npm run test:js
```

### Continuous Integration

`.github/workflows/ci.yml` runs three legs:

- **PHP (SQLite)** — lint + full test suite on a PHP version matrix
- **MySQL 8** — the same suite against a MySQL 8 service, catching MySQL-only issues (reserved words like `out`, `DISTINCT`/`ORDER BY` strictness)
- **Frontend** — Node 24; uses `npm install` (not `npm ci`) because macOS-generated lockfile wasm optionals fail `npm ci`'s strict sync check on Linux, then runs Vitest and the Vite build

### Writing a Test

```php
// tests/Feature/AgentTest.php
namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Agent;

class AgentTest extends TestCase
{
    public function test_can_view_agent_catalog()
    {
        $response = $this->get('/agents');
        $response->assertStatus(200);
    }

    public function test_agent_detail_shows_skills()
    {
        $agent = Agent::factory()->has(Skill::factory(3))->create();
        
        $response = $this->get("/agents/{$agent->slug}");
        
        $response->assertStatus(200);
        $response->assertSee($agent->name);
    }
}
```

## Debugging

### Tinker REPL

```bash
php artisan tinker

> $user = User::find(1)
> $user->name
> $user->subscriptions
> dd($user)           # Dump and die
```

### Log Files

```bash
# View recent logs
tail -f storage/logs/laravel.log

# Clear logs
php artisan logs:clear
```

### Browser DevTools

- **Network**: Check API responses
- **Console**: JavaScript errors
- **Vue Devtools Extension**: Inspect Vue component state

### Laravel Debugbar

Add to `.env` for development:

```ini
DEBUGBAR_ENABLED=true
```

Then install (if not already):

```bash
composer require barryvdh/laravel-debugbar --dev
```

## Common Issues & Solutions

### Issue: Migrations Won't Run
```
SQLSTATE[HY000]: General error: 1030 Got error...
```
**Solution**: Check database connection in `.env`. Ensure MySQL is running.

### Issue: npm install fails
**Solution**: Clear npm cache and reinstall:
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Issue: Vite assets not loading in dev
**Solution**: Ensure Vite dev server is running on Terminal 2 with `npm run dev`.

### Issue: "Composer mutex is locked"
**Solution**: Remove the lock file:
```bash
rm -f ~/.composer/cache/repo/*/composer.lock
composer install
```

### Issue: "CORS error" from frontend to backend
**Solution**: Check `config/cors.php` is configured correctly. In development, ensure Vite is on `localhost:5173`.

## Best Practices

1. **Always run migrations** before pushing code with schema changes
2. **Format code** before committing: `./vendor/bin/pint`
3. **Test locally** before pushing: `composer test`
4. **Build assets** for production: `npm run build`
5. **Use `.env.example`** as template, never commit `.env` with secrets
6. **Write tests** for new features (aim for >80% coverage)
7. **Use seeders** for reproducible test data
8. **Keep Vue components** small and focused (max 300 lines)
9. **Cache API responses** where appropriate
10. **Log important events** via `ActivityLog::log()`

## Database Seeding

### Built-in Seeders

```bash
php artisan db:seed                       # Run all seeders
php artisan db:seed --class=AgentSeeder   # Run specific seeder
```

### Available Seeders

- `DatabaseSeeder` — orchestrates all seeders
- `AgentSeeder` — creates sample agents
- `SkillSeeder` — creates sample skills
- `ConnectorSeeder` — creates sample connectors
- `UserSeeder` — creates sample users
- `SubscriptionSeeder` — creates sample subscriptions

### Creating a Seeder

```bash
php artisan make:seeder YourSeeder
```

Edit `database/seeders/YourSeeder.php`:

```php
public function run(): void
{
    User::factory(10)->create();
    Agent::factory(5)->create();
}
```

Then add to `DatabaseSeeder.php`:

```php
public function run(): void
{
    $this->call([
        UserSeeder::class,
        AgentSeeder::class,
        // ... other seeders
    ]);
}
```

## Git Workflow

### Feature Branch Workflow

```bash
# Create feature branch
git checkout -b feature/agent-detail-page

# Make changes, test locally, commit
git add .
git commit -m "feat: add agent detail page with subscription"

# Push to remote
git push origin feature/agent-detail-page

# Create pull request on GitHub
# (after review and approval)

# Merge to main
git checkout main
git pull origin main
git merge feature/agent-detail-page
git push origin main

# Delete feature branch
git branch -d feature/agent-detail-page
git push origin --delete feature/agent-detail-page
```

### Commit Message Convention

Follow conventional commits:
- `feat:` — new feature
- `fix:` — bug fix
- `docs:` — documentation only
- `refactor:` — code restructuring (no behavior change)
- `test:` — test additions/changes
- `chore:` — maintenance, build, dependencies

Example:
```
feat: add agent subscription workflow

- Add SubscribeController with checkout flow
- Implement Stripe payment integration
- Create subscription success page
- Update agent detail to show subscribe button

Closes #123
```

## Deployment Preview

For details on production deployment, see [Deployment Guide](deployment.md).

Quick summary:
1. Build assets: `npm run build`
2. Commit assets: `git add public_html/build/ && git commit`
3. Push to main: `git push origin main`
4. SSH to server and pull: `cd ~/www/apispi.com && git pull`
5. Run migrations: `php artisan migrate`
