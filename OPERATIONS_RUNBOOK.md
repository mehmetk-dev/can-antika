# Operations Runbook

## 1) Log Correlation ID
- Tüm API istekleri `X-Correlation-Id` ile cevaplanır (`CorrelationIdFilter`).
- Hata incelemede API cevabındaki `Ref: <id>` değeri ile backend loglarında aynı request bulunur.

## 2) Metrics ve Alarm Hazırlığı
- Actuator endpointleri:
  - `/actuator/health`
  - `/actuator/info`
  - `/actuator/metrics`
  - `/actuator/prometheus`
- Alarm önerileri:
  - `http_server_requests_seconds_count{status=~"5.."} > threshold`
  - `jvm_memory_used_bytes / jvm_memory_max_bytes > 0.85`
  - `process_cpu_usage > 0.8`
  - `rate_limit` kaynaklı 429 oranı anormal artış

## 3) Backup Planı
- Tam yedek: `./backup-db.sh`
- Öneri: her gün 03:00 cron
- Retention: varsayılan `KEEP_DAYS=7` (ortama göre arttırılmalı)

## 4) Restore Planı
1. Uygulamayı maintenance moda alın.
2. Hedef backup dosyasını belirleyin.
3. Çalıştırın:
   - `./restore-db.sh /absolute/path/to/can_antika_YYYYMMDD_HHMMSS.sql.gz`
4. Smoke test:
   - Login
   - Ürün listeleme
   - Sipariş detay ekranı
5. Maintenance modunu kapatın.

## 5) Migration Rollback Planı (Flyway)
- Flyway Community sürümünde otomatik `undo` yoktur.
- Her migration için ters SQL dosyası tutulmalı:
  - Örnek: `V3__add_x.sql` için `rollback/V3__add_x__rollback.sql`
- Acil durumda adımlar:
1. Trafiği kes / maintenance moda al.
2. Son migration değişikliklerini yedekten doğrula.
3. İlgili rollback SQL'i manuel uygula (`psql`).
4. `flyway_schema_history` kayıtlarını kontrollü şekilde doğrula.
5. Uygulamayı ayağa kaldır ve smoke test çalıştır.

## 6) Olay Sonrası Kontrol Listesi
- Hata anındaki `X-Correlation-Id` listesi
- Etkilenen endpoint ve zaman aralığı
- Alınan aksiyonlar (rollback/restore/restart)
- Tekrarı önlemek için kalıcı aksiyon maddeleri
