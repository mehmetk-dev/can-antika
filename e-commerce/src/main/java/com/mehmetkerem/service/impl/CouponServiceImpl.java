package com.mehmetkerem.service.impl;

import com.mehmetkerem.dto.request.CouponRequest;
import com.mehmetkerem.dto.response.CouponResponse;
import com.mehmetkerem.exception.BadRequestException;
import com.mehmetkerem.exception.NotFoundException;
import com.mehmetkerem.mapper.CouponMapper;
import com.mehmetkerem.model.Coupon;
import com.mehmetkerem.model.CouponUsage;
import com.mehmetkerem.repository.CouponRepository;
import com.mehmetkerem.repository.CouponUsageRepository;
import com.mehmetkerem.service.ICouponService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CouponServiceImpl implements ICouponService {

    private final CouponRepository couponRepository;
    private final CouponUsageRepository couponUsageRepository;
    private final CouponMapper couponMapper;

    @Override
    public CouponResponse createCoupon(String code, BigDecimal discountAmount, BigDecimal minCartAmount, int daysValid) {
        if (couponRepository.findByCode(code).isPresent()) {
            throw new BadRequestException("Bu kupon kodu zaten mevcut!");
        }

        Coupon coupon = Coupon.builder()
                .code(code.toUpperCase())
                .discountAmount(discountAmount)
                .minCartAmount(minCartAmount != null ? minCartAmount : BigDecimal.ZERO)
                .expirationDate(LocalDateTime.now().plusDays(daysValid))
                .isActive(true)
                .usageCount(0)
                .build();

        return couponMapper.toResponse(couponRepository.save(coupon));
    }

    @Override
    public CouponResponse createCoupon(CouponRequest request) {
        if (couponRepository.findByCode(request.getCode()).isPresent()) {
            throw new BadRequestException("Bu kupon kodu zaten mevcut!");
        }

        Coupon coupon = Coupon.builder()
                .code(request.getCode() != null ? request.getCode().toUpperCase() : null)
                .discountAmount(request.getDiscountAmount())
                .discountType(request.getDiscountType())
                .minCartAmount(request.getMinCartAmount() != null ? request.getMinCartAmount() : BigDecimal.ZERO)
                .expirationDate(request.getExpirationDate())
                .maxUsageCount(request.getMaxUsageCount())
                .perUserLimit(request.getPerUserLimit())
                .description(request.getDescription())
                .isActive(request.isActive())
                .usageCount(0)
                .build();

        return couponMapper.toResponse(couponRepository.save(coupon));
    }

    @Override
    public CouponResponse getCouponByCode(String code) {
        Coupon coupon = couponRepository.findByCode(code)
                .orElseThrow(() -> new NotFoundException("Kupon bulunamadi!"));
        return couponMapper.toResponse(coupon);
    }

    @Override
    public List<CouponResponse> getAllCoupons() {
        return couponRepository.findAll().stream().map(couponMapper::toResponse).toList();
    }

    @Override
    public CouponResponse updateCoupon(Long id, CouponRequest request) {
        Coupon existing = couponRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Kupon bulunamadi id: " + id));

        existing.setCode(request.getCode() != null ? request.getCode().toUpperCase() : existing.getCode());
        existing.setDiscountAmount(request.getDiscountAmount());
        existing.setDiscountType(request.getDiscountType());
        existing.setMinCartAmount(request.getMinCartAmount());
        existing.setExpirationDate(request.getExpirationDate());
        existing.setMaxUsageCount(request.getMaxUsageCount());
        existing.setPerUserLimit(request.getPerUserLimit());
        existing.setDescription(request.getDescription());
        existing.setActive(request.isActive());

        return couponMapper.toResponse(couponRepository.save(existing));
    }

    @Transactional
    @Override
    public BigDecimal applyCoupon(String code, BigDecimal cartTotal) {
        Coupon coupon = getValidatedCoupon(code, cartTotal, null);
        return calculateDiscountedTotal(coupon, cartTotal);
    }

    @Transactional
    @Override
    public void consumeCoupon(String code, BigDecimal cartTotal, Long userId) {
        Coupon coupon = getValidatedCoupon(code, cartTotal, userId);
        coupon.setUsageCount(coupon.getUsageCount() + 1);
        couponRepository.save(coupon);

        if (userId != null) {
            CouponUsage usage = couponUsageRepository.findByCouponIdAndUserId(coupon.getId(), userId)
                    .orElseGet(() -> CouponUsage.builder()
                            .couponId(coupon.getId())
                            .userId(userId)
                            .usageCount(0)
                            .build());
            usage.setUsageCount(usage.getUsageCount() + 1);
            couponUsageRepository.save(usage);
        }
    }

    private Coupon getValidatedCoupon(String code, BigDecimal cartTotal, Long userId) {
        Coupon coupon = couponRepository.findByCode(code)
                .orElseThrow(() -> new NotFoundException("Kupon bulunamadi!"));

        if (!coupon.isActive()) {
            throw new BadRequestException("Bu kupon pasif durumda.");
        }

        if (LocalDateTime.now().isAfter(coupon.getExpirationDate())) {
            throw new BadRequestException("Bu kuponun suresi dolmus.");
        }

        int usageLimit = coupon.getMaxUsageCount() == null ? 0 : coupon.getMaxUsageCount();
        if (usageLimit > 0 && coupon.getUsageCount() >= usageLimit) {
            throw new BadRequestException("Bu kuponun kullanim limiti dolmustur.");
        }

        Integer perUserLimit = coupon.getPerUserLimit();
        if (userId != null && perUserLimit != null && perUserLimit > 0) {
            int usedByUser = couponUsageRepository.findByCouponIdAndUserId(coupon.getId(), userId)
                    .map(CouponUsage::getUsageCount)
                    .orElse(0);
            if (usedByUser >= perUserLimit) {
                throw new BadRequestException("Bu kuponu kullanma limitinize ulastiniz.");
            }
        }

        if (cartTotal.compareTo(coupon.getMinCartAmount()) < 0) {
            throw new BadRequestException(
                    "Sepet tutari bu kupon icin yetersiz. Minimum tutar: " + coupon.getMinCartAmount());
        }

        return coupon;
    }

    private BigDecimal calculateDiscountedTotal(Coupon coupon, BigDecimal cartTotal) {
        BigDecimal discount = coupon.getDiscountAmount();
        if ("PERCENTAGE".equalsIgnoreCase(coupon.getDiscountType())) {
            discount = cartTotal.multiply(discount)
                    .divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
        }
        return cartTotal.subtract(discount).max(BigDecimal.ZERO);
    }

    @Override
    public void deleteCoupon(Long couponId) {
        if (!couponRepository.existsById(couponId)) {
            throw new NotFoundException("Kupon bulunamadi id: " + couponId);
        }
        couponRepository.deleteById(couponId);
    }
}
