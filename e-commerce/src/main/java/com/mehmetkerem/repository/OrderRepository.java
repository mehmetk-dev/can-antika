package com.mehmetkerem.repository;

import com.mehmetkerem.model.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long>, JpaSpecificationExecutor<Order> {
        List<Order> findByUserId(Long userId);

        Page<Order> findByUserId(Long userId, Pageable pageable);

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

        @Query(value = "SELECT o.user_id, u.name, u.email, COUNT(o.id) as order_count, SUM(o.total_amount) as total_spent "
                        + "FROM orders o JOIN users u ON o.user_id = u.id "
                        + "GROUP BY o.user_id, u.name, u.email ORDER BY total_spent DESC LIMIT :limit", nativeQuery = true)
        List<Object[]> getTopCustomers(@org.springframework.data.repository.query.Param("limit") int limit);

        @Query(value = "SELECT TO_CHAR(order_date, 'YYYY-MM') as month, SUM(total_amount) as revenue, COUNT(*) as count "
                        + "FROM orders WHERE order_date >= :startDate "
                        + "GROUP BY TO_CHAR(order_date, 'YYYY-MM') ORDER BY month ASC", nativeQuery = true)
        List<Object[]> getMonthlyRevenue(
                        @org.springframework.data.repository.query.Param("startDate") java.time.LocalDateTime startDate);
}
