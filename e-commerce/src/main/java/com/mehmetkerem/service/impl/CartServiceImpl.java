package com.mehmetkerem.service.impl;

import com.mehmetkerem.dto.request.CartItemRequest;
import com.mehmetkerem.dto.response.CartItemResponse;
import com.mehmetkerem.dto.response.CartResponse;
import com.mehmetkerem.dto.response.ProductResponse;
import com.mehmetkerem.exception.NotFoundException;
import com.mehmetkerem.exception.ExceptionMessages;
import com.mehmetkerem.mapper.CartItemMapper;
import com.mehmetkerem.model.Cart;
import com.mehmetkerem.model.CartItem;
import com.mehmetkerem.model.Product;
import com.mehmetkerem.repository.CartRepository;
import com.mehmetkerem.service.ICartService;
import com.mehmetkerem.service.ICouponService;
import com.mehmetkerem.service.IProductService;
import com.mehmetkerem.service.IStockService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.mehmetkerem.util.Messages;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class CartServiceImpl implements ICartService {

    private final CartRepository cartRepository;
    private final CartItemMapper cartItemMapper;
    private final IProductService productService;
    private final ICouponService couponService;
    private final IStockService stockService;

    @Transactional
    @Override
    public CartResponse saveCart(Long userId, List<CartItemRequest> cartItemRequests) {
        log.info("Sepet kaydediliyor. UserId: {}, Ürün Adedi: {}", userId, cartItemRequests.size());
        stockService.validateCartStock(cartItemRequests);

        Cart cart = getCartByUserId(userId);

        List<CartItem> incomingCartItems = cartItemMapper.toEntityCartItem(cartItemRequests);

        List<Long> productIds = incomingCartItems.stream()
                .map(CartItem::getProductId)
                .collect(Collectors.toList());

        List<ProductResponse> products = productService.getProductResponsesByIds(productIds);

        Map<Long, ProductResponse> productMap = products.stream()
                .collect(Collectors.toMap(ProductResponse::getId, p -> p));

        for (CartItem item : incomingCartItems) {
            ProductResponse product = productMap.get(item.getProductId());
            if (product == null) {
                throw new NotFoundException("Product not found: " + item.getProductId());
            }
            item.setPrice(product.getPrice());
        }

        // Merge: aynı ürünlü kalemleri birleştir
        Map<Long, CartItem> mergedItems = new LinkedHashMap<>();
        for (CartItem item : cart.getItems()) {
            mergedItems.put(item.getProductId(), item);
        }

        for (CartItem item : incomingCartItems) {
            CartItem existing = mergedItems.get(item.getProductId());
            if (existing == null) {
                cart.getItems().add(item);
                mergedItems.put(item.getProductId(), item);
                continue;
            }

            existing.setQuantity(existing.getQuantity() + item.getQuantity());
            ProductResponse product = productMap.get(item.getProductId());
            if (product != null) {
                existing.setPrice(product.getPrice());
            }
        }

        List<CartItemRequest> mergedRequests = mergedItems.values().stream()
                .map(item -> {
                    CartItemRequest request = new CartItemRequest();
                    request.setProductId(item.getProductId());
                    request.setQuantity(item.getQuantity());
                    return request;
                })
                .toList();
        stockService.validateCartStock(mergedRequests);

        cart.setUpdatedAt(LocalDateTime.now());

        if (cart.getItems().isEmpty()) {
            cart.setCouponCode(null);
        }
        return toResponse(cartRepository.save(cart));
    }

    @Override
    public Cart getCartByUserId(Long userId) {
        return cartRepository.findByUserId(userId).orElseGet(() -> {
            Cart newCart = Cart.builder()
                    .userId(userId)
                    .items(new ArrayList<>())
                    .build();
            return cartRepository.save(newCart);
        });
    }

    @Transactional
    @Override
    public CartResponse getCartResponseByUserId(Long userId) {
        return toResponse(getCartByUserId(userId));
    }

    @Transactional
    @Override
    public CartResponse addItem(Long userId, CartItemRequest request) {
        Cart cart = getCartByUserId(userId);

        Product product = productService.getProductById(request.getProductId());

        Optional<CartItem> existingItem = cart.getItems().stream()
                .filter(item -> Objects.equals(item.getProductId(), request.getProductId()))
                .findFirst();

        int totalQuantity = request.getQuantity() + existingItem.map(CartItem::getQuantity).orElse(0);
        stockService.validateCartItemStock(totalQuantity, product);

        if (existingItem.isPresent()) {
            existingItem.get().setQuantity(totalQuantity);
        } else {
            CartItem newItem = cartItemMapper.toEntity(request);
            newItem.setPrice(product.getPrice());
            cart.getItems().add(newItem);
        }

        cart.setUpdatedAt(LocalDateTime.now());
        log.info("Sepete ürün eklendi. Kullanıcı ID: {}, Ürün ID: {}, Miktar: {}", userId, request.getProductId(),
                request.getQuantity());

        return toResponse(cartRepository.save(cart));
    }

    @Transactional
    @Override
    public CartResponse updateItemQuantity(Long userId, Long productId, int quantity) {
        stockService.validateCartItemStock(quantity, productService.getProductById(productId));

        Cart cart = getCartByUserId(userId);

        CartItem cartItem = cart.getItems().stream()
                .filter(item -> Objects.equals(item.getProductId(), productId))
                .findFirst()
                .orElseThrow(() -> new NotFoundException(ExceptionMessages.PRODUCT_NOT_FOUND_IN_CART));

        cartItem.setQuantity(quantity);
        cart.setUpdatedAt(LocalDateTime.now());

        return toResponse(cartRepository.save(cart));
    }

    @Transactional
    @Override
    public CartResponse removeItem(Long userId, Long productId) {
        Cart cart = getCartByUserId(userId);
        boolean isRemoved = cart.getItems().removeIf(item -> Objects.equals(item.getProductId(), productId));
        cart.setUpdatedAt(LocalDateTime.now());

        if (!isRemoved) {
            log.warn("Sepetten ürün silme hatası: Ürün bulunamadı. Kullanıcı ID: {}, Ürün ID: {}", userId, productId);
            throw new NotFoundException(ExceptionMessages.PRODUCT_NOT_FOUND);
        }
        if (cart.getItems().isEmpty()) {
            cart.setCouponCode(null);
        }
        log.info("Ürün sepetten çıkarıldı. Kullanıcı ID: {}, Ürün ID: {}", userId, productId);
        return toResponse(cartRepository.save(cart));
    }

    @Transactional
    @Override
    public String clearCart(Long userId) {
        Cart cart = getCartByUserId(userId);
        cart.getItems().clear();
        cart.setCouponCode(null);
        cart.setUpdatedAt(LocalDateTime.now());
        cartRepository.save(cart);
        return String.format(Messages.CLEAR_VALUE, userId, "sepet");
    }

    @Override
    @Transactional
    public CartResponse applyCoupon(Long userId, String couponCode) {
        Cart cart = getCartByUserId(userId);
        BigDecimal currentTotal = calculateRawTotal(cart);
        couponService.applyCoupon(couponCode, currentTotal);
        cart.setCouponCode(couponCode);
        cartRepository.save(cart);
        return toResponse(cart);
    }

    @Override
    @Transactional
    public CartResponse removeCoupon(Long userId) {
        Cart cart = getCartByUserId(userId);
        cart.setCouponCode(null);
        cartRepository.save(cart);
        return toResponse(cart);
    }

    private BigDecimal calculateRawTotal(Cart cart) {
        return cart.getItems().stream()
                .map(item -> item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    @Transactional
    @Override
    public BigDecimal calculateTotal(Long userId) {
        Cart cart = getCartByUserId(userId);
        BigDecimal total = calculateRawTotal(cart);

        if (cart.getCouponCode() != null) {
            try {
                return couponService.applyCoupon(cart.getCouponCode(), total);
            } catch (Exception e) {
                log.warn("Geçersiz kupon temizleniyor. Kupon: {}, Sebep: {}", cart.getCouponCode(), e.getMessage());
                cart.setCouponCode(null);
                cartRepository.save(cart);
                return total;
            }
        }
        return total;
    }

    private CartResponse toResponse(Cart cart) {
        List<CartItemResponse> items = toResponseCartItems(cart);
        CartTotals totals = calculateTotals(cart.getCouponCode(), items);
        return CartResponse.builder()
                .id(cart.getId())
                .userId(cart.getUserId())
                .items(items)
                .subtotal(totals.subtotal())
                .discount(totals.discount())
                .total(totals.total())
                .couponCode(totals.couponCode())
                .updatedAt(cart.getUpdatedAt())
                .build();
    }

    private CartTotals calculateTotals(String couponCode, List<CartItemResponse> items) {
        BigDecimal subtotal = items.stream()
                .map(CartItemResponse::getTotal)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (couponCode == null || couponCode.isBlank()) {
            return new CartTotals(subtotal, BigDecimal.ZERO, subtotal, null);
        }

        try {
            BigDecimal total = couponService.applyCoupon(couponCode, subtotal);
            BigDecimal discount = subtotal.subtract(total).max(BigDecimal.ZERO);
            return new CartTotals(subtotal, discount, total, couponCode.toUpperCase());
        } catch (Exception e) {
            log.warn("Gecersiz kupon sepet yanitindan cikarildi. Kupon: {}, Sebep: {}", couponCode, e.getMessage());
            return new CartTotals(subtotal, BigDecimal.ZERO, subtotal, null);
        }
    }

    private record CartTotals(BigDecimal subtotal, BigDecimal discount, BigDecimal total, String couponCode) {
    }

    private List<CartItemResponse> toResponseCartItems(Cart cart) {
        List<CartItem> cartItems = cart.getItems();
        if (cartItems.isEmpty()) {
            return new ArrayList<>();
        }

        List<Long> productIds = cartItems.stream()
                .map(CartItem::getProductId)
                .collect(Collectors.toList());

        Map<Long, ProductResponse> productMap = productService.getProductResponsesByIds(productIds).stream()
                .collect(Collectors.toMap(ProductResponse::getId, p -> p));

        List<Long> unavailableProductIds = cartItems.stream()
                .filter(cartItem -> !isCartItemAvailable(cartItem, productMap.get(cartItem.getProductId())))
                .map(CartItem::getProductId)
                .toList();
        if (!unavailableProductIds.isEmpty()) {
            log.warn("Sepetten erisilemeyen urunler temizleniyor. UserId: {}, ProductIds: {}",
                    cart.getUserId(), unavailableProductIds);
            cartItems.removeIf(cartItem -> unavailableProductIds.contains(cartItem.getProductId()));
            if (cartItems.isEmpty()) {
                cart.setCouponCode(null);
            }
        }

        return cartItems.stream()
                .map(cartItem -> {
                    ProductResponse product = productMap.get(cartItem.getProductId());
                    return cartItemMapper.toResponseWithProduct(cartItem, product);
                })
                .collect(Collectors.toList());
    }

    private boolean isCartItemAvailable(CartItem cartItem, ProductResponse product) {
        if (product == null || cartItem == null || cartItem.getQuantity() <= 0) {
            return false;
        }
        int stock = product.getStock() == null ? 0 : product.getStock();
        return stock >= cartItem.getQuantity() && isSellable(product.getAttributes());
    }

    private boolean isSellable(Map<String, Object> attributes) {
        if (attributes == null || attributes.isEmpty()) {
            return true;
        }
        Object rawStatus = attributes.get("status");
        if (rawStatus == null) {
            return true;
        }
        String normalizedStatus = rawStatus.toString().trim().toLowerCase(Locale.ROOT);
        return !"sold".equals(normalizedStatus) && !"reserved".equals(normalizedStatus);
    }
}
