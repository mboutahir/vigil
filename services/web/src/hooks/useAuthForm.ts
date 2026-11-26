import { useState } from 'react';

const EMAIL_REGX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const PASSWORD_REGX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&+=!])[^\r\n\u0085\u2028\u2029]{8,}$/u;

interface UseAuthFormOptions {
  requireConfirm?: boolean;
  validatePasswordStrength?: boolean;
}

export default function useAuthForm({
  requireConfirm = false,
  validatePasswordStrength = false,
}: UseAuthFormOptions = {}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [formError, setFormError] = useState<Error | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setEmailError('');
    setFormError(null);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setPasswordError('');
    setFormError(null);
  };

  const handleConfirmPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setConfirmPassword(e.target.value);
    setConfirmPasswordError('');
    setFormError(null);
  };

  const validate = (): boolean => {
    let isValid: boolean = true;

    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setFormError(null);

    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!EMAIL_REGX.test(email.trim())) {
      setEmailError('Enter a valid email');
      isValid = false;
    }

    if (password.length === 0) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length > 50) {
      setPasswordError('Password must be 50 characters or fewer');
      isValid = false;
    } else if (validatePasswordStrength && !PASSWORD_REGX.test(password)) {
      setPasswordError('Use 8–50 characters, including uppercase, lowercase, a number, and one of @#$%^&+=!');
      setFormError(new Error('Weak password'));
      isValid = false;
    }

    if (requireConfirm) {
      if (confirmPassword.length === 0) {
        setConfirmPasswordError('Confirm password is required');
        isValid = false;
      } else if (password !== confirmPassword) {
        setConfirmPasswordError("Passwords don't match");
        isValid = false;
      }
    }
    return isValid;
  };

  const runSubmit = async (submitFn: () => Promise<void>) => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await submitFn();
    } catch (error) {
      setFormError(
        error instanceof Error ? error : new Error('Something went wrong'),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    email,
    password,
    emailError,
    passwordError,
    confirmPasswordError,
    formError,
    setFormError,
    handleEmailChange,
    handlePasswordChange,
    handleConfirmPasswordChange,
    isSubmitting,
    runSubmit,
  };
}
