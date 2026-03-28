# Security Access Matrix (USER / ADMIN / GUEST)

## Public (GUEST)
- `POST /v1/auth/login`
- `POST /v1/auth/register`
- `POST /v1/auth/refresh-token`
- `POST /v1/auth/forgot-password`
- `POST /v1/auth/reset-password`
- `POST /v1/auth/logout`
- `GET /v1/product/**`
- `POST /v1/product/*/view`
- `GET /v1/category/**`
- `GET /v1/review/**`
- `GET /v1/site-settings`
- `GET /v1/faq`
- `GET /v1/brands`
- `GET /v1/popups/active`
- `GET /v1/blog`
- `GET /v1/blog/{slug}`
- `GET /v1/blog/categories`
- `GET /v1/pages`
- `GET /v1/pages/{slug}`
- `GET /v1/coupons/{code}`
- `POST /v1/contact`
- `POST /v1/newsletter/subscribe`
- `POST /v1/newsletter/unsubscribe`
- `GET /actuator/health`

## USER (authenticated)
- SecurityConfig `anyRequest().authenticated()` ile public olmayan endpointler USER/ADMIN erişimine açıktır.
- Controller seviyesinde `ROLE_ADMIN` zorunluluğu olmayan işlemler USER tarafından kullanılabilir:
  - `POST /v1/payment/process`
  - `GET /v1/payment/{paymentId}` (yalnızca kendi ödemesi)
  - `GET /v1/payment/my-payments`
  - `DELETE /v1/user/me`
  - Sepet/sipariş/yorum/istek listesi gibi kullanıcı akışları

## ADMIN
- `/v1/admin/**` tamamı `ROLE_ADMIN`
- Controller seviyesinde ayrıca `ROLE_ADMIN` gerektiren örnekler:
  - `POST /v1/files/upload`
  - `POST /v1/files/upload-multiple`
  - `POST /v1/product/save`
  - `PUT /v1/product/{id}`
  - `DELETE /v1/product/{id}`
  - `POST /v1/product/import-excel`
  - `POST /v1/category/save`
  - `PUT /v1/category/{id}`
  - `DELETE /v1/category/{id}`
  - `PUT /v1/payment/{paymentId}/status`
  - `DELETE /v1/payment/{paymentId}`
  - `v1/user/**` yönetim endpointleri

## Notes
- Ödeme ve sipariş akışında ownership kontrolü servis katmanında da doğrulanır (`orderAuthorizationService.assertOwner`).
- GUEST için beklenen `401`, yetkisiz rol için beklenen `403` davranışı frontend'de anlamlı mesajlarla ele alınır.
