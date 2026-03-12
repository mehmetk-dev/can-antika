package com.mehmetkerem.service.impl;

import com.mehmetkerem.dto.request.OrderReturnRequest;
import com.mehmetkerem.dto.response.OrderReturnResponse;
import com.mehmetkerem.enums.ReturnStatus;
import com.mehmetkerem.exception.BadRequestException;
import com.mehmetkerem.exception.ExceptionMessages;
import com.mehmetkerem.exception.NotFoundException;
import com.mehmetkerem.mapper.OrderReturnMapper;
import com.mehmetkerem.model.Order;
import com.mehmetkerem.model.OrderReturn;
import com.mehmetkerem.repository.OrderReturnRepository;
import com.mehmetkerem.service.IOrderReturnService;
import com.mehmetkerem.service.IOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderReturnServiceImpl implements IOrderReturnService {

    private final OrderReturnRepository orderReturnRepository;
    private final IOrderService orderService;
    private final OrderReturnMapper orderReturnMapper;
    private final com.mehmetkerem.service.IOrderAuthorizationService orderAuthorizationService;

    @Override
    @Transactional
    public OrderReturnResponse createReturn(Long userId, OrderReturnRequest request) {
        Order order = orderService.getOrderById(request.getOrderId());
        orderAuthorizationService.assertOwner(order, userId);
        boolean hasPending = orderReturnRepository.existsByOrderIdAndUserIdAndStatus(
                request.getOrderId(), userId, ReturnStatus.PENDING);
        if (hasPending) {
            throw new BadRequestException("Bu sipariş için zaten bekleyen bir iade talebiniz var.");
        }

        OrderReturn orderReturn = OrderReturn.builder()
                .orderId(request.getOrderId())
                .userId(userId)
                .status(ReturnStatus.PENDING)
                .reason(request.getReason())
                .createdAt(LocalDateTime.now())
                .build();
        orderReturn = orderReturnRepository.save(orderReturn);
        return orderReturnMapper.toResponse(orderReturn);
    }

    @Override
    public List<OrderReturnResponse> getReturnsByUser(Long userId) {
        return orderReturnRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(orderReturnMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<OrderReturnResponse> getAllReturns() {
        return orderReturnRepository.findAll().stream()
                .map(orderReturnMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public OrderReturnResponse approve(Long returnId) {
        OrderReturn orderReturn = getById(returnId);
        if (orderReturn.getStatus() != ReturnStatus.PENDING) {
            throw new BadRequestException("Sadece bekleyen iade talepleri onaylanabilir.");
        }
        orderService.revertStockForOrder(orderReturn.getOrderId());
        orderReturn.setStatus(ReturnStatus.APPROVED);
        orderReturn.setProcessedAt(LocalDateTime.now());
        orderReturn = orderReturnRepository.save(orderReturn);
        return orderReturnMapper.toResponse(orderReturn);
    }

    @Override
    @Transactional
    public OrderReturnResponse reject(Long returnId) {
        OrderReturn orderReturn = getById(returnId);
        if (orderReturn.getStatus() != ReturnStatus.PENDING) {
            throw new BadRequestException("Sadece bekleyen iade talepleri reddedilebilir.");
        }
        orderReturn.setStatus(ReturnStatus.REJECTED);
        orderReturn.setProcessedAt(LocalDateTime.now());
        orderReturn = orderReturnRepository.save(orderReturn);
        return orderReturnMapper.toResponse(orderReturn);
    }

    private OrderReturn getById(Long id) {
        return orderReturnRepository.findById(id)
                .orElseThrow(
                        () -> new NotFoundException(String.format(ExceptionMessages.NOT_FOUND, id, "iade talebi")));
    }
}
