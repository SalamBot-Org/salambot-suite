/**
 * ╭─────────────────────────────────────────────────────────────╮
 * │  ✅ SalamBot API Gateway - Middleware de Validation        │
 * ├─────────────────────────────────────────────────────────────┤
 * │  📁 Validation des requêtes et sanitisation des données    │
 * │  👨‍💻 SalamBot Team <info@salambot.ma>                        │
 * │  📅 Créé: 2025-06-02 | Modifié: 2025-06-02                │
 * │  🏷️  v2.1.0-gateway | 🔒 Propriétaire SalamBot Team        │
 * ╰─────────────────────────────────────────────────────────────╯
 */

import { Request, Response, NextFunction } from 'express';
import { createValidationError } from './error-handler';

/**
 * 🌟 MIDDLEWARE DE VALIDATION ENTERPRISE 🌟
 * 
 * 📖 Mission: Validation et sanitisation des données entrantes
 * 🎭 Fonctionnalités:
 *   • 🔍 Validation des paramètres et corps de requête
 *   • 🧹 Sanitisation contre les attaques XSS/injection
 *   • 📏 Validation des limites de taille
 *   • 🛡️ Protection contre les payloads malveillants
 * 
 * 🏆 Objectifs Sécurité:
 *   • Prévention des attaques par injection
 *   • Validation stricte des types de données
 *   • Protection contre les dénis de service
 * 
 * 👥 Équipe: SalamBot Security Team <security@salambot.ma>
 * 📅 Implémentation: 2025-06-02
 * 🔖 Version: 2.1.0-enterprise
 */

/**
 * 📋 Interface pour les règles de validation
 */
export interface ValidationRule {
  field: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'email' | 'url';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  allowedValues?: unknown[];
  customValidator?: (value: unknown) => boolean | string;
}

/**
 * 🎯 Schémas de validation par endpoint
 */
const validationSchemas: Record<string, ValidationRule[]> = {
  // Validation pour la détection de langue
  '/api/ai/detect-language': [
    {
      field: 'text',
      type: 'string',
      required: true,
      minLength: 1,
      maxLength: 10000,
      customValidator: (value: unknown) => {
        // Vérifier que le texte ne contient pas de scripts malveillants
        if (typeof value !== 'string') {
          return 'La valeur doit être une chaîne de caractères';
        }
        const dangerousPatterns = /<script|javascript:|data:|vbscript:/i;
        if (dangerousPatterns.test(value)) {
          return 'Contenu potentiellement malveillant détecté';
        }
        return true;
      }
    },
    {
      field: 'options',
      type: 'object',
      required: false
    }
  ],
  
  // Validation pour la génération de réponse
  '/api/ai/generate-reply': [
    {
      field: 'message',
      type: 'string',
      required: true,
      minLength: 1,
      maxLength: 5000
    },
    {
      field: 'context',
      type: 'object',
      required: false
    },
    {
      field: 'language',
      type: 'string',
      required: false,
      allowedValues: ['fr', 'ar', 'darija', 'auto']
    },
    {
      field: 'temperature',
      type: 'number',
      required: false,
      min: 0,
      max: 2
    }
  ],
  
  // Validation pour les endpoints d'administration
  '/api/admin/users': [
    {
      field: 'email',
      type: 'email',
      required: true
    },
    {
      field: 'role',
      type: 'string',
      required: true,
      allowedValues: ['admin', 'user', 'service']
    },
    {
      field: 'permissions',
      type: 'array',
      required: false
    }
  ]
};

/**
 * ✅ Middleware principal de validation
 */
export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validation de base pour tous les endpoints
    const basicValidation = performBasicValidation(req);
    if (!basicValidation.isValid) {
      throw createValidationError(basicValidation.error || 'Validation error', basicValidation.details);
    }
    
    // Validation spécifique par endpoint
    const endpointValidation = performEndpointValidation(req);
    if (!endpointValidation.isValid) {
      throw createValidationError(endpointValidation.error || 'Endpoint validation error', endpointValidation.details);
    }
    
    // Sanitisation des données
    sanitizeRequestData(req);
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * 🔍 Validation de base pour toutes les requêtes
 */
