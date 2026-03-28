package com.mehmetkerem.controller.impl;

import com.mehmetkerem.controller.IRestFileUploadController;
import com.mehmetkerem.exception.BadRequestException;
import com.mehmetkerem.service.IFileStorageService;
import com.mehmetkerem.util.ResultData;
import com.mehmetkerem.util.ResultHelper;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.annotation.Secured;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@RestController
@RequestMapping("/v1/files")
@SuppressWarnings("null")
public class RestFileUploadControllerImpl implements IRestFileUploadController {

    private final IFileStorageService storageService;

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg", "image/png", "image/gif", "image/webp");
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "gif", "webp");
    private static final long MAX_FILE_SIZE_BYTES = 5L * 1024 * 1024;
    private static final long MAX_BATCH_SIZE_BYTES = 20L * 1024 * 1024;

    public RestFileUploadControllerImpl(IFileStorageService storageService) {
        this.storageService = storageService;
    }

    @Override
    @Secured("ROLE_ADMIN")
    @PostMapping("/upload")
    public ResultData<String> uploadFile(@RequestParam("file") MultipartFile file) {
        validateImage(file);
        String cloudinaryUrl = storageService.save(file);
        return ResultHelper.success(cloudinaryUrl);
    }

    @Override
    @Secured("ROLE_ADMIN")
    @PostMapping("/upload-multiple")
    public ResultData<List<String>> uploadMultiple(@RequestParam("files") List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            throw new BadRequestException("En az bir dosya gerekli.");
        }
        if (files.size() > 10) {
            throw new BadRequestException("Tek seferde en fazla 10 dosya yuklenebilir.");
        }

        long totalSize = files.stream().mapToLong(MultipartFile::getSize).sum();
        if (totalSize > MAX_BATCH_SIZE_BYTES) {
            throw new BadRequestException("Toplam dosya boyutu en fazla 20 MB olabilir.");
        }

        List<String> urls = new ArrayList<>();
        for (MultipartFile file : files) {
            validateImage(file);
            urls.add(storageService.save(file));
        }
        return ResultHelper.success(urls);
    }

    @Override
    @GetMapping("/{filename:.+}")
    @ResponseBody
    public ResponseEntity<Resource> getFile(@PathVariable String filename) {
        return ResponseEntity.status(HttpStatus.GONE).build();
    }

    private void validateImage(MultipartFile file) {
        if (file.isEmpty()) {
            throw new BadRequestException("Dosya bos olamaz.");
        }
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new BadRequestException("Dosya boyutu en fazla 5 MB olabilir.");
        }

        String originalFilename = file.getOriginalFilename();
        validateFileNameSafety(originalFilename);

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase(Locale.ROOT))) {
            throw new BadRequestException("Sadece resim dosyalari yuklenebilir (JPEG, PNG, GIF, WebP).");
        }

        String extension = getExtension(originalFilename);
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new BadRequestException("Gecersiz dosya uzantisi. Sadece JPEG, PNG, GIF, WebP yuklenebilir.");
        }

        try {
            if (!hasValidImageMagicBytes(file)) {
                throw new BadRequestException("Dosya icerigi gecerli bir resim formati degil.");
            }
        } catch (IOException e) {
            throw new BadRequestException("Dosya dogrulamasi sirasinda hata olustu.");
        }
    }

    private void validateFileNameSafety(String originalFilename) {
        if (originalFilename == null || originalFilename.isBlank()) {
            throw new BadRequestException("Dosya adi bos olamaz.");
        }

        String normalized = originalFilename.trim();
        if (normalized.contains("..")
                || normalized.contains("/")
                || normalized.contains("\\")
                || normalized.contains("\0")) {
            throw new BadRequestException("Gecersiz dosya adi.");
        }
    }

    private String getExtension(String originalFilename) {
        if (originalFilename == null || !originalFilename.contains(".")) {
            return "";
        }
        return originalFilename.substring(originalFilename.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
    }

    private boolean hasValidImageMagicBytes(MultipartFile file) throws IOException {
        byte[] bytes = new byte[12];
        int read;
        try (InputStream inputStream = file.getInputStream()) {
            read = inputStream.read(bytes);
        }

        if (read < 12) {
            return false;
        }

        if ((bytes[0] & 0xFF) == 0xFF && (bytes[1] & 0xFF) == 0xD8 && (bytes[2] & 0xFF) == 0xFF) {
            return true;
        }

        if ((bytes[0] & 0xFF) == 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4E && bytes[3] == 0x47
                && bytes[4] == 0x0D && bytes[5] == 0x0A && bytes[6] == 0x1A && bytes[7] == 0x0A) {
            return true;
        }

        if (bytes[0] == 'G' && bytes[1] == 'I' && bytes[2] == 'F' && bytes[3] == '8'
                && (bytes[4] == '7' || bytes[4] == '9') && bytes[5] == 'a') {
            return true;
        }

        return bytes[0] == 'R' && bytes[1] == 'I' && bytes[2] == 'F' && bytes[3] == 'F'
                && bytes[8] == 'W' && bytes[9] == 'E' && bytes[10] == 'B' && bytes[11] == 'P';
    }
}
