package com.mehmetkerem.mapper;

import com.mehmetkerem.dto.response.CouponResponse;
import com.mehmetkerem.model.Coupon;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE, unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface CouponMapper {

    @Mapping(source = "usageCount", target = "currentUsageCount")
    CouponResponse toResponse(Coupon entity);
}
