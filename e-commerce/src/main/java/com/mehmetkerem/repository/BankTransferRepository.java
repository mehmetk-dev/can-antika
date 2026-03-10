package com.mehmetkerem.repository;

import com.mehmetkerem.model.BankTransfer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BankTransferRepository extends JpaRepository<BankTransfer, Long> {
    Page<BankTransfer> findAllByOrderByCreatedAtDesc(Pageable pageable);
    Page<BankTransfer> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);
    long countByStatus(String status);
}
