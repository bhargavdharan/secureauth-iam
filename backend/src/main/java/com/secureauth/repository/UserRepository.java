package com.secureauth.repository;

import com.secureauth.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    Page<User> findByEmailContainingIgnoreCaseOrFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(
        String email, String firstName, String lastName, Pageable pageable);
    long countByEnabled(boolean enabled);

    // Regular users only (exclude ADMIN and SUPER_ADMIN)
    @Query("SELECT DISTINCT u FROM User u WHERE NOT EXISTS " +
           "(SELECT r FROM u.roles r WHERE r.name IN :adminRoles)")
    Page<User> findNonAdminUsers(@Param("adminRoles") List<String> adminRoles, Pageable pageable);

    @Query("SELECT DISTINCT u FROM User u WHERE NOT EXISTS " +
           "(SELECT r FROM u.roles r WHERE r.name IN :adminRoles) " +
           "AND (LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(u.firstName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(u.lastName) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<User> findNonAdminUsersWithSearch(@Param("adminRoles") List<String> adminRoles,
                                            @Param("search") String search,
                                            Pageable pageable);

    // Admin users only
    @Query("SELECT DISTINCT u FROM User u JOIN u.roles r WHERE r.name IN :adminRoles")
    Page<User> findAdminUsers(@Param("adminRoles") List<String> adminRoles, Pageable pageable);

    @Query("SELECT DISTINCT u FROM User u JOIN u.roles r WHERE r.name IN :adminRoles " +
           "AND (LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(u.firstName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(u.lastName) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<User> findAdminUsersWithSearch(@Param("adminRoles") List<String> adminRoles,
                                         @Param("search") String search,
                                         Pageable pageable);
}
