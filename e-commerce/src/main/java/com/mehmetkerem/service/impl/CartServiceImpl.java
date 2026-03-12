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

        List<CartItem> entityCartItem = cartItemMapper.toEntityCartItem(cartItemRequests);

        List<Long> productIds = entityCartItem.stream()
                .map(CartItem::getProductId)
                .collect(Collectors.toList());

        List<ProductResponse> products = productService.getProductResponsesByIds(productIds);

        Map<Long, ProductResponse> productMap = products.stream()
                .collect(Collectors.toMap(ProductResponse::getId, p -> p));

        for (CartItem item : entityCartItem) {
            ProductResponse product = productMap.get(item.getProductId());
            if (product == null) {
                throw new NotFoundException("Product not found: " + item.getProductId());
            }
            item.setPrice(product.getPrice());
        }

        // Merge: aynı ürünlü kalemleri birleştir
        Map<Long, CartItem> mergedItems = new LinkedHashMap<>();
        for (CartItem item : entityCartItem) {
            if (mergedItems.containsKey(item.getProductId())) {
                CartItem existing = mergedItems.get(item.getProductId());
                existing.setQuantity(existing.getQuantity() + item.getQuantity());
            } else {
                mergedItems.put(item.getProductId(), item);
            }
        }

        cart.getItems().clear();
        cart.getItems().addAll(mergedItems.values());
        cart.setUpdatedAt(LocalDateTime.now());

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

    @Override
    public CartResponse removeItem(Long userId, Long productId) {
        Cart cart = getCartByUserId(userId);
        boolean isRemoved = cart.getItems().removeIf(item -> Objects.equals(item.getProductId(), productId));
        cart.setUpdatedAt(LocalDateTime.now());

        if (!isRemoved) {
            log.warn("Sepetten ürün silme hatası: Ürün bulunamadı. Kullanıcı ID: {}, Ürün ID: {}", userId, productId);
            throw new NotFoundException(ExceptionMessages.PRODUCT_NOT_FOUND);
        }
        log.info("Ürün sepetten çıkarıldı. Kullanıcı ID: {}, Ürün ID: {}", userId, productId);
        return toResponse(cartRepository.save(cart));
    }

    @Override
    public String clearCart(Long userId) {
        Cart cart = getCartByUserId(userId);
        cart.getItems().clear();
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
        return CartResponse.builder()
                .id(cart.getId())
                .userId(cart.getUserId())
                .items(toResponseCartItem(cart.getItems()))
                .updatedAt(cart.getUpdatedAt())
                .build();
    }

    private List<CartItemResponse> toResponseCartItem(List<CartItem> cartItems) {
        if (cartItems.isEmpty()) {
            return new ArrayList<>();
        }

        List<Long> productIds = cartItems.stream()
                .map(CartItem::getProductId)
                .collect(Collectors.toList());

        Map<Long, ProductResponse> productMap = productService.getProductResponsesByIds(productIds).stream()
                .collect(Collectors.toMap(ProductResponse::getId, p -> p));

        return cartItems.stream()
                .map(cartItem -> {
                    ProductResponse product = productMap.get(cartItem.getProductId());
                    if (product == null) {
                        return null;
                    }
                    return cartItemMapper.toResponseWithProduct(cartItem, product);
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }
}
