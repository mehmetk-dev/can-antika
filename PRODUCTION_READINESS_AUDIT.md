# Can Antika — Production Readiness Audit

**Date:** 2026-03-10
**Scope:** Full-stack audit — everything needed to go live, **excluding** payment gateway and Resend (email) integrations.

---

## Summary

The platform is well-architected with many security best practices already implemented (HttpOnly cookies, CSP headers, rate limiting, Flyway migrations, global exception handling, input validation). However, several **critical** and **high-priority** items must be resolved before going fully live.

| Severity | Count |
|----------|-------|
| 🔴 CRITICAL | 6 |
| 🟠 HIGH | 11 |
| 🟡 MEDIUM | 10 |
| 🔵 LOW / Nice-to-have | 8 |

---

## 🔴 CRITICAL — Must Fix Before Launch

### C1. Docker Compose runs frontend in DEV mode
**File:** `docker-compose.yml` line 46
```yaml
command: sh -c "npm run dev -- -H 0.0.0.0"
```
The frontend container runs `npm run dev` (development server), NOT a production build. The frontend `Dockerfile` is properly configured with a multi-stage build and standalone output — but it is **never used** by `docker-compose.yml`.

**Impact:** No optimizations, no static generation, SSR dev overhead, source maps exposed, React strict mode double renders, Next.js dev warnings visible to users.

**Fix:** Replace the frontend service to build from the Dockerfile:
```yaml
frontend:
  build: ./can-antika-frontend
  container_name: can-antika-frontend-app
  ports:
    - "3005:3000"
  environment:
    - INTERNAL_API_URL=http://backend:8080
    - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
    - NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
```

---

### C2. No reverse proxy / SSL termination
**Finding:** No nginx, Caddy, or Traefik configuration exists anywhere in the project. Both services expose raw HTTP ports (3005, 8085) directly.

**Impact:**
- No HTTPS in production
- HSTS headers emitted by Spring Security are meaningless over HTTP
- Cookies with `Secure=true` won't be sent by browsers
- No HTTP→HTTPS redirect
- No gzip/brotli compression at the proxy level

**Fix:** Add a reverse proxy service to `docker-compose.yml`:
```yaml
caddy:
  image: caddy:2-alpine
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ./Caddyfile:/etc/caddy/Caddyfile
    - caddy_data:/data
  depends_on:
    - frontend
    - backend
```
With a `Caddyfile`:
```
canantika.com {
    handle /v1/* {
        reverse_proxy backend:8080
    }
    handle {
        reverse_proxy frontend:3000
    }
}
```

---

### C3. No admin user creation mechanism in production
**File:** `e-commerce/src/main/java/com/mehmetkerem/config/DataInitializer.java` line 21
```java
@Profile("dev")
```
`DataInitializer` — which creates the admin user — is gated behind `@Profile("dev")`. No other `CommandLineRunner` or bootstrap exists. In production (no profile or a `prod` profile), **the admin user is never created**, making the admin panel inaccessible.

**Fix:** Extract admin initialization into a separate `@Component` without the `@Profile("dev")` gate:
```java
@Component
@RequiredArgsConstructor
@Slf4j
public class AdminBootstrap implements CommandLineRunner {
    // Only creates admin if not exists + validates strong password
    // Keep seed data (categories/products) ONLY in @Profile("dev")
}
```

---

### C4. `COOKIE_SECURE` defaults to `false` and is not passed in docker-compose
**File:** `application.properties` line 58
```properties
app.cookie.secure=${COOKIE_SECURE:false}
```
**File:** `docker-compose.yml` — `COOKIE_SECURE` is **absent** from the backend environment block.

**Impact:** In production, cookies are sent over HTTP, making them vulnerable to interception (session hijacking).

**Fix:**
1. Change default to `true`: `app.cookie.secure=${COOKIE_SECURE:true}`
2. Add to docker-compose backend environment: `- COOKIE_SECURE=true`

---

### C5. Swagger/OpenAPI defaults to ENABLED
**File:** `application.properties` lines 49-50
```properties
springdoc.api-docs.enabled=${SPRINGDOC_ENABLED:true}
springdoc.swagger-ui.enabled=${SPRINGDOC_ENABLED:true}
```
While `docker-compose.yml` passes `SPRINGDOC_ENABLED=false`, the `application.properties` default is `true`. If the app is started outside docker-compose (or the env var is forgotten), the full API docs are publicly accessible.

