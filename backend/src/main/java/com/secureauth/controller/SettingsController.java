package com.secureauth.controller;

import com.secureauth.dto.PasswordChangeRequest;
import com.secureauth.dto.UserResponse;
import com.secureauth.dto.UserUpdateRequest;
import com.secureauth.security.CustomUserDetails;
import com.secureauth.service.MfaService;
import com.secureauth.service.UserService;
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
@RequestMapping("/api/settings")
@RequiredArgsConstructor
@Tag(name = "Settings", description = "User settings and profile management")
public class SettingsController {

    private final UserService userService;
    private final MfaService mfaService;

    @PutMapping("/profile")
    @Operation(summary = "Update own profile")
    public ResponseEntity<UserResponse> updateProfile(@AuthenticationPrincipal CustomUserDetails userDetails,
                                                       @Valid @RequestBody UserUpdateRequest request,
                                                       HttpServletRequest httpRequest) {
        return ResponseEntity.ok(userService.updateUser(userDetails.getId(), request, httpRequest.getRemoteAddr()));
    }

    @PutMapping("/password")
    @Operation(summary = "Change password")
    public ResponseEntity<Map<String, String>> changePassword(@AuthenticationPrincipal CustomUserDetails userDetails,
                                                               @Valid @RequestBody PasswordChangeRequest request,
                                                               HttpServletRequest httpRequest) {
        userService.changePassword(userDetails.getId(), request, httpRequest.getRemoteAddr());
        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }

    @DeleteMapping("/mfa")
    @Operation(summary = "Disable MFA")
    public ResponseEntity<Map<String, String>> disableMfa(@AuthenticationPrincipal CustomUserDetails userDetails,
                                                           HttpServletRequest httpRequest) {
        mfaService.disableMfa(userDetails.getId(), httpRequest.getRemoteAddr());
        return ResponseEntity.ok(Map.of("message", "MFA disabled successfully"));
    }
}
