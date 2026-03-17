package com.secureauth.controller;

import com.secureauth.exception.ResourceNotFoundException;
import com.secureauth.model.FormAttribute;
import com.secureauth.repository.FormAttributeRepository;
import com.secureauth.security.CustomUserDetails;
import com.secureauth.service.AuditService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/form-attributes")
@RequiredArgsConstructor
@Tag(name = "Form Attributes", description = "Manage which fields appear in user creation/edit forms")
public class FormAttributeController {

    private final FormAttributeRepository formAttributeRepository;
    private final AuditService auditService;

    @GetMapping
    @Operation(summary = "Get all form attributes")
    public ResponseEntity<List<FormAttribute>> getAll() {
        return ResponseEntity.ok(formAttributeRepository.findAll());
    }

    @GetMapping("/form/{formType}")
    @Operation(summary = "Get visible attributes for a specific form type")
    public ResponseEntity<List<FormAttribute>> getByFormType(@PathVariable FormAttribute.FormType formType) {
        return ResponseEntity.ok(formAttributeRepository.findByFormTypeAndVisibleTrueOrderByDisplayOrderAsc(formType));
    }

    @GetMapping("/form/{formType}/all")
    @Operation(summary = "Get ALL attributes for a form type (admin - includes hidden)")
    public ResponseEntity<List<FormAttribute>> getAllByFormType(@PathVariable FormAttribute.FormType formType) {
        return ResponseEntity.ok(formAttributeRepository.findByFormTypeOrderByDisplayOrderAsc(formType));
    }

    @PostMapping
    @Operation(summary = "Create a new form attribute")
    public ResponseEntity<FormAttribute> create(@RequestBody FormAttribute request,
                                                  @AuthenticationPrincipal CustomUserDetails userDetails,
                                                  HttpServletRequest httpRequest) {
        // Set next display order
        List<FormAttribute> existing = formAttributeRepository.findByFormTypeOrderByDisplayOrderAsc(request.getFormType());
        request.setDisplayOrder(existing.isEmpty() ? 0 : existing.get(existing.size() - 1).getDisplayOrder() + 1);
        request.setId(null);

        FormAttribute attr = formAttributeRepository.save(request);
        auditService.log(userDetails.getId(), "ATTRIBUTE_CREATED", "FORM_ATTRIBUTE",
            "Attribute created: " + attr.getFieldName() + " (" + attr.getFormType() + ")", httpRequest.getRemoteAddr());

        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED).body(attr);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a form attribute")
    public ResponseEntity<Void> delete(@PathVariable Long id,
                                        @AuthenticationPrincipal CustomUserDetails userDetails,
                                        HttpServletRequest httpRequest) {
        FormAttribute attr = formAttributeRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Form attribute not found"));

        auditService.log(userDetails.getId(), "ATTRIBUTE_DELETED", "FORM_ATTRIBUTE",
            "Attribute deleted: " + attr.getFieldName() + " (" + attr.getFormType() + ")", httpRequest.getRemoteAddr());
        formAttributeRepository.delete(attr);

        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a form attribute (toggle visibility, required, etc.)")
    public ResponseEntity<FormAttribute> update(@PathVariable Long id,
                                                 @RequestBody FormAttribute request,
                                                 @AuthenticationPrincipal CustomUserDetails userDetails,
                                                 HttpServletRequest httpRequest) {
        FormAttribute attr = formAttributeRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Form attribute not found"));

        if (request.getLabel() != null) attr.setLabel(request.getLabel());
        attr.setVisible(request.isVisible());
        attr.setRequired(request.isRequired());
        attr.setEditable(request.isEditable());
        attr.setDisplayOrder(request.getDisplayOrder());
        if (request.getDefaultValue() != null) attr.setDefaultValue(request.getDefaultValue());
        if (request.getPlaceholder() != null) attr.setPlaceholder(request.getPlaceholder());
        if (request.getValidationRegex() != null) attr.setValidationRegex(request.getValidationRegex());
        if (request.getValidationMessage() != null) attr.setValidationMessage(request.getValidationMessage());

        attr = formAttributeRepository.save(attr);
        auditService.log(userDetails.getId(), "ATTRIBUTE_UPDATED", "FORM_ATTRIBUTE",
            "Attribute updated: " + attr.getFieldName() + " (" + attr.getFormType() + ")", httpRequest.getRemoteAddr());

        return ResponseEntity.ok(attr);
    }

    @PutMapping("/bulk")
    @Operation(summary = "Bulk update form attributes")
    public ResponseEntity<List<FormAttribute>> bulkUpdate(@RequestBody List<FormAttribute> attributes,
                                                           @AuthenticationPrincipal CustomUserDetails userDetails,
                                                           HttpServletRequest httpRequest) {
        List<FormAttribute> updated = attributes.stream().map(req -> {
            FormAttribute attr = formAttributeRepository.findById(req.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Attribute not found: " + req.getId()));
            attr.setVisible(req.isVisible());
            attr.setRequired(req.isRequired());
            attr.setEditable(req.isEditable());
            attr.setDisplayOrder(req.getDisplayOrder());
            if (req.getLabel() != null) attr.setLabel(req.getLabel());
            if (req.getPlaceholder() != null) attr.setPlaceholder(req.getPlaceholder());
            return formAttributeRepository.save(attr);
        }).toList();

        auditService.log(userDetails.getId(), "ATTRIBUTES_BULK_UPDATED", "FORM_ATTRIBUTE",
            "Bulk updated " + updated.size() + " attributes", httpRequest.getRemoteAddr());

        return ResponseEntity.ok(updated);
    }
}
