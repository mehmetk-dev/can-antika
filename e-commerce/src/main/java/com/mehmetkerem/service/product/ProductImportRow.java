package com.mehmetkerem.service.product;

import com.mehmetkerem.dto.request.ProductRequest;

public record ProductImportRow(int rowNumber, ProductRequest request) {
}
