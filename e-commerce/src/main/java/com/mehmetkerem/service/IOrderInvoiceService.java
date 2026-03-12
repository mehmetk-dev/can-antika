package com.mehmetkerem.service;

import com.mehmetkerem.dto.response.OrderInvoiceResponse;
import com.mehmetkerem.model.Order;

public interface IOrderInvoiceService {

    /** Sipariş fatura/fiş bilgisi oluşturur. */
    OrderInvoiceResponse buildInvoice(Order order);
}
