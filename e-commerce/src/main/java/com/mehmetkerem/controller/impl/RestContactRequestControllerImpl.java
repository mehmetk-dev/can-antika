package com.mehmetkerem.controller.impl;

import com.mehmetkerem.controller.IRestContactRequestController;
import com.mehmetkerem.dto.request.ContactRequestDto;
import com.mehmetkerem.dto.response.ContactRequestResponse;
import com.mehmetkerem.dto.response.CursorResponse;
import com.mehmetkerem.model.ContactRequest;
import com.mehmetkerem.service.IContactRequestService;
import com.mehmetkerem.util.ResultData;
import com.mehmetkerem.util.ResultHelper;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.security.access.annotation.Secured;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
public class RestContactRequestControllerImpl implements IRestContactRequestController {

    private final IContactRequestService contactRequestService;

    private ContactRequestResponse toResponse(ContactRequest r) {
        return ContactRequestResponse.builder()
                .id(r.getId()).name(r.getName()).email(r.getEmail())
                .phone(r.getPhone()).subject(r.getSubject()).message(r.getMessage())
                .read(r.isRead()).adminNote(r.getAdminNote()).createdAt(r.getCreatedAt()).build();
    }

    private ContactRequest toEntity(ContactRequestDto dto) {
        ContactRequest r = new ContactRequest();
        r.setName(dto.getName());
        r.setEmail(dto.getEmail());
        r.setPhone(dto.getPhone());
        r.setSubject(dto.getSubject());
        r.setMessage(dto.getMessage());
        return r;
    }

    @Override
    @PostMapping("/v1/contact")
    public ResultData<Map<String, String>> submitContact(@Valid @RequestBody ContactRequestDto request) {
        contactRequestService.submitRequest(toEntity(request));
        return ResultHelper.success(Map.of("message", "Mesajınız gönderildi"));
    }

    @Override
    @Secured("ROLE_ADMIN")
    @GetMapping("/v1/admin/contact-requests")
    public ResultData<CursorResponse<ContactRequestResponse>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<ContactRequest> result = contactRequestService.getAll(page, size);
        CursorResponse<ContactRequestResponse> cursor = new CursorResponse<>();
        cursor.setItems(result.getContent().stream().map(this::toResponse).toList());
        cursor.setTotalElement(result.getTotalElements());
        cursor.setPageNumber(result.getNumber());
        cursor.setPageSize(result.getSize());
        return ResultHelper.success(cursor);
    }

    @Override
    @Secured("ROLE_ADMIN")
    @GetMapping("/v1/admin/contact-requests/unread-count")
    public ResultData<Map<String, Long>> getUnreadCount() {
        return ResultHelper.success(Map.of("count", contactRequestService.getUnreadCount()));
    }

    @Override
    @Secured("ROLE_ADMIN")
    @PutMapping("/v1/admin/contact-requests/{id}")
    public ResultData<ContactRequestResponse> updateRequest(@PathVariable Long id, @Valid @RequestBody ContactRequestDto req) {
        return ResultHelper.success(toResponse(contactRequestService.updateRequest(id, toEntity(req))));
    }

    @Override
    @Secured("ROLE_ADMIN")
    @DeleteMapping("/v1/admin/contact-requests/{id}")
    public ResultData<Map<String, String>> deleteRequest(@PathVariable Long id) {
        contactRequestService.deleteRequest(id);
        return ResultHelper.success(Map.of("message", "Silindi"));
    }
}

