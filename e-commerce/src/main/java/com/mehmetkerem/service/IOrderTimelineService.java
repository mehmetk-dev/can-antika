package com.mehmetkerem.service;

import com.mehmetkerem.dto.response.OrderStatusHistoryResponse;
import com.mehmetkerem.enums.OrderStatus;
import com.mehmetkerem.model.Order;

import java.util.List;

public interface IOrderTimelineService {

    /** Sipariş oluşturulduğunda ilk timeline kaydını oluşturur. */
    void recordCreation(Long orderId, Long userId);

    /** Durum değişikliğinde timeline kaydı oluşturur. */
    void recordStatusChange(Long orderId, OrderStatus oldStatus, OrderStatus newStatus, Long changedBy);

    /** Sipariş durum geçmişini getirir (yetkilendirme dahil). */
    List<OrderStatusHistoryResponse> getTimeline(Order order);
}
