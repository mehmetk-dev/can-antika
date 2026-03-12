package com.mehmetkerem.mapper;

import com.mehmetkerem.dto.response.OrderReturnResponse;
import com.mehmetkerem.model.OrderReturn;
import org.mapstruct.Mapper;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE, unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface OrderReturnMapper {

    OrderReturnResponse toResponse(OrderReturn entity);
}
