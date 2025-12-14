import { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service.js';
import {
  validateEmail,
  validatePassword,
  validateName,
} from '../../middleware/validation.js';
import type {
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  UserUpdateResponse,
  PasswordChangeResponse,
} from '@qalam/shared';

export async function register(
  req: Request<object, AuthResponse, RegisterRequest>,
  res: Response<AuthResponse>,
  next: NextFunction
): Promise<void> {
  try {
    const email = validateEmail(req.body.email);
    const password = validatePassword(req.body.password);
    const name = validateName(req.body.name);

    const result = await authService.register(email, password, name);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function login(
  req: Request<object, AuthResponse, LoginRequest>,
  res: Response<AuthResponse>,
  next: NextFunction
): Promise<void> {
  try {
    const email = validateEmail(req.body.email);
    const password = validatePassword(req.body.password);

    const result = await authService.login(email, password);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getMe(
  req: Request,
  res: Response<{ user: ReturnType<typeof authService.getMe> extends Promise<infer T> ? T : never }>,
  next: NextFunction
): Promise<void> {
  try {
    const user = await authService.getMe(req.user!.id);
    res.json({ user });
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(
  req: Request,
  res: Response<UserUpdateResponse>,
  next: NextFunction
): Promise<void> {
  try {
    const data: { name?: string; preferredTranslation?: string } = {};

    if (req.body.name !== undefined) {
      data.name = validateName(req.body.name);
    }

    if (req.body.preferredTranslation !== undefined) {
      if (typeof req.body.preferredTranslation !== 'string') {
        throw new Error('preferredTranslation must be a string');
      }
      data.preferredTranslation = req.body.preferredTranslation;
    }

    const user = await authService.updateProfile(req.user!.id, data);
    res.json({ user });
  } catch (error) {
    next(error);
  }
}

export async function changePassword(
  req: Request,
  res: Response<PasswordChangeResponse>,
  next: NextFunction
): Promise<void> {
  try {
    const currentPassword = validatePassword(req.body.currentPassword);
    const newPassword = validatePassword(req.body.newPassword);

    await authService.changePassword(req.user!.id, currentPassword, newPassword);
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
}
