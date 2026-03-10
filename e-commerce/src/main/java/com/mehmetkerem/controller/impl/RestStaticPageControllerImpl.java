package com.mehmetkerem.controller.impl;

import com.mehmetkerem.controller.IRestStaticPageController;
import com.mehmetkerem.dto.request.StaticPageRequest;
import com.mehmetkerem.dto.response.StaticPageResponse;
import com.mehmetkerem.model.StaticPage;
import com.mehmetkerem.service.IStaticPageService;
import com.mehmetkerem.util.Result;
import com.mehmetkerem.util.ResultData;
import com.mehmetkerem.util.ResultHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.annotation.Secured;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class RestStaticPageControllerImpl implements IRestStaticPageController {

    private final IStaticPageService staticPageService;

    private StaticPageResponse toResponse(StaticPage p) {
        return StaticPageResponse.builder()
                .id(p.getId()).title(p.getTitle()).slug(p.getSlug())
                .content(p.getContent()).active(p.isActive())
                .createdAt(p.getCreatedAt()).updatedAt(p.getUpdatedAt()).build();
    }

    private StaticPage toEntity(StaticPageRequest req) {
        StaticPage p = new StaticPage();
        p.setTitle(req.getTitle());
        p.setSlug(req.getSlug());
        p.setContent(req.getContent());
        p.setActive(req.isActive());
        return p;
    }

    @Override
    @GetMapping("/v1/pages/{slug}")
    public ResultData<StaticPageResponse> getBySlug(@PathVariable String slug) {
        StaticPage page = staticPageService.getBySlug(slug);
        if (page == null) {
            return new ResultData<>(false, "Sayfa bulunamadı", "404", null);
        }
        return ResultHelper.success(toResponse(page));
    }

    @Override
    @GetMapping("/v1/pages")
    public ResultData<List<StaticPageResponse>> getActivePages() {
        return ResultHelper.success(staticPageService.getActivePages().stream().map(this::toResponse).toList());
    }

    @Override
    @Secured("ROLE_ADMIN")
    @GetMapping("/v1/admin/pages")
    public ResultData<List<StaticPageResponse>> getAllPages() {
        return ResultHelper.success(staticPageService.getAllPages().stream().map(this::toResponse).toList());
    }

    @Override
    @Secured("ROLE_ADMIN")
    @PostMapping("/v1/admin/pages")
    public ResultData<StaticPageResponse> createPage(@RequestBody StaticPageRequest req) {
        return ResultHelper.success(toResponse(staticPageService.savePage(toEntity(req))));
    }

    @Override
    @Secured("ROLE_ADMIN")
    @PutMapping("/v1/admin/pages/{id}")
    public ResultData<StaticPageResponse> updatePage(@PathVariable Long id, @RequestBody StaticPageRequest req) {
        return ResultHelper.success(toResponse(staticPageService.updatePage(id, toEntity(req))));
    }

    @Override
    @Secured("ROLE_ADMIN")
    @DeleteMapping("/v1/admin/pages/{id}")
    public Result deletePage(@PathVariable Long id) {
        staticPageService.deletePage(id);
        return ResultHelper.ok();
    }
}

