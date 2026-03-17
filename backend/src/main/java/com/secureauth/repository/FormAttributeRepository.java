package com.secureauth.repository;

import com.secureauth.model.FormAttribute;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FormAttributeRepository extends JpaRepository<FormAttribute, Long> {
    List<FormAttribute> findByFormTypeOrderByDisplayOrderAsc(FormAttribute.FormType formType);
    List<FormAttribute> findByFormTypeAndVisibleTrueOrderByDisplayOrderAsc(FormAttribute.FormType formType);
}
