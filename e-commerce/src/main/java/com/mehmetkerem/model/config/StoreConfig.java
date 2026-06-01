package com.mehmetkerem.model.config;

import jakarta.persistence.Column;
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
public class StoreConfig {

    private String storeName = "Can Antika";

    private String businessType = "Antika Eşya Satışı";

    @Column(length = 500)
    private String storeDescription = "1982'den gelen aile tecrübesiyle Can Antika çatısı altında seçkin antika ve koleksiyon ürünleri sunuyoruz.";

    private String companyName = "Can Antika Ltd. Şti.";

    private String taxId = "";

    private String taxOffice = "";
}
