package com.mehmetkerem.repository;

import com.mehmetkerem.enums.Role;
import com.mehmetkerem.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    // Enhanced stats queries
    long countByRole(Role role);

    long countByCreatedAtAfter(LocalDateTime date);

    long countByRoleAndCreatedAtAfter(Role role, LocalDateTime date);

    // Admin: paginated user list
    Page<User> findByRole(Role role, Pageable pageable);
}
