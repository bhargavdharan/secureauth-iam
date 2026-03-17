package com.secureauth.repository;

import com.secureauth.model.ApiKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApiKeyRepository extends JpaRepository<ApiKey, Long> {
    List<ApiKey> findByUserId(Long userId);
    List<ApiKey> findByUserIdAndActive(Long userId, boolean active);
}
