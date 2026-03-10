package com.mehmetkerem.service.impl;

import com.mehmetkerem.exception.NotFoundException;
import com.mehmetkerem.model.StaticPage;
import com.mehmetkerem.repository.StaticPageRepository;
import com.mehmetkerem.service.IStaticPageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StaticPageServiceImpl implements IStaticPageService {

    private final StaticPageRepository pageRepository;

    @Override
    public StaticPage getBySlug(String slug) {
        return pageRepository.findBySlugAndActiveTrue(slug).orElse(null);
    }

    @Override
    public List<StaticPage> getActivePages() {
        return pageRepository.findByActiveTrueOrderByTitleAsc();
    }

    @Override
    public List<StaticPage> getAllPages() {
        return pageRepository.findAll();
    }

    @Override
    public StaticPage savePage(StaticPage page) {
        if (page.getSlug() == null || page.getSlug().isBlank()) {
            page.setSlug(slugify(page.getTitle()));
        }
        return pageRepository.save(page);
    }

    @Override
    public StaticPage updatePage(Long id, StaticPage page) {
        StaticPage existing = pageRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Sayfa bulunamadı: " + id));
        existing.setTitle(page.getTitle());
        existing.setSlug(page.getSlug() != null && !page.getSlug().isBlank() ? page.getSlug() : slugify(page.getTitle()));
        existing.setContent(page.getContent());
        existing.setActive(page.isActive());
        return pageRepository.save(existing);
    }

    @Override
    public void deletePage(Long id) {
        pageRepository.deleteById(id);
    }

    private String slugify(String text) {
        if (text == null) return "";
        return text.toLowerCase()
                .replaceAll("[çÇ]", "c").replaceAll("[şŞ]", "s")
                .replaceAll("[ıİ]", "i").replaceAll("[ğĞ]", "g")
                .replaceAll("[üÜ]", "u").replaceAll("[öÖ]", "o")
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .replaceAll("(^-|-$)", "");
    }
}
