
import { supabase } from './supabaseClient';
import type { PoMasterSheet } from '@/types';

export async function fetchPoMasterFromSupabase(): Promise<PoMasterSheet[]> {
    const { data, error } = await supabase
        .from('po_master')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching po_master:', error);
        throw error;
    }

    return (data || []).map((row: any) => ({
        rowIndex: row.id,
        timestamp: row.created_at,
        poNumber: row.po_number,
        partyName: row.party_name,
        quotationNumber: row.quotation_number,
        enquiryNumber: row.enquiry_number,
        product: row.product,
        description: row.description,
        quantity: Number(row.quantity),
        unit: row.unit,
        rate: Number(row.rate),
        gstPercent: Number(row.gst_percent),
        discountPercent: Number(row.discount_percent),
        amount: Number(row.amount),
        totalPoAmount: Number(row.total_po_amount),
        preparedBy: row.prepared_by,
        approvedBy: row.approved_by,
        deliveryDate: row.delivery_date,
        paymentTerms: row.payment_terms,
        numberOfDays: row.number_of_days,
        totalPaidAmount: Number(row.total_paid_amount),
        outstandingAmount: Number(row.outstanding_amount),
        status: row.status,
        internalCode: row.internal_code || '',
        // Derived fields since they are not in the database schema anymore
        gst: (Number(row.amount) * Number(row.gst_percent)) / 100 || 0,
        discount: (Number(row.amount) * Number(row.discount_percent)) / 100 || 0,
        // pdf is TEXT[] in DB, we use the first one if available
        pdf: Array.isArray(row.pdf) ? row.pdf[0] || '' : (row.pdf || ''),
        quotationDate: row.quotation_date || '',
        enquiryDate: row.enquiry_date || '',
        term1: row.term_1 || '', term2: row.term_2 || '', term3: row.term_3 || '', term4: row.term_4 || '', term5: row.term_5 || '',
        term6: row.term_6 || '', term7: row.term_7 || '', term8: row.term_8 || '', term9: row.term_9 || '', term10: row.term_10 || '',
        deliveryDays: row.delivery_days || 0,
        deliveryType: row.delivery_type || '',
        firmNameMatch: row.firm_name_match || '',
        emailSendStatus: String(row.email_send_status || 'false'),
        'Guarantee': row.guarantee || '',
        'Freight Payment': row.freight_payment || '',
    })) as PoMasterSheet[];
}

export async function savePoMasterToSupabase(
    data: Partial<PoMasterSheet>[],
    action: 'insert' | 'update' | 'delete'
) {
    if (action === 'delete') {
        const ids = data.map(d => d.rowIndex).filter(id => id);
        if (ids.length === 0) return { success: true };
        const { error } = await supabase.from('po_master').delete().in('id', ids);
        if (error) throw error;
        return { success: true };
    }

    const rows = data.map(d => {
        const row: any = {};
        if (d.rowIndex) row.id = d.rowIndex;

        if (d.poNumber !== undefined) row.po_number = d.poNumber;
        if (d.partyName !== undefined) row.party_name = d.partyName;
        if (d.quotationNumber !== undefined) row.quotation_number = d.quotationNumber;
        if (d.enquiryNumber !== undefined) row.enquiry_number = d.enquiryNumber;
        if (d.product !== undefined) row.product = d.product;
        if (d.description !== undefined) row.description = d.description;
        if (d.quantity !== undefined) row.quantity = d.quantity;
        if (d.unit !== undefined) row.unit = d.unit;
        if (d.rate !== undefined) row.rate = d.rate;
        if (d.gstPercent !== undefined) row.gst_percent = d.gstPercent;
        if (d.discountPercent !== undefined) {
            const val = typeof d.discountPercent === 'number' ? d.discountPercent : parseFloat(d.discountPercent || '0');
            row.discount_percent = isNaN(val) ? 0 : val;
        }
        if (d.amount !== undefined) row.amount = d.amount;
        if (d.totalPoAmount !== undefined) row.total_po_amount = d.totalPoAmount;
        if (d.preparedBy !== undefined) row.prepared_by = d.preparedBy;
        if (d.approvedBy !== undefined) row.approved_by = d.approvedBy;
        if (d.deliveryDate !== undefined) row.delivery_date = d.deliveryDate || null;
        if (d.paymentTerms !== undefined) row.payment_terms = d.paymentTerms;
        if (d.numberOfDays !== undefined) row.number_of_days = d.numberOfDays;

        // Handle pdf as TEXT[]
        if (d.pdf !== undefined) row.pdf = d.pdf ? [d.pdf] : [];

        if (d.quotationDate !== undefined) row.quotation_date = d.quotationDate || null;
        if (d.enquiryDate !== undefined) row.enquiry_date = d.enquiryDate || null;
        if (d.internalCode !== undefined) row.internal_code = d.internalCode;
        if (d.deliveryDays !== undefined) row.delivery_days = d.deliveryDays;
        if (d.deliveryType !== undefined) row.delivery_type = d.deliveryType;
        if (d.firmNameMatch !== undefined) row.firm_name_match = d.firmNameMatch;

        // Handle email_send_status as BOOLEAN
        if (d.emailSendStatus !== undefined) {
            row.email_send_status = d.emailSendStatus === 'true' || d.emailSendStatus === true;
        }

        if (d.Guarantee !== undefined) row.guarantee = d.Guarantee;
        if (d['Freight Payment'] !== undefined) row.freight_payment = d['Freight Payment'];
        if (d.status !== undefined) row.status = d.status;
        if (d.totalPaidAmount !== undefined) row.total_paid_amount = d.totalPaidAmount;
        if (d.outstandingAmount !== undefined) row.outstanding_amount = d.outstandingAmount;

        // Handle terms with underscores: term_1, term_2, ...
        for (let i = 1; i <= 10; i++) {
            const frontendKey = `term${i}` as keyof PoMasterSheet;
            if (d[frontendKey] !== undefined) {
                row[`term_${i}`] = d[frontendKey];
            }
        }

        return row;
    });

    const { data: result, error } = await supabase.from('po_master').upsert(rows).select();
    if (error) {
        console.error('Error saving po_master:', error);
        throw error;
    }
    return { success: true, data: result };
}
