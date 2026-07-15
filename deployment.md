# Deployment Guide

Complete instructions for deploying ApiSpi to production on SiteGround shared hosting.

## Production Environment

### Hosting Overview

- **Provider**: SiteGround shared hosting
- **Server Path**: `~/www/apispi.com`
- **Web Root**: `public_html/` (non-standard location)
- **PHP Version**: 8.2+
- **Database**: MySQL 8.0+
- **Node.js**: NOT available on server
- **SSL**: HTTPS required (managed by SiteGround)

### Key Constraints

1. **No Node.js** — Must build frontend locally, commit assets to git
2. **No npm** — No `npm install` on server
3. **Git-based deployment only** — No FTP uploads
4. **No build step on server** — All assets must be built locally and committed
5. **Database migrations** — Must be run manually after deploy (or via git hooks)

## Pre-Deployment Checklist

### Local Machine (5 Steps)

**Step 1: Verify Code Status**

```bash
git status
# Ensure working directory is clean
# If not, commit or stash changes
```

**Step 2: Pull Latest Code**

```bash
git pull origin main
```

**Step 3: Install Dependencies**

```bash
# Install production PHP dependencies
composer install --no-dev

# Install Node dependencies (for building)
npm install
```

**Step 4: Run Tests**

```bash
# Run test suite (optional but recommended)
composer test

# Check code formatting
./vendor/bin/pint --check
```

**Step 5: Build Frontend Assets**

```bash
npm run build
# Output: public_html/build/{app.js,app.css,admin.js,dashboard.js,...}
```

Verify build output:

```bash
git status
# You should see changes in public_html/build/

ls -la public_html/build/
# Should show .js, .css, and .json files
```

## deploy.sh (Preferred)

The app repo now ships `deploy.sh` — run it **on the server** (`~/www/apispi.com`) to make pull + migrate + cache-clear a single command (pull-without-migrate has caused production 500s before):

```bash
./deploy.sh                  # pull + migrate + clear caches
./deploy.sh ConnectorSeeder  # …and re-run one specific seeder
```

It deliberately does **not** run a full `db:seed` — admins edit agents/trainings in the DB, and a blanket re-seed would clobber those edits. Pass the specific seeder class instead (seeders are `updateOrCreate`-safe).

## Deployment Steps (5 Steps)

### Step 1: Build Frontend Assets Locally

Ensure you have built production assets:

```bash
npm run build
# Outputs to public_html/build/
```

### Step 2: Commit Built Assets

```bash
git add public_html/build/
git commit -m "Build frontend assets for v1.2.0"
```

Include a version number in the commit message for easy tracking.

### Step 3: Create Git Tag (Optional)

```bash
git tag -a v1.2.0 -m "Release version 1.2.0"
```

### Step 4: Push to Repository

```bash
git push origin main
git push origin v1.2.0      # If using tags
```

### Step 5: Deploy to Server (SSH)

Connect to SiteGround via SSH:

```bash
ssh user@apispi.com
cd ~/www/apispi.com
```

**Pull Latest Code**

```bash
git pull origin main
# This pulls built assets along with code changes
```

**Clear Caches** (recommended)

```bash
php artisan cache:clear
php artisan config:clear
php artisan view:clear
```

**Run Migrations** (if needed)

```bash
# Check if there are pending migrations
php artisan migrate:status

# Run pending migrations
php artisan migrate
```

**Verify Deployment**

```bash
# Check application is running
curl https://apispi.com

# Check logs for errors
tail -f storage/logs/laravel.log
```

## Complete Deployment Workflow

For reference, here's the complete workflow from start to finish:

### Pre-Deployment (Local)

```bash
# 1. Ensure working directory is clean
git status

# 2. Pull latest code
git pull origin main

# 3. Install dependencies
composer install --no-dev
npm install

# 4. Run tests
composer test

# 5. Build frontend assets
npm run build

# 6. Verify build
git status
ls -la public_html/build/
```

### Deployment (Local & Server)

```bash
# 7. Commit built assets
git add public_html/build/
git commit -m "Build frontend assets for v1.2.0"

# 8. Create tag (optional)
git tag -a v1.2.0 -m "Release version 1.2.0"

# 9. Push to repository
git push origin main
git push origin v1.2.0

# 10. SSH to server
ssh user@apispi.com

# 11. Deploy (on server)
cd ~/www/apispi.com
git pull origin main

# 12. Clear caches
php artisan cache:clear
php artisan config:clear
php artisan view:clear

# 13. Run migrations (if needed)
php artisan migrate

# 14. Verify
curl https://apispi.com
tail -f storage/logs/laravel.log
```

