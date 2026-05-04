/**
 * Form validation utilities for secure input handling
 */

import { sanitizeHtml, sanitizeSearchInput } from './security';

// Common validation rules
export const ValidationRules = {
  required: (value: unknown) => {
    if (value === null || value === undefined || value === '') {
      return 'This field is required';
    }
    return null;
  },

  minLength: (min: number) => (value: string) => {
    if (typeof value !== 'string' || value.length < min) {
      return `Minimum length is ${min} characters`;
    }
    return null;
  },

  maxLength: (max: number) => (value: string) => {
    if (typeof value !== 'string' || value.length > max) {
      return `Maximum length is ${max} characters`;
    }
    return null;
  },

  email: (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (typeof value !== 'string' || !emailRegex.test(value)) {
      return 'Please enter a valid email address';
    }
    return null;
  },

  url: (value: string) => {
    try {
      new URL(value);
      return null;
    } catch {
      return 'Please enter a valid URL';
    }
  },

  noHtml: (value: string) => {
    if (typeof value !== 'string') return null;
    const htmlRegex = /<[^>]*>/;
    if (htmlRegex.test(value)) {
      return 'HTML tags are not allowed';
    }
    return null;
  },

  noScript: (value: string) => {
    if (typeof value !== 'string') return null;
    const scriptRegex = /<script[^>]*>.*?<\/script>/gi;
    const jsRegex = /javascript:/gi;
    if (scriptRegex.test(value) || jsRegex.test(value)) {
      return 'Script content is not allowed';
    }
    return null;
  },

  alphanumeric: (value: string) => {
    if (typeof value !== 'string') return null;
    const alphanumericRegex = /^[a-zA-Z0-9]+$/;
    if (!alphanumericRegex.test(value)) {
      return 'Only letters and numbers are allowed';
    }
    return null;
  },

  numeric: (value: string) => {
    if (typeof value !== 'string') return null;
    const numericRegex = /^[0-9]+$/;
    if (!numericRegex.test(value)) {
      return 'Only numbers are allowed';
    }
    return null;
  }
};

// Field types for different validation scenarios
export enum FieldType {
  TEXT = 'text',
  EMAIL = 'email',
  URL = 'url',
  SEARCH = 'search',
  NUMERIC = 'numeric',
  ALPHANUMERIC = 'alphanumeric',
  TEXTAREA = 'textarea'
}

// Validation schema interface
export interface ValidationSchema {
  [fieldName: string]: {
    type: FieldType;
    rules: Array<(value: unknown) => string | null>;
    sanitize?: boolean;
  };
}

// Form validator class
export class FormValidator {
  private schema: ValidationSchema;

  constructor(schema: ValidationSchema) {
    this.schema = schema;
  }

  // Validate a single field
  validateField(fieldName: string, value: unknown): string | null {
    const fieldSchema = this.schema[fieldName];
    if (!fieldSchema) return null;

    // Run all validation rules
    for (const rule of fieldSchema.rules) {
      const error = rule(value);
      if (error) return error;
    }

    return null;
  }

  // Validate entire form
  validateForm(data: Record<string, unknown>): Record<string, string> {
    const errors: Record<string, string> = {};

    for (const fieldName in this.schema) {
      const error = this.validateField(fieldName, data[fieldName]);
      if (error) {
        errors[fieldName] = error;
      }
    }

    return errors;
  }

  // Sanitize form data
  sanitizeForm(data: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};

    for (const fieldName in data) {
      const fieldSchema = this.schema[fieldName];
      const value = data[fieldName];

      if (!fieldSchema || !fieldSchema.sanitize) {
        sanitized[fieldName] = value;
        continue;
      }

      switch (fieldSchema.type) {
        case FieldType.SEARCH:
          sanitized[fieldName] = sanitizeSearchInput(typeof value === 'string' ? value : '');
          break;
        case FieldType.TEXT:
        case FieldType.TEXTAREA:
          sanitized[fieldName] = sanitizeHtml(typeof value === 'string' ? value : '');
          break;
        case FieldType.EMAIL:
          sanitized[fieldName] = typeof value === 'string' ? value.toLowerCase().trim() : value;
          break;
        case FieldType.NUMERIC:
          sanitized[fieldName] = typeof value === 'string' ? value.replace(/[^0-9]/g, '') : value;
          break;
        case FieldType.ALPHANUMERIC:
          sanitized[fieldName] = typeof value === 'string' ? value.replace(/[^a-zA-Z0-9]/g, '') : value;
          break;
        default:
          sanitized[fieldName] = value;
      }
    }

    return sanitized;
  }

  // Check if form is valid
  isValid(data: Record<string, unknown>): boolean {
    const errors = this.validateForm(data);
    return Object.keys(errors).length === 0;
  }
}

// Pre-defined validation schemas for common use cases
export const CommonSchemas = {
  searchForm: {
    search: {
      type: FieldType.SEARCH,
      rules: [
        ValidationRules.maxLength(200),
        ValidationRules.noScript
      ],
      sanitize: true
    }
  },

  contactForm: {
    name: {
      type: FieldType.TEXT,
      rules: [
        ValidationRules.required,
        ValidationRules.minLength(2),
        ValidationRules.maxLength(100),
        ValidationRules.noHtml,
        ValidationRules.noScript
      ],
      sanitize: true
    },
    email: {
      type: FieldType.EMAIL,
      rules: [
        ValidationRules.required,
        ValidationRules.email,
        ValidationRules.maxLength(255)
      ],
      sanitize: true
    },
    message: {
      type: FieldType.TEXTAREA,
      rules: [
        ValidationRules.required,
        ValidationRules.minLength(10),
        ValidationRules.maxLength(1000),
        ValidationRules.noScript
      ],
      sanitize: true
    }
  },

  newsSearchForm: {
    query: {
      type: FieldType.SEARCH,
      rules: [
        ValidationRules.maxLength(100),
        ValidationRules.noHtml,
        ValidationRules.noScript
      ],
      sanitize: true
    },
    page: {
      type: FieldType.NUMERIC,
      rules: [
        ValidationRules.numeric
      ],
      sanitize: true
    },
    limit: {
      type: FieldType.NUMERIC,
      rules: [
        ValidationRules.numeric
      ],
      sanitize: true
    }
  }
};

// Hook for React components
export function useFormValidation(schema: ValidationSchema) {
  const validator = new FormValidator(schema);

  const validate = (data: Record<string, unknown>) => {
    return validator.validateForm(data);
  };

  const sanitize = (data: Record<string, unknown>) => {
    return validator.sanitizeForm(data);
  };

  const isValid = (data: Record<string, unknown>) => {
    return validator.isValid(data);
  };

  return { validate, sanitize, isValid };
}