**Fix:** Change defaults:
```properties
springdoc.api-docs.enabled=${SPRINGDOC_ENABLED:false}
springdoc.swagger-ui.enabled=${SPRINGDOC_ENABLED:false}
```

---

### C6. Redis has no authentication
**File:** `docker-compose.yml` lines 3-18

Redis runs with zero authentication. In production, anyone with network access can read/write all cached data, rate-limit state, and session data.

**Fix:**
```yaml
redis:
  image: redis:7-alpine
  command: redis-server --requirepass ${REDIS_PASSWORD:?REDIS_PASSWORD is required}
```
And in `application.properties`:
```properties
spring.data.redis.password=${REDIS_PASSWORD:}
```

---

## 🟠 HIGH — Should Fix Before Launch

### H1. Frontend `NEXT_PUBLIC_API_URL` not set at build time
**Files:**
- `can-antika-frontend/lib/api-client.ts` lines 3-4: `process.env.NEXT_PUBLIC_API_URL || "http://localhost:8085"`
- `can-antika-frontend/lib/api/index.ts` line 250: same fallback
- `can-antika-frontend/app/giris/page.tsx` line 238: same fallback
- `can-antika-frontend/app/kayit/page.tsx` line 214: same fallback

**Impact:** `NEXT_PUBLIC_*` vars are baked into the client JS bundle at **build time**. Since `docker-compose.yml` doesn't pass `NEXT_PUBLIC_API_URL` and the frontend runs `npm run dev` (C1), all client-side API calls in production will try `http://localhost:8085`, which is unreachable from the user's browser.

**Fix:** Set `NEXT_PUBLIC_API_URL` as a build arg in the frontend Dockerfile or docker-compose:
```yaml
frontend:
  build:
    context: ./can-antika-frontend
    args:
      - NEXT_PUBLIC_API_URL=https://canantika.com
      - NEXT_PUBLIC_SITE_URL=https://canantika.com
```

---

### H2. Hardcoded Cloudinary cloud name leaked
**File:** `application.properties` line 119
```properties
cloudinary.cloud-name=${CLOUDINARY_CLOUD_NAME:dqlbenxvc}
```
The real Cloudinary cloud name `dqlbenxvc` is committed as a fallback default.

**Fix:** `cloudinary.cloud-name=${CLOUDINARY_CLOUD_NAME:change-me}`

---

### H3. Insecure JWT secret default
**File:** `application.properties` line 53
```properties
jwt.secret=${JWT_SECRET:change-this-to-a-very-long-secret-key}
```
If `JWT_SECRET` env var is not set, this weak, publicly-known default is used.

**Fix:** Remove the default entirely so the app fails to start: `jwt.secret=${JWT_SECRET}`

---

### H4. Insecure DB password default
**File:** `application.properties` line 11
```properties
spring.datasource.password=${DB_PASSWORD:change-me}
```

**Fix:** `spring.datasource.password=${DB_PASSWORD}`

---

### H5. Database & Redis ports exposed to host network
**File:** `docker-compose.yml` lines 28-29 and line 7
```yaml
ports:
  - "5432:5432"   # PostgreSQL
  - "6379:6379"   # Redis
```
On a VPS, these are accessible from the internet.

**Fix:** Remove port mappings for `db` and `redis` in production, or bind to loopback:
```yaml
ports:
  - "127.0.0.1:5432:5432"
```

---

### H6. OAuth2 Google scopes request excessive permissions
**File:** `application.properties` line 70
```properties
scope=openid,profile,email,address,phone
```
`address` and `phone` are unnecessary for login, may trigger Google's "sensitive scopes" verification process, and request data that isn't used.

**Fix:** `scope=openid,profile,email`

---

### H7. Missing `og-image.jpg`
**File:** `can-antika-frontend/app/layout.tsx` line 55
References `/og-image.jpg` for OpenGraph metadata, but this file **does not exist** in `/public/`. Social media sharing will show broken/missing preview images.

**Fix:** Create a branded 1200×630 image at `can-antika-frontend/public/og-image.jpg`.

---

### H8. `spring.sql.init.mode=always` conflicts with Flyway
**File:** `application.properties` line 34
```properties
spring.sql.init.mode=always
```
This re-runs SQL init scripts on every startup, which is redundant with Flyway and can cause conflicts.

