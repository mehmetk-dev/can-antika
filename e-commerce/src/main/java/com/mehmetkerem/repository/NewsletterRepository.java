package com.mehmetkerem.repository;

import com.mehmetkerem.model.NewsletterSubscriber;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface NewsletterRepository extends JpaRepository<NewsletterSubscriber, Long> {

    Optional<NewsletterSubscriber> findByEmail(String email);

    boolean existsByEmail(String email);

    Page<NewsletterSubscriber> findByActiveTrue(Pageable pageable);

    long countByActiveTrue();
}
