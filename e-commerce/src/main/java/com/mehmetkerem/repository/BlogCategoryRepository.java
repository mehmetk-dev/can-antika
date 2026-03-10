package com.mehmetkerem.repository;

import com.mehmetkerem.model.BlogCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BlogCategoryRepository extends JpaRepository<BlogCategory, Long> {
    List<BlogCategory> findByActiveTrue();
}
