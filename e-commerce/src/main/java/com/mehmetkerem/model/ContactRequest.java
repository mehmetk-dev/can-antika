package com.mehmetkerem.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "contact_requests")
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ContactRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "İsim boş bırakılamaz")
    @Size(max = 100, message = "İsim en fazla 100 karakter olabilir")
    private String name;

    @NotBlank(message = "E-posta boş bırakılamaz")
    @Email(message = "Geçerli bir e-posta adresi giriniz")
    private String email;

    private String phone;

    @NotBlank(message = "Konu boş bırakılamaz")
    @Size(max = 200, message = "Konu en fazla 200 karakter olabilir")
    private String subject;

    @NotBlank(message = "Mesaj boş bırakılamaz")
    @Size(max = 2000, message = "Mesaj en fazla 2000 karakter olabilir")
    @Column(columnDefinition = "TEXT")
    private String message;

    @Builder.Default
    private boolean read = false;

    private String adminNote;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
