package com.mehmetkerem.jwt;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.core.userdetails.UserDetailsService;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;

class JwtAuthFilterTest {

    private final TestableJwtAuthFilter filter = new TestableJwtAuthFilter(
            mock(JwtService.class),
            mock(UserDetailsService.class));

    @Test
    void skipsOnlyPublicSiteSettingsGetEndpoint() {
        assertTrue(filter.shouldSkip(new MockHttpServletRequest("GET", "/v1/site-settings")));
        assertFalse(filter.shouldSkip(new MockHttpServletRequest("GET", "/v1/site-settings/admin")));
        assertFalse(filter.shouldSkip(new MockHttpServletRequest("PUT", "/v1/site-settings")));
    }

    private static class TestableJwtAuthFilter extends JwtAuthFilter {
        TestableJwtAuthFilter(JwtService jwtService, UserDetailsService userDetailsService) {
            super(jwtService, userDetailsService);
        }

        boolean shouldSkip(MockHttpServletRequest request) {
            return shouldNotFilter(request);
        }
    }
}
