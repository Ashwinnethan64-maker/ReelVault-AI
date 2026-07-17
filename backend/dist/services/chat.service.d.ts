export declare const chatWithVault: (userId: string, sessionId: string, message: string) => Promise<{
    reply: string;
    sources: any;
}>;
