package com.mehmetkerem.controller.impl;

import com.mehmetkerem.controller.IRestPopupController;
import com.mehmetkerem.dto.request.PopupRequest;
import com.mehmetkerem.dto.response.PopupResponse;
import com.mehmetkerem.model.Popup;
import com.mehmetkerem.service.IPopupService;
import com.mehmetkerem.util.Result;
import com.mehmetkerem.util.ResultData;
import com.mehmetkerem.util.ResultHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.annotation.Secured;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class RestPopupControllerImpl implements IRestPopupController {

    private final IPopupService popupService;

    private PopupResponse toResponse(Popup p) {
        return PopupResponse.builder()
                .id(p.getId()).title(p.getTitle()).content(p.getContent())
                .imageUrl(p.getImageUrl()).linkUrl(p.getLinkUrl()).linkText(p.getLinkText())
                .active(p.isActive()).position(p.getPosition())
                .delaySeconds(p.getDelaySeconds()).showOnce(p.isShowOnce()).build();
    }

    private Popup toEntity(PopupRequest req) {
        Popup p = new Popup();
        p.setTitle(req.getTitle());
        p.setContent(req.getContent());
        p.setImageUrl(req.getImageUrl());
        p.setLinkUrl(req.getLinkUrl());
        p.setLinkText(req.getLinkText());
        p.setActive(req.isActive());
        p.setPosition(req.getPosition());
        p.setDelaySeconds(req.getDelaySeconds());
        p.setShowOnce(req.isShowOnce());
        return p;
    }

    @Override
    @GetMapping("/v1/popups/active")
    public ResultData<List<PopupResponse>> getActivePopups() {
        return ResultHelper.success(popupService.getActivePopups().stream().map(this::toResponse).toList());
    }

    @Override
    @Secured("ROLE_ADMIN")
    @GetMapping("/v1/admin/popups")
    public ResultData<List<PopupResponse>> getAllPopups() {
        return ResultHelper.success(popupService.getAllPopups().stream().map(this::toResponse).toList());
    }

    @Override
    @Secured("ROLE_ADMIN")
    @PostMapping("/v1/admin/popups")
    public ResultData<PopupResponse> createPopup(@jakarta.validation.Valid @RequestBody PopupRequest req) {
        return ResultHelper.success(toResponse(popupService.savePopup(toEntity(req))));
    }

    @Override
    @Secured("ROLE_ADMIN")
    @PutMapping("/v1/admin/popups/{id}")
    public ResultData<PopupResponse> updatePopup(@PathVariable Long id, @jakarta.validation.Valid @RequestBody PopupRequest req) {
        return ResultHelper.success(toResponse(popupService.updatePopup(id, toEntity(req))));
    }

    @Override
    @Secured("ROLE_ADMIN")
    @DeleteMapping("/v1/admin/popups/{id}")
    public Result deletePopup(@PathVariable Long id) {
        popupService.deletePopup(id);
        return ResultHelper.ok();
    }
}

