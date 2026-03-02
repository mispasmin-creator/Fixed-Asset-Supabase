
import { supabase } from './supabaseClient';
import type { Vendors } from '@/types/sheets';

export async function fetchVendorsFromSupabase(): Promise<Vendors[]> {
    const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .order('vendor_name', { ascending: true });

    if (error) {
        console.error('Error fetching vendors:', error);
        throw error;
    }

    return (data || []).map((row: any) => ({
        id: row.id,
        created_at: row.created_at,
        vendor_name: row.vendor_name,
        rate_type: row.rate_type,
        rate: Number(row.rate),
        with_tax: row.with_tax,
        tax_value: Number(row.tax_value),
        payment_term: row.payment_term,
        whatsapp_number: row.whatsapp_number,
        email: row.email,
    }));
}

export async function saveVendorsToSupabase(
    data: Partial<Vendors>[],
    action: 'insert' | 'update' | 'delete'
) {
    if (action === 'delete') {
        const ids = data.map(d => d.id).filter(id => id);
        if (ids.length === 0) return { success: true };

        const { error } = await supabase
            .from('vendors')
            .delete()
            .in('id', ids);

        if (error) throw error;
        return { success: true };
    }

    const rows = data.map(d => {
        const row: any = {};
        if (d.id) row.id = d.id;

        if (d.vendor_name !== undefined) row.vendor_name = d.vendor_name;
        if (d.rate_type !== undefined) row.rate_type = d.rate_type;
        if (d.rate !== undefined) row.rate = d.rate;
        if (d.with_tax !== undefined) row.with_tax = d.with_tax;
        if (d.tax_value !== undefined) row.tax_value = d.tax_value;
        if (d.payment_term !== undefined) row.payment_term = d.payment_term;
        if (d.whatsapp_number !== undefined) row.whatsapp_number = d.whatsapp_number;
        if (d.email !== undefined) row.email = d.email;

        return row;
    });

    const { data: result, error } = await supabase
        .from('vendors')
        .upsert(rows)
        .select();

    if (error) {
        console.error('Error saving vendors:', error);
        throw error;
    }
    return { success: true, data: result };
}
