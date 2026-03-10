package com.mehmetkerem.service;

import com.mehmetkerem.model.NewsletterSubscriber;
import org.springframework.data.domain.Page;

public interface INewsletterService {
    NewsletterSubscriber subscribe(String email, String name);
    void unsubscribe(String email);
    Page<NewsletterSubscriber> getAll(int page, int size);
    Page<NewsletterSubscriber> getActive(int page, int size);
    long getActiveCount();
    void delete(Long id);
}
