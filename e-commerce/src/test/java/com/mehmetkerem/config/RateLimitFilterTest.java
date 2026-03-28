package com.mehmetkerem.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@SuppressWarnings("null")
class RateLimitFilterTest {

    @Test
    @DisplayName("Rate limit asildiginda 429 doner")
    void doFilter_WhenLimitExceeded_ShouldReturn429() throws Exception {
        RateLimitConfig config = new RateLimitConfig();
        config.setFailOpenOnRedisError(false);
        config.setGlobalMaxRequests(100);
        config.setGlobalWindowMinutes(1);

        RateLimitConfig.BucketConfig bucket = new RateLimitConfig.BucketConfig();
        bucket.setName("auth-login");
        bucket.setPathPrefix("/v1/auth/login");
        bucket.setMaxRequests(5);
        bucket.setWindowMinutes(1);
        bucket.setUserScoped(true);
        bucket.setMessage("too many");
        config.setBuckets(List.of(bucket));

        StringRedisTemplate redis = mock(StringRedisTemplate.class);
        when(redis.execute(any(), anyList(), anyString())).thenReturn(6L);

        RateLimitFilter filter = new RateLimitFilter(config, redis, new ObjectMapper());

        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/v1/auth/login");
        request.setContentType("application/json");
        request.setContent("{\"email\":\"test@example.com\",\"password\":\"x\"}".getBytes());
        request.addHeader("X-RateLimit-Subject", "test@example.com");

        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(request, response, chain);

        assertEquals(429, response.getStatus());
        assertEquals("{\"message\":\"too many\"}", response.getContentAsString());
    }
}
