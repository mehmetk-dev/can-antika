package com.mehmetkerem.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mehmetkerem.enums.AuthProvider;
import com.mehmetkerem.enums.Role;
import com.mehmetkerem.model.User;
import com.mehmetkerem.repository.UserRepository;
import com.mehmetkerem.util.CookieUtil;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "app.security.csrf.enabled=true")
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class CsrfIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void logoutRequiresCsrfToken() throws Exception {
        MvcResult tokenResult = mockMvc.perform(get("/v1/auth/csrf"))
                .andExpect(status().isOk())
                .andReturn();

        Cookie csrfCookie = tokenResult.getResponse().getCookie("XSRF-TOKEN");
        assertNotNull(csrfCookie);
        String token = objectMapper.readTree(tokenResult.getResponse().getContentAsString())
                .path("data").path("token").asText();

        mockMvc.perform(post("/v1/auth/logout").cookie(csrfCookie))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/v1/auth/logout")
                        .cookie(csrfCookie)
                        .header("X-XSRF-TOKEN", token))
                .andExpect(status().isOk());
    }

    @Test
    void passwordChangeClearsCookiesAndInvalidatesRefreshToken() throws Exception {
        String email = "password-change@test.com";
        createUser(email, "old-password");
        MvcResult loginResult = login(email, "old-password");
        Cookie accessCookie = requiredCookie(loginResult, CookieUtil.ACCESS_TOKEN_COOKIE);
        Cookie refreshCookie = requiredCookie(loginResult, CookieUtil.REFRESH_TOKEN_COOKIE);
        CsrfCredentials csrf = csrfCredentials();

        MvcResult changeResult = mockMvc.perform(post("/v1/auth/change-password")
                        .cookie(accessCookie, refreshCookie, csrf.cookie())
                        .header("X-XSRF-TOKEN", csrf.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "oldPassword": "old-password",
                                  "newPassword": "new-password"
                                }
                                """))
                .andExpect(status().isOk())
                .andReturn();

        assertEquals(0, requiredCookie(changeResult, CookieUtil.ACCESS_TOKEN_COOKIE).getMaxAge());
        assertEquals(0, requiredCookie(changeResult, CookieUtil.REFRESH_TOKEN_COOKIE).getMaxAge());

        mockMvc.perform(post("/v1/auth/refresh-token")
                        .cookie(refreshCookie, csrf.cookie())
                        .header("X-XSRF-TOKEN", csrf.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());

        login(email, "new-password");
    }

    @Test
    void logoutWithoutAccessTokenInvalidatesRefreshToken() throws Exception {
        String email = "refresh-logout@test.com";
        createUser(email, "password123");
        MvcResult loginResult = login(email, "password123");
        Cookie refreshCookie = requiredCookie(loginResult, CookieUtil.REFRESH_TOKEN_COOKIE);
        CsrfCredentials csrf = csrfCredentials();

        mockMvc.perform(post("/v1/auth/logout")
                        .cookie(refreshCookie, csrf.cookie())
                        .header("X-XSRF-TOKEN", csrf.token()))
                .andExpect(status().isOk());

        mockMvc.perform(post("/v1/auth/refresh-token")
                        .cookie(refreshCookie, csrf.cookie())
                        .header("X-XSRF-TOKEN", csrf.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());
    }

    private void createUser(String email, String password) {
        userRepository.save(User.builder()
                .email(email)
                .name("Auth Test")
                .passwordHash(passwordEncoder.encode(password))
                .role(Role.USER)
                .provider(AuthProvider.LOCAL)
                .build());
    }

    private MvcResult login(String email, String password) throws Exception {
        return mockMvc.perform(post("/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(java.util.Map.of(
                                "email", email,
                                "password", password))))
                .andExpect(status().isOk())
                .andReturn();
    }

    private CsrfCredentials csrfCredentials() throws Exception {
        MvcResult result = mockMvc.perform(get("/v1/auth/csrf"))
                .andExpect(status().isOk())
                .andReturn();
        String token = objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data").path("token").asText();
        return new CsrfCredentials(requiredCookie(result, "XSRF-TOKEN"), token);
    }

    private Cookie requiredCookie(MvcResult result, String name) {
        Cookie cookie = result.getResponse().getCookie(name);
        assertNotNull(cookie, () -> name + " cookie eksik");
        return cookie;
    }

    private record CsrfCredentials(Cookie cookie, String token) {
    }
}
