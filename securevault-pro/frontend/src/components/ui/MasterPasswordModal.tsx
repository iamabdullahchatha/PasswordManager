import { useState, useRef, useEffect } from 'react';
import { Shield, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Alert } from './Alert';
import { authService } from '../../services/auth.service';
import { useAuthStore } from '../../store/authStore';
import { toast } from '../../hooks/useToast';
import { getErrorMessage } from '../../services/api';
import { useNavigate } from 'react-router-dom';

interface MasterPasswordModalProps {
  open: boolean;
  onClose: () => void;
  onVerified: () => void;
  title?: string;
  description?: string;
}

export function MasterPasswordModal({
  open, onClose, onVerified,
  title = 'Master Password Required',
  description = 'Enter your master password to decrypt and view this information.',
}: MasterPasswordModalProps) {
  const { user, setMasterPasswordVerified } = useAuthStore();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setPassword(''); setError(''); setShow(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]);

  const handleVerify = async () => {
    if (!password.trim()) { setError('Master password is required'); return; }
    setLoading(true); setError('');
    try {
      const result = await authService.verifyMasterPassword(password);
      if (result.data?.verified) {
        setMasterPasswordVerified(true);
        setPassword('');
        onVerified();
        onClose();
        toast('Identity verified', 'success');
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (!user?.hasMasterPassword) {
    return (
      <Modal open={open} onClose={onClose} size="xs">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto">
            <AlertTriangle size={24} className="text-amber-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">Master Password Not Set</h3>
            <p className="text-sm text-slate-500 mt-1.5">
              You need to set a master password before viewing stored credentials.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} fullWidth>Later</Button>
            <Button variant="primary" onClick={() => { onClose(); navigate('/settings/security'); }} fullWidth>
              Set Now
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title={title} description={description} size="xs">
      <div className="space-y-4">
        <div className="relative">
          <input
            ref={inputRef}
            type={show ? 'text' : 'password'}
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
            placeholder="Enter master password"
            className="w-full bg-white rounded-lg border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 px-3 py-2.5 pr-10 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          <button type="button" onClick={() => setShow((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        {error && <Alert variant="error">{error}</Alert>}
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} fullWidth disabled={loading}>Cancel</Button>
          <Button variant="primary" onClick={handleVerify} loading={loading} fullWidth>Verify</Button>
        </div>
        <p className="text-center text-xs text-slate-400">Session verified for 30 minutes</p>
      </div>
    </Modal>
  );
}
