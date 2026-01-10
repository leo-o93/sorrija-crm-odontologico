import { describe, it, expect } from 'vitest';
import { formatPhone, parseDate, parseDateTime, parseCurrency } from '../supabase';

describe('formatPhone', () => {
  it('should format a 10-digit phone number with 55 prefix', () => {
    expect(formatPhone('31982808133')).toBe('5531982808133');
  });

  it('should format a phone with existing formatting', () => {
    expect(formatPhone('(31) 9 8280-8133')).toBe('5531982808133');
  });

  it('should return cleaned number for less than 10 digits', () => {
    expect(formatPhone('123456789')).toBe('123456789');
  });

  it('should handle already prefixed numbers', () => {
    expect(formatPhone('5531982808133')).toBe('555531982808133');
  });

  it('should remove all non-numeric characters', () => {
    expect(formatPhone('abc31def982gh808ij133')).toBe('5531982808133');
  });
});

describe('parseDate', () => {
  it('should parse DD/MM/YYYY format', () => {
    expect(parseDate('25/12/2024')).toBe('2024-12-25');
  });

  it('should parse ISO format', () => {
    expect(parseDate('2024-12-25')).toBe('2024-12-25');
  });

  it('should parse ISO datetime format', () => {
    expect(parseDate('2024-12-25T14:30:00')).toBe('2024-12-25');
  });

  it('should parse Excel serial date', () => {
    // 45651 = 2024-12-25
    expect(parseDate(45651)).toBe('2024-12-25');
  });

  it('should parse Excel serial date as string', () => {
    expect(parseDate('45651')).toBe('2024-12-25');
  });

  it('should handle Excel date with decimal (time)', () => {
    expect(parseDate(45651.5)).toBe('2024-12-25');
  });

  it('should return null for invalid input', () => {
    expect(parseDate('invalid')).toBeNull();
  });

  it('should return null for empty string', () => {
    expect(parseDate('')).toBeNull();
  });

  it('should pad single-digit day and month', () => {
    expect(parseDate('1/2/2024')).toBe('2024-02-01');
  });
});

describe('parseDateTime', () => {
  it('should parse DD/MM/YYYY HH:MM:SS format', () => {
    expect(parseDateTime('25/12/2024 14:30:45')).toBe('2024-12-25T14:30:45');
  });

  it('should parse DD/MM/YYYY HH:MM format (without seconds)', () => {
    expect(parseDateTime('25/12/2024 14:30')).toBe('2024-12-25T14:30:00');
  });

  it('should parse DD/MM/YYYY format with midnight', () => {
    expect(parseDateTime('25/12/2024')).toBe('2024-12-25T00:00:00');
  });

  it('should parse ISO format', () => {
    expect(parseDateTime('2024-12-25T14:30:00')).toBe('2024-12-25T14:30:00');
  });

  it('should add time to ISO date-only format', () => {
    expect(parseDateTime('2024-12-25')).toBe('2024-12-25T00:00:00');
  });

  it('should parse Excel serial date with time fraction', () => {
    // 45651.5 = 2024-12-25 12:00 (midday)
    const result = parseDateTime(45651.5);
    expect(result).not.toBeNull();
    expect(result?.split('T')[0]).toBe('2024-12-25');
  });

  it('should return null for invalid input', () => {
    expect(parseDateTime('invalid')).toBeNull();
  });

  it('should return null for empty string', () => {
    expect(parseDateTime('')).toBeNull();
  });
});

describe('parseCurrency', () => {
  it('should parse Brazilian currency format', () => {
    expect(parseCurrency('R$ 1.234,56')).toBe(1234.56);
  });

  it('should parse currency without R$ symbol', () => {
    expect(parseCurrency('1.234,56')).toBe(1234.56);
  });

  it('should parse simple decimal', () => {
    expect(parseCurrency('100,50')).toBe(100.50);
  });

  it('should parse integer as currency', () => {
    expect(parseCurrency('1000')).toBe(1000);
  });

  it('should return null for empty string', () => {
    expect(parseCurrency('')).toBeNull();
  });

  it('should return null for invalid input', () => {
    expect(parseCurrency('abc')).toBeNull();
  });

  it('should handle currency with spaces', () => {
    expect(parseCurrency('R$   1.000,00')).toBe(1000.00);
  });
});
