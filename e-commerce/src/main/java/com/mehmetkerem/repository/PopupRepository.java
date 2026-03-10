package com.mehmetkerem.repository;

import com.mehmetkerem.model.Popup;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PopupRepository extends JpaRepository<Popup, Long> {
    List<Popup> findByActiveTrue();
}
