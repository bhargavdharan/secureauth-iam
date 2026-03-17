package com.secureauth.service;

import com.secureauth.dto.ApiKeyRequest;
import com.secureauth.dto.ApiKeyResponse;
import com.secureauth.exception.BadRequestException;
import com.secureauth.exception.ResourceNotFoundException;
import com.secureauth.model.ApiKey;
import com.secureauth.repository.ApiKeyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ApiKeyService {

    private final ApiKeyRepository apiKeyRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    public List<ApiKeyResponse> getUserKeys(Long userId) {
        return apiKeyRepository.findByUserId(userId).stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    @Transactional
    public ApiKeyResponse createKey(Long userId, ApiKeyRequest request, String ipAddress) {
        SecureRandom random = new SecureRandom();
        byte[] keyBytes = new byte[32];
        random.nextBytes(keyBytes);
        String rawKey = Base64.getUrlEncoder().withoutPadding().encodeToString(keyBytes);
        String prefix = rawKey.substring(0, 8);

        ApiKey apiKey = ApiKey.builder()
            .userId(userId)
            .name(request.getName())
            .keyHash(passwordEncoder.encode(rawKey))
            .prefix(prefix)
            .permissions(request.getPermissions())
            .expiresAt(request.getExpiresAt())
            .build();

        apiKey = apiKeyRepository.save(apiKey);

        auditService.log(userId, "API_KEY_CREATED", "API_KEY", "API key created: " + request.getName(), ipAddress);

        ApiKeyResponse response = mapToResponse(apiKey);
        response.setKey("sa_" + rawKey); // only returned on creation
        return response;
    }

    @Transactional
    public void revokeKey(Long userId, Long keyId, String ipAddress) {
        ApiKey apiKey = apiKeyRepository.findById(keyId)
            .orElseThrow(() -> new ResourceNotFoundException("API key not found"));

        if (!apiKey.getUserId().equals(userId)) {
            throw new BadRequestException("You can only revoke your own API keys");
        }

        apiKey.setActive(false);
        apiKeyRepository.save(apiKey);

        auditService.log(userId, "API_KEY_REVOKED", "API_KEY", "API key revoked: " + apiKey.getName(), ipAddress);
    }

    private ApiKeyResponse mapToResponse(ApiKey apiKey) {
        return ApiKeyResponse.builder()
            .id(apiKey.getId())
            .name(apiKey.getName())
            .prefix(apiKey.getPrefix())
            .permissions(apiKey.getPermissions())
            .active(apiKey.isActive())
            .createdAt(apiKey.getCreatedAt())
            .expiresAt(apiKey.getExpiresAt())
            .build();
    }
}
