package com.secureauth.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.stream.Collectors;

@Component
public class JwtTokenProvider {

    private final SecretKey key;
    private final long accessTokenExpiration;
    private final long refreshTokenExpiration;

    public JwtTokenProvider(
        @Value("${app.jwt.secret}") String secret,
        @Value("${app.jwt.access-token-expiration}") long accessTokenExpiration,
        @Value("${app.jwt.refresh-token-expiration}") long refreshTokenExpiration
    ) {
        this.key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret));
        this.accessTokenExpiration = accessTokenExpiration;
        this.refreshTokenExpiration = refreshTokenExpiration;
    }

    public String generateAccessToken(Authentication authentication) {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        return buildToken(userDetails, accessTokenExpiration, "access");
    }

    public String generateRefreshToken(Authentication authentication) {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        return buildToken(userDetails, refreshTokenExpiration, "refresh");
    }

    public String generateAccessTokenFromUserId(Long userId, String email, String roles) {
        Date now = new Date();
        return Jwts.builder()
            .subject(String.valueOf(userId))
            .claim("email", email)
            .claim("roles", roles)
            .claim("type", "access")
            .issuedAt(now)
            .expiration(new Date(now.getTime() + accessTokenExpiration))
            .signWith(key)
            .compact();
    }

    private String buildToken(CustomUserDetails userDetails, long expiration, String type) {
        Date now = new Date();
        String roles = userDetails.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .collect(Collectors.joining(","));

        return Jwts.builder()
            .subject(String.valueOf(userDetails.getId()))
            .claim("email", userDetails.getUsername())
            .claim("roles", roles)
            .claim("type", type)
            .issuedAt(now)
            .expiration(new Date(now.getTime() + expiration))
            .signWith(key)
            .compact();
    }

    public Long getUserIdFromToken(String token) {
        Claims claims = parseToken(token);
        return Long.parseLong(claims.getSubject());
    }

    public String getTokenType(String token) {
        Claims claims = parseToken(token);
        return claims.get("type", String.class);
    }

    public boolean validateToken(String token) {
        try {
            parseToken(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    private Claims parseToken(String token) {
        return Jwts.parser()
            .verifyWith(key)
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }
}
