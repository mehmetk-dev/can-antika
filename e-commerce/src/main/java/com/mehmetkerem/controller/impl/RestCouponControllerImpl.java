package com.mehmetkerem.controller.impl;

import com.mehmetkerem.controller.IRestCouponController;
import com.mehmetkerem.dto.request.CouponRequest;
import com.mehmetkerem.dto.response.CouponResponse;
import com.mehmetkerem.service.ICouponService;
import com.mehmetkerem.util.ResultData;
import com.mehmetkerem.util.ResultHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.annotation.Secured;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/v1/coupons")
@RequiredArgsConstructor
public class RestCouponControllerImpl implements IRestCouponController {

    private final ICouponService couponService;

    @Override
    @Secured("ROLE_ADMIN")
    @PostMapping("/create")
    public ResultData<CouponResponse> createCoupon(@RequestBody CouponRequest request) {
        return ResultHelper.success(couponService.createCoupon(request));
    }

    @Override
    @GetMapping("/{code}")
    public ResultData<CouponResponse> getCoupon(@PathVariable String code) {
        return ResultHelper.success(couponService.getCouponByCode(code));
    }

    @Override
    @Secured("ROLE_ADMIN")
    @PostMapping("/apply")
    public ResultData<BigDecimal> applyCoupon(@RequestParam String code, @RequestParam BigDecimal total) {
        return ResultHelper.success(couponService.applyCoupon(code, total));
    }

    @Override
    @Secured("ROLE_ADMIN")
    @DeleteMapping("/{id}")
    public ResultData<String> deleteCoupon(@PathVariable Long id) {
        couponService.deleteCoupon(id);
        return ResultHelper.success("Kupon silindi.");
    }

    // Admin: list all coupons
    @Secured("ROLE_ADMIN")
    @GetMapping("/admin/all")
    public ResultData<List<CouponResponse>> getAllCoupons() {
        return ResultHelper.success(couponService.getAllCoupons());
    }

    // Admin: update coupon
    @Secured("ROLE_ADMIN")
    @PutMapping("/admin/{id}")
    public ResultData<CouponResponse> updateCoupon(@PathVariable Long id, @RequestBody CouponRequest incoming) {
        return ResultHelper.success(couponService.updateCoupon(id, incoming));
    }
}
