package com.mehmetkerem.service;

import com.mehmetkerem.model.Order;

public interface IOrderAuthorizationService {

    /** Sipariş sahibi kontrolü — userId eşleşmezse BadRequestException fırlatır. */
    void assertOwner(Order order, Long userId);

    /** Sipariş sahibi VEYA admin kontrolü — SecurityContext'ten alır. */
    void assertOwnerOrAdmin(Order order);
}
