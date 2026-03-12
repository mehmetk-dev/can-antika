package com.mehmetkerem.aspect;

import com.mehmetkerem.dto.request.CartItemRequest;
import com.mehmetkerem.enums.ActivityType;
import com.mehmetkerem.model.User;
import com.mehmetkerem.service.IActivityLogService;
import com.mehmetkerem.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

@Aspect
@Component
@RequiredArgsConstructor
public class ShoppingLoggingAspect {

    private final IActivityLogService activityLogService;

    // ── Sepet ──

    @AfterReturning("execution(* com.mehmetkerem.service.impl.CartServiceImpl.addItem(..))")
    public void logCartAddItem(JoinPoint joinPoint) {
        Object[] args = joinPoint.getArgs();
        Long userId = (Long) args[0];
        CartItemRequest request = (CartItemRequest) args[1];
        logActivity(ActivityType.CART_ADD_ITEM, userId, "CartItem", request.getProductId(),
                String.format("Sepete ürün eklendi. Ürün ID: %d, Adet: %d",
                        request.getProductId(), request.getQuantity()));
    }

    @AfterReturning("execution(* com.mehmetkerem.service.impl.CartServiceImpl.removeItem(..))")
    public void logCartRemoveItem(JoinPoint joinPoint) {
        Object[] args = joinPoint.getArgs();
        Long userId = (Long) args[0];
        Long productId = (Long) args[1];
        logActivity(ActivityType.CART_REMOVE_ITEM, userId, "CartItem", productId,
                "Sepetten ürün çıkarıldı. Ürün ID: " + productId);
    }

    @AfterReturning("execution(* com.mehmetkerem.service.impl.CartServiceImpl.clearCart(..))")
    public void logCartClear(JoinPoint joinPoint) {
        Long userId = (Long) joinPoint.getArgs()[0];
        logActivity(ActivityType.CART_CLEAR, userId, "Cart", null, "Sepet temizlendi");
    }

    @AfterReturning("execution(* com.mehmetkerem.service.impl.CartServiceImpl.applyCoupon(..))")
    public void logCouponApply(JoinPoint joinPoint) {
        Object[] args = joinPoint.getArgs();
        Long userId = (Long) args[0];
        String couponCode = (String) args[1];
        logActivity(ActivityType.CART_APPLY_COUPON, userId, "Coupon", null,
                "Kupon uygulandı: " + couponCode);
    }

    // ── Favori ──

    @AfterReturning("execution(* com.mehmetkerem.service.impl.WishlistServiceImpl.addItemToWishlist(..))")
    public void logWishlistAdd(JoinPoint joinPoint) {
        Object[] args = joinPoint.getArgs();
        Long userId = (Long) args[0];
        Long productId = (Long) args[1];
        logActivity(ActivityType.WISHLIST_ADD, userId, "WishlistItem", productId,
                "Favorilere ürün eklendi. Ürün ID: " + productId);
    }

    @AfterReturning("execution(* com.mehmetkerem.service.impl.WishlistServiceImpl.removeItemFromWishlist(..))")
    public void logWishlistRemove(JoinPoint joinPoint) {
        Object[] args = joinPoint.getArgs();
        Long userId = (Long) args[0];
        Long productId = (Long) args[1];
        logActivity(ActivityType.WISHLIST_REMOVE, userId, "WishlistItem", productId,
                "Favorilerden ürün çıkarıldı. Ürün ID: " + productId);
    }

    private void logActivity(ActivityType type, Long userId, String entityType,
            Long entityId, String description) {
        User user = SecurityUtils.getCurrentUser();
        String email = user != null ? user.getEmail() : null;
        activityLogService.log(type, userId, email, entityType, entityId, description, null);
    }
}
