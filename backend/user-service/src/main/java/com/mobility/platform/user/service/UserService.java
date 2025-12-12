package com.mobility.platform.user.service;

import com.mobility.platform.common.dto.PageResponse;
import com.mobility.platform.common.enums.UserRole;
import com.mobility.platform.common.event.EventPublisher;
import com.mobility.platform.common.exception.BusinessException;
import com.mobility.platform.common.exception.ResourceNotFoundException;
import com.mobility.platform.common.exception.UnauthorizedException;
import com.mobility.platform.common.security.JwtUtil;
import com.mobility.platform.user.dto.*;
import com.mobility.platform.user.entity.User;
import com.mobility.platform.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * User service implementation
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final EventPublisher eventPublisher;
    
    @Transactional
    public AuthResponse register(UserRegistrationRequest request) {
        log.info("Registering new user with email: {}", request.getEmail());
        
        // Check if user already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("Email already registered", "EMAIL_EXISTS");
        }
        
        if (userRepository.existsByPhoneNumber(request.getPhoneNumber())) {
            throw new BusinessException("Phone number already registered", "PHONE_EXISTS");
        }
        
        // Create new user
        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setAddress(request.getAddress());
        user.setCity(request.getCity());
        user.setCountry(request.getCountry());
        user.setZipCode(request.getZipCode());
        user.setDriverLicenseNumber(request.getDriverLicenseNumber());
        user.setRole(UserRole.CUSTOMER);
        user.setActive(true);
        
        user = userRepository.save(user);
        
        // Publish user registered event
        Map<String, Object> eventData = new HashMap<>();
        eventData.put("userId", user.getId());
        eventData.put("email", user.getEmail());
        eventData.put("role", user.getRole());
        eventPublisher.publishUserEvent("registered", eventData);
        
        log.info("User registered successfully with ID: {}", user.getId());
        
        // Generate JWT token
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getId());
        claims.put("role", user.getRole());
        String token = jwtUtil.generateToken(user.getEmail(), claims);
        
        return AuthResponse.builder()
                .token(token)
                .expiresIn(86400000L) // 24 hours
                .user(mapToResponse(user))
                .build();
    }
    
    public AuthResponse login(LoginRequest request) {
        log.info("User login attempt: {}", request.getEmailOrPhone());
        
        // Find user by email or phone
        User user = userRepository.findByEmail(request.getEmailOrPhone())
                .or(() -> userRepository.findByPhoneNumber(request.getEmailOrPhone()))
                .orElseThrow(() -> new UnauthorizedException("Invalid credentials"));
        
        // Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new UnauthorizedException("Invalid credentials");
        }
        
        // Check if user is active
        if (!user.getActive()) {
            throw new BusinessException("Account is deactivated", "ACCOUNT_INACTIVE");
        }
        
        // Generate JWT token
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getId());
        claims.put("role", user.getRole());
        String token = jwtUtil.generateToken(user.getEmail(), claims);
        
        log.info("User logged in successfully: {}", user.getId());
        
        return AuthResponse.builder()
                .token(token)
                .expiresIn(86400000L)
                .user(mapToResponse(user))
                .build();
    }
    
    public UserResponse getUserById(Long id) {
        log.info("Fetching user by ID: {}", id);
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        return mapToResponse(user);
    }
    
    public UserResponse getUserByEmail(String email) {
        log.info("Fetching user by email: {}", email);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
        return mapToResponse(user);
    }
    
    public PageResponse<UserResponse> getAllUsers(Pageable pageable) {
        log.info("Fetching all users with pagination");
        Page<User> userPage = userRepository.findAll(pageable);
        
        List<UserResponse> users = userPage.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
        
        return PageResponse.<UserResponse>builder()
                .content(users)
                .pageNumber(userPage.getNumber())
                .pageSize(userPage.getSize())
                .totalElements(userPage.getTotalElements())
                .totalPages(userPage.getTotalPages())
                .first(userPage.isFirst())
                .last(userPage.isLast())
                .empty(userPage.isEmpty())
                .build();
    }
    
    @Transactional
    public UserResponse updateUser(Long id, UserRegistrationRequest request) {
        log.info("Updating user: {}", id);
        
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        
        // Update fields
        if (request.getFirstName() != null) {
            user.setFirstName(request.getFirstName());
        }
        if (request.getLastName() != null) {
            user.setLastName(request.getLastName());
        }
        if (request.getAddress() != null) {
            user.setAddress(request.getAddress());
        }
        if (request.getCity() != null) {
            user.setCity(request.getCity());
        }
        if (request.getCountry() != null) {
            user.setCountry(request.getCountry());
        }
        if (request.getZipCode() != null) {
            user.setZipCode(request.getZipCode());
        }
        if (request.getDriverLicenseNumber() != null) {
            user.setDriverLicenseNumber(request.getDriverLicenseNumber());
        }
        
        user = userRepository.save(user);
        log.info("User updated successfully: {}", id);
        
        return mapToResponse(user);
    }
    
    @Transactional
    public void deactivateUser(Long id) {
        log.info("Deactivating user: {}", id);
        
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        
        user.setActive(false);
        userRepository.save(user);
        
        log.info("User deactivated successfully: {}", id);
    }
    
    private UserResponse mapToResponse(User user) {
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setEmail(user.getEmail());
        response.setFirstName(user.getFirstName());
        response.setLastName(user.getLastName());
        response.setPhoneNumber(user.getPhoneNumber());
        response.setAddress(user.getAddress());
        response.setCity(user.getCity());
        response.setCountry(user.getCountry());
        response.setZipCode(user.getZipCode());
        response.setRole(user.getRole());
        response.setActive(user.getActive());
        response.setEmailVerified(user.getEmailVerified());
        response.setPhoneVerified(user.getPhoneVerified());
        response.setProfileImageUrl(user.getProfileImageUrl());
        response.setDriverLicenseNumber(user.getDriverLicenseNumber());
        response.setDriverLicenseExpiry(user.getDriverLicenseExpiry());
        response.setKycVerified(user.getKycVerified());
        response.setCreatedAt(user.getCreatedAt());
        response.setUpdatedAt(user.getUpdatedAt());
        return response;
    }
}






