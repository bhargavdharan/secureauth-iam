package com.secureauth.service;

import com.secureauth.model.AuditLog;
import com.secureauth.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public void log(Long userId, String action, String resource, String details, String ipAddress) {
        AuditLog log = AuditLog.builder()
            .userId(userId)
            .action(action)
            .resource(resource)
            .details(details)
            .ipAddress(ipAddress)
            .build();
        auditLogRepository.save(log);
    }

    public Page<AuditLog> getLogs(Pageable pageable) {
        return auditLogRepository.findAll(pageable);
    }

    public Page<AuditLog> getLogsByUserId(Long userId, Pageable pageable) {
        return auditLogRepository.findByUserId(userId, pageable);
    }

    public Page<AuditLog> getLogsByAction(String action, Pageable pageable) {
        return auditLogRepository.findByAction(action, pageable);
    }

    public Page<AuditLog> getLogsByUserIdAndAction(Long userId, String action, Pageable pageable) {
        return auditLogRepository.findByUserIdAndAction(userId, action, pageable);
    }

    public Page<AuditLog> getLogsByDateRange(LocalDateTime start, LocalDateTime end, Pageable pageable) {
        return auditLogRepository.findByTimestampBetween(start, end, pageable);
    }

    public List<AuditLog> getRecentActivity() {
        return auditLogRepository.findTop10ByOrderByTimestampDesc();
    }

    public long getRecentLoginCount() {
        return auditLogRepository.countByTimestampAfter(LocalDateTime.now().minusDays(1));
    }
}
