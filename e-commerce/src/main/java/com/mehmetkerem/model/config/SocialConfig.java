package com.mehmetkerem.model.config;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SocialConfig {

    private String facebook = "";

    private String instagram = "";

    private String twitter = "";

    private String youtube = "";

    private String tiktok = "";
}
