// lib/validations/leave.ts
import { z } from 'zod';

export const LeaveTypeSchema = z.object({
  name: z.string().min(1, 'Nama harus diisi'),
  max_days: z.number().min(1, 'Maksimal hari minimal 1'),
  is_paid: z.boolean().default(true),
  requires_document: z.boolean().default(false),
});

export const LeaveRequestSchema = z.object({
  leave_type_id: z.string().uuid('ID jenis cuti tidak valid'),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD'),
  reason: z.string().min(10, 'Alasan minimal 10 karakter'),
  attachment_url: z.string().url('URL lampiran tidak valid').optional().or(z.literal('')),
});

export const LeaveReviewSchema = z.object({
  action: z.enum(['approve', 'reject']),
  rejection_note: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.action === 'reject' && (!data.rejection_note || data.rejection_note.length < 10)) {
    ctx.addIssue({
      code: 'custom',
      message: 'Catatan penolakan minimal 10 karakter jika ditolak',
      path: ['rejection_note'],
    });
  }
});

export const LeaveQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  year: z.string().regex(/^\d{4}$/).optional(),
  status: z.enum(['pending', 'approved', 'rejected', 'cancelled']).optional(),
  employee_id: z.string().uuid().optional(),
  leave_type_id: z.string().uuid().optional(),
  sort_dir: z.enum(['asc', 'desc']).default('desc'),
});

export const LeaveBalanceQuerySchema = z.object({
  year: z.coerce.number().min(2000).optional(),
  employee_id: z.string().uuid().optional(),
});
