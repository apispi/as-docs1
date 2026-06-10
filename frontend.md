# Frontend Architecture

Complete guide to Vue.js, Vite, and frontend patterns used in ApiSpi.

## Overview

The frontend is built with **Vue 3**, **Vite**, and **Tailwind CSS**, deployed as production-built assets committed to git (no build step on server).

### Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| Vue.js | 3 | Reactive UI components |
| Vite | Latest | Build tool, dev server with HMR |
| Tailwind CSS | Latest | Utility-first CSS |
| Laravel Blade | 11 | Server-side templating (initial HTML) |

## Build & Deployment

### Vite Configuration

**Config File**: `vite.config.js`

**Entry Points**: Multiple (one per app feature)

```bash
resources/js/
├── app.js                # Global styles & minimal JS
├── admin.js              # Admin panel (dynamic routing)
├── dashboard.js          # User dashboard overview
├── catalog.js            # Agent marketplace
├── agents-list.js        # User's subscriptions list
├── agent-detail.js       # Individual subscription detail
└── profile.js            # User profile settings
```

**Output Directory**: `public_html/build/` (must be committed to git)

### Build Commands

```bash
# Development server with HMR (runs on http://localhost:5173)
npm run dev

# Production build (optimized for deployment)
npm run build
# Output: public_html/build/{manifest.json,app.js,app.css,...}

# Preview production build locally
npm run preview
```

### Critical Deployment Requirement

**NO Node.js on production server** — built assets must be committed to git.

```bash
# Workflow
npm run build                           # Build locally
git add public_html/build/
git commit -m "Build assets for v1.2.0"
git push origin main
# Server: git pull (assets auto-served)
```

## Vue Entry Points & Application Architecture

Each Vue app is a separate Vite entry point, mounted to a Blade `<div>`, receiving props via `data-*` JSON attributes.

| Entry Point | Mount Div | Routing | Purpose |
|---|---|---|---|
| `admin.js` | `#admin-app` | Client-side via `data-page` | Admin panel (dynamic page switching) |
| `dashboard.js` | `#dashboard-app` | Static | User dashboard overview |
| `catalog.js` | `#catalog-app` | Static | Agent marketplace browsing |
| `agents-list.js` | `#agents-list-app` | Static | User's subscriptions list |
| `agent-detail.js` | `#agent-detail-app` | Static | Individual subscription detail |
| `profile.js` | `#profile-app` | Static | User account settings & password |
| `app.js` | — | — | Global styles (CSS only) |

## Props Pattern: Blade → Vue

Props are serialized as JSON in HTML attributes and hydrated on the client.

### Example

**Blade Template** (`resources/views/dashboard/agents.blade.php`):

```blade
<div id="agents-list-app" 
     data-agents='@json($agents)'
     data-user='@json(auth()->user())'
     data-stats='@json($stats)'>
</div>

<script type="module" src="{{ asset('build/agents-list.js') }}"></script>
```

**Vue Entry Point** (`resources/js/agents-list.js`):

```javascript
import { createApp } from 'vue'
import App from './components/AgentsList.vue'

const el = document.getElementById('agents-list-app')
const props = {
  agents: JSON.parse(el.dataset.agents || '[]'),
  user: JSON.parse(el.dataset.user || '{}'),
  stats: JSON.parse(el.dataset.stats || '{}'),
}

createApp(App, props).mount(el)
```

**Vue Component** (`resources/js/components/AgentsList.vue`):

```vue
<template>
  <div class="agents-list">
    <h1>My Agents ({{ agents.length }})</h1>
    <ul>
      <li v-for="agent in agents" :key="agent.id">
        {{ agent.name }} — ${{ agent.price }}
      </li>
    </ul>
    <p>Welcome, {{ user.name }}!</p>
  </div>
</template>

<script setup>
defineProps({
  agents: Array,
  user: Object,
  stats: Object,
})
</script>

<style scoped>
.agents-list {
  padding: 2rem;
}
</style>
```

### Why This Pattern?

- **Server-side rendering**: Initial HTML contains data (no loading spinners)
- **SEO-friendly**: Search engines see content in HTML
- **Performance**: No runtime API calls for initial page data
- **Simplicity**: Data flows one direction: Blade → Vue

## Admin Panel Architecture

The admin panel uses **client-side routing** via `data-page` attribute to dynamically load admin pages without full page reloads.

### How Admin Routing Works

**Blade View** (`resources/views/admin/agents.blade.php`):

```blade
<div id="admin-app" 
     data-page="agents"
     data-props='@json($data)'>
</div>

<script type="module" src="{{ asset('build/admin.js') }}"></script>
```

**Admin Entry Point** (`resources/js/admin.js`):

