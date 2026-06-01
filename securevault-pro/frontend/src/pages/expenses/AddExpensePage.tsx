import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Tag, Calendar, RefreshCw, Store, FileText, CreditCard, Info } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { expensesService } from '../../services/expenses.service';
import { toast } from '../../hooks/useToast';
import { getErrorMessage } from '../../services/api';
import { EXPENSE_CATEGORY_LABELS, PAYMENT_METHOD_LABELS } from '../../utils/format';
import type { ExpenseCategory, PaymentMethod, ExpenseStatus } from '../../types';

const categories = Object.entries(EXPENSE_CATEGORY_LABELS) as [ExpenseCategory, string][];
const paymentMethods = Object.entries(PAYMENT_METHOD_LABELS) as [PaymentMethod, string][];
const currencies = ['USD', 'EUR', 'GBP', 'PKR', 'CAD', 'AUD', 'INR', 'AED', 'SAR', 'JPY'];
const statuses: { value: ExpenseStatus; label: string }[] = [
  { value: 'PAID',      label: 'Paid'      },
  { value: 'PENDING',   label: 'Pending'   },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const schema = z.object({
  title:           z.string().min(1, 'Title is required').max(200),
  amount:          z.string().min(1, 'Amount is required').refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'Must be a positive number'),
  currency:        z.string().optional().default('USD'),
  category:        z.string().min(1, 'Category is required'),
  customCategory:  z.string().max(100).optional(),
  paymentMethod:   z.string().default('CASH'),
  status:          z.string().default('PAID'),
  date:            z.string().min(1, 'Date is required'),
  vendor:          z.string().max(200).optional(),
  description:     z.string().max(1000).optional(),
  notes:           z.string().max(2000).optional(),
  isRecurring:     z.boolean().optional().default(false),
  recurringPeriod: z.string().optional(),
  tags:            z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const selectCls = 'w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm hover:border-slate-300';
const labelCls  = 'block text-sm font-semibold text-slate-700 mb-1.5';

export default function AddExpensePage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const isEdit   = !!id;
  const [loadingData, setLoadingData] = useState(isEdit);

  const {
    register, handleSubmit, watch, setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      category:      'OTHER',
      paymentMethod: 'CASH',
      status:        'PAID',
      date:          new Date().toISOString().split('T')[0],
      currency:      'USD',
    },
  });

  const isRecurring = watch('isRecurring');
  const category    = watch('category');

  useEffect(() => {
    if (isEdit && id) {
      expensesService.getById(id).then((res) => {
        if (res.data) {
          const e = res.data;
          setValue('title',           e.title);
          setValue('amount',          String(e.amount));
          setValue('currency',        e.currency);
          setValue('category',        e.category);
          setValue('customCategory',  e.customCategory ?? '');
          setValue('paymentMethod',   e.paymentMethod);
          setValue('status',          e.status);
          setValue('date',            new Date(e.date).toISOString().split('T')[0]);
          setValue('vendor',          e.vendor ?? '');
          setValue('description',     e.description ?? '');
          setValue('notes',           e.notes ?? '');
          setValue('isRecurring',     e.isRecurring);
          setValue('recurringPeriod', e.recurringPeriod ?? '');
          setValue('tags',            e.tags.join(', '));
        }
      }).finally(() => setLoadingData(false));
    }
  }, [id, isEdit, setValue]);

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        title:           data.title,
        amount:          parseFloat(data.amount),
        currency:        data.currency ?? 'USD',
        category:        data.category as ExpenseCategory,
        customCategory:  data.category === 'OTHER' ? data.customCategory || null : null,
        paymentMethod:   data.paymentMethod as PaymentMethod,
        status:          data.status as ExpenseStatus,
        date:            data.date,
        vendor:          data.vendor || null,
        description:     data.description || null,
        notes:           data.notes || null,
        isRecurring:     data.isRecurring ?? false,
        recurringPeriod: data.isRecurring ? data.recurringPeriod || null : null,
        tags:            data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      };

      if (isEdit && id) {
        await expensesService.update(id, payload);
        toast('Expense updated', 'success');
      } else {
        await expensesService.create(payload);
        toast('Expense recorded', 'success');
      }
      navigate('/expenses');
    } catch (err) { toast(getErrorMessage(err), 'error'); }
  };

  if (loadingData) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-2xl">
      <PageHeader
        title={isEdit ? 'Edit Expense' : 'Add Expense'}
        description={isEdit ? 'Update expense details' : 'Record a new transaction'}
        icon={DollarSign}
        breadcrumb={['Expenses', isEdit ? 'Edit' : 'New Expense']}
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-slate-200 shadow-card"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="divide-y divide-slate-100">
          {/* ── Core Details ─────────────────────────────────────────────── */}
          <div className="p-6 space-y-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Transaction Details</p>

            <Input
              label="Expense Title"
              placeholder="e.g. Monthly Rent, Grocery, Coffee…"
              error={errors.title?.message}
              required
              {...register('title')}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                leftIcon={DollarSign}
                error={errors.amount?.message}
                required
                {...register('amount')}
              />
              <div>
                <label className={labelCls}>Currency</label>
                <select className={selectCls} {...register('currency')}>
                  {currencies.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Category <span className="text-red-500">*</span></label>
                <select className={selectCls} {...register('category')}>
                  {categories.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                {errors.category && <p className="text-xs text-red-600 mt-1">{errors.category.message}</p>}
              </div>
              <Input
                label="Date"
                type="date"
                leftIcon={Calendar}
                error={errors.date?.message}
                required
                {...register('date')}
              />
            </div>

            {category === 'OTHER' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                <Input
                  label="Custom Category Name"
                  placeholder="e.g. Pet care, Hobbies…"
                  {...register('customCategory')}
                />
              </motion.div>
            )}
          </div>

          {/* ── Payment Info ────────────────────────────────────────────── */}
          <div className="p-6 space-y-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Payment Information</p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}><CreditCard size={13} className="inline mr-1" />Payment Method</label>
                <select className={selectCls} {...register('paymentMethod')}>
                  {paymentMethods.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Status</label>
                <select className={selectCls} {...register('status')}>
                  {statuses.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>

            <Input
              label="Vendor / Shop Name"
              placeholder="e.g. Amazon, Local Store…"
              leftIcon={Store}
              {...register('vendor')}
            />
          </div>

          {/* ── Additional Details ───────────────────────────────────────── */}
          <div className="p-6 space-y-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Additional Details</p>

            <div>
              <label className={labelCls}><FileText size={13} className="inline mr-1" />Description</label>
              <textarea
                rows={2}
                placeholder="Brief description…"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm resize-none"
                {...register('description')}
              />
            </div>

            <div>
              <label className={labelCls}><Info size={13} className="inline mr-1" />Notes</label>
              <textarea
                rows={2}
                placeholder="Private notes, reminders…"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm resize-none"
                {...register('notes')}
              />
            </div>

            <Input
              label="Tags"
              leftIcon={Tag}
              placeholder="food, work, travel (comma separated)"
              {...register('tags')}
            />
          </div>

          {/* ── Recurring ────────────────────────────────────────────────── */}
          <div className="p-6 space-y-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recurring Settings</p>

            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex-shrink-0">
                <input type="checkbox" className="sr-only peer" {...register('isRecurring')} />
                <div className="w-[18px] h-[18px] rounded border-2 border-slate-300 peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all" />
                <svg viewBox="0 0 12 12" fill="none" className="absolute inset-0 w-full h-full p-0.5 opacity-0 peer-checked:opacity-100 pointer-events-none">
                  <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                  <RefreshCw size={13} className="text-slate-400" /> Recurring Expense
                </p>
                <p className="text-xs text-slate-500">This expense repeats on a schedule</p>
              </div>
            </label>

            {isRecurring && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                <label className={labelCls}>Recurrence Period</label>
                <select className={selectCls} {...register('recurringPeriod')}>
                  <option value="">Select period</option>
                  {(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'] as const).map((p) => (
                    <option key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</option>
                  ))}
                </select>
              </motion.div>
            )}
          </div>

          {/* ── Actions ─────────────────────────────────────────────────── */}
          <div className="p-6 flex gap-3">
            <Button type="button" variant="outline" onClick={() => navigate('/expenses')} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={isSubmitting} className="flex-1">
              {isEdit ? 'Update Expense' : 'Save Expense'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
