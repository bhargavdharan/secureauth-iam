package com.secureauth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ApiKeyResponse {
    private Long id;
    private String name;
    private String prefix;
    private String key; // only populated on creation
    private String permissions;
    private boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
}
