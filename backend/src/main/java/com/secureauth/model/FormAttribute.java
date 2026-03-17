package com.secureauth.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "form_attributes", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"field_name", "form_type"})
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FormAttribute {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "field_name", nullable = false)
    private String fieldName;

    @Column(nullable = false)
    private String label;

    @Column(nullable = false)
    private String fieldType; // TEXT, EMAIL, SELECT, BOOLEAN, DATE

    @Column(name = "form_type", nullable = false)
    @Enumerated(EnumType.STRING)
    private FormType formType; // USER_CREATE, USER_EDIT

    @Builder.Default
    private boolean required = false;

    @Builder.Default
    private boolean visible = true;

    @Builder.Default
    private boolean editable = true;

    @Builder.Default
    private int displayOrder = 0;

    private String defaultValue;

    private String placeholder;

    private String validationRegex;

    private String validationMessage;

    public enum FormType {
        USER_CREATE, USER_EDIT
    }
}
