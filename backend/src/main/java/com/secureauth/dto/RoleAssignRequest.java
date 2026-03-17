package com.secureauth.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.Set;

@Data
public class RoleAssignRequest {
    @NotEmpty(message = "At least one role ID is required")
    private Set<Long> roleIds;
}
