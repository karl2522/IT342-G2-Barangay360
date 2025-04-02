package org.backend.security.jwt;

import java.security.Key;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;
import java.util.stream.Collectors;

import javax.annotation.PostConstruct;

import org.backend.payload.response.TokenDTO;
import org.backend.security.services.UserDetailsImpl;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.http.HttpServletRequest;

@Component
public class JwtUtils {
    private static final Logger logger = LoggerFactory.getLogger(JwtUtils.class);
    private static final String TOKEN_TYPE = "Bearer";
    private static final String ISSUER = "Barangay360";
    private static final String AUDIENCE = "Barangay360-Users";

    @Autowired
    private TokenBlacklist tokenBlacklist;

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.key-size}")
    private int keySize;

    @Value("${app.jwt.access-token.expiration}")
    private int jwtExpirationMs;

    @Value("${app.jwt.refresh-token.expiration}")
    private int refreshTokenExpirationMs;

    private Key key;

    @PostConstruct
    public void init() {
        // Use the configured secret if provided, otherwise generate a secure key
        if ("your-256-bit-secret".equals(jwtSecret)) {
            byte[] keyBytes = new byte[keySize / 8];
            SecureRandom secureRandom = new SecureRandom();
            secureRandom.nextBytes(keyBytes);
            this.key = Keys.hmacShaKeyFor(keyBytes);
            logger.info("Using generated secure key for JWT signing");
        } else {
            this.key = Keys.hmacShaKeyFor(jwtSecret.getBytes());
            logger.info("Using configured secret key for JWT signing");
        }
    }

    public TokenDTO generateJwtToken(Authentication authentication) {
        UserDetailsImpl userPrincipal = (UserDetailsImpl) authentication.getPrincipal();
        Instant now = Instant.now();
        Instant expiration = now.plusMillis(jwtExpirationMs);

        String token = Jwts.builder()
                .setSubject(userPrincipal.getUsername())
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(expiration))
                .setIssuer(ISSUER)
                .setAudience(AUDIENCE)
                .setId(UUID.randomUUID().toString())
                .claim("roles", userPrincipal.getAuthorities().stream()
                        .map(GrantedAuthority::getAuthority)
                        .collect(Collectors.toList()))
                .signWith(key)
                .compact();

        return new TokenDTO(token, TOKEN_TYPE, now, expiration, ISSUER, AUDIENCE);
    }

    public TokenDTO generateRefreshToken(Authentication authentication) {
        UserDetailsImpl userPrincipal = (UserDetailsImpl) authentication.getPrincipal();
        Instant now = Instant.now();
        Instant expiration = now.plusMillis(refreshTokenExpirationMs);

        String token = Jwts.builder()
                .setSubject(userPrincipal.getUsername())
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(expiration))
                .setIssuer(ISSUER)
                .setAudience(AUDIENCE)
                .setId(UUID.randomUUID().toString())
                .claim("type", "REFRESH")
                .signWith(key)
                .compact();

        return new TokenDTO(token, TOKEN_TYPE, now, expiration, ISSUER, AUDIENCE);
    }

    public String getUserNameFromJwtToken(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(key)
                .requireIssuer(ISSUER)
                .requireAudience(AUDIENCE)
                .build()
                .parseClaimsJws(token)
                .getBody();
        return claims.getSubject();
    }

    public boolean validateJwtToken(String authToken) {
        if (tokenBlacklist.isBlacklisted(authToken)) {
            logger.error("Token is blacklisted");
            return false;
        }

        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(key)
                    .requireIssuer(ISSUER)
                    .requireAudience(AUDIENCE)
                    .build()
                    .parseClaimsJws(authToken)
                    .getBody();

            // Check if it's a refresh token
            if (claims.get("type") != null && "REFRESH".equals(claims.get("type"))) {
                return false;
            }
            return true;
        } catch (SecurityException e) {
            logger.error("Invalid JWT signature: {}", e.getMessage());
        } catch (MalformedJwtException e) {
            logger.error("Invalid JWT token: {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            logger.error("JWT token is expired: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            logger.error("JWT token is unsupported: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            logger.error("JWT claims string is empty: {}", e.getMessage());
        }

        return false;
    }

    public boolean validateRefreshToken(String refreshToken) {
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(key)
                    .requireIssuer(ISSUER)
                    .requireAudience(AUDIENCE)
                    .build()
                    .parseClaimsJws(refreshToken)
                    .getBody();

            // Verify it's a refresh token
            return claims.get("type") != null && "REFRESH".equals(claims.get("type"));
        } catch (Exception e) {
            logger.error("Invalid refresh token: {}", e.getMessage());
            return false;
        }
    }

    public TokenDTO generateTokenFromUsername(String username) {
        Instant now = Instant.now();
        Instant expiration = now.plusMillis(jwtExpirationMs);

        String token = Jwts.builder()
                .setSubject(username)
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(expiration))
                .setIssuer(ISSUER)
                .setAudience(AUDIENCE)
                .setId(UUID.randomUUID().toString())
                .signWith(key)
                .compact();

        return new TokenDTO(token, TOKEN_TYPE, now, expiration, ISSUER, AUDIENCE);
    }
    
    public void blacklistToken(String token) {
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
            Instant expiry = claims.getExpiration().toInstant();
            tokenBlacklist.blacklist(token, expiry);
        } catch (Exception e) {
            logger.error("Error blacklisting token: {}", e.getMessage());
        }
    }

    public String parseJwt(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");

        if (StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
            return headerAuth.substring(7);
        }

        return null;
    }

    public long getRefreshTokenExpirationMs() {
        return refreshTokenExpirationMs;
    }
}