**Fix:** `spring.sql.init.mode=${SQL_INIT_MODE:never}`

---

### H9. `spring.jpa.defer-datasource-initialization=true` with Flyway
**File:** `application.properties` line 33

This setting defers datasource init to after Hibernate, creating a potential conflict with Flyway's migration order.

**Fix:** Set to `false` since Flyway manages migrations.

---

### H10. Backend Dockerfile has no JVM tuning
**File:** `e-commerce/Dockerfile` line 11
```dockerfile
ENTRYPOINT ["java", "-jar", "app.jar"]
```
No memory limits, GC configuration, or container-awareness flags. With a 1.5GB memory limit in docker-compose, the JVM could OOM.

**Fix:**
```dockerfile
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "-XX:+UseG1GC", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
```

---

### H11. Missing production env vars in docker-compose / .env.example
**Not set in docker-compose backend:**
- `COOKIE_SECURE`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
- `APP_BASE_URL` (defaults to `http://localhost:8080`)
- `REDIS_PASSWORD`

**Not set in docker-compose frontend:**
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SITE_URL`

**Missing from `.env.example`:**
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `COOKIE_SECURE`, `APP_BASE_URL`, `NEXT_PUBLIC_SITE_URL`
- `REDIS_PASSWORD`, `JPA_DDL_AUTO`, `FLYWAY_ENABLED`

---

## 🟡 MEDIUM — Fix Before or Shortly After Launch

### M1. No JSON-LD structured data
**Finding:** No Schema.org / JSON-LD markup found in the frontend codebase. Product pages have good OpenGraph tags but no structured data for Google rich results (price, availability, reviews).

**Fix:** Add `<script type="application/ld+json">` blocks for:
- `Product` schema on product detail pages (with price, availability, image, brand)
- `Organization` on the home page
- `BreadcrumbList` on category/product pages
- `FAQPage` on the SSS (FAQ) page

---

### M2. No canonical URLs on individual pages
**Finding:** `metadataBase` is correctly set to `https://canantika.com` in the root layout, but individual pages don't explicitly set `alternates.canonical`. Next.js should auto-resolve with `metadataBase`, but explicit canonicals are safer.

**Recommendation:** Add explicit canonical on key pages:
```ts
alternates: { canonical: `/urun/${slug}` }
```

---

### M3. Product OpenGraph type is `website` instead of `product`
**File:** `can-antika-frontend/app/urun/[slug]/page.tsx` line 63
```ts
type: "website",
```
Product pages should use `type: "product"` for semantically correct social sharing.

---

### M4. Console.error statements in frontend production code (8 occurrences)
**Files:**
- `app/admin/page.tsx:49`
- `app/urunler/catalog-client.tsx:74`
- `components/product/product-detail.tsx:43`
- `components/header.tsx:47-48`
- `app/admin/urunler/yeni/page.tsx:32`
- `components/footer.tsx:139`
- `app/admin/urunler/page.tsx:27`

These are `console.error` in catch blocks for error visibility. They're acceptable but should ideally route to an error tracking service.

---

### M5. No error monitoring / APM service
**Finding:** No Sentry, LogRocket, Datadog, or similar service configured for either frontend or backend. Production errors are only visible in Docker container logs.

**Fix:** Add `@sentry/nextjs` for frontend and `sentry-spring-boot-starter` for backend.

---

### M6. Package name is placeholder
**File:** `can-antika-frontend/package.json` line 2
```json
"name": "my-v0-project"
```
Should be `can-antika-frontend`.

---

### M7. `@vercel/analytics` included but likely unnecessary
**File:** `can-antika-frontend/app/layout.tsx` line 5
```ts
import { Analytics } from "@vercel/analytics/next"
```
The app is containerized for Docker/VPS deployment. Vercel Analytics only works on Vercel's platform.

**Fix:** Remove `@vercel/analytics` import and its `<Analytics />` component in layout, and uninstall the package.

---

### M8. Flyway migration is empty baseline
**File:** `e-commerce/src/main/resources/db/migration/V1__baseline.sql`
```sql
-- Boş — mevcut tablo yapısına dokunmuyoruz.
```
The only migration file is empty. Flyway has no record of what the schema actually looks like. Future V2+ migrations have no reliable baseline.

**Fix:** Generate a full DDL dump of the current schema as V1, then re-baseline Flyway.

---

