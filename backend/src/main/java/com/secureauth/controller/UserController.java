package com.secureauth.controller;

import com.secureauth.dto.*;
import com.secureauth.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Set;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "User Management", description = "Admin endpoints for managing users")
public class UserController {

    private final UserService userService;

    @GetMapping
    @Operation(summary = "List users (paginated). Use type=regular for non-admin, type=admin for admin only.")
    public ResponseEntity<Page<UserResponse>> getAllUsers(
        @RequestParam(required = false) String search,
        @RequestParam(required = false) String type,
        @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(userService.getAllUsers(search, type, pageable));
    }

    @PostMapping
    @Operation(summary = "Create a new user (admin)")
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody RegisterRequest request,
                                                    @RequestParam(required = false) Set<Long> roleIds,
                                                    HttpServletRequest httpRequest) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(userService.createUser(request, roleIds, httpRequest.getRemoteAddr()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get user by ID")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update user")
    public ResponseEntity<UserResponse> updateUser(@PathVariable Long id,
                                                    @Valid @RequestBody UserUpdateRequest request,
                                                    HttpServletRequest httpRequest) {
        return ResponseEntity.ok(userService.updateUser(id, request, httpRequest.getRemoteAddr()));
    }

    @PutMapping("/{id}/toggle")
    @Operation(summary = "Enable/disable user")
    public ResponseEntity<UserResponse> toggleUser(@PathVariable Long id, HttpServletRequest httpRequest) {
        return ResponseEntity.ok(userService.toggleUser(id, httpRequest.getRemoteAddr()));
    }

    @PutMapping("/{id}/roles")
    @Operation(summary = "Assign roles to user")
    public ResponseEntity<UserResponse> assignRoles(@PathVariable Long id,
                                                     @Valid @RequestBody RoleAssignRequest request,
                                                     HttpServletRequest httpRequest) {
        return ResponseEntity.ok(userService.assignRoles(id, request, httpRequest.getRemoteAddr()));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a user")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id, HttpServletRequest httpRequest) {
        userService.deleteUser(id, httpRequest.getRemoteAddr());
        return ResponseEntity.noContent().build();
    }
}
