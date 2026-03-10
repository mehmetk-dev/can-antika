#!/bin/bash
# ╔══════════════════════════════════════════════════════════════════╗
# ║  Let's Encrypt SSL sertifikası kurulum scripti                  ║
# ║  İlk kurulumda bir kez çalıştırın.                              ║
# ╚══════════════════════════════════════════════════════════════════╝

set -e

DOMAIN=${1:-canantika.com}
EMAIL=${2:-admin@canantika.com}

echo "=== SSL sertifikası alınıyor: $DOMAIN ==="

# 1) Geçici nginx config — sadece HTTP challenge için
mkdir -p nginx certbot/conf certbot/www

# Geçici self-signed sertifika (nginx başlayabilmesi için)
mkdir -p certbot/conf/live/$DOMAIN
if [ ! -f "certbot/conf/live/$DOMAIN/fullchain.pem" ]; then
  echo "Geçici self-signed sertifika oluşturuluyor..."
  openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout "certbot/conf/live/$DOMAIN/privkey.pem" \
    -out "certbot/conf/live/$DOMAIN/fullchain.pem" \
    -subj "/CN=$DOMAIN" 2>/dev/null
fi

# 2) Nginx'i başlat (HTTP challenge için)
echo "Nginx başlatılıyor..."
docker compose -f docker-compose.prod.yml up -d nginx

# 3) Certbot ile gerçek sertifika al
echo "Let's Encrypt sertifikası alınıyor..."
docker compose -f docker-compose.prod.yml run --rm certbot \
  certbot certonly --webroot \
  --webroot-path=/var/www/certbot \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  -d "$DOMAIN" \
  -d "www.$DOMAIN"

# 4) Nginx'i yeniden başlat (gerçek sertifika ile)
echo "Nginx yeniden başlatılıyor..."
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload

echo ""
echo "=== SSL kurulumu tamamlandı! ==="
echo "Şimdi tüm servisleri başlatabilirsiniz:"
echo "  docker compose -f docker-compose.prod.yml up -d"
