import { Request, Response } from 'express';
export declare class UserController {
    static getAllUsers(_req: Request, res: Response): Promise<void>;
    static getUserById(req: Request, res: Response): Promise<void>;
    static getUserByUsername(req: Request, res: Response): Promise<void>;
    static createUser(req: Request, res: Response): Promise<void>;
    static updateUser(req: Request, res: Response): Promise<void>;
    static deleteUser(req: Request, res: Response): Promise<void>;
    static checkUsername(req: Request, res: Response): Promise<void>;
    static checkEmail(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=userController.d.ts.map