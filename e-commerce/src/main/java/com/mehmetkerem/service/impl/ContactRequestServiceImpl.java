package com.mehmetkerem.service.impl;

import com.mehmetkerem.exception.NotFoundException;
import com.mehmetkerem.model.ContactRequest;
import com.mehmetkerem.repository.ContactRequestRepository;
import com.mehmetkerem.service.IContactRequestService;
import com.mehmetkerem.service.INotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ContactRequestServiceImpl implements IContactRequestService {

    private final ContactRequestRepository repository;
    private final INotificationService notificationService;
    private final com.mehmetkerem.service.IInAppNotificationService inAppNotificationService;

    @Override
    public ContactRequest submitRequest(ContactRequest request) {
        ContactRequest saved = repository.save(request);
        notificationService.sendContactFormNotification(
                saved.getName(),
                saved.getEmail(),
                (saved.getPhone() != null && !saved.getPhone().isBlank()) ? saved.getPhone() : "Belirtilmedi",
                saved.getMessage()
        );
        try {
            String message = saved.getMessage();
            String truncated = message.length() > 120 ? message.substring(0, 120) + "..." : message;
            inAppNotificationService.createForAdmins(
                    "Yeni İletişim Formu: " + saved.getName(),
                    saved.getName() + " tarafından form gönderildi: " + truncated,
                    "NEW_CONTACT",
                    saved.getId());
        } catch (Exception e) {
            // Form kaydedildi, bildirim başarısız olsa da kullanıcıya hata döndürme
        }
        return saved;
    }

    @Override
    public Page<ContactRequest> getAll(int page, int size) {
        return repository.findAllByOrderByCreatedAtDesc(
                com.mehmetkerem.util.PageRequestUtils.of(page, size));
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
