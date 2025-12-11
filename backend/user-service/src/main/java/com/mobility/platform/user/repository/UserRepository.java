package com.mobility.platform.user.repository;

import com.mobility.platform.common.enums.UserRole;
import com.mobility.platform.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * User repository
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    Optional<User> findByEmail(String email);
    
    Optional<User> findByPhoneNumber(String phoneNumber);
    
    boolean existsByEmail(String email);
    
    boolean existsByPhoneNumber(String phoneNumber);
    
    List<User> findByRole(UserRole role);
    
    List<User> findByActive(Boolean active);
    
    @Query("SELECT u FROM User u WHERE u.role = :role AND u.active = true")
    List<User> findActiveUsersByRole(UserRole role);
    
    @Query("SELECT u FROM User u WHERE u.kycVerified = true AND u.role = :role")
    List<User> findKycVerifiedUsersByRole(UserRole role);
}

