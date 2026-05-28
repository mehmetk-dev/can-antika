package com.mehmetkerem.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PaytrInitializeResponse {
    private Long orderId;
    private String merchantOid;
    private String iframeToken;
    private String iframeUrl;
}
