package com.secureauth.controller;

import com.secureauth.model.AuditLog;
import com.secureauth.service.AuditService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/audit-logs")
@RequiredArgsConstructor
@Tag(name = "Audit Logs", description = "Admin endpoints for viewing audit logs")
public class AuditLogController {

    private final AuditService auditService;

    @GetMapping
    @Operation(summary = "List audit logs (paginated, filterable)")
    public ResponseEntity<Page<AuditLog>> getLogs(
        @RequestParam(required = false) Long userId,
        @RequestParam(required = false) String action,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
        @PageableDefault(sort = "timestamp", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        if (userId != null && action != null) {
            return ResponseEntity.ok(auditService.getLogsByUserIdAndAction(userId, action, pageable));
        } else if (userId != null) {
            return ResponseEntity.ok(auditService.getLogsByUserId(userId, pageable));
        } else if (action != null) {
            return ResponseEntity.ok(auditService.getLogsByAction(action, pageable));
        } else if (startDate != null && endDate != null) {
            return ResponseEntity.ok(auditService.getLogsByDateRange(startDate, endDate, pageable));
        }
        return ResponseEntity.ok(auditService.getLogs(pageable));
    }
}
