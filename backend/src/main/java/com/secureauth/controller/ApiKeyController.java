package com.secureauth.controller;

import com.secureauth.dto.ApiKeyRequest;
import com.secureauth.dto.ApiKeyResponse;
import com.secureauth.security.CustomUserDetails;
import com.secureauth.service.ApiKeyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/api-keys")
@RequiredArgsConstructor
@Tag(name = "API Keys", description = "Endpoints for managing API keys")
public class ApiKeyController {

    private final ApiKeyService apiKeyService;

    @GetMapping
    @Operation(summary = "List user's API keys")
    public ResponseEntity<List<ApiKeyResponse>> getKeys(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(apiKeyService.getUserKeys(userDetails.getId()));
    }

    @PostMapping
    @Operation(summary = "Generate a new API key")
    public ResponseEntity<ApiKeyResponse> createKey(@AuthenticationPrincipal CustomUserDetails userDetails,
                                                     @Valid @RequestBody ApiKeyRequest request,
                                                     HttpServletRequest httpRequest) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(apiKeyService.createKey(userDetails.getId(), request, httpRequest.getRemoteAddr()));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Revoke an API key")
    public ResponseEntity<Void> revokeKey(@AuthenticationPrincipal CustomUserDetails userDetails,
                                           @PathVariable Long id,
                                           HttpServletRequest httpRequest) {
        apiKeyService.revokeKey(userDetails.getId(), id, httpRequest.getRemoteAddr());
        return ResponseEntity.noContent().build();
    }
}
