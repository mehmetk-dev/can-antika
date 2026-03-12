package com.mehmetkerem.service.impl;

import com.mehmetkerem.dto.response.OrderStatusHistoryResponse;
import com.mehmetkerem.enums.OrderStatus;
import com.mehmetkerem.model.Order;
import com.mehmetkerem.model.OrderStatusHistory;
import com.mehmetkerem.repository.OrderStatusHistoryRepository;
import com.mehmetkerem.service.IOrderTimelineService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Sipariş durum geçmişi (timeline) yönetimi.
 */
@Service
@RequiredArgsConstructor
public class OrderTimelineService implements IOrderTimelineService {

    private final OrderStatusHistoryRepository orderStatusHistoryRepository;
    private final com.mehmetkerem.service.IOrderAuthorizationService orderAuthorizationService;

    /**
     * Sipariş oluşturulduğunda ilk timeline kaydını oluşturur.
     */
    @Override
    public void recordCreation(Long orderId, Long userId) {
        orderStatusHistoryRepository.save(
                OrderStatusHistory.builder()
                        .orderId(orderId)
                        .oldStatus(null)
                        .newStatus(OrderStatus.PENDING)
                        .changedBy(userId)
                        .changedAt(LocalDateTime.now())
                        .note("Sipariş oluşturuldu")
                        .build());
    }

    /**
     * Durum değişikliğinde timeline kaydı oluşturur.
     */
    @Override
    public void recordStatusChange(Long orderId, OrderStatus oldStatus, OrderStatus newStatus, Long changedBy) {
        orderStatusHistoryRepository.save(
                OrderStatusHistory.builder()
                        .orderId(orderId)
                        .oldStatus(oldStatus)
                        .newStatus(newStatus)
                        .changedBy(changedBy)
                        .build());
    }

    /**
     * Sipariş durum geçmişini getirir.
     * Yetkilendirme: sipariş sahibi veya admin görebilir.
     */
    @Override
    public List<OrderStatusHistoryResponse> getTimeline(Order order) {
        orderAuthorizationService.assertOwnerOrAdmin(order);

        return orderStatusHistoryRepository.findByOrderIdOrderByChangedAtAsc(order.getId())
                .stream()
                .map(h -> OrderStatusHistoryResponse.builder()
                        .id(h.getId())
                        .oldStatus(h.getOldStatus())
                        .newStatus(h.getNewStatus())
                        .changedBy(h.getChangedBy())
                        .note(h.getNote())
                        .changedAt(h.getChangedAt())
                        .build())
                .toList();
    }
}
