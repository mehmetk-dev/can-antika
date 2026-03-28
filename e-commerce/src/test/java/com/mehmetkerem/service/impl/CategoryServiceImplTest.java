package com.mehmetkerem.service.impl;

import com.mehmetkerem.dto.request.CategoryRequest;
import com.mehmetkerem.dto.response.CategoryResponse;
import com.mehmetkerem.exception.BadRequestException;
import com.mehmetkerem.exception.NotFoundException;
import com.mehmetkerem.mapper.CategoryMapper;
import com.mehmetkerem.model.Category;
import com.mehmetkerem.repository.CategoryRepository;
import com.mehmetkerem.repository.ProductRepository;
import com.mehmetkerem.service.IActivityLogService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class CategoryServiceImplTest {

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CategoryMapper categoryMapper;

    @Mock
    private IActivityLogService activityLogService;

    @InjectMocks
    private CategoryServiceImpl categoryService;

    private CategoryRequest categoryRequest;
    private Category category;
    private CategoryResponse categoryResponse;

    @BeforeEach
    void setUp() {
        categoryRequest = new CategoryRequest();
        categoryRequest.setName("Antika");

        category = Category.builder()
                .id(1L)
                .name("Antika")
                .deleted(false)
                .build();

        categoryResponse = new CategoryResponse();
        categoryResponse.setId(1L);
        categoryResponse.setName("Antika");
    }

    @Test
    @DisplayName("saveCategory - yeni kategori basariyla kaydedilir")
    void saveCategory_WhenNameNotExists_ShouldSaveAndReturnResponse() {
        when(categoryRepository.existsByName("Antika")).thenReturn(false);
        when(categoryMapper.toEntity(categoryRequest)).thenReturn(category);
        when(categoryRepository.save(any(Category.class))).thenReturn(category);
        when(categoryMapper.toResponse(category)).thenReturn(categoryResponse);

        CategoryResponse result = categoryService.saveCategory(categoryRequest);

        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("Antika", result.getName());
        verify(categoryRepository).existsByName("Antika");
        verify(categoryRepository).save(any(Category.class));
    }

    @Test
    @DisplayName("saveCategory - ayni isimde kategori varsa BadRequestException firlatir")
    void saveCategory_WhenNameExists_ShouldThrowBadRequestException() {
        when(categoryRepository.existsByName("Antika")).thenReturn(true);

        assertThrows(BadRequestException.class, () -> categoryService.saveCategory(categoryRequest));
        verify(categoryRepository, never()).save(any());
    }

    @Test
    @DisplayName("getCategoryById - mevcut id ile kategori doner")
    void getCategoryById_WhenExists_ShouldReturnCategory() {
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));

        Category result = categoryService.getCategoryById(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("Antika", result.getName());
    }

    @Test
    @DisplayName("getCategoryById - olmayan id ile NotFoundException firlatir")
    void getCategoryById_WhenNotExists_ShouldThrowNotFoundException() {
        when(categoryRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> categoryService.getCategoryById(999L));
    }

    @Test
    @DisplayName("getCategoryResponseById - response doner")
    void getCategoryResponseById_ShouldReturnResponse() {
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(categoryMapper.toResponse(category)).thenReturn(categoryResponse);

        CategoryResponse result = categoryService.getCategoryResponseById(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("Antika", result.getName());
    }

    @Test
    @DisplayName("updateCategory - guncelleme basarili")
    void updateCategory_WhenExists_ShouldUpdateAndReturn() {
        CategoryRequest updateRequest = new CategoryRequest();
        updateRequest.setName("Antika Saatler");
        updateRequest.setDescription("Aciklama");
        updateRequest.setCoverImageUrl("https://example.com/cat.jpg");

        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(categoryRepository.save(any(Category.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(categoryMapper.toResponse(any(Category.class))).thenAnswer(invocation -> {
            Category saved = invocation.getArgument(0);
            CategoryResponse response = new CategoryResponse();
            response.setId(saved.getId());
            response.setName(saved.getName());
            return response;
        });

        CategoryResponse result = categoryService.updateCategory(1L, updateRequest);

        assertEquals("Antika Saatler", result.getName());
        verify(categoryRepository).save(argThat(saved ->
                "Antika Saatler".equals(saved.getName())
                        && "Aciklama".equals(saved.getDescription())
                        && "https://example.com/cat.jpg".equals(saved.getCoverImageUrl())));
    }

    @Test
    @DisplayName("deleteCategory - kategori silinir ve mesaj doner")
    void deleteCategory_WhenExists_ShouldDeleteAndReturnMessage() {
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(productRepository.existsByCategoryId(1L)).thenReturn(false);
        doNothing().when(categoryRepository).delete(category);

        String result = categoryService.deleteCategory(1L);

        assertTrue(result.contains("1"));
        assertTrue(result.contains("kategori"));
        verify(categoryRepository).delete(category);
    }

    @Test
    @DisplayName("deleteCategory - kategoriye bagli urun varsa hata firlatir")
    void deleteCategory_WhenProductsExist_ShouldThrowBadRequestException() {
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(productRepository.existsByCategoryId(1L)).thenReturn(true);

        assertThrows(BadRequestException.class, () -> categoryService.deleteCategory(1L));
        verify(categoryRepository, never()).delete(any(Category.class));
    }

    @Test
    @DisplayName("findAllCategories - tum kategoriler listelenir")
    void findAllCategories_ShouldReturnAllCategories() {
        when(categoryRepository.findAll()).thenReturn(List.of(category));
        when(categoryMapper.toResponse(category)).thenReturn(categoryResponse);

        List<CategoryResponse> result = categoryService.findAllCategories();

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Antika", result.get(0).getName());
    }
}
