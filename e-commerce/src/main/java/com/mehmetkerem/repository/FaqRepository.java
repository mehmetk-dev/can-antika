package com.mehmetkerem.repository;

import com.mehmetkerem.model.FaqItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FaqRepository extends JpaRepository<FaqItem, Long> {
    List<FaqItem> findByActiveTrueOrderBySortOrderAsc();
}
