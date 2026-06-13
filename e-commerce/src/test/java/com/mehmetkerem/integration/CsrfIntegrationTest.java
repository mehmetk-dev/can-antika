package com.mehmetkerem.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "app.security.csrf.enabled=true")
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CsrfIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

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
}
