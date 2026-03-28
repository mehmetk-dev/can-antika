package com.mehmetkerem.service.product;

import com.mehmetkerem.dto.request.ProductRequest;
import com.mehmetkerem.exception.BadRequestException;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class ProductExcelParser {

    public ProductExcelParseResult parse(MultipartFile file) {
        validateFile(file);

        List<String> errors = new ArrayList<>();
        List<ProductImportRow> rows = new ArrayList<>();

        try (InputStream inputStream = file.getInputStream();
                XSSFWorkbook workbook = new XSSFWorkbook(inputStream)) {
            Sheet sheet = workbook.getNumberOfSheets() > 0 ? workbook.getSheetAt(0) : null;
            if (sheet == null || sheet.getPhysicalNumberOfRows() == 0) {
                throw new BadRequestException("Excel dosyasi bos.");
            }

            Row headerRow = sheet.getRow(0);
            if (headerRow == null) {
                throw new BadRequestException("Baslik satiri bulunamadi.");
            }

            Map<String, Integer> headers = extractHeaders(headerRow);
            validateRequiredHeaders(headers);

            for (int r = 1; r <= sheet.getLastRowNum(); r++) {
                Row row = sheet.getRow(r);
                if (row == null || isRowEmpty(row)) {
                    continue;
                }

                try {
                    ProductRequest request = toProductRequest(row, headers);
                    rows.add(new ProductImportRow(r + 1, request));
                } catch (Exception ex) {
                    errors.add("Satir " + (r + 1) + ": " + ex.getMessage());
                }
            }
        } catch (IOException ex) {
            throw new BadRequestException("Excel dosyasi okunamadi.");
        }

        return new ProductExcelParseResult(rows, errors);
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Excel dosyasi bos olamaz.");
        }
        String originalName = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase();
        if (!originalName.endsWith(".xlsx")) {
            throw new BadRequestException("Sadece .xlsx formati destekleniyor.");
        }
    }

    private Map<String, Integer> extractHeaders(Row headerRow) {
        Map<String, Integer> headers = new HashMap<>();
        DataFormatter formatter = new DataFormatter();
        for (int i = 0; i < headerRow.getLastCellNum(); i++) {
            String key = formatter.formatCellValue(headerRow.getCell(i)).trim().toLowerCase();
            if (!key.isEmpty()) {
                headers.put(key, i);
            }
        }
        return headers;
    }

    private void validateRequiredHeaders(Map<String, Integer> headers) {
        List<String> required = List.of("title", "price", "stock", "categoryid");
        List<String> missing = required.stream().filter(h -> !headers.containsKey(h)).toList();
        if (!missing.isEmpty()) {
            throw new BadRequestException("Eksik kolon(lar): " + String.join(", ", missing));
        }
    }

    private ProductRequest toProductRequest(Row row, Map<String, Integer> headers) {
        ProductRequest request = new ProductRequest();
        request.setTitle(readString(row, headers, "title", true));
        request.setDescription(readString(row, headers, "description", false));
        request.setPrice(readBigDecimal(row, headers, "price", true));
        request.setStock(readInteger(row, headers, "stock", true));
        request.setCategoryId(readLong(row, headers, "categoryid", true));
        request.setPeriodName(resolveExcelPeriodName(row, headers));
        request.setImageUrls(readImageUrls(row, headers, "imageurls"));

        Map<String, Object> attrs = new HashMap<>();
        putIfPresent(attrs, "era", readString(row, headers, "era", false));
        putIfPresent(attrs, "material", readString(row, headers, "material", false));
        putIfPresent(attrs, "status", readString(row, headers, "status", false));
        putIfPresent(attrs, "dimensions", readString(row, headers, "dimensions", false));
        putIfPresent(attrs, "condition", readString(row, headers, "condition", false));
        putIfPresent(attrs, "conditionDetails", readString(row, headers, "conditiondetails", false));
        putIfPresent(attrs, "provenance", readString(row, headers, "provenance", false));
        if (!attrs.isEmpty()) {
            request.setAttributes(attrs);
        }

        return request;
    }

    private String resolveExcelPeriodName(Row row, Map<String, Integer> headers) {
        String periodName = readString(row, headers, "period", false);
        if (periodName != null && !periodName.isBlank()) {
            return periodName;
        }
        String era = readString(row, headers, "era", false);
        return (era == null || era.isBlank()) ? null : era;
    }

    private List<String> readImageUrls(Row row, Map<String, Integer> headers, String key) {
        if (!headers.containsKey(key)) {
            return new ArrayList<>();
        }
        String raw = readString(row, headers, key, false);
        if (raw == null || raw.isBlank()) {
            return new ArrayList<>();
        }
        List<String> urls = java.util.Arrays.stream(raw.split("\\|"))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
        return new ArrayList<>(urls);
    }

    private String readString(Row row, Map<String, Integer> headers, String key, boolean required) {
        Integer idx = headers.get(key);
        if (idx == null) {
            if (required) {
                throw new BadRequestException(key + " kolonu zorunlu.");
            }
            return null;
        }
        DataFormatter formatter = new DataFormatter();
        String value = formatter.formatCellValue(row.getCell(idx)).trim();
        if (required && value.isEmpty()) {
            throw new BadRequestException(key + " alani zorunlu.");
        }
        return value;
    }

    private BigDecimal readBigDecimal(Row row, Map<String, Integer> headers, String key, boolean required) {
        String value = readString(row, headers, key, required);
        if (value == null || value.isEmpty()) {
            return null;
        }
        try {
            return new BigDecimal(value.replace(",", "."));
        } catch (Exception ex) {
            throw new BadRequestException(key + " gecerli bir sayi olmali.");
        }
    }

    private Integer readInteger(Row row, Map<String, Integer> headers, String key, boolean required) {
        String value = readString(row, headers, key, required);
        if (value == null || value.isEmpty()) {
            return null;
        }
        try {
            return Integer.parseInt(value.replace(".0", ""));
        } catch (Exception ex) {
            throw new BadRequestException(key + " gecerli bir tam sayi olmali.");
        }
    }

    private Long readLong(Row row, Map<String, Integer> headers, String key, boolean required) {
        String value = readString(row, headers, key, required);
        if (value == null || value.isEmpty()) {
            return null;
        }
        try {
            return Long.parseLong(value.replace(".0", ""));
        } catch (Exception ex) {
            throw new BadRequestException(key + " gecerli bir sayi olmali.");
        }
    }

    private boolean isRowEmpty(Row row) {
        DataFormatter formatter = new DataFormatter();
        for (Cell cell : row) {
            if (cell != null && cell.getCellType() != org.apache.poi.ss.usermodel.CellType.BLANK) {
                if (!formatter.formatCellValue(cell).trim().isEmpty()) {
                    return false;
                }
            }
        }
        return true;
    }

    private void putIfPresent(Map<String, Object> attrs, String key, String value) {
        if (value != null && !value.isBlank()) {
            attrs.put(key, value);
        }
    }
}
