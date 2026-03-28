package com.mehmetkerem.repository;

import com.mehmetkerem.model.StaticPage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StaticPageRepository extends JpaRepository<StaticPage, Long> {
    Optional<StaticPage> findBySlugAndActiveTrue(String slug);
    boolean existsBySlug(String slug);

    List<StaticPage> findByActiveTrueOrderByTitleAsc();
}
