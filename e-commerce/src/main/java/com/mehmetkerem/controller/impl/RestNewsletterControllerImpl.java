package com.mehmetkerem.controller.impl;

import com.mehmetkerem.controller.IRestNewsletterController;
import com.mehmetkerem.dto.response.CursorResponse;
import com.mehmetkerem.dto.response.NewsletterSubscriberResponse;
import com.mehmetkerem.model.NewsletterSubscriber;
import com.mehmetkerem.service.INewsletterService;
import com.mehmetkerem.util.ResultData;
import com.mehmetkerem.util.ResultHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.security.access.annotation.Secured;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/v1/newsletter")
@RequiredArgsConstructor
public class RestNewsletterControllerImpl implements IRestNewsletterController {

    private final INewsletterService newsletterService;

    private NewsletterSubscriberResponse toResponse(NewsletterSubscriber s) {
        return NewsletterSubscriberResponse.builder()
                .id(s.getId()).email(s.getEmail()).name(s.getName())
                .active(s.isActive()).subscribedAt(s.getSubscribedAt()).build();
    }

    @Override
    @PostMapping("/subscribe")
    public ResultData<Map<String, String>> subscribe(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String name = body.getOrDefault("name", "");
        if (email == null || email.isBlank()) {
            return new ResultData<>(false, "E-posta adresi zorunludur", "400", null);
        }
        newsletterService.subscribe(email, name);
        return ResultHelper.success(Map.of("message", "Başarıyla abone oldunuz"));
    }

    @Override
    @PostMapping("/unsubscribe")
    public ResultData<Map<String, String>> unsubscribe(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            return new ResultData<>(false, "E-posta adresi zorunludur", "400", null);
        }
        newsletterService.unsubscribe(email);
        return ResultHelper.success(Map.of("message", "Abonelikten çıktınız"));
    }

    @Override
    @Secured("ROLE_ADMIN")
    @GetMapping("/admin")
    public ResultData<CursorResponse<NewsletterSubscriberResponse>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<NewsletterSubscriber> result = newsletterService.getAll(page, size);
        CursorResponse<NewsletterSubscriberResponse> cursor = new CursorResponse<>();
        cursor.setItems(result.getContent().stream().map(this::toResponse).toList());
        cursor.setTotalElement(result.getTotalElements());
        cursor.setPageNumber(result.getNumber());
        cursor.setPageSize(result.getSize());
        return ResultHelper.success(cursor);
    }

    @Override
    @Secured("ROLE_ADMIN")
    @GetMapping("/admin/count")
    public ResultData<Map<String, Long>> getCount() {
        return ResultHelper.success(Map.of("count", newsletterService.getActiveCount()));
    }

    @Override
    @Secured("ROLE_ADMIN")
    @DeleteMapping("/admin/{id}")
    public ResultData<Map<String, String>> delete(@PathVariable Long id) {
        newsletterService.delete(id);
        return ResultHelper.success(Map.of("message", "Abone silindi"));
    }
}

