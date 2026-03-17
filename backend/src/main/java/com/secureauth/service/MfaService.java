package com.secureauth.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.secureauth.dto.MfaSetupResponse;
import com.secureauth.exception.BadRequestException;
import com.secureauth.exception.ResourceNotFoundException;
import com.secureauth.model.User;
import com.secureauth.repository.UserRepository;
import dev.samstevens.totp.code.CodeVerifier;
import dev.samstevens.totp.code.DefaultCodeGenerator;
import dev.samstevens.totp.code.DefaultCodeVerifier;
import dev.samstevens.totp.secret.DefaultSecretGenerator;
import dev.samstevens.totp.secret.SecretGenerator;
import dev.samstevens.totp.time.SystemTimeProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Service
@RequiredArgsConstructor
@Slf4j
public class MfaService {

    private static final String ISSUER = "SecureAuth IAM";
    private static final int QR_WIDTH = 300;
    private static final int QR_HEIGHT = 300;

    private final UserRepository userRepository;
    private final AuditService auditService;

    public MfaSetupResponse setupMfa(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.isMfaEnabled()) {
            throw new BadRequestException("MFA is already enabled");
        }

        SecretGenerator secretGenerator = new DefaultSecretGenerator();
        String secret = secretGenerator.generate();

        user.setMfaSecret(secret);
        userRepository.save(user);

        String otpAuthUri = buildOtpAuthUri(user.getEmail(), secret);
        String qrCodeBase64 = generateQrCodeBase64(otpAuthUri);

        return MfaSetupResponse.builder()
            .secret(secret)
            .qrCodeUri(otpAuthUri)
            .qrCodeImage(qrCodeBase64)
            .build();
    }

    @Transactional
    public void verifyAndEnableMfa(Long userId, String code, String ipAddress) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getMfaSecret() == null) {
            throw new BadRequestException("MFA setup not initiated. Call /api/mfa/setup first.");
        }

        CodeVerifier verifier = new DefaultCodeVerifier(new DefaultCodeGenerator(), new SystemTimeProvider());
        if (!verifier.isValidCode(user.getMfaSecret(), code)) {
            throw new BadRequestException("Invalid MFA code. Please try again.");
        }

        user.setMfaEnabled(true);
        userRepository.save(user);

        auditService.log(userId, "MFA_ENABLED", "AUTH", "MFA enabled for user", ipAddress);
    }

    @Transactional
    public void disableMfa(Long userId, String ipAddress) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setMfaEnabled(false);
        user.setMfaSecret(null);
        userRepository.save(user);

        auditService.log(userId, "MFA_DISABLED", "AUTH", "MFA disabled for user", ipAddress);
    }

    private String buildOtpAuthUri(String email, String secret) {
        String encodedIssuer = URLEncoder.encode(ISSUER, StandardCharsets.UTF_8);
        String encodedEmail = URLEncoder.encode(email, StandardCharsets.UTF_8);
        return String.format(
            "otpauth://totp/%s:%s?secret=%s&issuer=%s&algorithm=SHA1&digits=6&period=30",
            encodedIssuer, encodedEmail, secret, encodedIssuer
        );
    }

    private String generateQrCodeBase64(String otpAuthUri) {
        try {
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            BitMatrix bitMatrix = qrCodeWriter.encode(otpAuthUri, BarcodeFormat.QR_CODE, QR_WIDTH, QR_HEIGHT);

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", outputStream);

            return "data:image/png;base64," + Base64.getEncoder().encodeToString(outputStream.toByteArray());
        } catch (WriterException | IOException e) {
            log.error("Failed to generate QR code", e);
            throw new BadRequestException("Failed to generate QR code");
        }
    }
}
