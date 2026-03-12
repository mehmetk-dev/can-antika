import type { FC } from "react"
import type { SettingsTabProps } from "./types"
import StoreSettingsTab from "./store-settings-tab"
import CompanySettingsTab from "./company-settings-tab"
import ContactSettingsTab from "./contact-settings-tab"
import ShippingSettingsTab from "./shipping-settings-tab"
import PaymentSettingsTab from "./payment-settings-tab"
import CurrencySettingsTab from "./currency-settings-tab"
import FooterSettingsTab from "./footer-settings-tab"
import SocialSettingsTab from "./social-settings-tab"
import SeoSettingsTab from "./seo-settings-tab"
import SmtpSettingsTab from "./smtp-settings-tab"
import SmsSettingsTab from "./sms-settings-tab"
import MaintenanceSettingsTab from "./maintenance-settings-tab"

export const TAB_COMPONENTS: Record<string, FC<SettingsTabProps>> = {
    store: StoreSettingsTab,
    company: CompanySettingsTab,
    contact: ContactSettingsTab,
    shipping: ShippingSettingsTab,
    payment: PaymentSettingsTab,
    currency: CurrencySettingsTab,
    footer: FooterSettingsTab,
    social: SocialSettingsTab,
    seo: SeoSettingsTab,
    smtp: SmtpSettingsTab,
    sms: SmsSettingsTab,
    maintenance: MaintenanceSettingsTab,
}