function performBasicValidation(req: Request): { isValid: boolean; error?: string; details?: Record<string, unknown> } {
  const errors: string[] = [];
  
  // Validation de la taille du payload
  const contentLength = req.headers['content-length'];
  if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) { // 10MB
    errors.push('Taille de requête trop importante (limite: 10MB)');
  }
  
  // Validation du Content-Type pour les requêtes POST/PUT
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.headers['content-type'];
    if (!contentType) {
      errors.push('Header Content-Type manquant');
    } else if (!contentType.includes('application/json') && !contentType.includes('multipart/form-data')) {
      errors.push('Content-Type non supporté (attendu: application/json)');
    }
  }
  
  // Validation des headers obligatoires
  const requiredHeaders = ['user-agent'];
  for (const header of requiredHeaders) {
    if (!req.headers[header]) {
      errors.push(`Header obligatoire manquant: ${header}`);
    }
  }
  
  // Validation contre les attaques par header injection
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === 'string' && (value.includes('\n') || value.includes('\r'))) {
      errors.push(`Header potentiellement malveillant détecté: ${key}`);
    }
  }
  
  if (errors.length > 0) {
    return {
      isValid: false,
      error: 'Erreurs de validation de base',
      details: { errors }
    };
  }
  
  return { isValid: true };
}

/**
 * 🎯 Validation spécifique par endpoint
 */
function performEndpointValidation(req: Request): { isValid: boolean; error?: string; details?: Record<string, unknown> } {
  // Recherche du schéma de validation correspondant
  const schema = findValidationSchema(req.path);
  if (!schema) {
    return { isValid: true }; // Pas de validation spécifique
  }
  
  const errors: Array<{ field: string; error: string }> = [];
  const data = { ...req.body, ...req.query, ...req.params };
  
  // Validation de chaque règle
  for (const rule of schema) {
    const validationResult = validateField(data[rule.field], rule);
    if (!validationResult.isValid) {
      errors.push({
        field: rule.field,
        error: validationResult.error || 'Erreur de validation'
      });
    }
  }
  
  if (errors.length > 0) {
    return {
      isValid: false,
      error: 'Erreurs de validation des champs',
      details: { fieldErrors: errors }
    };
  }
  
  return { isValid: true };
}

/**
 * 🔍 Recherche du schéma de validation pour un chemin
 */
function findValidationSchema(path: string): ValidationRule[] | null {
  // Recherche exacte
  if (validationSchemas[path]) {
    return validationSchemas[path];
  }
  
  // Recherche par pattern (pour les chemins avec paramètres)
  for (const [schemaPath, rules] of Object.entries(validationSchemas)) {
    const pattern = schemaPath.replace(/:[^/]+/g, '[^/]+');
    const regex = new RegExp(`^${pattern}$`);
    if (regex.test(path)) {
      return rules;
    }
  }
  
  return null;
}

/**
 * ✅ Validation d'un champ selon une règle
 */
function validateField(value: unknown, rule: ValidationRule): { isValid: boolean; error?: string } {
  // Champ requis
  if (rule.required && (value === undefined || value === null || value === '')) {
    return { isValid: false, error: `Champ obligatoire manquant` };
  }
  
  // Si le champ n'est pas requis et est vide, on passe
  if (!rule.required && (value === undefined || value === null || value === '')) {
    return { isValid: true };
  }
  
  // Validation du type
  const typeValidation = validateType(value, rule.type);
  if (!typeValidation.isValid) {
    return typeValidation;
  }
  
  // Validation des contraintes spécifiques
  const constraintValidation = validateConstraints(value, rule);
  if (!constraintValidation.isValid) {
    return constraintValidation;
  }
  
  // Validation personnalisée
  if (rule.customValidator) {
    const customResult = rule.customValidator(value);
    if (customResult !== true) {
      return { isValid: false, error: typeof customResult === 'string' ? customResult : 'Validation personnalisée échouée' };
    }
  }
  
  return { isValid: true };
}

