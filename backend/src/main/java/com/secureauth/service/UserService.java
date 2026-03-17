package com.secureauth.service;

import com.secureauth.dto.*;
import com.secureauth.exception.BadRequestException;
import com.secureauth.exception.ResourceNotFoundException;
import com.secureauth.model.Role;
import com.secureauth.model.User;
import com.secureauth.repository.RoleRepository;
import com.secureauth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static com.secureauth.service.AuthService.mapToUserResponse;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    private static final List<String> ADMIN_ROLES = List.of("ADMIN", "SUPER_ADMIN");

    public Page<UserResponse> getAllUsers(String search, String type, Pageable pageable) {
        Page<User> users;
        if ("regular".equalsIgnoreCase(type)) {
            users = (search != null && !search.isBlank())
                ? userRepository.findNonAdminUsersWithSearch(ADMIN_ROLES, search, pageable)
                : userRepository.findNonAdminUsers(ADMIN_ROLES, pageable);
        } else if ("admin".equalsIgnoreCase(type)) {
            users = (search != null && !search.isBlank())
                ? userRepository.findAdminUsersWithSearch(ADMIN_ROLES, search, pageable)
                : userRepository.findAdminUsers(ADMIN_ROLES, pageable);
        } else {
            if (search != null && !search.isBlank()) {
                users = userRepository.findByEmailContainingIgnoreCaseOrFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(
                    search, search, search, pageable);
            } else {
                users = userRepository.findAll(pageable);
            }
        }
        return users.map(AuthService::mapToUserResponse);
    }

    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return mapToUserResponse(user);
    }

    @Transactional
    public UserResponse updateUser(Long id, UserUpdateRequest request, String ipAddress) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        if (request.getFirstName() != null) user.setFirstName(request.getFirstName());
        if (request.getLastName() != null) user.setLastName(request.getLastName());
        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new BadRequestException("Email already in use");
            }
            user.setEmail(request.getEmail());
        }

        user = userRepository.save(user);
        auditService.log(id, "USER_UPDATED", "USER", "User profile updated", ipAddress);
        return mapToUserResponse(user);
    }

    @Transactional
    public UserResponse toggleUser(Long id, String ipAddress) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        user.setEnabled(!user.isEnabled());
        user = userRepository.save(user);

        String action = user.isEnabled() ? "USER_ENABLED" : "USER_DISABLED";
        auditService.log(id, action, "USER", "User " + (user.isEnabled() ? "enabled" : "disabled"), ipAddress);
        return mapToUserResponse(user);
    }

    @Transactional
    public UserResponse assignRoles(Long id, RoleAssignRequest request, String ipAddress) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        Set<Role> roles = new HashSet<>(roleRepository.findAllById(request.getRoleIds()));
        if (roles.size() != request.getRoleIds().size()) {
            throw new BadRequestException("One or more roles not found");
        }

        user.setRoles(roles);
        user = userRepository.save(user);

        auditService.log(id, "ROLES_ASSIGNED", "USER", "Roles updated for user", ipAddress);
        return mapToUserResponse(user);
    }

    @Transactional
    public UserResponse createUser(RegisterRequest request, Set<Long> roleIds, String ipAddress) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already registered");
        }

        Set<Role> roles = new HashSet<>();
        if (roleIds != null && !roleIds.isEmpty()) {
            roles = new HashSet<>(roleRepository.findAllById(roleIds));
        } else {
            roleRepository.findByName("USER").ifPresent(roles::add);
        }

        User user = User.builder()
            .firstName(request.getFirstName())
            .lastName(request.getLastName())
            .email(request.getEmail())
            .password(passwordEncoder.encode(request.getPassword()))
            .roles(roles)
            .build();

        user = userRepository.save(user);
        auditService.log(user.getId(), "USER_CREATED", "USER", "User created by admin: " + user.getEmail(), ipAddress);
        return mapToUserResponse(user);
    }

    @Transactional
    public void deleteUser(Long id, String ipAddress) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        auditService.log(id, "USER_DELETED", "USER", "User deleted: " + user.getEmail(), ipAddress);
        userRepository.delete(user);
    }

    @Transactional
    public void changePassword(Long userId, PasswordChangeRequest request, String ipAddress) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        auditService.log(userId, "PASSWORD_CHANGED", "USER", "Password changed", ipAddress);
    }
}
