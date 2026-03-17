package com.secureauth.dto;

import jakarta.validation.constraints.Email;
import lombok.Data;

@Data
public class UserUpdateRequest {
    private String firstName;
    private String lastName;

    @Email(message = "Invalid email format")
    private String email;
}
