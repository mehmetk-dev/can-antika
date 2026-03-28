package com.mehmetkerem.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mehmetkerem.dto.request.LoginRequest;
import com.mehmetkerem.enums.Role;
import com.mehmetkerem.model.User;
import com.mehmetkerem.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
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

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@ActiveProfiles("test")
@SuppressWarnings("null")
class ApiSecurityContractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private String userToken;

    @BeforeEach
    void setUp() throws Exception {
        userRepository.deleteAll();

        User admin = User.builder()
                .email("admin.contract@test.com")
                .name("Admin")
                .passwordHash(passwordEncoder.encode("admin123"))
                .role(Role.ADMIN)
                .build();
        userRepository.save(admin);

        User user = User.builder()
                .email("user.contract@test.com")
                .name("User")
                .passwordHash(passwordEncoder.encode("user123"))
                .role(Role.USER)
                .build();
        userRepository.save(user);

        LoginRequest userLogin = new LoginRequest();
        userLogin.setEmail("user.contract@test.com");
        userLogin.setPassword("user123");
        MvcResult userRes = mockMvc.perform(post("/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userLogin)))
                .andExpect(status().isOk())
                .andReturn();
        userToken = objectMapper.readTree(userRes.getResponse().getContentAsString())
                .path("data").path("accessToken").asText();
    }

    @Test
    @DisplayName("401 - Auth olmadan korumali endpoint erisimi")
    void shouldReturn401ForUnauthenticatedRequest() throws Exception {
        mockMvc.perform(get("/v1/cart"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("403 - USER rolunun ADMIN endpointine erisimi")
    void shouldReturn403ForForbiddenRole() throws Exception {
        mockMvc.perform(get("/v1/address/find-all")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("400 - Gecersiz request body")
    void shouldReturn400ForInvalidRequest() throws Exception {
        mockMvc.perform(post("/v1/cart/items")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("quantity", 0))))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("404 - Olmayan kayit")
    void shouldReturn404ForMissingResource() throws Exception {
        mockMvc.perform(get("/v1/payment/999999")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("CORS - izinli origin preflight")
    void shouldAllowCorsPreflightForAllowedOrigin() throws Exception {
        mockMvc.perform(options("/v1/contact")
                        .header("Origin", "http://localhost:3000")
                        .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:3000"));
    }

    @Test
    @DisplayName("CORS - izin verilmeyen origin preflight")
    void shouldBlockCorsPreflightForDisallowedOrigin() throws Exception {
        MvcResult result = mockMvc.perform(options("/v1/contact")
                        .header("Origin", "http://evil.example")
                        .header("Access-Control-Request-Method", "POST"))
                .andReturn();

        assertNotEquals(500, result.getResponse().getStatus());
        assertNull(result.getResponse().getHeader("Access-Control-Allow-Origin"));
    }
}
