import bcrypt from 'bcrypt';
import { prisma } from '../../db/client.js';
import { generateToken } from '../../utils/jwt.js';
import { conflict, unauthorized } from '../../middleware/errorHandler.js';
import type { User, AuthResponse } from '@qalam/shared';

const BCRYPT_ROUNDS = 10;

function formatUser(user: {
  id: number;
  email: string;
  name: string;
  preferredTranslation: string;
  createdAt: Date;
  lastLoginAt: Date | null;
}): User {
  return {
    id: user.id.toString(),
    email: user.email,
    name: user.name,
    preferredTranslation: user.preferredTranslation,
    createdAt: user.createdAt.toISOString(),
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
  };
}

export async function register(
  email: string,
  password: string,
  name: string
): Promise<AuthResponse> {
  // Check if user already exists
  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    conflict('Email already registered');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
    },
  });

  // Generate token
  const token = generateToken(user.id);

  return {
    token,
    user: formatUser(user),
  };
}

export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    unauthorized('Invalid email or password');
  }

  // Verify password
  const valid = await bcrypt.compare(password, user.passwordHash);

  if (!valid) {
    unauthorized('Invalid email or password');
  }

  // Update last login
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  // Generate token
  const token = generateToken(user.id);

  return {
    token,
    user: formatUser(updatedUser),
  };
}

export async function getMe(userId: number): Promise<User> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    unauthorized('User not found');
  }

  return formatUser(user);
}

export async function updateProfile(
  userId: number,
  data: { name?: string; preferredTranslation?: string }
): Promise<User> {
  const user = await prisma.user.update({
    where: { id: userId },
    data,
  });

  return formatUser(user);
}

export async function changePassword(
  userId: number,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    unauthorized('User not found');
  }

  // Verify current password
  const valid = await bcrypt.compare(currentPassword, user.passwordHash);

  if (!valid) {
    unauthorized('Current password is incorrect');
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
}
