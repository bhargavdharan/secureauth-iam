package com.secureauth.config;

import com.secureauth.model.FormAttribute;
import com.secureauth.model.Permission;
import com.secureauth.model.Role;
import com.secureauth.model.User;
import com.secureauth.repository.FormAttributeRepository;
import com.secureauth.repository.PermissionRepository;
import com.secureauth.repository.RoleRepository;
import com.secureauth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final PermissionRepository permissionRepository;
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final FormAttributeRepository formAttributeRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        if (roleRepository.count() > 0) {
            log.info("Data already initialized, skipping...");
            return;
        }

        log.info("Initializing default data...");

        // --- Permissions with categories ---
        Map<String, Permission> perms = new HashMap<>();
        String[][] permData = {
            {"USER_READ",       "View user profiles and list",         "USER_MANAGEMENT"},
            {"USER_CREATE",     "Create new users",                     "USER_MANAGEMENT"},
            {"USER_WRITE",      "Edit user details",                    "USER_MANAGEMENT"},
            {"USER_DELETE",     "Delete users",                         "USER_MANAGEMENT"},
            {"USER_ACTIVATE",   "Activate/deactivate users",            "USER_MANAGEMENT"},
            {"ROLE_READ",       "View roles and permissions",           "ROLE_MANAGEMENT"},
            {"ROLE_CREATE",     "Create custom roles",                  "ROLE_MANAGEMENT"},
            {"ROLE_WRITE",      "Edit roles and assign permissions",    "ROLE_MANAGEMENT"},
            {"ROLE_DELETE",     "Delete custom roles",                  "ROLE_MANAGEMENT"},
            {"ROLE_ASSIGN",     "Assign roles to users",                "ROLE_MANAGEMENT"},
            {"AUDIT_READ",      "View audit logs",                      "AUDIT"},
            {"AUDIT_EXPORT",    "Export audit logs",                     "AUDIT"},
            {"API_KEY_READ",    "View own API keys",                    "API_KEY"},
            {"API_KEY_CREATE",  "Generate new API keys",                "API_KEY"},
            {"API_KEY_REVOKE",  "Revoke API keys",                      "API_KEY"},
            {"ATTRIBUTE_READ",  "View form attribute configuration",    "SYSTEM"},
            {"ATTRIBUTE_WRITE", "Modify form attribute configuration",  "SYSTEM"},
            {"DASHBOARD_VIEW",  "View dashboard analytics",             "SYSTEM"},
        };

        for (String[] pd : permData) {
            Permission p = permissionRepository.save(
                Permission.builder().name(pd[0]).description(pd[1]).category(pd[2]).builtIn(true).build()
            );
            perms.put(pd[0], p);
        }

        // --- Built-in Roles ---
        Role superAdmin = roleRepository.save(Role.builder()
            .name("SUPER_ADMIN")
            .description("Full system access — all permissions")
            .permissions(Set.copyOf(perms.values()))
            .builtIn(true)
            .build());

        Role admin = roleRepository.save(Role.builder()
            .name("ADMIN")
            .description("User and role management, audit access")
            .permissions(Set.of(
                perms.get("USER_READ"), perms.get("USER_CREATE"), perms.get("USER_WRITE"),
                perms.get("USER_ACTIVATE"), perms.get("ROLE_READ"), perms.get("ROLE_ASSIGN"),
                perms.get("AUDIT_READ"), perms.get("DASHBOARD_VIEW"),
                perms.get("ATTRIBUTE_READ")
            ))
            .builtIn(true)
            .build());

        Role userRole = roleRepository.save(Role.builder()
            .name("USER")
            .description("Standard user with basic self-service access")
            .permissions(Set.of(
                perms.get("USER_READ"), perms.get("API_KEY_READ"),
                perms.get("API_KEY_CREATE"), perms.get("API_KEY_REVOKE"),
                perms.get("DASHBOARD_VIEW")
            ))
            .builtIn(true)
            .build());

        // --- Default admin user ---
        if (!userRepository.existsByEmail("admin@secureauth.com")) {
            userRepository.save(User.builder()
                .firstName("Admin")
                .lastName("User")
                .email("admin@secureauth.com")
                .password(passwordEncoder.encode("Admin@123"))
                .enabled(true)
                .roles(Set.of(superAdmin))
                .build());
            log.info("Default admin created: admin@secureauth.com / Admin@123");
        }

        // --- Form Attributes: USER_CREATE ---
        int order = 0;
        formAttributeRepository.save(FormAttribute.builder()
            .fieldName("firstName").label("First Name").fieldType("TEXT")
            .formType(FormAttribute.FormType.USER_CREATE)
            .required(true).visible(true).editable(true).displayOrder(order++)
            .placeholder("Enter first name").build());
        formAttributeRepository.save(FormAttribute.builder()
            .fieldName("lastName").label("Last Name").fieldType("TEXT")
            .formType(FormAttribute.FormType.USER_CREATE)
            .required(true).visible(true).editable(true).displayOrder(order++)
            .placeholder("Enter last name").build());
        formAttributeRepository.save(FormAttribute.builder()
            .fieldName("email").label("Email Address").fieldType("EMAIL")
            .formType(FormAttribute.FormType.USER_CREATE)
            .required(true).visible(true).editable(true).displayOrder(order++)
            .placeholder("user@example.com").build());
        formAttributeRepository.save(FormAttribute.builder()
            .fieldName("password").label("Password").fieldType("PASSWORD")
            .formType(FormAttribute.FormType.USER_CREATE)
            .required(true).visible(true).editable(true).displayOrder(order++)
            .placeholder("Min 8 chars, upper, lower, digit, special")
            .validationRegex("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#])[A-Za-z\\d@$!%*?&#]{8,}$")
            .validationMessage("Must contain uppercase, lowercase, digit, and special character").build());
        formAttributeRepository.save(FormAttribute.builder()
            .fieldName("enabled").label("Account Active").fieldType("BOOLEAN")
            .formType(FormAttribute.FormType.USER_CREATE)
            .required(false).visible(true).editable(true).displayOrder(order++).defaultValue("true").build());

        // --- Form Attributes: USER_EDIT ---
        order = 0;
        formAttributeRepository.save(FormAttribute.builder()
            .fieldName("firstName").label("First Name").fieldType("TEXT")
            .formType(FormAttribute.FormType.USER_EDIT)
            .required(true).visible(true).editable(true).displayOrder(order++)
            .placeholder("Enter first name").build());
        formAttributeRepository.save(FormAttribute.builder()
            .fieldName("lastName").label("Last Name").fieldType("TEXT")
            .formType(FormAttribute.FormType.USER_EDIT)
            .required(true).visible(true).editable(true).displayOrder(order++)
            .placeholder("Enter last name").build());
        formAttributeRepository.save(FormAttribute.builder()
            .fieldName("email").label("Email Address").fieldType("EMAIL")
            .formType(FormAttribute.FormType.USER_EDIT)
            .required(true).visible(true).editable(true).displayOrder(order++)
            .placeholder("user@example.com").build());
        formAttributeRepository.save(FormAttribute.builder()
            .fieldName("enabled").label("Account Active").fieldType("BOOLEAN")
            .formType(FormAttribute.FormType.USER_EDIT)
            .required(false).visible(true).editable(true).displayOrder(order++).build());
        formAttributeRepository.save(FormAttribute.builder()
            .fieldName("mfaEnabled").label("MFA Status").fieldType("BOOLEAN")
            .formType(FormAttribute.FormType.USER_EDIT)
            .required(false).visible(true).editable(false).displayOrder(order++).build());

        log.info("Data initialization complete. {} permissions, {} roles, {} form attributes",
            perms.size(), 3, formAttributeRepository.count());
    }
}
