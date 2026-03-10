package com.mehmetkerem.controller.impl;

import com.mehmetkerem.controller.IRestFileUploadController;
import com.mehmetkerem.exception.BadRequestException;
import com.mehmetkerem.service.IFileStorageService;
import com.mehmetkerem.util.ResultData;
import com.mehmetkerem.util.ResultHelper;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import org.springframework.security.access.annotation.Secured;

@RestController
@RequestMapping("/v1/files")
@SuppressWarnings("null")
public class RestFileUploadControllerImpl implements IRestFileUploadController {

    private final IFileStorageService storageService;

    public RestFileUploadControllerImpl(IFileStorageService storageService) {
        this.storageService = storageService;
    }

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg", "image/png", "image/gif", "image/webp");
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "gif", "webp");

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
    public ResultData<List<String>> uploadMultiple(
            @RequestParam("files") List<MultipartFile> files) {

        if (files == null || files.isEmpty()) {
            throw new BadRequestException("En az bir dosya gerekli.");
        }
        if (files.size() > 10) {
            throw new BadRequestException("Tek seferde en fazla 10 dosya yüklenebilir.");
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
            throw new BadRequestException("Dosya boş olamaz.");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new BadRequestException("Sadece resim dosyaları yüklenebilir (JPEG, PNG, GIF, WebP).");
        }

        String extension = getExtension(file.getOriginalFilename());
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new BadRequestException("Geçersiz dosya uzantısı. Sadece JPEG, PNG, GIF, WebP yüklenebilir.");
        }

        try {
            if (!hasValidImageMagicBytes(file)) {
                throw new BadRequestException("Dosya içeriği geçerli bir resim formatı değil.");
            }
        } catch (IOException e) {
            throw new BadRequestException("Dosya doğrulaması sırasında hata oluştu.");
        }
    }

    private String getExtension(String originalFilename) {
        if (originalFilename == null || !originalFilename.contains(".")) {
            return "";
        }
        return originalFilename.substring(originalFilename.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
    }

    private boolean hasValidImageMagicBytes(MultipartFile file) throws IOException {
        byte[] bytes = file.getBytes();
        if (bytes.length < 12) {
            return false;
        }

        // JPEG
        if ((bytes[0] & 0xFF) == 0xFF && (bytes[1] & 0xFF) == 0xD8 && (bytes[2] & 0xFF) == 0xFF) {
            return true;
        }

        // PNG
        if ((bytes[0] & 0xFF) == 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4E && bytes[3] == 0x47
                && bytes[4] == 0x0D && bytes[5] == 0x0A && bytes[6] == 0x1A && bytes[7] == 0x0A) {
            return true;
        }

        // GIF87a/GIF89a
        if (bytes[0] == 'G' && bytes[1] == 'I' && bytes[2] == 'F' && bytes[3] == '8'
                && (bytes[4] == '7' || bytes[4] == '9') && bytes[5] == 'a') {
            return true;
        }

        // WEBP (RIFF....WEBP)
        return bytes[0] == 'R' && bytes[1] == 'I' && bytes[2] == 'F' && bytes[3] == 'F'
                && bytes[8] == 'W' && bytes[9] == 'E' && bytes[10] == 'B' && bytes[11] == 'P';
    }
}
