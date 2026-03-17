package com.secureauth.service;

import com.secureauth.dto.*;
import com.secureauth.exception.BadRequestException;
import com.secureauth.model.Role;
import com.secureauth.model.User;
import com.secureauth.repository.RoleRepository;
import com.secureauth.repository.UserRepository;
import com.secureauth.security.CustomUserDetails;
import com.secureauth.security.JwtTokenProvider;
import dev.samstevens.totp.code.CodeVerifier;
import dev.samstevens.totp.code.DefaultCodeGenerator;
import dev.samstevens.totp.code.DefaultCodeVerifier;
import dev.samstevens.totp.time.SystemTimeProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final AuditService auditService;

    @Transactional
    public AuthResponse register(RegisterRequest request, String ipAddress) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already registered");
        }

        Role userRole = roleRepository.findByName("USER")
            .orElseThrow(() -> new BadRequestException("Default role not found"));

        User user = User.builder()
            .firstName(request.getFirstName())
            .lastName(request.getLastName())
            .email(request.getEmail())
            .password(passwordEncoder.encode(request.getPassword()))
            .roles(Set.of(userRole))
            .build();

        user = userRepository.save(user);

        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        String accessToken = tokenProvider.generateAccessToken(authentication);
        String refreshToken = tokenProvider.generateRefreshToken(authentication);

        auditService.log(user.getId(), "USER_REGISTERED", "USER", "New user registered: " + user.getEmail(), ipAddress);

        return AuthResponse.builder()
            .accessToken(accessToken)
            .refreshToken(refreshToken)
            .tokenType("Bearer")
            .user(mapToUserResponse(user))
            .build();
    }

    public AuthResponse login(LoginRequest request, String ipAddress) {
        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new BadRequestException("Invalid email or password"));

        if (user.isMfaEnabled()) {
            if (request.getMfaCode() == null || request.getMfaCode().isBlank()) {
                return AuthResponse.builder().mfaRequired(true).build();
            }
            CodeVerifier verifier = new DefaultCodeVerifier(new DefaultCodeGenerator(), new SystemTimeProvider());
            if (!verifier.isValidCode(user.getMfaSecret(), request.getMfaCode())) {
                throw new BadRequestException("Invalid MFA code");
            }
        }

        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        String accessToken = tokenProvider.generateAccessToken(authentication);
        String refreshToken = tokenProvider.generateRefreshToken(authentication);

        auditService.log(user.getId(), "USER_LOGIN", "AUTH", "User logged in", ipAddress);

        return AuthResponse.builder()
            .accessToken(accessToken)
            .refreshToken(refreshToken)
            .tokenType("Bearer")
            .user(mapToUserResponse(user))
            .build();
    }

    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String token = request.getRefreshToken();

        if (!tokenProvider.validateToken(token) || !"refresh".equals(tokenProvider.getTokenType(token))) {
            throw new BadRequestException("Invalid refresh token");
        }

        Long userId = tokenProvider.getUserIdFromToken(token);
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new BadRequestException("User not found"));

        String roles = user.getRoles().stream().map(Role::getName).collect(Collectors.joining(","));
        String accessToken = tokenProvider.generateAccessTokenFromUserId(userId, user.getEmail(), roles);

        return AuthResponse.builder()
            .accessToken(accessToken)
            .refreshToken(token)
            .tokenType("Bearer")
            .user(mapToUserResponse(user))
            .build();
    }

    public UserResponse getCurrentUser(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new BadRequestException("User not found"));
        return mapToUserResponse(user);
    }

    public static UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
            .id(user.getId())
            .email(user.getEmail())
            .firstName(user.getFirstName())
            .lastName(user.getLastName())
            .enabled(user.isEnabled())
            .mfaEnabled(user.isMfaEnabled())
            .roles(user.getRoles().stream().map(Role::getName).collect(Collectors.toSet()))
            .createdAt(user.getCreatedAt())
            .build();
    }
}
