package com.mehmetkerem.service;

import com.mehmetkerem.model.Popup;
import java.util.List;

public interface IPopupService {
    List<Popup> getActivePopups();
    List<Popup> getAllPopups();
    Popup savePopup(Popup popup);
    Popup updatePopup(Long id, Popup popup);
    void deletePopup(Long id);
}
