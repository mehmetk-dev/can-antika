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
        var existing = repository.findByEmail(email);
        if (existing.isPresent()) {
            var sub = existing.get();
            sub.setActive(true);
            if (name != null && !name.isBlank()) sub.setName(name);
            return repository.save(sub);
        }
        return repository.save(NewsletterSubscriber.builder()
                .email(email)
                .name(name)
                .build());
    }

    public void unsubscribe(String email) {
        repository.findByEmail(email).ifPresent(sub -> {
            sub.setActive(false);
            repository.save(sub);
        });
    }

    public Page<NewsletterSubscriber> getAll(int page, int size) {
        return repository.findAll(PageRequest.of(page, size, Sort.by("subscribedAt").descending()));
    }

    public Page<NewsletterSubscriber> getActive(int page, int size) {
        return repository.findByActiveTrue(PageRequest.of(page, size));
    }

    public long getActiveCount() {
        return repository.countByActiveTrue();
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }
}
