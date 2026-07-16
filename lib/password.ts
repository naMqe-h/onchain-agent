export function validatePasswordStrength(password: string): string | null {
    const hasMinLength = password.length >= 8
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumber = /\d/.test(password)
    const hasSpecialChar = /[^A-Za-z0-9]/.test(password)

    if (!hasMinLength || !hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
        return 'Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character'
    }

    return null
}
