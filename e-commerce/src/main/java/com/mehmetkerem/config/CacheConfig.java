package com.mehmetkerem.config;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.mehmetkerem.dto.response.CategoryResponse;
import com.mehmetkerem.dto.response.PeriodResponse;
import com.mehmetkerem.model.BlogPost;
import com.mehmetkerem.model.Product;
import com.mehmetkerem.model.SiteSettings;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;

import java.time.Duration;

/**
 * Redis tabanlı cache konfigürasyonu.
 * DTO bazlı mix-in ile sadece cache'lenen tiplere @class eklenir,
 * koleksiyon kök tipine type info eklenmez (PROPERTY'nin liste hatasını önler).
 */
@Configuration
@EnableCaching
@Profile("!test")
public class CacheConfig {

    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());

        // Sadece cache'lenen DTO/entity tiplerine @class ekle — global typing yok
        mapper.addMixIn(CategoryResponse.class, CacheTypeMixin.class);
        mapper.addMixIn(PeriodResponse.class, CacheTypeMixin.class);
        mapper.addMixIn(BlogPost.class, CacheTypeMixin.class);
        mapper.addMixIn(Product.class, CacheTypeMixin.class);
        mapper.addMixIn(SiteSettings.class, CacheTypeMixin.class);

        GenericJackson2JsonRedisSerializer serializer =
                new GenericJackson2JsonRedisSerializer(mapper);

        RedisCacheConfiguration config = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(60))
                .serializeValuesWith(
                        RedisSerializationContext.SerializationPair
                                .fromSerializer(serializer))
                .disableCachingNullValues();

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(config)
                .build();
    }

    @JsonTypeInfo(use = JsonTypeInfo.Id.CLASS, property = "@class")
    private interface CacheTypeMixin {}
}
