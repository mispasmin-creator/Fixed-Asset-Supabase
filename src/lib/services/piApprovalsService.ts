
import { supabase } from './supabaseClient';
import type { PIApprovalSheet } from '@/types/sheets';

export async function fetchPIApprovalsFromSupabase(): Promise<PIApprovalSheet[]> {
    const { data, error } = await supabase
        .from('pi_approvals')
        .select(`
            id,
            created_at,
            pi_number,
            indent_number,
            party_name,
            product_name,
            qty,
            pi_amount,
            po_number,
            po_rate_without_tax,
            total_po_amount,
            delivery_date,
            payment_terms,
            total_paid_amount,
            outstanding_amount,
            status,
            planned,
            actual,
            delay,
            payment_form,
            internal_code,
            number_of_days,
            firm_name_match,
            pi_copy,
            po_copy,
            status1
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching pi_approvals:', error);
        throw error;
    }

    return (data || []).map((row: any) => ({
        rowIndex: row.id,
        timestamp: row.created_at,
        piNo: row.pi_number,
        indentNo: row.indent_number,
        partyName: row.party_name,
        productName: row.product_name,
        qty: Number(row.qty),
        piAmount: Number(row.pi_amount),
        poNumber: row.po_number,
        poRateWithoutTax: Number(row.po_rate_without_tax),
        totalPoAmount: Number(row.total_po_amount),
        deliveryDate: row.delivery_date,
        paymentTerms: row.payment_terms,
        totalPaidAmount: Number(row.total_paid_amount),
        outstandingAmount: Number(row.outstanding_amount),
        status: row.status,

        internalCode: row.internal_code || '',
        numberOfDays: Number(row.number_of_days || 0),
        planned: row.planned || '',
        actual: row.actual || '',
        delay: row.delay || '',
        paymentForm: row.payment_form || '',
        firmNameMatch: row.firm_name_match || '',
        piCopy: row.pi_copy || '',
        poCopy: row.po_copy || '',
        status1: row.status1 || '',
    }));
}

export async function savePIApprovalsToSupabase(
    data: Partial<PIApprovalSheet>[],
    action: 'insert' | 'update' | 'delete'
) {
    if (action === 'delete') {
        const ids = data.map(d => d.rowIndex).filter(id => id);
        if (ids.length === 0) return { success: true };
        const { error } = await supabase.from('pi_approvals').delete().in('id', ids);
        if (error) throw error;
        return { success: true };
    }

    const rows = data.map(d => {
        const row: any = {};
        if (d.rowIndex) row.id = d.rowIndex;

        if (d.piNo !== undefined) row.pi_number = d.piNo;
        if (d.indentNo !== undefined) row.indent_number = d.indentNo;
        if (d.partyName !== undefined) row.party_name = d.partyName;
        if (d.productName !== undefined) row.product_name = d.productName;
        if (d.qty !== undefined) row.qty = d.qty;
        if (d.piAmount !== undefined) row.pi_amount = d.piAmount;
        if (d.poNumber !== undefined) row.po_number = d.poNumber;
        if (d.poRateWithoutTax !== undefined) row.po_rate_without_tax = d.poRateWithoutTax;
        if (d.totalPoAmount !== undefined) row.total_po_amount = d.totalPoAmount;
        if (d.deliveryDate !== undefined) row.delivery_date = d.deliveryDate || null;
        if (d.paymentTerms !== undefined) row.payment_terms = d.paymentTerms;
        if (d.totalPaidAmount !== undefined) row.total_paid_amount = d.totalPaidAmount;
        if (d.outstandingAmount !== undefined) row.outstanding_amount = d.outstandingAmount;
        if (d.status !== undefined) row.status = d.status;
        if (d.internalCode !== undefined) row.internal_code = d.internalCode;
        if (d.numberOfDays !== undefined) row.number_of_days = d.numberOfDays;
        if (d.planned !== undefined) row.planned = d.planned;
        if (d.actual !== undefined) row.actual = d.actual;
        if (d.delay !== undefined) row.delay = d.delay;
        if (d.paymentForm !== undefined) row.payment_form = d.paymentForm;
        if (d.firmNameMatch !== undefined) row.firm_name_match = d.firmNameMatch;
        if (d.piCopy !== undefined) row.pi_copy = d.piCopy;
        if (d.poCopy !== undefined) row.po_copy = d.poCopy;
        if (d.status1 !== undefined) row.status1 = d.status1;

        return row;
    });

    const { data: result, error } = await supabase.from('pi_approvals').upsert(rows).select();
    if (error) {
        console.error('Error saving pi_approvals:', error);
        throw error;
    }
    return { success: true, data: result };
}
