package com.mehmetkerem.repository;

import com.mehmetkerem.model.ContactRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ContactRequestRepository extends JpaRepository<ContactRequest, Long> {
    Page<ContactRequest> findAllByOrderByCreatedAtDesc(Pageable pageable);
    long countByReadFalse();
}
