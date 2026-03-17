package com.secureauth.repository;

import com.secureauth.model.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    Page<AuditLog> findByUserId(Long userId, Pageable pageable);
    Page<AuditLog> findByAction(String action, Pageable pageable);
    Page<AuditLog> findByTimestampBetween(LocalDateTime start, LocalDateTime end, Pageable pageable);
    Page<AuditLog> findByUserIdAndAction(Long userId, String action, Pageable pageable);
    List<AuditLog> findTop10ByOrderByTimestampDesc();
    long countByTimestampAfter(LocalDateTime timestamp);
}
