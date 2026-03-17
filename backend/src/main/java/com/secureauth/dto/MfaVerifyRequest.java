package com.secureauth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class MfaVerifyRequest {
    @NotBlank(message = "MFA code is required")
    private String code;
}
