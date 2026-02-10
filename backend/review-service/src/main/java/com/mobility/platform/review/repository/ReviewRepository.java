package com.mobility.platform.review.repository;

import com.mobility.platform.review.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    
    List<Review> findByVehicleId(Long vehicleId);
    
    List<Review> findByDriverId(Long driverId);
    
    List<Review> findByUserId(Long userId);
    
    List<Review> findByBookingId(Long bookingId);
    
    @Query("SELECT COUNT(r) > 0 FROM Review r WHERE r.bookingId = :bookingId AND r.reviewType = :reviewType")
    boolean existsByBookingIdAndReviewType(@Param("bookingId") Long bookingId, @Param("reviewType") Review.ReviewType reviewType);
    
    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.vehicleId = :vehicleId AND r.approved = true")
    Double getAverageRatingForVehicle(@Param("vehicleId") Long vehicleId);
    
    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.driverId = :driverId AND r.approved = true")
    Double getAverageRatingForDriver(@Param("driverId") Long driverId);
    
    @Query("SELECT COUNT(r) FROM Review r WHERE r.vehicleId = :vehicleId AND r.approved = true")
    Long countReviewsForVehicle(@Param("vehicleId") Long vehicleId);
    
    @Query("SELECT COUNT(r) FROM Review r WHERE r.driverId = :driverId AND r.approved = true")
    Long countReviewsForDriver(@Param("driverId") Long driverId);
}
