package com.secureauth.controller;

import com.secureauth.dto.MfaSetupResponse;
import com.secureauth.dto.MfaVerifyRequest;
import com.secureauth.security.CustomUserDetails;
import com.secureauth.service.MfaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/mfa")
@RequiredArgsConstructor
@Tag(name = "Multi-Factor Authentication", description = "MFA setup and verification endpoints")
public class MfaController {

    private final MfaService mfaService;

    @PostMapping("/setup")
    @Operation(summary = "Generate MFA secret and QR code URI")
    public ResponseEntity<MfaSetupResponse> setup(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(mfaService.setupMfa(userDetails.getId()));
    }

    @PostMapping("/verify")
    @Operation(summary = "Verify MFA code and enable MFA")
    public ResponseEntity<Map<String, String>> verify(@AuthenticationPrincipal CustomUserDetails userDetails,
                                                       @Valid @RequestBody MfaVerifyRequest request,
                                                       HttpServletRequest httpRequest) {
        mfaService.verifyAndEnableMfa(userDetails.getId(), request.getCode(), httpRequest.getRemoteAddr());
        return ResponseEntity.ok(Map.of("message", "MFA enabled successfully"));
    }
}
