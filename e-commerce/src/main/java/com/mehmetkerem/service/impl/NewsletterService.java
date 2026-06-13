package com.mehmetkerem.service.impl;

import com.mehmetkerem.model.NewsletterSubscriber;
import com.mehmetkerem.repository.NewsletterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class NewsletterService implements com.mehmetkerem.service.INewsletterService {

    private final NewsletterRepository repository;

    public NewsletterSubscriber subscribe(String email, String name) {
        String normalizedEmail = email.trim().toLowerCase(java.util.Locale.ROOT);
        String normalizedName = name == null ? "" : name.trim();
        var existing = repository.findByEmail(normalizedEmail);
        if (existing.isPresent()) {
            var sub = existing.get();
            sub.setActive(true);
            if (!normalizedName.isBlank()) sub.setName(normalizedName);
            return repository.save(sub);
        }
        return repository.save(NewsletterSubscriber.builder()
                .email(normalizedEmail)
                .name(normalizedName)
                .build());
    }

    public void unsubscribe(String email) {
        repository.findByEmail(email.trim().toLowerCase(java.util.Locale.ROOT)).ifPresent(sub -> {
            sub.setActive(false);
            repository.save(sub);
        });
    }

    public Page<NewsletterSubscriber> getAll(int page, int size) {
        return repository.findAll(com.mehmetkerem.util.PageRequestUtils.of(
                page, size, Sort.by("subscribedAt").descending()));
    }

    public Page<NewsletterSubscriber> getActive(int page, int size) {
        return repository.findByActiveTrue(com.mehmetkerem.util.PageRequestUtils.of(page, size));
    }

    public long getActiveCount() {
        return repository.countByActiveTrue();
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }
}