### M9. No automated database backup strategy
**Finding:** Only a manual `can_antika_backup.sql` exists. No cron job, no pg_dump automation, no offsite backup.

**Fix:** Add a backup service to docker-compose or a host cron job:
```yaml
backup:
  image: prodrigestivill/postgres-backup-local
  environment:
    - POSTGRES_HOST=db
    - POSTGRES_DB=${POSTGRES_DB}
    - POSTGRES_USER=${POSTGRES_USER}
    - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    - SCHEDULE=@daily
    - BACKUP_KEEP_DAYS=30
  volumes:
    - ./backups:/backups
```

---

### M10. `.env.example` is incomplete
**File:** `.env.example` — only 15 lines, missing many production-critical variables (see H11).

---

## 🔵 LOW / Nice-to-have

### L1. CORS default in SecurityConfig references unused Vite dev port
**File:** `e-commerce/src/main/java/com/mehmetkerem/config/SecurityConfig.java` line 46
```java
@Value("${app.cors.allowed-origins:http://localhost:3000,http://localhost:5173}")
```
`localhost:5173` (Vite) is never used in this project. Minor since env vars override.

---

### L2. Backend healthcheck uses `curl` but Alpine image may not have it
**File:** `docker-compose.yml` line 84
```yaml
test: ["CMD", "curl", "-f", "http://localhost:8080/actuator/health"]
```
`eclipse-temurin:17-jre-alpine` doesn't include `curl` by default. The healthcheck will fail.

**Fix:** Use `wget` (available in Alpine):
```yaml
test: ["CMD", "wget", "--spider", "-q", "http://localhost:8080/actuator/health"]
```

---

### L3. PostgreSQL service has no healthcheck
The `db` service has no healthcheck. Backend `depends_on: db` only ensures the container starts, not that PostgreSQL is ready.

**Fix:**
```yaml
db:
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-can_user}"]
    interval: 10s
    timeout: 5s
    retries: 5
```

---

### L4. SameSite=Strict may break OAuth2 redirect flow
**File:** `e-commerce/src/main/java/com/mehmetkerem/util/CookieUtil.java` line 45
```java
cookie.setAttribute("SameSite", "Strict");
```
After Google OAuth2 redirects back to the backend, cookies set during the handler may not be sent on the subsequent cross-origin redirect to the frontend.

**Recommendation:** Consider `SameSite=Lax` which protects against CSRF but allows top-level navigations.

---

### L5. Token dual storage (localStorage + HttpOnly cookie)
**Files:** `api-client.ts` (localStorage) and `CookieUtil.java` (HttpOnly cookies)

Tokens exist in both localStorage (XSS-accessible) and HttpOnly cookies. This is functional but localStorage tokens weaken the security benefit of HttpOnly cookies.

---

### L6. `hibernate.format_sql=true` in production
**File:** `application.properties` line 42
Adds whitespace formatting to SQL logs. Minor log volume increase.

---

### L7. No `X-Robots-Tag` header for API responses
If the backend API is accessible directly (not behind a proxy path), search engines could crawl and index API JSON responses.

---

### L8. No `ADMIN_USER_ID` in docker-compose environment
**File:** `application.properties` line 117
```properties
app.admin.user-id=${ADMIN_USER_ID:1}
```
Defaults to `1` which will work if the admin is the first user created, but this is fragile.

---

## ✅ Already Well-Implemented

