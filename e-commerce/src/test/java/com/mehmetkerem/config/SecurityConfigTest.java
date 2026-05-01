package com.mehmetkerem.config;

import com.mehmetkerem.jwt.JwtAuthFilter;
import com.mehmetkerem.security.CustomOAuth2UserService;
import com.mehmetkerem.security.OAuth2LoginFailureHandler;
import com.mehmetkerem.security.OAuth2LoginSuccessHandler;
import org.junit.jupiter.api.Test;
import org.springframework.core.env.Environment;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.cors.CorsConfiguration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class SecurityConfigTest {

    @Test
    void corsShouldIncludePublicSiteOrigins() {
        Environment environment = mock(Environment.class);
        when(environment.getActiveProfiles()).thenReturn(new String[0]);

        SecurityConfig securityConfig = new SecurityConfig(
                mock(RateLimitFilter.class),
                mock(JwtAuthFilter.class),
                mock(UserDetailsService.class),
                mock(PasswordEncoder.class),
                mock(CustomOAuth2UserService.class),
                mock(OAuth2LoginSuccessHandler.class),
                mock(OAuth2LoginFailureHandler.class),
                environment
        );
        ReflectionTestUtils.setField(securityConfig, "allowedOrigins", "https://admin.canantika.com");
        ReflectionTestUtils.setField(securityConfig, "frontendUrl", "https://canantika.com");
        ReflectionTestUtils.setField(securityConfig, "requireHttpsOnProd", true);

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/v1/category/find-all");
        CorsConfiguration corsConfiguration = securityConfig.corsConfigurationSource()
                .getCorsConfiguration(request);

        assertThat(corsConfiguration).isNotNull();
        assertThat(corsConfiguration.getAllowedOrigins())
                .contains("https://canantika.com", "https://www.canantika.com");
    }
}
