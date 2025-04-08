package org.backend.payload.response;

import java.util.List;

import lombok.Data;

@Data
public class JwtResponse {
    private TokenDTO accessToken;
    private TokenDTO refreshToken;
    private Long id;
    private String username;
    private String email;
    private List<String> roles;
    private String firstName;
    private String lastName;
    private String phone;
    private String address;
    private boolean isActive;
    private String profileImage;

    public JwtResponse(TokenDTO accessToken, TokenDTO refreshToken, Long id, String username, String email, List<String> roles, 
                       String firstName, String lastName, String phone, String address, boolean isActive, String profileImage) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.id = id;
        this.username = username;
        this.email = email;
        this.roles = roles;
        this.firstName = firstName;
        this.lastName = lastName;
        this.phone = phone;
        this.address = address;
        this.isActive = isActive;
        this.profileImage = profileImage;
    }

    public TokenDTO getAccessToken() {
        return accessToken;
    }

    public void setAccessToken(TokenDTO accessToken) {
        this.accessToken = accessToken;
    }

    public TokenDTO getRefreshToken() {
        return refreshToken;
    }

    public void setRefreshToken(TokenDTO refreshToken) {
        this.refreshToken = refreshToken;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public List<String> getRoles() {
        return roles;
    }

    public void setRoles(List<String> roles) {
        this.roles = roles;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean active) {
        isActive = active;
    }

    public String getProfileImage() {
        return profileImage;
    }

    public void setProfileImage(String profileImage) {
        this.profileImage = profileImage;
    }

    public String getFullName() {
        return firstName + " " + lastName;
    }
} 