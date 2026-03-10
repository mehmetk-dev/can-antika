package com.mehmetkerem.service.impl;

import com.mehmetkerem.exception.NotFoundException;
import com.mehmetkerem.model.Brand;
import com.mehmetkerem.repository.BrandRepository;
import com.mehmetkerem.service.IBrandService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BrandServiceImpl implements IBrandService {

    private final BrandRepository brandRepository;

    @Override
    public List<Brand> findAllBrands() {
        return brandRepository.findAll();
    }

    @Override
    public List<Brand> findActiveBrands() {
        return brandRepository.findByActiveTrue();
    }

    @Override
    public Brand getBrandById(Long id) {
        return brandRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Marka bulunamadı: " + id));
    }

    @Override
    public Brand saveBrand(Brand brand) {
        return brandRepository.save(brand);
    }

    @Override
    public Brand updateBrand(Long id, Brand brand) {
        Brand existing = getBrandById(id);
        existing.setName(brand.getName());
        existing.setSlug(brand.getSlug());
        existing.setLogoUrl(brand.getLogoUrl());
        existing.setActive(brand.isActive());
        return brandRepository.save(existing);
    }

    @Override
    public void deleteBrand(Long id) {
        brandRepository.deleteById(id);
    }
}
