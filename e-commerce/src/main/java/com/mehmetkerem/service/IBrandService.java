package com.mehmetkerem.service;

import com.mehmetkerem.model.Brand;
import java.util.List;

public interface IBrandService {
    List<Brand> findAllBrands();
    List<Brand> findActiveBrands();
    Brand getBrandById(Long id);
    Brand saveBrand(Brand brand);
    Brand updateBrand(Long id, Brand brand);
    void deleteBrand(Long id);
}
