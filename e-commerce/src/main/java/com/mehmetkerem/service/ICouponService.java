package com.mehmetkerem.service;

import com.mehmetkerem.dto.request.CouponRequest;
import com.mehmetkerem.dto.response.CouponResponse;
import java.math.BigDecimal;
import java.util.List;

public interface ICouponService {
    CouponResponse createCoupon(String code, BigDecimal discountAmount, BigDecimal minCartAmount, int daysValid);
    
    CouponResponse createCoupon(CouponRequest request);

    CouponResponse getCouponByCode(String code);
    
    List<CouponResponse> getAllCoupons();
    
    CouponResponse updateCoupon(Long id, CouponRequest request);

    BigDecimal applyCoupon(String code, BigDecimal cartTotal);

    void consumeCoupon(String code, BigDecimal cartTotal);

    void deleteCoupon(Long couponId);
}
