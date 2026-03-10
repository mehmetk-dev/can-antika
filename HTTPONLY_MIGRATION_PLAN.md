# httpOnly Cookie-Only Auth Geçiş Planı

## Mimari Değişiklik

```
ÖNCE (Mevcut — Dual Storage):
Login → Backend token'ları body'de + cookie'de döner
     → Frontend localStorage'a da yazar (getToken/setTokens)
     → API istekleri → Authorization: Bearer header (localStorage'dan) 
     → JwtAuthFilter: önce header, sonra cookie

SONRA (Hedef — Cookie-Only):
Login → Backend token'ları SADECE httpOnly cookie'de set eder
     → Frontend token'a hiç erişmez
     → API istekleri → credentials: "include" (cookie otomatik)
     → JwtAuthFilter: cookie'den okur (header fallback kalır ama kullanılmaz)
```

> **BFF Proxy'ye gerek yok!** Backend zaten cookie set ediyor + `JwtAuthFilter` zaten cookie'den okuyor.
> Tek yapmamız gereken: Frontend'in localStorage token yönetimini tamamen kaldırmak.

---

## Aşama 1: Backend (3 değişiklik)

### 1.1 — `CookieUtil.java`
- [ ] `SameSite=Strict` → `SameSite=Lax` (OAuth2 cross-origin redirect cookie kaybını önlemek için)

### 1.2 — `RestAuthControllerImpl.java`
- [ ] `login()`: Response body'den token'ları kaldır → sadece `user` bilgisi dönsün
- [ ] `refreshToken()`: Cookie'den refresh token okuma desteği ekle (body'den gelmezse cookie'den al)
- [ ] `refreshToken()`: Response body'den token kaldır → sadece `user` dönsün

### 1.3 — `IRestAuthController.java`
- [ ] `login()` method imzasına `HttpServletResponse` ekle (zaten var)
- [ ] `refreshToken()` method imzasına `HttpServletRequest` ekle

---

## Aşama 2: Frontend — Core (3 dosya)

### 2.1 — `lib/api-client.ts` — SADELEŞTIR
Silinecekler:
- [ ] `getToken()`, `setTokens()`, `clearTokens()`, `getRefreshToken()` fonksiyonları (tümü)
- [ ] `tryRefreshToken()` fonksiyonu
- [ ] Tüm `localStorage` referansları
- [ ] `Authorization: Bearer` header ekleme mantığı

Kalacak/Güncellenecek:
- [ ] `BASE_URL`, `buildUrl()`, `request()` — credentials: "include" zaten var
- [ ] 401 handling: backend `/v1/auth/refresh-token`'a cookie ile POST → retry; başarısızsa `/giris`'e redirect
- [ ] `api` object (get/post/put/patch/delete/raw)

### 2.2 — `lib/auth-context.tsx` — GÜNCELLE
- [ ] `import { setTokens, clearTokens, getToken }` → tamamen kaldır
- [ ] Init: `getToken()` kontrolü yerine → doğrudan `authApi.getProfile()` çağır
- [ ] `localStorage.getItem("can_antika_user")` flash önleme → kaldır
- [ ] `localStorage.setItem("can_antika_user")` → kaldır
- [ ] Login: `setTokens()` çağrısını kaldır (cookie backend set ediyor)
- [ ] Logout: `clearTokens()` → kaldır, `localStorage.removeItem("can_antika_user")` → kaldır

