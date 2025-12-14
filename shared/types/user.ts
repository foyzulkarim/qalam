/**
 * User account information (returned after login/registration)
 */
export interface User {
  /** Unique user identifier */
  id: string;

  /** User's email address */
  email: string;

  /** User's display name */
  name: string;

  /** Preferred translation (for future use when multiple translations available) */
  preferredTranslation: string;

  /** When the account was created */
  createdAt: string;

  /** When the user last logged in */
  lastLoginAt: string | null;
}

/**
 * User profile update data (partial updates allowed)
 */
export interface UserUpdateData {
  name?: string;
  preferredTranslation?: string;
}

/**
 * Password change request
 */
export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
}
