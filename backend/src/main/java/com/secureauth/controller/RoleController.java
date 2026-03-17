package com.secureauth.controller;

import com.secureauth.dto.RoleRequest;
import com.secureauth.exception.BadRequestException;
import com.secureauth.exception.ResourceNotFoundException;
import com.secureauth.model.Permission;
import com.secureauth.model.Role;
import com.secureauth.repository.PermissionRepository;
import com.secureauth.repository.RoleRepository;
import com.secureauth.service.AuditService;
import com.secureauth.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/roles")
@RequiredArgsConstructor
@Tag(name = "Role Management", description = "Admin endpoints for managing roles and permissions")
public class RoleController {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final AuditService auditService;

    @GetMapping
    @Operation(summary = "List all roles with their permissions")
    public ResponseEntity<List<Role>> getAllRoles() {
        return ResponseEntity.ok(roleRepository.findAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get role by ID")
    public ResponseEntity<Role> getRoleById(@PathVariable Long id) {
        Role role = roleRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Role not found"));
        return ResponseEntity.ok(role);
    }

    @PostMapping
    @Operation(summary = "Create a new custom role")
    public ResponseEntity<Role> createRole(@Valid @RequestBody RoleRequest request,
                                            @AuthenticationPrincipal CustomUserDetails userDetails,
                                            HttpServletRequest httpRequest) {
        if (roleRepository.existsByName(request.getName().toUpperCase())) {
            throw new BadRequestException("Role already exists: " + request.getName());
        }

        Set<Permission> permissions = new HashSet<>();
        if (request.getPermissionIds() != null && !request.getPermissionIds().isEmpty()) {
            permissions = new HashSet<>(permissionRepository.findAllById(request.getPermissionIds()));
        }

        Role role = Role.builder()
            .name(request.getName().toUpperCase())
            .description(request.getDescription())
            .permissions(permissions)
            .builtIn(false)
            .build();

        role = roleRepository.save(role);
        auditService.log(userDetails.getId(), "ROLE_CREATED", "ROLE", "Custom role created: " + role.getName(), httpRequest.getRemoteAddr());
        return ResponseEntity.status(HttpStatus.CREATED).body(role);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a role (custom roles only)")
    public ResponseEntity<Role> updateRole(@PathVariable Long id,
                                            @Valid @RequestBody RoleRequest request,
                                            @AuthenticationPrincipal CustomUserDetails userDetails,
                                            HttpServletRequest httpRequest) {
        Role role = roleRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Role not found"));

        if (role.isBuiltIn()) {
            throw new BadRequestException("Built-in roles cannot be modified");
        }

        if (!role.getName().equals(request.getName().toUpperCase()) && roleRepository.existsByName(request.getName().toUpperCase())) {
            throw new BadRequestException("Role name already exists");
        }

        role.setName(request.getName().toUpperCase());
        role.setDescription(request.getDescription());

        if (request.getPermissionIds() != null) {
            Set<Permission> permissions = new HashSet<>(permissionRepository.findAllById(request.getPermissionIds()));
            role.setPermissions(permissions);
        }

        role = roleRepository.save(role);
        auditService.log(userDetails.getId(), "ROLE_UPDATED", "ROLE", "Role updated: " + role.getName(), httpRequest.getRemoteAddr());
        return ResponseEntity.ok(role);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a custom role")
    public ResponseEntity<Void> deleteRole(@PathVariable Long id,
                                            @AuthenticationPrincipal CustomUserDetails userDetails,
                                            HttpServletRequest httpRequest) {
        Role role = roleRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Role not found"));

        if (role.isBuiltIn()) {
            throw new BadRequestException("Built-in roles cannot be deleted");
        }

        auditService.log(userDetails.getId(), "ROLE_DELETED", "ROLE", "Role deleted: " + role.getName(), httpRequest.getRemoteAddr());
        roleRepository.delete(role);
        return ResponseEntity.noContent().build();
    }

    // --- Permissions ---

    @GetMapping("/permissions")
    @Operation(summary = "List all permissions grouped by category")
    public ResponseEntity<Map<String, List<Permission>>> getAllPermissions() {
        Map<String, List<Permission>> grouped = permissionRepository.findAll().stream()
            .collect(Collectors.groupingBy(
                p -> p.getCategory() != null ? p.getCategory() : "OTHER",
                TreeMap::new,
                Collectors.toList()
            ));
        return ResponseEntity.ok(grouped);
    }
}
