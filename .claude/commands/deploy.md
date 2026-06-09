Deploy the apispi.com Laravel app to production on SiteGround.

Work through these steps in order. Stop and report clearly if any step fails — never proceed past a failure.

---

## 1. Pre-flight checks

Run the following in parallel and report any issues before continuing:

- `git status` — confirm the working tree state
- `git log origin/main..HEAD --oneline` — show commits not yet pushed
- `php artisan migrate:status 2>/dev/null | grep -E "Pending|No"` — flag any pending migrations

If there are pending migrations, remind the user they will need to run `php artisan migrate` on the server after pulling.

---

## 2. Run tests

```bash
composer test
```

If tests fail, stop. Do not deploy broken code. Show the failure output.

---

## 3. Build frontend assets

```bash
npm run build
```

If this fails, stop and show the error. Do not commit or push.

After a successful build, confirm which files changed:

```bash
git diff --stat public_html/build/
```

---

## 4. Stage and commit

Stage the built assets:

```bash
git add public_html/build/
```

Check for any other unstaged changes (app code, Blade templates, Vue files, migrations, etc.):

```bash
git status
```

If other changes exist, ask the user whether to include them in this deploy commit or skip them. Stage whatever they confirm.

If nothing is staged after `public_html/build/`, ask the user whether to proceed with a push-only deploy (no new build commit needed).

Commit using a concise message that describes what changed — do not include a Co-Authored-By trailer in deploy commits.

Example format: `"deploy: build assets + <brief description of other changes>"`

---

## 5. Push to remote

```bash
git push origin main
```

If the push is rejected due to diverged history, stop and report. Do not force-push without an explicit instruction from the user.

---

## 6. Server-side deploy

Print the following block exactly for the user to run via SSH on SiteGround. Fill in any values you know (e.g. pending migration status from step 1):

```bash
ssh <siteground-user>@<host>

# Inside the server:
cd ~/www/apispi.com

# Pull latest code (includes built assets)
git pull origin main

# Run pending migrations (skip if migrate:status showed none pending)
php artisan migrate

# Clear application caches
php artisan cache:clear
php artisan config:clear
php artisan view:clear

# Verify the app is healthy
php artisan migrate:status
tail -20 storage/logs/laravel.log
```

Remind the user to replace `<siteground-user>@<host>` with their actual SiteGround SSH credentials.

---

## 7. Post-deploy verification

After the user confirms the server steps are done, suggest they quickly verify:

- Home page loads: `https://apispi.com`
- Login works: `https://apispi.com/login`
- Dashboard accessible after login
- Agents display at `https://apispi.com/agents`
- Check `storage/logs/laravel.log` on the server for any errors

---

## Error reference

| Problem | Action |
|---|---|
| `npm run build` fails | Fix the build error locally, do not deploy |
| Tests fail | Fix tests, do not deploy |
| `git push` rejected | Investigate divergence, pull and rebase if safe |
| 500 error after deploy | SSH in, tail `storage/logs/laravel.log`, check migrations ran |
| Assets 404 after deploy | Verify `public_html/build/` files were committed and pulled |
| Session errors | Run `php artisan migrate` — sessions table may be missing |
