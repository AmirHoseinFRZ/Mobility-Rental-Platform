package com.mobility.platform.user.controller;

import com.mobility.platform.common.dto.ApiResponse;
import com.mobility.platform.common.dto.PageResponse;
import com.mobility.platform.user.dto.*;
import com.mobility.platform.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * User REST controller
 */
@RestController
@RequestMapping
@RequiredArgsConstructor
@Tag(name = "User Management", description = "User registration, authentication, and profile management")
public class UserController {
    
    private final UserService userService;
    
    @PostMapping("/register")
    @Operation(summary = "Register new user")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody UserRegistrationRequest request) {
        AuthResponse response = userService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("User registered successfully", response));
    }
    
    @PostMapping("/login")
    @Operation(summary = "User login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request) {
        AuthResponse response = userService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Get user by ID")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable Long id) {
        UserResponse response = userService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    @GetMapping("/email/{email}")
    @Operation(summary = "Get user by email")
    public ResponseEntity<ApiResponse<UserResponse>> getUserByEmail(@PathVariable String email) {
        UserResponse response = userService.getUserByEmail(email);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    @GetMapping
    @Operation(summary = "Get all users with pagination")
    public ResponseEntity<ApiResponse<PageResponse<UserResponse>>> getAllUsers(
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {
        PageResponse<UserResponse> response = userService.getAllUsers(pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    @PutMapping("/{id}")
    @Operation(summary = "Update user profile")
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UserRegistrationRequest request) {
        UserResponse response = userService.updateUser(id, request);
        return ResponseEntity.ok(ApiResponse.success("User updated successfully", response));
    }
    
    @DeleteMapping("/{id}")
    @Operation(summary = "Deactivate user")
    public ResponseEntity<ApiResponse<Void>> deactivateUser(@PathVariable Long id) {
        userService.deactivateUser(id);
        return ResponseEntity.ok(ApiResponse.success("User deactivated successfully", null));
    }
    
    @GetMapping("/health")
    @Operation(summary = "Health check")
    public ResponseEntity<ApiResponse<String>> health() {
        return ResponseEntity.ok(ApiResponse.success("User service is running", "OK"));
    }
}