## Rollback Procedure

If deployment introduces issues, rollback to previous version:

### Quick Rollback (Using Git)

```bash
# On server
cd ~/www/apispi.com

# Check recent commits
git log --oneline -10

# Rollback to previous commit
git reset --hard <commit-hash>
git clean -fd

# Clear caches
php artisan cache:clear
php artisan optimize:clear

# Verify
curl https://apispi.com
```

### Full Rollback with Database

If migrations caused issues:

```bash
# On server
cd ~/www/apispi.com

# Rollback migrations
php artisan migrate:rollback

# Rollback code
git reset --hard <previous-commit-hash>

# Clear caches
php artisan cache:clear
php artisan optimize:clear

# Verify
curl https://apispi.com
```

## Environment Configuration (Production)

On server, `.env` should contain:

```ini
# Application
APP_NAME="APISPI"
APP_ENV=production
APP_DEBUG=false                    # NEVER true in production
APP_KEY=base64:XXXXX              # Set during initial setup

APP_URL=https://apispi.com

# Database
DB_CONNECTION=mysql
DB_HOST=localhost
DB_DATABASE=apispi_prod
DB_USERNAME=apispi_prod_user
DB_PASSWORD=***                   # Use strong password

# Session (REQUIRED)
SESSION_DRIVER=database

# Cache (recommended: Redis if available)
CACHE_DRIVER=file                 # or 'redis'

# Queue (optional)
QUEUE_CONNECTION=sync

# Mail
MAIL_MAILER=smtp
MAIL_HOST=mail.apispi.com
MAIL_PORT=587
MAIL_USERNAME=noreply@apispi.com
MAIL_PASSWORD=***
MAIL_FROM_ADDRESS=noreply@apispi.com
MAIL_FROM_NAME="ApiSpi"

# AI Integration
ANTHROPIC_API_KEY=sk-ant-***      # From Anthropic console
ANTHROPIC_MODEL=claude-sonnet-4-5

# Logging
LOG_CHANNEL=stack
LOG_LEVEL=warning                 # Use 'warning' or higher in production
```

### Initial Setup on Server

If this is the first deployment:

```bash
# 1. Clone repository
git clone <repo-url> ~/www/apispi.com
cd ~/www/apispi.com

# 2. Create .env
cp .env.example .env
nano .env                         # Edit with production credentials

# 3. Generate key
php artisan key:generate

# 4. Install PHP dependencies
composer install --no-dev

# 5. Create database
# (via SiteGround cPanel or SSH MySQL)
mysql -u root -p
> CREATE DATABASE apispi_prod;
> CREATE USER 'apispi_prod_user'@'localhost' IDENTIFIED BY 'strong-password';
> GRANT ALL PRIVILEGES ON apispi_prod.* TO 'apispi_prod_user'@'localhost';
> FLUSH PRIVILEGES;
> EXIT;

# 6. Run migrations
php artisan migrate

# 7. Seed data (optional)
php artisan db:seed

# 8. Clear caches
php artisan cache:clear
php artisan optimize

# 9. Set permissions
chmod -R 755 storage/
chmod -R 755 bootstrap/cache/
```

## Monitoring & Maintenance

### Check Application Status

```bash
# SSH to server
ssh user@apispi.com
cd ~/www/apispi.com

# View recent errors
tail -100 storage/logs/laravel.log

# Check disk space
df -h

# Check database
php artisan tinker
> User::count()
> Agent::count()
> Subscription::where('status', 'active')->count()
> exit
```

### Regular Maintenance Tasks

**Weekly**:
```bash
# Clear old logs (optional)
php artisan logs:clear

# Check for security updates
composer outdated --direct
```

**Monthly**:
```bash
# Backup database
mysqldump -u user -p database > backup-$(date +%Y%m%d).sql

# Review activity logs
php artisan tinker
> ActivityLog::where('created_at', '>=', now()->subDays(30))->count()
> exit
```

### Setting Up Automated Backups

Create a backup script (`backup.sh`):

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
DB_USER="apispi_prod_user"
DB_NAME="apispi_prod"
BACKUP_DIR="/home/user/backups"

mkdir -p $BACKUP_DIR

# Backup database
mysqldump -u $DB_USER -p $DB_NAME > $BACKUP_DIR/db_$DATE.sql

# Compress
gzip $BACKUP_DIR/db_$DATE.sql

