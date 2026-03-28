package com.mehmetkerem.controller;

import com.mehmetkerem.controller.impl.RestFileUploadControllerImpl;
import com.mehmetkerem.exception.BadRequestException;
import com.mehmetkerem.service.IFileStorageService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RestFileUploadControllerTest {

    @Mock
    private IFileStorageService storageService;

    @InjectMocks
    private RestFileUploadControllerImpl controller;

    @Test
    @DisplayName("getFile - Cloudinary'ye geçildiği için artık local dosya sunulmaz (410 GONE)")
    void getFile_ShouldReturnGoneStatus() {
        ResponseEntity<Resource> response = controller.getFile("test.jpg");
        assertEquals(410, response.getStatusCode().value());
        assertNull(response.getBody());
    }

    @Test
    @DisplayName("uploadFile - 5MB ustu dosya reddedilir")
    void uploadFile_WhenFileIsTooLarge_ShouldThrowBadRequest() {
        byte[] largeContent = new byte[5 * 1024 * 1024 + 1];
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.webp",
                "image/webp",
                largeContent);

        assertThrows(BadRequestException.class, () -> controller.uploadFile(file));
        verify(storageService, never()).save(any());
    }

    @Test
    @DisplayName("uploadMultiple - toplam boyut 20MB ustu olursa reddedilir")
    void uploadMultiple_WhenTotalSizeExceedsLimit_ShouldThrowBadRequest() {
        byte[] bigChunk = new byte[11 * 1024 * 1024];
        MockMultipartFile file1 = new MockMultipartFile("files", "a.webp", "image/webp", bigChunk);
        MockMultipartFile file2 = new MockMultipartFile("files", "b.webp", "image/webp", bigChunk);

        assertThrows(BadRequestException.class, () -> controller.uploadMultiple(List.of(file1, file2)));
        verify(storageService, never()).save(any());
    }
}
