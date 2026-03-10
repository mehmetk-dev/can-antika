package com.mehmetkerem.service.impl;

import com.mehmetkerem.dto.request.CouponRequest;
import com.mehmetkerem.dto.response.CouponResponse;
import com.mehmetkerem.exception.BadRequestException;
import com.mehmetkerem.exception.NotFoundException;
import com.mehmetkerem.model.Coupon;
import com.mehmetkerem.repository.CouponRepository;
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

    private CouponResponse mapToResponse(Coupon coupon) {
        return CouponResponse.builder()
                .id(coupon.getId())
                .code(coupon.getCode())
                .discountAmount(coupon.getDiscountAmount())
                .discountType(coupon.getDiscountType())
                .minCartAmount(coupon.getMinCartAmount())
                .expirationDate(coupon.getExpirationDate())
                .maxUsageCount(coupon.getMaxUsageCount())
                .currentUsageCount(coupon.getUsageCount())
                .perUserLimit(coupon.getPerUserLimit())
                .description(coupon.getDescription())
                .active(coupon.isActive())
                .build();
    }

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

        return mapToResponse(couponRepository.save(coupon));
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

        return mapToResponse(couponRepository.save(coupon));
    }

    @Override
    public CouponResponse getCouponByCode(String code) {
        Coupon coupon = couponRepository.findByCode(code)
                .orElseThrow(() -> new NotFoundException("Kupon bulunamadı!"));
        return mapToResponse(coupon);
    }

    @Override
    public List<CouponResponse> getAllCoupons() {
        return couponRepository.findAll().stream().map(this::mapToResponse).toList();
    }

    @Override
    public CouponResponse updateCoupon(Long id, CouponRequest request) {
        Coupon existing = couponRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Kupon bulunamadı id: " + id));

        existing.setCode(request.getCode() != null ? request.getCode().toUpperCase() : existing.getCode());
        existing.setDiscountAmount(request.getDiscountAmount());
        existing.setDiscountType(request.getDiscountType());
        existing.setMinCartAmount(request.getMinCartAmount());
        existing.setExpirationDate(request.getExpirationDate());
        existing.setMaxUsageCount(request.getMaxUsageCount());
        existing.setPerUserLimit(request.getPerUserLimit());
        existing.setDescription(request.getDescription());
        existing.setActive(request.isActive());

        return mapToResponse(couponRepository.save(existing));
    }

    @Transactional
    @Override
    public BigDecimal applyCoupon(String code, BigDecimal cartTotal) {
        Coupon coupon = getValidatedCoupon(code, cartTotal);
        return calculateDiscountedTotal(coupon, cartTotal);
    }

    @Transactional
    @Override
    public void consumeCoupon(String code, BigDecimal cartTotal) {
        Coupon coupon = getValidatedCoupon(code, cartTotal);
        coupon.setUsageCount(coupon.getUsageCount() + 1);
        couponRepository.save(coupon);
    }

    private Coupon getValidatedCoupon(String code, BigDecimal cartTotal) {
        Coupon coupon = couponRepository.findByCode(code)
                .orElseThrow(() -> new NotFoundException("Kupon bulunamadı!"));

        if (!coupon.isActive()) {
            throw new BadRequestException("Bu kupon pasif durumda.");
        }

        if (LocalDateTime.now().isAfter(coupon.getExpirationDate())) {
            throw new BadRequestException("Bu kuponun süresi dolmuş.");
        }

        Integer usageLimit = coupon.getMaxUsageCount();
        if (usageLimit == null) {
            usageLimit = 0; // Check DB model for fallback
        }

        if (usageLimit > 0 && coupon.getUsageCount() >= usageLimit) {
            throw new BadRequestException("Bu kuponun kullanım limiti dolmuştur.");
        }

        if (cartTotal.compareTo(coupon.getMinCartAmount()) < 0) {
            throw new BadRequestException(
                    "Sepet tutarı bu kupon için yetersiz. Minimum tutar: " + coupon.getMinCartAmount());
        }

        return coupon;
    }

    private BigDecimal calculateDiscountedTotal(Coupon coupon, BigDecimal cartTotal) {
        BigDecimal newTotal = cartTotal.subtract(coupon.getDiscountAmount());
        return newTotal.max(BigDecimal.ZERO);
    }

    @Override
    public void deleteCoupon(Long couponId) {
        if (!couponRepository.existsById(couponId)) {
            throw new NotFoundException("Kupon bulunamadı id: " + couponId);
        }
        couponRepository.deleteById(couponId);
    }
}
