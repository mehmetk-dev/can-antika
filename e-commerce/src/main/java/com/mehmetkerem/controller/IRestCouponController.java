package com.mehmetkerem.controller;

import com.mehmetkerem.dto.request.CouponRequest;
import com.mehmetkerem.dto.response.CouponResponse;
import com.mehmetkerem.util.ResultData;

import java.math.BigDecimal;
import java.util.List;

public interface IRestCouponController {
    ResultData<CouponResponse> createCoupon(CouponRequest request);

    ResultData<CouponResponse> getCoupon(String code);

    ResultData<BigDecimal> applyCoupon(String code, BigDecimal total);

    ResultData<String> deleteCoupon(Long id);

    ResultData<List<CouponResponse>> getAllCoupons();

    ResultData<CouponResponse> updateCoupon(Long id, CouponRequest incoming);
}
