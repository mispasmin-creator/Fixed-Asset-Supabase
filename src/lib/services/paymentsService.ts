
import { supabase } from './supabaseClient';
import type { PaymentHistory } from '@/types/sheets';

export async function fetchPaymentsFromSupabase(): Promise<PaymentHistory[]> {
    const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching payments:', error);
        throw error;
    }

    return (data || []).map((row: any) => ({
        timestamp: row.created_at,
        apPaymentNumber: row.ap_payment_number,
        status: row.status,
        uniqueNumber: row.unique_number,
        fmsName: row.fms_name,
        payTo: row.pay_to,
        amountToBePaid: Number(row.amount_to_be_paid),

        remarks: row.remarks || '',
        anyAttachments: row.any_attachments || '',
    }));
}

export async function savePaymentsToSupabase(
    data: Partial<PaymentHistory>[],
    action: 'insert' | 'update' | 'delete'
) {
    if (action === 'delete') {
        const ids = data.map(d => d.apPaymentNumber).filter(id => id);
        if (ids.length === 0) return { success: true };
        const { error } = await supabase.from('payments').delete().in('ap_payment_number', ids);
        if (error) throw error;
        return { success: true };
    }

    const rows = data.map(d => {
        const row: any = {};
        if (d.apPaymentNumber !== undefined) row.ap_payment_number = d.apPaymentNumber;
        if (d.status !== undefined) row.status = d.status;
        if (d.uniqueNumber !== undefined) row.unique_number = d.uniqueNumber;
        if (d.fmsName !== undefined) row.fms_name = d.fmsName;
        if (d.payTo !== undefined) row.pay_to = d.payTo;
        if (d.amountToBePaid !== undefined) row.amount_to_be_paid = d.amountToBePaid;
        if (d.remarks !== undefined) row.remarks = d.remarks;
        if (d.anyAttachments !== undefined) row.any_attachments = d.anyAttachments;

        return row;
    });

    const { data: result, error } = await supabase.from('payments').upsert(rows, { onConflict: 'ap_payment_number' }).select();
    if (error) {
        console.error('Error saving payments:', error);
        throw error;
    }
    return { success: true, data: result };
}
