package com.mehmetkerem.mapper;

import com.mehmetkerem.dto.request.BlogCategoryRequest;
import com.mehmetkerem.dto.request.BlogPostRequest;
import com.mehmetkerem.dto.response.BlogCategoryResponse;
import com.mehmetkerem.dto.response.BlogPostResponse;
import com.mehmetkerem.model.BlogCategory;
import com.mehmetkerem.model.BlogPost;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE, unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface BlogMapper {

    BlogPostResponse toPostResponse(BlogPost entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    BlogPost toPostEntity(BlogPostRequest request);

    BlogCategoryResponse toCategoryResponse(BlogCategory entity);

    @Mapping(target = "id", ignore = true)
    BlogCategory toCategoryEntity(BlogCategoryRequest request);
}
