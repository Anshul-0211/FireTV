import { Pool } from 'pg';
export declare const dbConfig: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
    max: number;
    idleTimeoutMillis: number;
    connectionTimeoutMillis: number;
};
export declare const pool: Pool;
export declare const testConnection: () => Promise<boolean>;
export declare const closeConnection: () => Promise<void>;
//# sourceMappingURL=database.d.ts.map