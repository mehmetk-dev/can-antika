package com.mehmetkerem.service.product;

import java.util.List;

public record ProductExcelParseResult(List<ProductImportRow> rows, List<String> errors) {
}
