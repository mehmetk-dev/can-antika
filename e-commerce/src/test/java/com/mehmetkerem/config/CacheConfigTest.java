package com.mehmetkerem.config;

import com.mehmetkerem.dto.response.CategoryResponse;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class CacheConfigTest {

    @Test
    void redisSerializerShouldRoundTripRootLists() {
        GenericJackson2JsonRedisSerializer serializer =
                CacheConfig.redisCacheSerializer();

        CategoryResponse category = new CategoryResponse();
        category.setId(3L);
        category.setName("Eski para");

        Object deserialized = serializer.deserialize(serializer.serialize(List.of(category)));

        assertThat(deserialized).isInstanceOf(List.class);
        assertThat((List<?>) deserialized)
                .hasSize(1)
                .first()
                .isInstanceOf(CategoryResponse.class)
                .extracting("name")
                .isEqualTo("Eski para");
    }
}
