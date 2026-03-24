package com.mehmetkerem.repository;

import com.mehmetkerem.model.Period;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PeriodRepository extends JpaRepository<Period, Long> {
    Optional<Period> findByNameIgnoreCase(String name);

    List<Period> findByActiveTrueOrderByNameAsc();
}
