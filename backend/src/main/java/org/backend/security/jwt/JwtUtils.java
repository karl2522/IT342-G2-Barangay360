package org.backend.security.jwt;

import java.time.Instant;
import java.util.Date;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.backend.security.services.UserDetailsImpl;
import org.backend.payload.response.TokenDTO;
import jakarta.servlet.http.HttpServletRequest;

@Component
public class JwtUtils {
    private static final Logger logger = LoggerFactory.getLogger(JwtUtils.class);
    private static final String TOKEN_TYPE = "Bearer";
    private static final String ISSUER = "Barangay360";
    private static final String AUDIENCE = "Barangay360-Users";

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration}")
    private int jwtExpirationMs;

    @Value("${app.jwt.refresh-token.expiration}")
    private int refreshTokenExpirationMs;

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
                .signWith(Keys.hmacShaKeyFor(jwtSecret.getBytes()))
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
                .signWith(Keys.hmacShaKeyFor(jwtSecret.getBytes()))
                .compact();

        return new TokenDTO(token, TOKEN_TYPE, now, expiration, ISSUER, AUDIENCE);
    }

    public String getUserNameFromJwtToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(Keys.hmacShaKeyFor(jwtSecret.getBytes()))
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    public boolean validateJwtToken(String authToken) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(Keys.hmacShaKeyFor(jwtSecret.getBytes()))
                    .build()
                    .parseClaimsJws(authToken);
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
            Jwts.parserBuilder()
                    .setSigningKey(Keys.hmacShaKeyFor(jwtSecret.getBytes()))
                    .build()
                    .parseClaimsJws(refreshToken);
            return true;
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
                .signWith(Keys.hmacShaKeyFor(jwtSecret.getBytes()))
                .compact();

        return new TokenDTO(token, TOKEN_TYPE, now, expiration, ISSUER, AUDIENCE);
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