# Keep last 7 days
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +7 -delete

echo "Backup completed: db_$DATE.sql.gz"
```

Add to crontab (runs daily at 2 AM):

```bash
0 2 * * * /home/user/backup.sh
```

## Common Deployment Issues

### Issue: "Cannot write to storage/"
**Cause**: Incorrect file permissions  
**Solution**:
```bash
chmod -R 755 storage/
chmod -R 755 bootstrap/cache/
```

### Issue: "Class not found" errors
**Cause**: Autoloader not refreshed  
**Solution**:
```bash
composer dump-autoload
php artisan optimize
```

### Issue: Assets not loading (404 errors)
**Cause**: Assets not built or Vite manifest missing  
**Solution**:
```bash
# Ensure public_html/build/ exists with manifest.json
ls -la public_html/build/
# Should show: manifest.json, app.js, app.css, etc.
```

### Issue: Database migration fails
**Cause**: Schema error or migration mismatch  
**Solution**:
```bash
# Check migration status
php artisan migrate:status

# Rollback last batch
php artisan migrate:rollback

# Review migration file for errors
# Fix and re-run
php artisan migrate
```

### Issue: "Connection refused" to database
**Cause**: Incorrect credentials or database not running  
**Solution**:
```bash
# Check .env database credentials
nano .env

# Test connection
php artisan tinker
> DB::connection()->getPdo()
> exit

# If error, restart MySQL (contact SiteGround support)
```

## Performance Optimization

### Caching

Enable production caching:

```bash
# Optimize config
php artisan config:cache

# Cache routes
php artisan route:cache

# Cache views (optional, auto-cleared on deploy)
php artisan view:cache

# Verify
ls -la bootstrap/cache/
```

### Database Optimization

```bash
# Analyze tables
mysqlcheck -u user -p --analyze apispi_prod

# Optimize tables
mysqlcheck -u user -p --optimize apispi_prod
```

### CDN for Static Assets

Consider using a CDN for `public_html/` static files (images, CSS, JS). Configure in `.env`:

```ini
ASSET_URL=https://cdn.apispi.com
```

## Version Management

### Semantic Versioning

Follow semantic versioning for releases:
- `v1.0.0` — Major version (breaking changes)
- `v1.1.0` — Minor version (new features, backward compatible)
- `v1.0.1` — Patch version (bug fixes)

### Release Tags

```bash
# Create release tag
git tag -a v1.2.0 -m "Release 1.2.0: Add agent subscriptions"

# Push tag
git push origin v1.2.0

# List tags
git tag -l

# Delete tag (if needed)
git tag -d v1.2.0
git push origin :refs/tags/v1.2.0
```

### Changelog

Maintain a `CHANGELOG.md`:

```markdown
## [1.2.0] - 2024-06-10

### Added
- Agent subscription workflow
- Stripe payment integration
- Subscription success page

### Fixed
- Agent catalog pagination
- Dashboard stats caching

### Changed
- Updated Anthropic API to claude-sonnet-4-5

## [1.1.0] - 2024-05-20

### Added
- Aria chatbot on dashboard
- User profile page
```

## Disaster Recovery

### Database Recovery

If database is corrupted:

```bash
# Restore from backup
mysql -u root -p apispi_prod < backup-20240610.sql

# Verify
php artisan tinker
> User::count()
> exit
```

### Code Recovery

If code is accidentally deleted:

```bash
# Check git history
git log --oneline

# Restore deleted file
git checkout <commit-hash> -- path/to/file.php

# Restore entire directory
git checkout <commit-hash> -- app/
```

## Security Checklist

- [ ] `.env` file with production secrets (not in git)
- [ ] SSL certificate installed (HTTPS)
- [ ] `APP_DEBUG=false` in `.env`
- [ ] Strong database password
- [ ] File permissions: `755` for dirs, `644` for files
- [ ] `storage/` and `bootstrap/cache/` writable by web server
- [ ] Regular backups (daily)
- [ ] Security updates applied (`composer update`)
- [ ] Log file monitoring
- [ ] Rate limiting enabled (already configured)

## Support & Escalation

For issues:

1. **Check logs**: `tail -f storage/logs/laravel.log`
2. **Check status**: `curl https://apispi.com`
3. **Rollback if critical**: Use Git rollback procedure above
4. **Contact SiteGround**: For server/hosting issues

## See Also

- [Architecture Guide](architecture.md) — System design
- [Development Guide](development.md) — Local development setup
- [Database Schema](database.md) — Data model reference
