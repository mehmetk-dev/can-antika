package com.mehmetkerem.repository;

import com.mehmetkerem.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {

    List<Product> findByIdIn(List<Long> ids);

    List<Product> findByTitleContainingIgnoreCase(String title);
    List<Product> findTop50ByTitleContainingIgnoreCase(String title);

    List<Product> findByCategoryId(Long categoryId);
    List<Product> findTop200ByCategoryId(Long categoryId);

    List<Product> findByPeriodId(Long periodId);
    List<Product> findTop500ByOrderByIdDesc();

    boolean existsByCategoryId(Long categoryId);

    boolean existsByPeriodId(Long periodId);

    long countByStockLessThan(int threshold);

    List<Product> findByStockLessThanEqualOrderByStockAsc(int threshold);

    Optional<Product> findBySlug(String slug);

    boolean existsBySlug(String slug);

    @Modifying
    @Query("UPDATE Product p SET p.viewCount = COALESCE(p.viewCount, 0) + 1 WHERE p.id = :id")
    void incrementViewCount(@Param("id") Long id);

    @Query("SELECT p.categoryId, COUNT(p.id) FROM Product p WHERE p.categoryId IS NOT NULL GROUP BY p.categoryId")
    List<Object[]> countProductsByCategoryId();
}
