export declare const getPrompt: (templateName: 'metadata' | 'chat' | 'flashcard' | 'quiz', variables: Record<string, string>) => string;
export declare const logPrompt: (userId: string | undefined, promptName: string, version: string, input: string, output: string, tokensUsed: number, durationMs: number) => Promise<void>;
