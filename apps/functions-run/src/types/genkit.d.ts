/**
 * @file        Définitions de types pour les modules Genkit
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-26
 * @updated     2025-05-26
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

declare module 'genkit' {
  export function flow<TInput, TOutput>(config: {
    name: string;
    description: string;
    version: string;
    run: (input: TInput) => Promise<TOutput>;
  }): {
    run: (input: TInput) => Promise<TOutput>;
  };
}

declare module 'genkit-vertexai' {
  export class GeminiModel {
    constructor(options: { model: string; maxOutputTokens?: number });
    generate(prompt: string): Promise<{ text: string }>;
  }
}

declare module 'genkit-openai' {
  export class OpenAIModel {
    constructor(options: { model: string; maxTokens?: number });
    generate(prompt: string): Promise<{ text: string }>;
  }
}

declare module 'cld3' {
  export function getLanguageDetector(): {
    findLanguage: (text: string) => { language: string; probability: number };
  };
}
