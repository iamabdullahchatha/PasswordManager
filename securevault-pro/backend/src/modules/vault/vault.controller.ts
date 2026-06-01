import { Response, NextFunction } from 'express';
import { vaultService } from './vault.service';
import { AuthRequest } from '../../middleware/auth.middleware';
import { sendSuccess, sendCreated } from '../../utils/response';
import { generatePassword, assessPasswordStrength } from '../../utils/password';
import type {
  CreateVaultEntryInput,
  UpdateVaultEntryInput,
  RevealInput,
  ListVaultQuery,
} from './vault.dto';

export class VaultController {

  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const query = req.query as unknown as ListVaultQuery;
      const result = await vaultService.listEntries(req.user.id, query);
      sendSuccess(res, result.entries, 'Vault entries retrieved', 200, result.meta);
    } catch (e) { next(e); }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const dto = req.body as CreateVaultEntryInput;
      const entry = await vaultService.createEntry(req.user.id, dto, req.ip);
      sendCreated(res, entry, 'Vault entry created');
    } catch (e) { next(e); }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const entry = await vaultService.getEntry(req.params.id, req.user.id);
      sendSuccess(res, entry);
    } catch (e) { next(e); }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const dto = req.body as UpdateVaultEntryInput;
      const entry = await vaultService.updateEntry(req.params.id, req.user.id, dto, req.ip);
      sendSuccess(res, entry, 'Vault entry updated');
    } catch (e) { next(e); }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await vaultService.deleteEntry(req.params.id, req.user.id, req.ip);
      sendSuccess(res, null, 'Vault entry deleted');
    } catch (e) { next(e); }
  }

  async reveal(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { masterPassword, field } = req.body as RevealInput;
      const result = await vaultService.revealField(req.params.id, req.user.id, masterPassword, field ?? 'password', req.ip);
      sendSuccess(res, result);
    } catch (e) { next(e); }
  }

  async toggleFavorite(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await vaultService.toggleFavorite(req.params.id, req.user.id);
      sendSuccess(res, result);
    } catch (e) { next(e); }
  }

  async toggleArchive(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await vaultService.toggleArchive(req.params.id, req.user.id, req.ip);
      sendSuccess(res, result);
    } catch (e) { next(e); }
  }

  async logCopy(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await vaultService.logCopy(req.params.id, req.user.id, req.ip);
      sendSuccess(res, null, 'Copy logged');
    } catch (e) { next(e); }
  }

  async getCategories(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const categories = await vaultService.getCategories(req.user.id);
      sendSuccess(res, categories);
    } catch (e) { next(e); }
  }

  async securityReport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const report = await vaultService.getSecurityReport(req.user.id);
      sendSuccess(res, report, 'Security report generated');
    } catch (e) { next(e); }
  }

  async exportVault(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { exportPassword, masterPassword } = req.body;
      const result = await vaultService.exportVault(req.user.id, masterPassword, exportPassword, req.ip);
      sendSuccess(res, result, 'Vault exported successfully');
    } catch (e) { next(e); }
  }

  async importVault(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { payload, exportPassword, masterPassword } = req.body;
      const result = await vaultService.importVault(req.user.id, masterPassword, exportPassword, payload, req.ip);
      sendSuccess(res, result, 'Vault imported successfully');
    } catch (e) { next(e); }
  }

  async getActivity(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const logs = await vaultService.getActivity(req.user.id, undefined, 100);
      sendSuccess(res, logs);
    } catch (e) { next(e); }
  }

  async getEntryActivity(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const logs = await vaultService.getActivity(req.user.id, req.params.id, 50);
      sendSuccess(res, logs);
    } catch (e) { next(e); }
  }

  async generatePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const {
        length = 20,
        uppercase = true,
        lowercase = true,
        numbers = true,
        symbols = true,
        excludeAmbiguous = false,
      } = req.body ?? {};

      const password = generatePassword({ length, uppercase, lowercase, numbers, symbols, excludeAmbiguous });
      const strength = assessPasswordStrength(password);
      sendSuccess(res, { password, strength });
    } catch (e) { next(e); }
  }
}

export const vaultController = new VaultController();
