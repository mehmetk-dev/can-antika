package com.mehmetkerem.service.payment;

import java.util.Map;

public interface PaytrTokenClient {
    Map<String, String> requestToken(String tokenUrl, Map<String, String> form);
}
