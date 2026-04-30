package com.mehmetkerem.repository;

import com.mehmetkerem.enums.ReturnStatus;
import com.mehmetkerem.model.OrderReturn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface OrderReturnRepository extends JpaRepository<OrderReturn, Long> {

    List<OrderReturn> findByUserIdOrderByCreatedAtDesc(Long userId);

    boolean existsByOrderIdAndUserIdAndStatus(Long orderId, Long userId, ReturnStatus status);

    boolean existsByOrderIdAndUserIdAndStatusIn(
            Long orderId,
            Long userId,
            Collection<ReturnStatus> statuses);

    long countByStatus(ReturnStatus status);
}
