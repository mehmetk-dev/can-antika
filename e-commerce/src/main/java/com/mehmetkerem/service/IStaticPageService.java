package com.mehmetkerem.service;

import com.mehmetkerem.model.StaticPage;
import java.util.List;

public interface IStaticPageService {
    StaticPage getBySlug(String slug);
    List<StaticPage> getActivePages();
    List<StaticPage> getAllPages();
    StaticPage savePage(StaticPage page);
    StaticPage updatePage(Long id, StaticPage page);
    void deletePage(Long id);
}
