import { Response, NextFunction } from 'express';
import { usersService } from './users.service';
import { AuthRequest } from '../../middleware/auth.middleware';
import { sendSuccess, sendCreated } from '../../utils/response';
import { Role } from '@prisma/client';
import type { CreateUserDto, UpdateUserDto, ChangePasswordDto, ListUsersQuery } from './users.dto';

export class UsersController {
  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await usersService.createUser(req.body as CreateUserDto, req.user.id, req.user.role as Role);
      sendCreated(res, user, 'User created successfully');
    } catch (err) { next(err); }
  }

  async list(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { users, meta } = await usersService.listUsers(req.query as unknown as ListUsersQuery);
      sendSuccess(res, users, 'Users retrieved', 200, meta);
    } catch (err) { next(err); }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await usersService.getUserById(req.params.id);
      sendSuccess(res, user);
    } catch (err) { next(err); }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await usersService.updateUser(req.params.id, req.body as UpdateUserDto, req.user.id, req.user.role as Role);
      sendSuccess(res, user, 'User updated');
    } catch (err) { next(err); }
  }

  async toggleStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await usersService.toggleUserStatus(req.params.id, req.user.id);
      sendSuccess(res, user, `User ${user.isActive ? 'activated' : 'deactivated'}`);
    } catch (err) { next(err); }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await usersService.deleteUser(req.params.id, req.user.id);
      sendSuccess(res, null, 'User deleted');
    } catch (err) { next(err); }
  }

  async changePassword(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await usersService.changePassword(req.user.id, req.body as ChangePasswordDto);
      sendSuccess(res, null, 'Password changed. Please log in again.');
    } catch (err) { next(err); }
  }
}

export const usersController = new UsersController();
