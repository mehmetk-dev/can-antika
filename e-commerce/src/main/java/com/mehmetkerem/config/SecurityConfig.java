// SecurityConfig.java
package com.mehmetkerem.config;

import com.mehmetkerem.jwt.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.security.web.header.writers.StaticHeadersWriter;
import com.mehmetkerem.security.CustomOAuth2UserService;
import com.mehmetkerem.security.OAuth2LoginSuccessHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

import static org.springframework.security.config.Customizer.withDefaults;

@Configuration
@EnableMethodSecurity(securedEnabled = true, prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

        private final RateLimitFilter rateLimitFilter;
        private final JwtAuthFilter jwtAuthFilter;
        private final UserDetailsService userDetailsService;
        private final PasswordEncoder passwordEncoder;
        private final CustomOAuth2UserService customOAuth2UserService;
        private final OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler;

        @Value("${app.cors.allowed-origins:http://localhost:3000,http://localhost:5173}")
        private String allowedOrigins;

        @Bean
        public CorsConfigurationSource corsConfigurationSource() {
                CorsConfiguration config = new CorsConfiguration();
                config.setAllowedOrigins(Arrays.asList(allowedOrigins.split(",")));
                config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
                config.setAllowedHeaders(List.of("*"));
                config.setAllowCredentials(true);
                config.setMaxAge(3600L);

                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
                source.registerCorsConfiguration("/**", config);
                return source;
        }

        @Bean
        public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
                return http
                                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                                .csrf(csrf -> csrf.disable())
                                .headers(headers -> headers
                                                .contentSecurityPolicy(csp -> csp.policyDirectives(
                                                                "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://connect.facebook.net; style-src 'self' 'unsafe-inline'; connect-src 'self' http: https: ws: wss:; object-src 'none'; frame-ancestors 'none'; base-uri 'self'"))
                                                .frameOptions(frame -> frame.deny())
                                                .httpStrictTransportSecurity(hsts -> hsts
                                                                .maxAgeInSeconds(31536000)
                                                                .includeSubDomains(true))
                                                .contentTypeOptions(withDefaults())
                                                .referrerPolicy(referrer -> referrer.policy(
                                                                ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
                                                .addHeaderWriter(new StaticHeadersWriter("Permissions-Policy",
                                                                "camera=(), microphone=(), geolocation=()")))
                                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                                .authorizeHttpRequests(auth -> auth
                                                // Auth endpoints
                                                .requestMatchers("/v1/auth/login", "/v1/auth/register",
                                                                "/v1/auth/refresh-token", "/v1/auth/forgot-password",
                                                                "/v1/auth/reset-password", "/v1/auth/logout")
                                                .permitAll()
                                                // Public GET endpoints
                                                .requestMatchers(HttpMethod.GET, "/v1/product/**").permitAll()
                                                .requestMatchers(HttpMethod.POST, "/v1/product/*/view").permitAll()
                                                .requestMatchers(HttpMethod.GET, "/v1/category/**").permitAll()
                                                .requestMatchers(HttpMethod.GET, "/v1/review/**").permitAll()
                                                .requestMatchers(HttpMethod.GET, "/v1/site-settings").permitAll()
                                                .requestMatchers(HttpMethod.GET, "/v1/faq").permitAll()
                                                .requestMatchers(HttpMethod.GET, "/v1/brands").permitAll()
                                                .requestMatchers(HttpMethod.GET, "/v1/popups/active").permitAll()
                                                .requestMatchers(HttpMethod.GET, "/v1/blog").permitAll()
                                                .requestMatchers(HttpMethod.GET, "/v1/blog/{slug}").permitAll()
                                                .requestMatchers(HttpMethod.GET, "/v1/blog/categories").permitAll()
                                                .requestMatchers(HttpMethod.GET, "/v1/pages").permitAll()
                                                .requestMatchers(HttpMethod.GET, "/v1/pages/{slug}").permitAll()
                                                .requestMatchers(HttpMethod.GET, "/v1/coupons/{code}").permitAll()
                                                // Public POST endpoints
                                                .requestMatchers(HttpMethod.POST, "/v1/contact").permitAll()
                                                .requestMatchers(HttpMethod.POST, "/v1/newsletter/subscribe").permitAll()
                                                .requestMatchers(HttpMethod.POST, "/v1/newsletter/unsubscribe").permitAll()
                                                // Swagger — disabled in prod, no permitAll needed
                                                // Actuator health
                                                .requestMatchers("/actuator/health").permitAll()
                                                // Admin & Vendor
                                                .requestMatchers("/v1/admin/**").hasRole("ADMIN")
                                                .requestMatchers("/v1/vendor/**").hasAnyRole("VENDOR", "ADMIN")
                                                .anyRequest().authenticated())
                                .exceptionHandling(eh -> eh.authenticationEntryPoint(
                                                (request, response, authException) -> response.sendError(
                                                                org.springframework.http.HttpStatus.UNAUTHORIZED
                                                                                .value(),
                                                                "Unauthorized")))
                                .oauth2Login(oauth2 -> oauth2
                                                .userInfoEndpoint(userInfo -> userInfo
                                                                .userService(customOAuth2UserService))
                                                .successHandler(oAuth2LoginSuccessHandler))
                                .authenticationProvider(daoAuthProvider())
                                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                                .addFilterBefore(rateLimitFilter, UsernamePasswordAuthenticationFilter.class)
                                .build();
        }

        @Bean
        public AuthenticationProvider daoAuthProvider() {
                var p = new DaoAuthenticationProvider();
                p.setPasswordEncoder(passwordEncoder);
                p.setUserDetailsService(userDetailsService);
                return p;
        }

        @Bean
        public AuthenticationManager authenticationManager(AuthenticationConfiguration cfg) throws Exception {
                return cfg.getAuthenticationManager();
        }
}
