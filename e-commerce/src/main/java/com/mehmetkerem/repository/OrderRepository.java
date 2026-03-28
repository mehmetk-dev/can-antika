package com.mehmetkerem.repository;

import com.mehmetkerem.model.Order;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long>, JpaSpecificationExecutor<Order> {
        List<Order> findByUserId(Long userId);

        Page<Order> findByUserId(Long userId, Pageable pageable);

        @Override
        Page<Order> findAll(Pageable pageable);

        @Override
        Page<Order> findAll(Specification<Order> spec, Pageable pageable);

        boolean existsByUserIdAndOrderItemsProductId(Long userId, Long productId);

        @Query("SELECT SUM(o.totalAmount) FROM Order o")
        BigDecimal calculateTotalRevenue();

        @Query("SELECT COUNT(o) FROM Order o")
        long countTotalOrders();

        @Query(value = "SELECT TO_CHAR(order_date, 'YYYY-MM-DD') as date, SUM(total_amount) as revenue, COUNT(*) as count "
                        +
                        "FROM orders WHERE order_date >= :startDate " +
                        "GROUP BY TO_CHAR(order_date, 'YYYY-MM-DD') ORDER BY date ASC", nativeQuery = true)
        List<Object[]> getDailyStats(
                        @org.springframework.data.repository.query.Param("startDate") java.time.LocalDateTime startDate);

        @Query("SELECT o FROM Order o WHERE o.orderStatus = 'PENDING' AND o.orderDate < :cutoff")
        List<Order> findExpiredPendingOrders(
                        @org.springframework.data.repository.query.Param("cutoff") java.time.LocalDateTime cutoff);

        @Query(value = "SELECT oi.product_id, oi.title, SUM(oi.quantity) as total_sold, SUM(oi.price * oi.quantity) as total_revenue "
                        + "FROM order_items oi GROUP BY oi.product_id, oi.title ORDER BY total_sold DESC LIMIT :limit", nativeQuery = true)
        List<Object[]> getTopSellingProducts(@org.springframework.data.repository.query.Param("limit") int limit);

        @Query(value = "SELECT o.user_id, u.name, u.email, COUNT(o.id) as order_count, SUM(o.total_amount) as total_spent, u.created_at "
                        + "FROM orders o JOIN users u ON o.user_id = u.id "
                        + "GROUP BY o.user_id, u.name, u.email, u.created_at ORDER BY total_spent DESC LIMIT :limit", nativeQuery = true)
        List<Object[]> getTopCustomers(@org.springframework.data.repository.query.Param("limit") int limit);

        @Query(value = "SELECT c.id, c.name, COALESCE(SUM(oi.quantity), 0), COALESCE(SUM(oi.price * oi.quantity), 0) "
                        + "FROM categories c "
                        + "LEFT JOIN products p ON p.category_id = c.id AND p.deleted = false "
                        + "LEFT JOIN order_items oi ON oi.product_id = p.id "
                        + "WHERE c.deleted = false "
                        + "GROUP BY c.id, c.name ORDER BY COALESCE(SUM(oi.price * oi.quantity), 0) DESC", nativeQuery = true)
        List<Object[]> getSalesByCategory();

        @Query(value = "SELECT TO_CHAR(order_date, 'YYYY-MM') as month, SUM(total_amount) as revenue, COUNT(*) as count "
                        + "FROM orders WHERE order_date >= :startDate "
                        + "GROUP BY TO_CHAR(order_date, 'YYYY-MM') ORDER BY month ASC", nativeQuery = true)
        List<Object[]> getMonthlyRevenue(
                        @org.springframework.data.repository.query.Param("startDate") java.time.LocalDateTime startDate);

        long countByOrderStatus(com.mehmetkerem.enums.OrderStatus orderStatus);

        @Lock(LockModeType.PESSIMISTIC_WRITE)
        @Query("SELECT o FROM Order o WHERE o.id = :id")
        Optional<Order> findByIdForUpdate(@Param("id") Long id);
}
