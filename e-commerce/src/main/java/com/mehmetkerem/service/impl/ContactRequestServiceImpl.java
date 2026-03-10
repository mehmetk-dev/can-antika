package com.mehmetkerem.service.impl;

import com.mehmetkerem.exception.NotFoundException;
import com.mehmetkerem.model.ContactRequest;
import com.mehmetkerem.repository.ContactRequestRepository;
import com.mehmetkerem.service.IContactRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ContactRequestServiceImpl implements IContactRequestService {

    private final ContactRequestRepository repository;

    @Override
    public ContactRequest submitRequest(ContactRequest request) {
        return repository.save(request);
    }

    @Override
    public Page<ContactRequest> getAll(int page, int size) {
        return repository.findAllByOrderByCreatedAtDesc(PageRequest.of(page, size));
    }

    @Override
    public long getUnreadCount() {
        return repository.countByReadFalse();
    }

    @Override
    public ContactRequest updateRequest(Long id, ContactRequest request) {
        ContactRequest existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("İletişim talebi bulunamadı: " + id));
        existing.setRead(true);
        if (request.getAdminNote() != null) existing.setAdminNote(request.getAdminNote());
        return repository.save(existing);
    }

    @Override
    public void deleteRequest(Long id) {
        repository.deleteById(id);
    }
}
