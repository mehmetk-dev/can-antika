package com.mehmetkerem.service.impl;

import com.mehmetkerem.dto.request.OrderRequest;
import com.mehmetkerem.dto.response.OrderInvoiceResponse;
import com.mehmetkerem.dto.response.OrderResponse;
import com.mehmetkerem.dto.response.ProductResponse;
import com.mehmetkerem.dto.response.UserResponse;
import com.mehmetkerem.enums.ActivityType;
import com.mehmetkerem.enums.OrderStatus;
import com.mehmetkerem.event.OrderEvent;
import com.mehmetkerem.event.OrderEventType;
import com.mehmetkerem.exception.BadRequestException;
import com.mehmetkerem.exception.ExceptionMessages;
import com.mehmetkerem.exception.NotFoundException;
import com.mehmetkerem.mapper.AddressMapper;
import com.mehmetkerem.mapper.OrderMapper;
import com.mehmetkerem.model.*;
import com.mehmetkerem.repository.OrderRepository;
import com.mehmetkerem.service.IOrderService;
import com.mehmetkerem.service.IActivityLogService;
import com.mehmetkerem.util.Messages;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * Sipariş iş mantığı servisi.
 *
 * <p>
 * Bildirim gönderimi (e-posta, in-app) bu sınıfta YOKTUR.
 * Transaction commit'lendikten SONRA
 * {@link com.mehmetkerem.event.OrderEventListener}
 * tarafından event dinlenerek yapılır.
 * </p>
 *
 * <p>Sorumluluk dağılımı:</p>
 * <ul>
 *   <li>Stok kontrol/düşürme/iade → {@link StockService}</li>
 *   <li>Fatura oluşturma → {@link OrderInvoiceService}</li>
 *   <li>Durum geçmişi (timeline) → {@link OrderTimelineService}</li>
 *   <li>DTO dönüşümleri → {@link OrderMapper}</li>
 * </ul>
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class OrderServiceImpl implements IOrderService {

    private final OrderRepository orderRepository;
    private final com.mehmetkerem.service.ICartService cartService;
    private final com.mehmetkerem.service.IProductService productService;
    private final com.mehmetkerem.service.IAddressService addressService;
    private final com.mehmetkerem.service.ICouponService couponService;
    private final com.mehmetkerem.service.IUserService userService;
    private final OrderMapper orderMapper;
    private final AddressMapper addressMapper;
    private final TransactionTemplate transactionTemplate;
    private final ApplicationEventPublisher eventPublisher;
    private final IActivityLogService activityLogService;
    private final com.mehmetkerem.service.IStockService stockService;
    private final com.mehmetkerem.service.IOrderInvoiceService orderInvoiceService;
    private final com.mehmetkerem.service.IOrderTimelineService orderTimelineService;
    private final com.mehmetkerem.service.IOrderAuthorizationService orderAuthorizationService;

    private static final int STOCK_UPDATE_MAX_RETRIES = 3;

    // ══════════════════════════════════════════════════════════════════════════
    // Sipariş Oluşturma
    // ══════════════════════════════════════════════════════════════════════════

    @Override
    public OrderResponse saveOrder(Long userId, OrderRequest request) {
        int attempt = 0;

        while (attempt < STOCK_UPDATE_MAX_RETRIES) {
            try {
                return transactionTemplate.execute(status -> doSaveOrder(userId, request));
            } catch (ObjectOptimisticLockingFailureException e) {
                attempt++;
                log.warn("Stok güncelleme çakışması (deneme {}/{}). Tekrar deneniyor. Kullanıcı ID: {}",
                        attempt, STOCK_UPDATE_MAX_RETRIES, userId);
            }
        }

        log.error("Stok güncelleme {} denemede başarısız. Kullanıcı ID: {}", STOCK_UPDATE_MAX_RETRIES, userId);
        throw new BadRequestException(
                "Sipariş şu anda tamamlanamadı (yoğun trafik). Lütfen kısa süre sonra tekrar deneyin.");
    }

    private OrderResponse doSaveOrder(Long userId, OrderRequest request) {
        log.info("Yeni sipariş oluşturma isteği alındı. Kullanıcı ID: {}", userId);
        Cart cart = cartService.getCartByUserId(userId);

        if (cart.getItems().isEmpty()) {
            log.warn("Sipariş başarısız: Kullanıcının sepeti boş. Kullanıcı ID: {}", userId);
            throw new BadRequestException(String.format(ExceptionMessages.CART_NOT_FOUND, userId));
        }

        log.debug("Sepet doğrulandı, {} kalem ürün siparişe dönüştürülüyor.", cart.getItems().size());

        List<ProductResponse> productList = productService.getProductResponsesByIds(
                cart.getItems().stream().map(CartItem::getProductId).toList());
        Map<Long, ProductResponse> productMap = productList.stream()
                .collect(Collectors.toMap(ProductResponse::getId, p -> p));
        List<OrderItem> orderItems = orderMapper.cartItemsToOrderItems(cart.getItems(), productMap);

        // Stok kontrolü ve düşürme
        List<OrderEvent.StockAlertInfo> stockAlerts = stockService.validateAndDeductStock(orderItems);
        log.debug("Stok kontrolü başarılı ve stoklar düşürüldü.");

        // Adresin bu kullanıcıya ait olduğunu doğrula
        var shippingAddress = addressService.getAddressByIdAndUserId(request.getAddressId(), userId);
        var paymentStatus = com.mehmetkerem.enums.PaymentStatus.PENDING;

        BigDecimal rawTotal = orderItems.stream()
            .map(item -> item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal finalTotal = rawTotal;
        if (cart.getCouponCode() != null && !cart.getCouponCode().isBlank()) {
            finalTotal = couponService.applyCoupon(cart.getCouponCode(), rawTotal);
            couponService.consumeCoupon(cart.getCouponCode(), rawTotal, userId);
        }

        Order order = Order.builder()
                .userId(userId)
                .orderStatus(OrderStatus.PENDING)
                .orderDate(LocalDateTime.now())
                .totalAmount(finalTotal)
                .shippingAddress(shippingAddress)
                .paymentStatus(paymentStatus)
                .orderItems(orderItems)
                .note(request.getNote())
                .build();

        orderRepository.save(order);
        log.info("Sipariş veritabanına kaydedildi. Sipariş ID: {}, Toplam Tutar: {}", order.getId(),
                order.getTotalAmount());

        orderTimelineService.recordCreation(order.getId(), userId);

        cartService.clearCart(userId);
        log.debug("Kullanıcının sepeti temizlendi. Kullanıcı ID: {}", userId);

        // Event yayınla — bildirimler Transaction COMMIT sonrası gönderilir
        User user = userService.getUserById(userId);
        eventPublisher.publishEvent(OrderEvent.builder()
                .type(OrderEventType.ORDER_CREATED)
                .orderId(order.getId())
                .userId(userId)
                .userEmail(user.getEmail())
                .orderCode("ORD-" + order.getId())
                .stockAlerts(stockAlerts.isEmpty() ? null : stockAlerts)
                .build());

        return toOrderResponse(order);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Sipariş Sorgulama
    // ══════════════════════════════════════════════════════════════════════════

    @Override
    public Order getOrderById(Long orderId) {
        return orderRepository.findById(orderId).orElseThrow(
                () -> new NotFoundException(String.format(ExceptionMessages.NOT_FOUND, orderId, "sipariş")));
    }

    @Override
    public OrderResponse getOrderResponseById(Long orderId) {
        return toOrderResponse(getOrderById(orderId));
    }

    @Override
    public Page<OrderResponse> getOrdersByUserId(Long userId, Pageable pageable) {
        return toOrderResponsePage(orderRepository.findByUserId(userId, pageable));
    }

    @Override
    public Page<OrderResponse> getAllOrders(Pageable pageable) {
        return toOrderResponsePage(orderRepository.findAll(pageable));
    }

    @Override
    public Page<OrderResponse> searchOrders(
            OrderStatus status, com.mehmetkerem.enums.PaymentStatus paymentStatus,
            Long userId, LocalDateTime from, LocalDateTime to, String query, Pageable pageable) {

        Specification<Order> spec = Specification
                .where(com.mehmetkerem.repository.specification.OrderSpecification.hasStatus(status))
                .and(com.mehmetkerem.repository.specification.OrderSpecification.hasPaymentStatus(paymentStatus))
                .and(com.mehmetkerem.repository.specification.OrderSpecification.hasUserId(userId))
                .and(com.mehmetkerem.repository.specification.OrderSpecification.dateBetween(from, to))
                .and(com.mehmetkerem.repository.specification.OrderSpecification.searchByOrderCode(query));

        return toOrderResponsePage(orderRepository.findAll(spec, pageable));
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Sipariş Güncelleme
    // ══════════════════════════════════════════════════════════════════════════

    @Transactional
    @Override
    public OrderResponse updateOrderStatus(Long orderId, OrderStatus newStatus) {
        Order order = getOrderById(orderId);
        OrderStatus oldStatus = order.getOrderStatus();

        if (oldStatus == OrderStatus.CANCELLED) {
            throw new BadRequestException("İptal edilmiş bir siparişin durumu değiştirilemez.");
        }

        if (newStatus == OrderStatus.CANCELLED && oldStatus != OrderStatus.CANCELLED) {
            log.info("Sipariş iptal ediliyor, stoklar iade ediliyor. Sipariş ID: {}", orderId);
            stockService.revertStockLevels(order.getOrderItems());
        }

        order.setOrderStatus(newStatus);
        orderRepository.save(order);
        log.info("Sipariş durumu güncellendi: {} -> {}", oldStatus, newStatus);

        Long currentUserId = com.mehmetkerem.util.SecurityUtils.getCurrentUserId();
        orderTimelineService.recordStatusChange(orderId, oldStatus, newStatus, currentUserId);

        activityLogService.log(ActivityType.ORDER_STATUS_UPDATED, currentUserId, "Sipariş durumu güncellendi: #" + orderId + " -> " + newStatus);

        // Event yayınla — bildirimler Transaction COMMIT sonrası
        UserResponse user = userService.getUserResponseById(order.getUserId());
        eventPublisher.publishEvent(OrderEvent.builder()
                .type(OrderEventType.STATUS_UPDATED)
                .orderId(orderId)
                .userId(order.getUserId())
                .userEmail(user.getEmail())
                .orderCode("ORD-" + orderId)
                .oldStatus(oldStatus)
                .newStatus(newStatus)
                .build());

        return toOrderResponse(order);
    }

    @Transactional
    @Override
    public void updatePaymentStatus(Long orderId, com.mehmetkerem.enums.PaymentStatus newStatus) {
        Order order = getOrderById(orderId);
        order.setPaymentStatus(newStatus);
        orderRepository.save(order);
    }

    @Override
    public String deleteOrder(Long orderId) {
        orderRepository.delete(getOrderById(orderId));
        return String.format(Messages.DELETE_VALUE, orderId, "sipariş");
    }

    @Override
    @Transactional
    public OrderResponse updateOrderTracking(Long orderId, String trackingNumber, String carrierName) {
        Order order = getOrderById(orderId);
        order.setTrackingNumber(trackingNumber);
        order.setCarrierName(carrierName);
        order.setLastUpdated(LocalDateTime.now());

        if (order.getOrderStatus() == OrderStatus.PENDING || order.getOrderStatus() == OrderStatus.PAID) {
            order.setOrderStatus(OrderStatus.SHIPPED);
        }

        orderRepository.save(order);

        // Event yayınla — bildirimler Transaction COMMIT sonrası
        UserResponse user = userService.getUserResponseById(order.getUserId());
        eventPublisher.publishEvent(OrderEvent.builder()
                .type(OrderEventType.TRACKING_UPDATED)
                .orderId(orderId)
                .userId(order.getUserId())
                .userEmail(user.getEmail())
                .orderCode("ORD-" + orderId)
                .trackingNumber(trackingNumber)
                .carrierName(carrierName)
                .build());

        return toOrderResponse(order);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Sipariş İptali
    // ══════════════════════════════════════════════════════════════════════════

    @Override
    @Transactional
    public OrderResponse cancelOrder(Long orderId, Long userId) {
        Order order = getOrderById(orderId);
        orderAuthorizationService.assertOwner(order, userId);
        if (order.getOrderStatus() != OrderStatus.PENDING && order.getOrderStatus() != OrderStatus.PAID) {
            throw new BadRequestException("Sadece bekleyen veya ödenen siparişler iptal edilebilir.");
        }
        OrderResponse response = updateOrderStatus(orderId, OrderStatus.CANCELLED);
        activityLogService.log(ActivityType.ORDER_CANCELLED, userId, "Sipariş iptal edildi: #" + orderId);
        return response;
    }

    @Override
    @Transactional
    public void revertStockForOrder(Long orderId) {
        Order order = getOrderById(orderId);
        stockService.revertStockLevels(order.getOrderItems());
        log.info("Sipariş stokları iade edildi. Sipariş ID: {}", orderId);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Fatura & Timeline (delege)
    // ══════════════════════════════════════════════════════════════════════════

    @Override
    public OrderInvoiceResponse getOrderInvoice(Long orderId) {
        return orderInvoiceService.buildInvoice(getOrderById(orderId));
    }

    @Override
    public List<com.mehmetkerem.dto.response.OrderStatusHistoryResponse> getOrderTimeline(Long orderId) {
        Order order = getOrderById(orderId);
        orderAuthorizationService.assertOwnerOrAdmin(order);
        return orderTimelineService.getTimeline(order);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Private Helper
    // ══════════════════════════════════════════════════════════════════════════

    private Page<OrderResponse> toOrderResponsePage(Page<Order> orders) {
        List<Order> content = orders.getContent();
        if (content.isEmpty()) {
            return new PageImpl<>(List.of(), orders.getPageable(), orders.getTotalElements());
        }

        List<Long> userIds = content.stream()
                .map(Order::getUserId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        Map<Long, UserResponse> userMap = userService.getUserResponsesByIds(userIds);

        List<OrderResponse> mapped = content.stream()
                .map(order -> toOrderResponse(order, userMap.get(order.getUserId())))
                .toList();

        return new PageImpl<>(mapped, orders.getPageable(), orders.getTotalElements());
    }

    private OrderResponse toOrderResponse(Order order) {
        return toOrderResponse(order, null);
    }

    private OrderResponse toOrderResponse(Order order, UserResponse preloadedUser) {
        UserResponse user = preloadedUser != null ? preloadedUser : userService.getUserResponseById(order.getUserId());
        OrderResponse resp = orderMapper.toResponse(order);
        resp.setUser(user);
        resp.setShippingAddress(addressMapper.toResponse(order.getShippingAddress()));
        resp.setOrderItems(orderMapper.orderItemsToResponses(order.getOrderItems()));
        return resp;
    }
}