```javascript
import { createApp } from 'vue'
import AdminApp from './components/AdminApp.vue'

// Import all admin pages
import DashboardPage from './components/admin/DashboardPage.vue'
import AgentsPage from './components/admin/AgentsPage.vue'
import SkillsPage from './components/admin/SkillsPage.vue'
import ConnectorsPage from './components/admin/ConnectorsPage.vue'
import UsersPage from './components/admin/UsersPage.vue'
import SubscriptionsPage from './components/admin/SubscriptionsPage.vue'
import ActivityLogsPage from './components/admin/ActivityLogsPage.vue'

// Register pages
const pages = {
  'dashboard': DashboardPage,
  'agents': AgentsPage,
  'skills': SkillsPage,
  'connectors': ConnectorsPage,
  'users': UsersPage,
  'subscriptions': SubscriptionsPage,
  'activity-logs': ActivityLogsPage,
  // Add new pages here
}

const el = document.getElementById('admin-app')
const props = {
  page: el.dataset.page,
  data: JSON.parse(el.dataset.props || '{}'),
  pages,
}

createApp(AdminApp, props).mount(el)
```

**Admin App Wrapper** (`resources/js/components/AdminApp.vue`):

```vue
<template>
  <div class="admin-container">
    <AdminNav :current-page="page" />
    
    <main class="admin-content">
      <component 
        :is="pages[page]" 
        :key="page"
        v-bind="data"
        @page-change="handlePageChange"
      />
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import AdminNav from './AdminNav.vue'

const props = defineProps({
  page: String,
  data: Object,
  pages: Object,
})

const currentPage = ref(props.page)

const handlePageChange = (newPage) => {
  currentPage.value = newPage
  // Optionally update browser history
  // window.history.pushState({}, '', `/admin/${newPage}`)
}
</script>

<style scoped>
.admin-container {
  display: grid;
  grid-template-columns: 250px 1fr;
}

.admin-nav {
  background: #f3f4f6;
  padding: 1rem;
}

.admin-content {
  padding: 2rem;
}
</style>
```

### Adding a New Admin Page (5 Steps)

**Step 1: Create Vue Component**

Create `resources/js/components/admin/MyNewPage.vue`:

```vue
<template>
  <div class="my-page">
    <h1>{{ pageTitle }}</h1>
    <!-- Page content here -->
  </div>
</template>

<script setup>
defineProps({
  pageTitle: String,
  items: Array,
})
</script>

<style scoped>
.my-page {
  padding: 2rem;
}
</style>
```

**Step 2: Register in admin.js**

```javascript
import MyNewPage from './components/admin/MyNewPage.vue'

const pages = {
  // ... existing pages
  'my-new-page': MyNewPage,  // Add this
}
```

**Step 3: Create Blade View**

Create `resources/views/admin/my-new-page.blade.php`:

```blade
@extends('layouts.master')

@section('content')
<div id="admin-app" 
     data-page="my-new-page"
     data-props='@json([
       "pageTitle" => "Manage Items",
       "items" => $items,
     ])'>
</div>

<script type="module" src="{{ asset('build/admin.js') }}"></script>
@endsection
```

**Step 4: Add Route**

In `routes/web.php`:

```php
Route::get('/admin/my-new-page', [AdminController::class, 'myNewPage'])
     ->middleware(['auth', 'admin'])
     ->name('admin.my-new-page');
```

**Step 5: Create Controller Method**

In `app/Http/Controllers/Admin/AdminController.php`:

```php
public function myNewPage()
{
    return view('admin.my-new-page', [
        'items' => Item::all(),
    ]);
}
```

## Static Chatbot (NOT Vite-compiled)

Chatbot is a **static JavaScript file** in `public_html/`, not compiled by Vite.

### Files

- **Main Script**: `public_html/js/chatbot.js`
- **NLP Bundle**: `public_html/js/nlp.min.js` (node-nlp v3.10.2)

### How It Works

1. **Page Load** (`/contact`): Loads `chatbot.js` unconditionally
2. **First Interaction**: Lazy-loads `nlp.min.js` (if not already loaded)
3. **Training**: NLP classifier trains on 16 predefined intents (in-browser)
4. **Classification**: User messages classified against intents
5. **Routing**: Matched intent → response handler or Anthropic API

### Example chatbot.js Structure

```javascript
// Lazy-load NLP on first user interaction
async function initNLP() {
  if (window.NLP) return; // Already loaded
  
  const script = document.createElement('script');
  script.src = '/js/nlp.min.js';
  script.onload = () => {
    trainClassifier();
  };
  document.head.appendChild(script);
}

async function trainClassifier() {
  const manager = new NLP.NlpManager({ languages: ['en'] });
  
  // Define intents
  manager.addDocument('en', 'what are your features', 'features');
  manager.addDocument('en', 'tell me about agents', 'agents');
  // ... more training data
  
  await manager.train();
  window.classifier = manager;
}

function handleUserMessage(message) {
  if (!window.classifier) {
    return "Hold on, I'm loading...";
  }
  
  const response = await window.classifier.process('en', message);
  const intent = response.intent;
  
  // Route to handler
  const handlers = {
    'features': () => "Here are our features...",
    'agents': () => "We offer these agents...",
    // ... more handlers
  };
  
  return handlers[intent]?.() || "I didn't understand that.";
}

// Listen for user interaction
document.addEventListener('click', initNLP, { once: true });
```

