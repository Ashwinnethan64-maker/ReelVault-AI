export declare const enqueueJob: (type: 'generate_metadata' | 'generate_embedding', payload: any) => Promise<{
    id: string;
    type: string;
    payload: string;
    status: string;
    attempts: number;
    error: string | null;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare const processNextJob: () => Promise<boolean | null>;
export declare const startBackgroundWorker: () => void;
