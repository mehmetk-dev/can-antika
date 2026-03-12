package com.mehmetkerem.model;

import com.mehmetkerem.model.config.*;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

@Getter
@Setter
@Entity
@Table(name = "site_settings")
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class SiteSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Embedded
    @Builder.Default
    private StoreConfig storeConfig = new StoreConfig();

    @Embedded
    @Builder.Default
    private ContactConfig contactConfig = new ContactConfig();

    @Embedded
    @Builder.Default
    private ShippingConfig shippingConfig = new ShippingConfig();

    @Embedded
    @Builder.Default
    private SocialConfig socialConfig = new SocialConfig();

    @Embedded
    @Builder.Default
    private SeoConfig seoConfig = new SeoConfig();

    @Embedded
    @Builder.Default
    private MaintenanceConfig maintenanceConfig = new MaintenanceConfig();

    @Embedded
    @Builder.Default
    private NotificationConfig notificationConfig = new NotificationConfig();

    @Embedded
    @Builder.Default
    private PaymentConfig paymentConfig = new PaymentConfig();
}
