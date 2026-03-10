package com.mehmetkerem.service.impl;

import com.mehmetkerem.exception.NotFoundException;
import com.mehmetkerem.model.Popup;
import com.mehmetkerem.repository.PopupRepository;
import com.mehmetkerem.service.IPopupService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PopupServiceImpl implements IPopupService {

    private final PopupRepository repository;

    @Override
    public List<Popup> getActivePopups() {
        return repository.findByActiveTrue();
    }

    @Override
    public List<Popup> getAllPopups() {
        return repository.findAll();
    }

    @Override
    public Popup savePopup(Popup popup) {
        return repository.save(popup);
    }

    @Override
    public Popup updatePopup(Long id, Popup popup) {
        Popup existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("Popup bulunamadı: " + id));
        existing.setTitle(popup.getTitle());
        existing.setContent(popup.getContent());
        existing.setImageUrl(popup.getImageUrl());
        existing.setLinkUrl(popup.getLinkUrl());
        existing.setLinkText(popup.getLinkText());
        existing.setActive(popup.isActive());
        existing.setPosition(popup.getPosition());
        existing.setDelaySeconds(popup.getDelaySeconds());
        existing.setShowOnce(popup.isShowOnce());
        return repository.save(existing);
    }

    @Override
    public void deletePopup(Long id) {
        repository.deleteById(id);
    }
}
