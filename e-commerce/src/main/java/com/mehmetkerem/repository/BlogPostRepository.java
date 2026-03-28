package com.mehmetkerem.repository;

import com.mehmetkerem.model.BlogPost;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface BlogPostRepository extends JpaRepository<BlogPost, Long> {
    Page<BlogPost> findByPublishedTrueOrderByCreatedAtDesc(Pageable pageable);
    Optional<BlogPost> findBySlug(String slug);
    boolean existsBySlug(String slug);
    Page<BlogPost> findByCategoryIdAndPublishedTrueOrderByCreatedAtDesc(Long categoryId, Pageable pageable);
}
