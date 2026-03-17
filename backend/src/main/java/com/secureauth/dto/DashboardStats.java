package com.secureauth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class DashboardStats {
    private long totalUsers;
    private long activeUsers;
    private long totalRoles;
    private long recentLogins;
    private List<Map<String, Object>> recentActivity;
    private Map<String, Long> roleDistribution;
}
