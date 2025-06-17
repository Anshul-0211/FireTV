import { User, CreateUserRequest, UpdateUserRequest, QueryResult } from '../types';
export declare class UserModel {
    static getAllUsers(): Promise<QueryResult<User[]>>;
    static getUserById(id: number): Promise<QueryResult<User>>;
    static getUserByUsername(username: string): Promise<QueryResult<User>>;
    static createUser(userData: CreateUserRequest): Promise<QueryResult<User>>;
    static updateUser(id: number, userData: UpdateUserRequest): Promise<QueryResult<User>>;
    static deleteUser(id: number): Promise<QueryResult<boolean>>;
    static usernameExists(username: string): Promise<boolean>;
    static emailExists(email: string): Promise<boolean>;
}
//# sourceMappingURL=User.d.ts.map