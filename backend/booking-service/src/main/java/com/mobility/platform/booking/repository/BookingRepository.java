package com.mobility.platform.booking.repository;

import com.mobility.platform.booking.entity.Booking;
import com.mobility.platform.common.enums.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Booking repository
 */
@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    
    Optional<Booking> findByBookingNumber(String bookingNumber);
    
    List<Booking> findByUserId(Long userId);
    
    List<Booking> findByVehicleId(Long vehicleId);
    
    List<Booking> findByDriverId(Long driverId);
    
    List<Booking> findByStatus(BookingStatus status);
    
    @Query("SELECT b FROM Booking b WHERE b.userId = :userId AND b.status = :status")
    List<Booking> findByUserIdAndStatus(@Param("userId") Long userId, @Param("status") BookingStatus status);
    
    @Query("SELECT b FROM Booking b WHERE b.vehicleId = :vehicleId AND b.status IN :statuses")
    List<Booking> findByVehicleIdAndStatusIn(@Param("vehicleId") Long vehicleId, @Param("statuses") List<BookingStatus> statuses);
    
    @Query("SELECT b FROM Booking b WHERE b.vehicleId = :vehicleId " +
            "AND b.status IN ('CONFIRMED', 'ONGOING') " +
            "AND ((b.startDateTime <= :endDateTime AND b.endDateTime >= :startDateTime))")
    List<Booking> findConflictingBookings(
            @Param("vehicleId") Long vehicleId,
            @Param("startDateTime") LocalDateTime startDateTime,
            @Param("endDateTime") LocalDateTime endDateTime);
    
    @Query("SELECT b FROM Booking b WHERE b.userId = :userId " +
            "ORDER BY b.startDateTime DESC")
    List<Booking> findUserBookingHistory(@Param("userId") Long userId);
    
    @Query("SELECT b FROM Booking b WHERE b.driverId = :driverId " +
            "AND b.status IN ('CONFIRMED', 'ONGOING') " +
            "ORDER BY b.startDateTime")
    List<Booking> findActiveBookingsForDriver(@Param("driverId") Long driverId);
    
    @Query("SELECT COUNT(b) FROM Booking b WHERE b.userId = :userId AND b.status = 'COMPLETED'")
    Long countCompletedBookingsByUser(@Param("userId") Long userId);
    
    @Query("SELECT b FROM Booking b WHERE b.startDateTime <= :now " +
            "AND b.status = 'CONFIRMED' " +
            "AND b.actualStartDateTime IS NULL")
    List<Booking> findBookingsToStart(@Param("now") LocalDateTime now);
    
    @Query("SELECT b FROM Booking b WHERE b.endDateTime <= :now " +
            "AND b.status = 'ONGOING' " +
            "AND b.actualEndDateTime IS NULL")
    List<Booking> findBookingsToComplete(@Param("now") LocalDateTime now);
}