### Deployment

- Edit directly in `public_html/js/`
- No build step required
- Commit to git as static files
- Deploy via git pull on server

## Global Styles & Tailwind CSS

### Configuration

**Config File**: `tailwind.config.js`

**CSS Entry**: `resources/css/app.css`

### Theme Customization

```javascript
// tailwind.config.js
export default {
  content: [
    './resources/views/**/*.blade.php',
    './resources/js/**/*.vue',
  ],
  theme: {
    extend: {
      colors: {
        admin: '#ef4444',      // Red for admin
        dashboard: '#f59e0b',  // Amber for user dashboard
      },
      spacing: {
        128: '32rem',
      },
    },
  },
  plugins: [],
}
```

### Color Palettes

**Admin UI** (Red/Rose):
```css
.admin-btn { @apply bg-red-500 hover:bg-red-600 text-white; }
.admin-sidebar { @apply bg-rose-50 border-r border-rose-200; }
```

**User Dashboard** (Amber/Gold):
```css
.dashboard-card { @apply bg-amber-50 border border-amber-200; }
.dashboard-btn { @apply bg-amber-600 hover:bg-amber-700 text-white; }
```

## Component Standards

### File Structure

```vue
<template>
  <!-- Single root element -->
  <div class="my-component">
    <h1>{{ title }}</h1>
    <button @click="handleClick">{{ buttonLabel }}</button>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// Props from parent/Blade
const props = defineProps({
  title: String,
  buttonLabel: { type: String, default: 'Click me' },
  items: Array,
})

// Emitted events
const emit = defineEmits(['item-selected', 'action-completed'])

// Reactive state
const count = ref(0)
const loading = ref(false)

// Computed properties
const doubled = computed(() => count.value * 2)

// Methods
const handleClick = async () => {
  count.value++
  emit('item-selected', count.value)
}
</script>

<style scoped>
/* Scoped styles only affect this component */
.my-component {
  padding: 2rem;
}

h1 {
  @apply text-2xl font-bold text-gray-900;
}
</style>
```

### Composition API

Use `<script setup>` (modern, concise):

```vue
<script setup>
import { ref, computed, watch, onMounted } from 'vue'

// State
const count = ref(0)

// Computed
const double = computed(() => count.value * 2)

// Watchers
watch(() => count.value, (newVal) => {
  console.log('Count changed to', newVal)
})

// Lifecycle
onMounted(() => {
  console.log('Component mounted')
})

// Methods
const increment = () => count.value++
</script>
```

**Avoid Options API** (older, verbose):
```javascript
// ❌ Don't use this
export default {
  data() { return { count: 0 } },
  computed: { double() { return this.count * 2 } },
  // ... etc
}
```

### Best Practices

- ✅ Keep components focused (one responsibility)
- ✅ Use `ref()` for reactive state
- ✅ Use `computed()` for derived values
- ✅ Emit events for child-to-parent communication
- ✅ Use `<style scoped>` to avoid style leaks
- ✅ Add JSDoc comments for props/emits
- ❌ Avoid direct DOM manipulation (use Vue refs)
- ❌ Avoid global mutable state (use Pinia if needed)
- ❌ Avoid complex logic in templates

## Asset Linking

### In Blade Templates

```blade
{{-- Vite-compiled JS/CSS --}}
<script type="module" src="{{ asset('build/admin.js') }}"></script>
<link rel="stylesheet" href="{{ asset('build/app.css') }}" />

{{-- Static images/files --}}
<img src="{{ asset('images/logo.png') }}" alt="Logo" />

{{-- Generated with hash (cache-busting) --}}
<link rel="preload" 
      href="{{ asset('build/9a45f3b2.js') }}" 
      as="script" crossorigin />
```

### In Vue Components

```vue
<template>
  <img :src="logoUrl" alt="Logo" />
</template>

<script setup>
import logoUrl from '@/images/logo.png'
</script>
```

## Development Workflow

### Local Development

**Terminal 1**: Run Laravel server
```bash
php artisan serve
# http://localhost:8000
```

**Terminal 2**: Run Vite dev server (with HMR)
```bash
npm run dev
# http://localhost:5173
```

Visit `http://localhost:8000` — changes to `.vue` files hot-reload instantly.

### Building for Production

```bash
npm run build
# Output: public_html/build/

git add public_html/build/
git commit -m "Build assets"
git push
```

## Performance Tips

1. **Code Splitting**: Vite automatically splits large components
2. **Lazy Loading**: Use dynamic imports for route-specific components
3. **Image Optimization**: Compress images, use WebP where possible
4. **CSS**: Tailwind purges unused classes in production build
5. **Caching**: Built assets have hash names (cache-busted automatically)

## See Also

- [Development Guide](development.md) — Setup and local development
- [Architecture Guide](architecture.md) — System design overview
- [Deployment Guide](deployment.md) — Production deployment

