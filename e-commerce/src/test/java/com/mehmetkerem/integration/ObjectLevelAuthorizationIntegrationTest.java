package com.mehmetkerem.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mehmetkerem.dto.request.LoginRequest;
import com.mehmetkerem.enums.OrderStatus;
import com.mehmetkerem.enums.PaymentMethod;
import com.mehmetkerem.enums.PaymentStatus;
import com.mehmetkerem.enums.Role;
import com.mehmetkerem.model.Address;
import com.mehmetkerem.model.Order;
import com.mehmetkerem.model.Payment;
import com.mehmetkerem.model.User;
import com.mehmetkerem.repository.AddressRepository;
import com.mehmetkerem.repository.OrderRepository;
import com.mehmetkerem.repository.PaymentRepository;
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

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@ActiveProfiles("test")
@SuppressWarnings("null")
class ObjectLevelAuthorizationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AddressRepository addressRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private String attackerToken;
    private Long victimAddressId;
    private Long victimPaymentId;
    private Long victimOrderId;

    @BeforeEach
    void setUp() throws Exception {
        paymentRepository.deleteAll();
        orderRepository.deleteAll();
        addressRepository.deleteAll();
        userRepository.deleteAll();

        User victim = userRepository.save(User.builder()
                .email("victim.idor@test.com")
                .name("Victim")
                .passwordHash(passwordEncoder.encode("victim123"))
                .role(Role.USER)
                .build());

        User attacker = userRepository.save(User.builder()
                .email("attacker.idor@test.com")
                .name("Attacker")
                .passwordHash(passwordEncoder.encode("attacker123"))
                .role(Role.USER)
                .build());

        attackerToken = loginAndGetAccessToken(attacker.getEmail(), "attacker123");

        Address victimAddress = addressRepository.save(Address.builder()
                .title("Ev")
                .country("TR")
                .city("Istanbul")
                .district("Besiktas")
                .addressLine("Test Sokak No:1")
                .postalCode("34000")
                .userId(victim.getId())
                .build());
        victimAddressId = victimAddress.getId();

        Order victimOrder = orderRepository.save(Order.builder()
                .userId(victim.getId())
                .orderDate(LocalDateTime.now())
                .orderStatus(OrderStatus.PENDING)
                .paymentStatus(PaymentStatus.PENDING)
                .shippingAddress(victimAddress)
                .totalAmount(new BigDecimal("199.99"))
                .orderItems(List.of())
                .build());
        victimOrderId = victimOrder.getId();

        Payment victimPayment = paymentRepository.save(Payment.builder()
                .orderId(victimOrderId)
                .userId(victim.getId())
                .amount(new BigDecimal("199.99"))
                .paymentMethod(PaymentMethod.EFT)
                .paymentStatus(PaymentStatus.PAID)
                .build());
        victimPaymentId = victimPayment.getId();
    }

    @Test
    @DisplayName("IDOR - baska kullanicinin adresine erisim engellenmeli")
    void shouldBlockAddressAccessOfAnotherUser() throws Exception {
        mockMvc.perform(get("/v1/address/{id}", victimAddressId)
                        .header("Authorization", "Bearer " + attackerToken))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("IDOR - baska kullanicinin odemesine erisim engellenmeli")
    void shouldBlockPaymentAccessOfAnotherUser() throws Exception {
        mockMvc.perform(get("/v1/payment/{paymentId}", victimPaymentId)
                        .header("Authorization", "Bearer " + attackerToken))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("IDOR - baska kullanicinin siparis timeline erisimi engellenmeli")
    void shouldBlockOrderTimelineAccessOfAnotherUser() throws Exception {
        mockMvc.perform(get("/v1/order/{orderId}/timeline", victimOrderId)
                        .header("Authorization", "Bearer " + attackerToken))
                .andExpect(status().isBadRequest());
    }

    private String loginAndGetAccessToken(String email, String password) throws Exception {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail(email);
        loginRequest.setPassword(password);

        MvcResult result = mockMvc.perform(post("/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data")
                .path("accessToken")
                .asText();
    }
}