/**
 * 🔢 Validation du type de données
 */
function validateType(value: unknown, type: string): { isValid: boolean; error?: string } {
  switch (type) {
    case 'string':
      if (typeof value !== 'string') {
        return { isValid: false, error: 'Doit être une chaîne de caractères' };
      }
      break;
    case 'number':
      if (typeof value !== 'number' || isNaN(value)) {
        return { isValid: false, error: 'Doit être un nombre valide' };
      }
      break;
    case 'boolean':
      if (typeof value !== 'boolean') {
        return { isValid: false, error: 'Doit être un booléen (true/false)' };
      }
      break;
    case 'array':
      if (!Array.isArray(value)) {
        return { isValid: false, error: 'Doit être un tableau' };
      }
      break;
    case 'object':
      if (typeof value !== 'object' || Array.isArray(value) || value === null) {
        return { isValid: false, error: 'Doit être un objet' };
      }
      break;
    case 'email':
      if (typeof value !== 'string' || !isValidEmail(value)) {
        return { isValid: false, error: 'Doit être une adresse email valide' };
      }
      break;
    case 'url':
      if (typeof value !== 'string' || !isValidUrl(value)) {
        return { isValid: false, error: 'Doit être une URL valide' };
      }
      break;
  }
  
  return { isValid: true };
}

/**
 * 📏 Validation des contraintes (longueur, valeurs autorisées, etc.)
 */
function validateConstraints(value: unknown, rule: ValidationRule): { isValid: boolean; error?: string } {
  // Longueur minimale/maximale pour les chaînes
  if (typeof value === 'string') {
    if (rule.minLength && value.length < rule.minLength) {
      return { isValid: false, error: `Longueur minimale: ${rule.minLength} caractères` };
    }
    if (rule.maxLength && value.length > rule.maxLength) {
      return { isValid: false, error: `Longueur maximale: ${rule.maxLength} caractères` };
    }
  }
  
  // Valeur minimale/maximale pour les nombres
  if (typeof value === 'number') {
    if (rule.min !== undefined && value < rule.min) {
      return { isValid: false, error: `Valeur minimale: ${rule.min}` };
    }
    if (rule.max !== undefined && value > rule.max) {
      return { isValid: false, error: `Valeur maximale: ${rule.max}` };
    }
  }
  
  // Pattern regex
  if (rule.pattern && typeof value === 'string') {
    if (!rule.pattern.test(value)) {
      return { isValid: false, error: 'Format invalide' };
    }
  }
  
  // Valeurs autorisées
  if (rule.allowedValues && !rule.allowedValues.includes(value)) {
    return { isValid: false, error: `Valeurs autorisées: ${rule.allowedValues.join(', ')}` };
  }
  
  return { isValid: true };
}

/**
 * 🧹 Sanitisation des données de requête
 */
function sanitizeRequestData(req: Request) {
  // Sanitisation du body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  
  // Sanitisation des query parameters
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query) as typeof req.query;
  }
}

/**
 * 🧼 Sanitisation récursive d'un objet
 */
function sanitizeObject(obj: unknown): unknown {
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (typeof obj === 'object' && obj !== null) {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[sanitizeString(key)] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  return obj;
}

/**
 * 🧽 Sanitisation d'une chaîne de caractères
 */
function sanitizeString(str: string): string {
  return str
    .replace(/[<>"'&]/g, (match) => {
      const entities: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      };
      return entities[match] || match;
    })
    .trim();
}

/**
 * 📧 Validation d'email
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 🌐 Validation d'URL
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}



export default validateRequest;