### 2.3 — `lib/api/index.ts`
- [ ] `authApi.login`: Dönüş tipi `LoginResponse` → `UserResponse` (token'lar artık yok)
- [ ] `authApi.refreshToken`: Body'den refreshToken göndermek yerine → cookie ile gidecek (body boş)
- [ ] `downloadInvoicePdf`: localStorage token → kaldır, `credentials: "include"` kullan

---

## Aşama 3: Frontend — Sayfalar (3 dosya)

### 3.1 — `app/oauth2/redirect/page.tsx` — TAMAMEN YENİDEN YAZ
- [ ] `import { setTokens }` → kaldır
- [ ] URL query param'dan token okuma → kaldır (cookie zaten set edilmiş)
- [ ] `localStorage.setItem("can_antika_user")` → kaldır
- [ ] Sadece `/v1/auth/me` çağır → user'ı al → context'e set et → redirect

### 3.2 — `app/admin/giris/page.tsx`
- [ ] `localStorage.getItem("can_antika_user")` → kaldır
- [ ] Admin role kontrolü → `useAuth()` context'ten `isAdmin` kullan

### 3.3 — `middleware.ts`
- [ ] Zaten cookie tabanlı — **değişiklik gerekmez** ✅

---

## Aşama 4: Doğrulama

### 4.1 — Derleme kontrolü
```bash
cd can-antika-frontend && npx tsc --noEmit
```

### 4.2 — localStorage temizlik kontrolü
```bash
grep -rn "localStorage.*can_antika" can-antika-frontend/lib/ can-antika-frontend/app/ can-antika-frontend/components/
```
- Hiçbir sonuç dönmemeli

### 4.3 — Token export kontrolü
```bash
grep -rn "getToken\|setTokens\|clearTokens\|getRefreshToken" can-antika-frontend/
```
- Hiçbir sonuç dönmemeli

### 4.4 — Test Senaryoları
| Senaryo | Beklenen |
|---------|----------|
| Login | Cookie set edilir, user yüklenir |
| Logout | Cookie temizlenir, korumalı sayfalara erişim engellenir |
| Token süresi dolunca | Otomatik refresh (cookie ile), kullanıcı fark etmez |
| Refresh token da dolarsa | `/giris`'e yönlendirilir |
| Google OAuth login | Cookie set edilir (backend), `/oauth2/redirect`'den user yüklenir |
| Admin sayfaya erişim (yetkisiz) | `/admin/giris`'e yönlendirilir |
| Birden fazla tab | Tüm tab'larda cookie paylaşılır, oturum senkron |
| XSS denemesi | Token'a JavaScript ile erişilemez (httpOnly) |

---

## Dosya Özeti

| Tip | Dosya | Değişiklik |
|-----|-------|-----------|
| Backend değişiklik | `CookieUtil.java` | SameSite=Lax |
| Backend değişiklik | `RestAuthControllerImpl.java` | Login/refresh response body'den token kaldır, cookie'den refresh oku |
| Backend değişiklik | `IRestAuthController.java` | refreshToken imzasına HttpServletRequest ekle |
| Frontend büyük | `lib/api-client.ts` | Token fonksiyonları sil, cookie-only auth |
| Frontend büyük | `lib/auth-context.tsx` | localStorage kaldır, cookie-based init |
| Frontend orta | `lib/api/index.ts` | refreshToken + downloadInvoicePdf düzelt |
| Frontend küçük | `app/oauth2/redirect/page.tsx` | Token query param kaldır |
| Frontend küçük | `app/admin/giris/page.tsx` | localStorage kaldır |
| Değişiklik yok | `middleware.ts` | Zaten cookie tabanlı ✅ |
| Değişiklik yok | `JwtAuthFilter.java` | Zaten cookie okuyor ✅ |
| Değişiklik yok | `SecurityConfig.java` | CSRF disable kalır (SameSite=Lax + CORS yeterli) ✅ |

**Toplam: 5 dosya değişiklik, 3 dosya küçük düzeltme, 0 yeni dosya**

---

## Güvenlik Puanı

| Metrik | Önce | Sonra |
|--------|------|-------|
| XSS'e karşı token koruması | 7/10 | 10/10 |
| CSRF koruması (SameSite=Lax) | 9/10 | 9/10 |
| Token çalınma riski | 7/10 | 10/10 |
| Token sızıntı yüzeyi | 6/10 | 10/10 |
| **Toplam** | **8.0/10** | **9.5/10** |
