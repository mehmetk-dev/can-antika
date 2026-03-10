package com.mehmetkerem.repository;

import com.mehmetkerem.model.Cart;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface CartRepository extends JpaRepository<Cart, Long> {
    Optional<Cart> findByUserId(Long userId);

    // Abandoned carts: has items and hasn't been updated since the threshold
    @Query("SELECT c FROM Cart c WHERE c.items IS NOT EMPTY AND c.updatedAt < :threshold ORDER BY c.updatedAt DESC")
    Page<Cart> findAbandonedCarts(@Param("threshold") LocalDateTime threshold, Pageable pageable);

    @Query("SELECT COUNT(c) FROM Cart c WHERE c.items IS NOT EMPTY AND c.updatedAt < :threshold")
    long countAbandonedCarts(@Param("threshold") LocalDateTime threshold);
}
