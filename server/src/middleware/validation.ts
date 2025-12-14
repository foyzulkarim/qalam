import { Request, Response, NextFunction } from 'express';
import { badRequest } from './errorHandler.js';

// Simple validation helpers (not using a full validation library for simplicity)

export function validateEmail(email: unknown): string {
  if (typeof email !== 'string') {
    badRequest('Email must be a string');
  }
  const trimmed = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    badRequest('Invalid email format');
  }
  return trimmed;
}

export function validatePassword(password: unknown): string {
  if (typeof password !== 'string') {
    badRequest('Password must be a string');
  }
  if (password.length < 8) {
    badRequest('Password must be at least 8 characters');
  }
  if (password.length > 128) {
    badRequest('Password must be less than 128 characters');
  }
  return password;
}

export function validateName(name: unknown): string {
  if (typeof name !== 'string') {
    badRequest('Name must be a string');
  }
  const trimmed = name.trim();
  if (trimmed.length < 1) {
    badRequest('Name is required');
  }
  if (trimmed.length > 100) {
    badRequest('Name must be less than 100 characters');
  }
  return trimmed;
}

export function validateVerseId(verseId: unknown): string {
  if (typeof verseId !== 'string') {
    badRequest('Verse ID must be a string');
  }
  const regex = /^\d+:\d+$/;
  if (!regex.test(verseId)) {
    badRequest('Invalid verse ID format. Expected format: "surahId:verseNumber" (e.g., "1:2")');
  }
  return verseId;
}

export function validateUserInput(userInput: unknown): string {
  if (typeof userInput !== 'string') {
    badRequest('User input must be a string');
  }
  if (userInput.length > 2000) {
    badRequest('User input must be less than 2000 characters');
  }
  return userInput;
}

export function validateBoolean(value: unknown, fieldName: string): boolean {
  if (typeof value !== 'boolean') {
    badRequest(`${fieldName} must be a boolean`);
  }
  return value;
}

export function validatePositiveInt(value: unknown, fieldName: string): number {
  const num = Number(value);
  if (!Number.isInteger(num) || num < 1) {
    badRequest(`${fieldName} must be a positive integer`);
  }
  return num;
}

// Request body validator middleware factory
export function validateBody<T>(
  validator: (body: unknown) => T
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = validator(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
}
