package com.mehmetkerem.service;

import com.mehmetkerem.model.ContactRequest;
import org.springframework.data.domain.Page;

public interface IContactRequestService {
    ContactRequest submitRequest(ContactRequest request);
    Page<ContactRequest> getAll(int page, int size);
    long getUnreadCount();
    ContactRequest updateRequest(Long id, ContactRequest request);
    void deleteRequest(Long id);
}
