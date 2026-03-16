package com.mehmetkerem.controller.impl;

import com.mehmetkerem.controller.IRestFaqController;
import com.mehmetkerem.model.FaqItem;
import com.mehmetkerem.service.IFaqService;
import com.mehmetkerem.util.Result;
import com.mehmetkerem.util.ResultData;
import com.mehmetkerem.util.ResultHelper;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.annotation.Secured;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class RestFaqControllerImpl implements IRestFaqController {

    private final IFaqService faqService;

    private com.mehmetkerem.dto.response.FaqItemResponse toResponse(FaqItem item) {
        return com.mehmetkerem.dto.response.FaqItemResponse.builder()
                .id(item.getId())
                .question(item.getQuestion())
                .answer(item.getAnswer())
                .displayOrder(item.getSortOrder())
                .active(item.isActive())
                .build();
    }

    private FaqItem toEntity(com.mehmetkerem.dto.request.FaqItemRequest request) {
        FaqItem entity = new FaqItem();
        entity.setQuestion(request.getQuestion());
        entity.setAnswer(request.getAnswer());
        entity.setSortOrder(request.getDisplayOrder());
        entity.setActive(request.isActive());
        return entity;
    }

    @Override
    @GetMapping("/v1/faq")
    public ResultData<List<com.mehmetkerem.dto.response.FaqItemResponse>> getActiveFaqs() {
        return ResultHelper.success(faqService.getActiveFaqs().stream().map(this::toResponse).toList());
    }

    @Override
    @Secured("ROLE_ADMIN")
    @GetMapping("/v1/admin/faq")
    public ResultData<List<com.mehmetkerem.dto.response.FaqItemResponse>> getAllFaqs() {
        return ResultHelper.success(faqService.getAllFaqs().stream().map(this::toResponse).toList());
    }

    @Override
    @Secured("ROLE_ADMIN")
    @PostMapping("/v1/admin/faq")
    public ResultData<com.mehmetkerem.dto.response.FaqItemResponse> createFaq(@Valid @RequestBody com.mehmetkerem.dto.request.FaqItemRequest request) {
        return ResultHelper.success(toResponse(faqService.saveFaq(toEntity(request))));
    }

    @Override
    @Secured("ROLE_ADMIN")
    @PutMapping("/v1/admin/faq/{id}")
    public ResultData<com.mehmetkerem.dto.response.FaqItemResponse> updateFaq(@PathVariable Long id, @Valid @RequestBody com.mehmetkerem.dto.request.FaqItemRequest request) {
        return ResultHelper.success(toResponse(faqService.updateFaq(id, toEntity(request))));
    }

    @Override
    @Secured("ROLE_ADMIN")
    @DeleteMapping("/v1/admin/faq/{id}")
    public Result deleteFaq(@PathVariable Long id) {
        faqService.deleteFaq(id);
        return ResultHelper.ok();
    }
}
