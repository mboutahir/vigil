package com.ft_transcendence.vigil.domain.dtos.users;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UsersPatchMeDto {
    @Size(min = 1, message = "email cannot be empty")
    @Pattern(regexp = "^\\S+@\\S+\\.\\S+$", message = "email must be valid")
    @Email(message="you must enter a valid email")
    private String email;
    @Size(max = 50)
    @Pattern(
            regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@#$%^&+=!]).{8,}$",
            message = "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character, and be at least 8 characters long"
    )
    private String password;
}