| Area | Details |
|------|---------|
| **Security headers** | CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy — both backend (Spring) and frontend (next.config.mjs) |
| **Rate limiting** | Per-bucket: auth 5/min, payment 10/min, admin 200/min, API 120/min, global 60/min |
| **HttpOnly cookies** | SameSite + Secure (when env var set) via CookieUtil |
| **Global exception handler** | Handles validation errors, auth errors, optimistic locking, file upload limits, general exceptions |
| **Flyway migrations** | Enabled with baseline-on-migrate |
| **DataInitializer** | Dev-only (`@Profile("dev")`) — seed data won't accidentally run in production |
| **XSS protection** | `customHeadScripts` removed (stored XSS risk), DOMPurify in dependencies |
| **JWT token refresh** | Separate access (30min) and refresh (24h) tokens |
| **Error boundary pages** | `error.tsx`, `not-found.tsx`, `global-error.tsx` — all properly implemented in Turkish with retry/home links |
| **Middleware auth guards** | Protects admin, account, order routes; redirects guest-only pages |
| **Frontend standalone output** | `output: 'standalone'` in next.config.mjs |
| **Frontend Dockerfile** | Multi-stage build, non-root `nextjs` user, proper file ownership |
| **Backend Dockerfile** | Multi-stage build (Maven build → JRE runtime) |
| **Image upload validation** | Content type whitelist (JPEG, PNG, GIF, WebP), extension check, 5MB limit |
| **Connection pooling** | HikariCP with pool size 20, leak detection at 30s |
| **SEO metadata** | Dynamic metadata from site settings API, proper OG tags, Twitter cards |
| **Sitemap** | Dynamic: products, blog posts, categories + static pages |
| **robots.txt** | Disallows admin, account, cart, OAuth2, maintenance pages |
| **Activity logging** | Async AOP-based audit logging |
| **Scheduled tasks** | Order expiry task (30-min interval), configurable expiry hours |
| **Optimistic locking** | `@Version` on User entity, handled in GlobalExceptionHandler |
| **Correlation ID logging** | MDC-based `correlationId` in log pattern |
| **Actuator** | Health endpoint only, details hidden |
| **CSRF** | Disabled (correct for stateless JWT API) |

---

## Admin Panel Route Coverage

All 26 admin routes have corresponding page files — admin panel is **complete**:

| Route | Page |
|-------|------|
| `/admin` | Dashboard with stats, charts, recent activity |
| `/admin/giris` | Admin login |
| `/admin/urunler` | Product list with search/filter |
| `/admin/urunler/yeni` | New product form |
| `/admin/urunler/[id]/duzenle` | Edit product |
| `/admin/kategoriler` | Category management |
| `/admin/markalar` | Brand management |
| `/admin/siparisler` | Order management |
| `/admin/musteriler` | Customer list |
| `/admin/musteriler/[id]` | Customer detail |
| `/admin/yorumlar` | Review moderation |
| `/admin/kuponlar` | Coupon management |
| `/admin/iadeler` | Returns management |
| `/admin/havale` | Bank transfer management |
| `/admin/blog` | Blog management |
| `/admin/bulten` | Newsletter subscribers |
| `/admin/popup` | Popup management |
| `/admin/sayfalar` | Static page management |
| `/admin/sss` | FAQ management |
| `/admin/sorgular` | Support tickets |
| `/admin/iletisim-talepleri` | Contact requests |
| `/admin/bildirimler` | Notifications |
| `/admin/aktiviteler` | Activity log |
| `/admin/raporlar` | Reports & analytics |
| `/admin/terk-edilen-sepetler` | Abandoned carts |
| `/admin/ayarlar` | Site settings |

---

## Pre-Launch Checklist

```
Infrastructure:
[ ] Add reverse proxy (Caddy/nginx) with automatic SSL/TLS
[ ] Switch docker-compose frontend from dev to Dockerfile build
[ ] Remove db/redis port exposure to host
[ ] Add db and redis healthchecks with service_healthy conditions
[ ] Fix backend healthcheck: curl → wget
[ ] Add JVM tuning flags to backend Dockerfile

Environment & Secrets:
[ ] Set NEXT_PUBLIC_API_URL at frontend build time
[ ] Set NEXT_PUBLIC_SITE_URL at frontend build time
[ ] Set COOKIE_SECURE=true in production
[ ] Add Redis password (requirepass)
[ ] Remove insecure defaults: JWT_SECRET, DB_PASSWORD, admin password
[ ] Change SPRINGDOC_ENABLED default to false
[ ] Configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
[ ] Set APP_BASE_URL to production domain
[ ] Update .env.example with all production variables

Application:
[ ] Create production admin bootstrap (outside @Profile("dev"))
[ ] Set spring.sql.init.mode=never
[ ] Set spring.jpa.defer-datasource-initialization=false
[ ] Remove Cloudinary cloud name from defaults
[ ] Reduce OAuth2 Google scopes to openid,profile,email
[ ] Test OAuth2 flow with SameSite cookies end-to-end

Frontend:
[ ] Create og-image.jpg (1200×630)
[ ] Remove @vercel/analytics (unless deploying on Vercel)
[ ] Rename package.json name to can-antika-frontend
[ ] Add JSON-LD structured data to product pages

Operations:
[ ] Set up automated database backups
[ ] Set up error monitoring (Sentry)
[ ] Remove hibernate.format_sql=true for production
```
