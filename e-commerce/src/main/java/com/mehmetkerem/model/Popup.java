package com.mehmetkerem.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Getter
@Setter
@Entity
@Table(name = "popups")
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Popup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    private String imageUrl;

    private String linkUrl;

    private String linkText;

    @Builder.Default
    private boolean active = false;

    @Builder.Default
    private String position = "CENTER"; // CENTER, BOTTOM, TOP

    @Builder.Default
    private int delaySeconds = 3;

    @Builder.Default
    private boolean showOnce = true;
}
