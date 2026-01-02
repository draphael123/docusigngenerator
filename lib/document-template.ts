import { prisma } from './prisma';
import fs from 'fs/promises';
import path from 'path';

export interface Placeholder {
  name: string;
  label: string;
  required: boolean;
  type: 'text' | 'date' | 'number';
}

export interface Anchor {
  name: string;
  label: string;
  tabType: 'signature' | 'date' | 'text' | 'checkbox' | 'radio';
  required: boolean;
}

export interface DocuSignRole {
  roleName: string;
  signingOrder: number;
  email?: string;
}

export interface TabMapping {
  anchorName: string;
  roleName: string;
  tabType: string;
}

/**
 * Replace placeholders in document content
 */
export function replacePlaceholders(content: string, values: Record<string, string>): string {
  let result = content;
  
  // Replace {{VAR:PLACEHOLDER_NAME}} with actual values
  for (const [key, value] of Object.entries(values)) {
    const placeholder = `{{VAR:${key}}}`;
    result = result.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value || '');
  }
  
  return result;
}

/**
 * Extract placeholders from document content
 */
export function extractPlaceholders(content: string): string[] {
  const placeholderRegex = /\{\{VAR:([A-Z_]+)\}\}/g;
  const placeholders: string[] = [];
  let match;
  
  while ((match = placeholderRegex.exec(content)) !== null) {
    if (!placeholders.includes(match[1])) {
      placeholders.push(match[1]);
    }
  }
  
  return placeholders;
}

/**
 * Extract DocuSign anchors from document content
 */
export function extractAnchors(content: string): string[] {
  const anchorRegex = /\{\{DS:([A-Z_]+)\}\}/g;
  const anchors: string[] = [];
  let match;
  
  while ((match = anchorRegex.exec(content)) !== null) {
    if (!anchors.includes(match[1])) {
      anchors.push(match[1]);
    }
  }
  
  return anchors;
}

/**
 * Validate that all required placeholders are filled
 */
export function validatePlaceholders(
  placeholders: Placeholder[],
  filledValues: Record<string, string>
): { valid: boolean; missing: string[] } {
  const required = placeholders.filter(p => p.required);
  const missing = required.filter(p => !filledValues[p.name] || filledValues[p.name].trim() === '');
  
  return {
    valid: missing.length === 0,
    missing: missing.map(p => p.name)
  };
}

/**
 * Validate that all required anchors are present
 */
export function validateAnchors(
  anchors: Anchor[],
  content: string
): { valid: boolean; missing: string[] } {
  const required = anchors.filter(a => a.required);
  const missing = required.filter(a => !content.includes(`{{DS:${a.name}}}`));
  
  return {
    valid: missing.length === 0,
    missing: missing.map(a => a.name)
  };
}

