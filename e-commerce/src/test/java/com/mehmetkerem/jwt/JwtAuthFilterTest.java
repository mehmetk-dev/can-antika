package com.mehmetkerem.jwt;

import com.mehmetkerem.enums.Role;
import com.mehmetkerem.model.User;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetailsService;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class JwtAuthFilterTest {

    private final JwtService jwtService = mock(JwtService.class);
    private final UserDetailsService userDetailsService = mock(UserDetailsService.class);
    private final TestableJwtAuthFilter filter = new TestableJwtAuthFilter(jwtService, userDetailsService);

    @Test
    void skipsOnlyPublicSiteSettingsGetEndpoint() {
        assertTrue(filter.shouldSkip(new MockHttpServletRequest("GET", "/v1/site-settings")));
        assertFalse(filter.shouldSkip(new MockHttpServletRequest("GET", "/v1/site-settings/admin")));
        assertFalse(filter.shouldSkip(new MockHttpServletRequest("PUT", "/v1/site-settings")));
    }

    @Test
    void doesNotAuthenticateDisabledUserWithValidJwt() throws Exception {
        User user = User.builder()
                .email("disabled@test.com")
                .role(Role.USER)
                .active(false)
                .build();
        when(jwtService.extractUsername("token")).thenReturn(user.getEmail());
        when(userDetailsService.loadUserByUsername(user.getEmail())).thenReturn(user);
        when(jwtService.isValid("token", user)).thenReturn(true);

        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/v1/cart/items");
        request.addHeader("Authorization", "Bearer token");
        filter.doFilter(request, new MockHttpServletResponse(), new MockFilterChain());

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        SecurityContextHolder.clearContext();
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
