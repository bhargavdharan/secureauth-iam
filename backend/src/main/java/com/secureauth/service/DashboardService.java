package com.secureauth.service;

import com.secureauth.dto.DashboardStats;
import com.secureauth.model.AuditLog;
import com.secureauth.model.User;
import com.secureauth.repository.RoleRepository;
import com.secureauth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final AuditService auditService;

    public DashboardStats getStats() {
        long totalUsers = userRepository.count();
        long activeUsers = userRepository.countByEnabled(true);
        long totalRoles = roleRepository.count();
        long recentLogins = auditService.getRecentLoginCount();

        List<AuditLog> recentActivity = auditService.getRecentActivity();
        List<Map<String, Object>> activityList = recentActivity.stream().map(log -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", log.getId());
            map.put("userId", log.getUserId());
            map.put("action", log.getAction());
            map.put("resource", log.getResource());
            map.put("details", log.getDetails());
            map.put("timestamp", log.getTimestamp());
            return map;
        }).collect(Collectors.toList());

        Map<String, Long> roleDistribution = new HashMap<>();
        userRepository.findAll().forEach(user ->
            user.getRoles().forEach(role ->
                roleDistribution.merge(role.getName(), 1L, Long::sum)
            )
        );

        return DashboardStats.builder()
            .totalUsers(totalUsers)
            .activeUsers(activeUsers)
            .totalRoles(totalRoles)
            .recentLogins(recentLogins)
            .recentActivity(activityList)
            .roleDistribution(roleDistribution)
            .build();
    }
}
