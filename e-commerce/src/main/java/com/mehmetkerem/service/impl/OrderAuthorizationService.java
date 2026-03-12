package com.mehmetkerem.service.impl;

import com.mehmetkerem.enums.Role;
import com.mehmetkerem.exception.BadRequestException;
import com.mehmetkerem.model.Order;
import com.mehmetkerem.model.User;
import com.mehmetkerem.service.IOrderAuthorizationService;
import com.mehmetkerem.util.SecurityUtils;
import org.springframework.stereotype.Service;

@Service
public class OrderAuthorizationService implements IOrderAuthorizationService {

    @Override
    public void assertOwner(Order order, Long userId) {
        if (!order.getUserId().equals(userId)) {
            throw new BadRequestException("Bu sipariş size ait değil.");
        }
    }

    @Override
    public void assertOwnerOrAdmin(Order order) {
        Long currentUserId = SecurityUtils.getCurrentUserId();
        User currentUser = SecurityUtils.getCurrentUser();
        boolean isOwner = currentUserId != null && order.getUserId().equals(currentUserId);
        boolean isAdmin = currentUser != null && currentUser.getRole() == Role.ADMIN;
        if (!isOwner && !isAdmin) {
            throw new BadRequestException("Bu siparişe erişim yetkiniz yok.");
        }
    }
}
