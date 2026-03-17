package com.secureauth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ApiKeyRequest {
    @NotBlank(message = "API key name is required")
    private String name;

    private String permissions;

    private LocalDateTime expiresAt;
}
