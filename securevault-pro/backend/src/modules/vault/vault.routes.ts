import { Router } from 'express';
import { vaultController } from './vault.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { sensitiveRateLimiter } from '../../config/rateLimit';
import {
  createVaultEntrySchema,
  updateVaultEntrySchema,
  revealPasswordSchema,
  listVaultQuerySchema,
  exportVaultSchema,
  importVaultSchema,
} from './vault.dto';

const router = Router();
router.use(authenticate as any);

// ── Collection endpoints ────────────────────────────────────────────────────
router.get('/categories',       vaultController.getCategories.bind(vaultController));
router.get('/security-report',  vaultController.securityReport.bind(vaultController));
router.get('/activity',         vaultController.getActivity.bind(vaultController));
router.post('/generate-password', vaultController.generatePassword.bind(vaultController));
router.post('/export',          sensitiveRateLimiter, validate(exportVaultSchema), vaultController.exportVault.bind(vaultController));
router.post('/import',          sensitiveRateLimiter, validate(importVaultSchema), vaultController.importVault.bind(vaultController));

// ── CRUD ────────────────────────────────────────────────────────────────────
router.get('/',    validate(listVaultQuerySchema, 'query'), vaultController.list.bind(vaultController));
router.post('/',   validate(createVaultEntrySchema),        vaultController.create.bind(vaultController));
router.get('/:id', vaultController.getById.bind(vaultController));
router.patch('/:id', validate(updateVaultEntrySchema), vaultController.update.bind(vaultController));
router.delete('/:id', vaultController.delete.bind(vaultController));

// ── Entry-level actions ─────────────────────────────────────────────────────
router.patch('/:id/favorite',   vaultController.toggleFavorite.bind(vaultController));
router.patch('/:id/archive',    vaultController.toggleArchive.bind(vaultController));
router.post('/:id/reveal',      sensitiveRateLimiter, validate(revealPasswordSchema), vaultController.reveal.bind(vaultController));
router.post('/:id/copy-log',    vaultController.logCopy.bind(vaultController));
router.get('/:id/activity',     vaultController.getEntryActivity.bind(vaultController));

export default router;
