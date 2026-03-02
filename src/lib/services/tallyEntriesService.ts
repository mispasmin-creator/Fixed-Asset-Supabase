import { supabase } from './supabaseClient';
import type { TallyEntrySheet } from '@/types/sheets';

export async function fetchTallyEntriesFromSupabase(): Promise<TallyEntrySheet[]> {
    const { data, error } = await supabase
        .from('tally_entry')
        .select(`
            *,
            indents:indents!indent_number (
                product_name,
                po_number,
                quantity,
                firm_name,
                approved_rate,
                created_at,
                po_qty,
                approved_vendor_id,
                indenter_name,
                department,
                uom
            ),
            store_in:store_in!lift_number (
                qty,
                bill_no,
                vendor_name,
                bill_amount,
                bill_status,
                photo_of_bill,
                photo_of_product,
                type_of_bill,
                location,
                area,
                purchase_date,
                material_date,
                indent_date,
                created_at
            )
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching tally_entry:', error);
        throw error;
    }

    return (data || []).map((row: any) => {
        // Handle join data which might be returned as an object or a single-element array
        const indentObj = Array.isArray(row.indents) ? row.indents[0] : row.indents;
        const indent = indentObj || {};

        const storeInObj = Array.isArray(row.store_in) ? row.store_in[0] : row.store_in;
        const storeIn = storeInObj || {};

        return {
            rowIndex: row.id.toString(),
            timestamp: row.created_at,
            liftNumber: row.lift_number || '',
            indentNumber: row.indent_number || '',
            indentNo: row.indent_number || '', // fallback mapping

            // From store_in & indents
            productName: indent.product_name || '',
            poNumber: indent.po_number || '',
            vendorName: storeIn.vendor_name || '',
            indentQty: Number(indent.quantity) || 0,
            firmNameMatch: indent.firm_name || '',
            indentedFor: '',
            approvedVendorName: '',
            rate: Number(indent.approved_rate) || 0,
            indentDate: indent.created_at || '',
            totalRate: (Number(indent.approved_rate) || 0) * (Number(indent.quantity) || 0),
            approvedVendorId: indent.approved_vendor_id,
            indenterName: indent.indenter_name || '',
            department: indent.department || '',
            uom: indent.uom || '',

            // From store_in
            qty: Number(storeIn.qty) || 0,
            billNo: storeIn.bill_no || '',
            billAmt: Number(storeIn.bill_amount) || 0,
            billStatus: storeIn.bill_status || '',
            billImage: storeIn.photo_of_bill || [],
            productImage: storeIn.photo_of_product || [],
            typeOfBills: storeIn.type_of_bill || '',
            location: storeIn.location || '',
            area: storeIn.area || '',
            purchaseDate: storeIn.purchase_date || '',
            materialInDate: storeIn.material_date || '',

            // Placeholders / Computed
            notReceivedBillNo: '',
            billReceivedLater: false,
            isCompleted: row.is_completed || false,

            // Workflow Fields (direct from tally_entry)
            planned1: row.planned1 || '',
            actual1: row.actual1 || '',
            delay1: row.delay1?.toString() || '',
            status1: row.status1 || '',
            remarks1: row.remarks1 || '',

            planned2: row.planned2 || '',
            actual2: row.actual2 || '',
            delay2: row.delay2?.toString() || '',
            status2: row.status2 || '',
            remarks2: row.remarks2 || '',

            planned3: row.planned3 || '',
            actual3: row.actual3 || '',
            delay3: row.delay3?.toString() || '',
            status3: row.status3 || '',
            remarks3: row.remarks3 || '',

            planned4: row.planned4 || '',
            actual4: row.actual4 || '',
            delay4: row.delay4?.toString() || '',
            status4: row.status4 || '',
            remarks4: row.remarks4 || '',

            planned5: row.planned5 || '',
            actual5: row.actual5 || '',
            delay5: row.delay5?.toString() || '',
            status5: row.status5 || ''
        };
    });
}

export async function saveTallyEntriesToSupabase(
    data: Partial<TallyEntrySheet>[],
    action: 'insert' | 'update' | 'delete'
) {
    if (action === 'delete') {
        const ids = data.map(d => d.rowIndex).filter(id => id);
        if (ids.length === 0) return { success: true };
        const { error } = await supabase.from('tally_entry').delete().in('id', ids);
        if (error) throw error;
        return { success: true };
    }

    const cleanDate = (val: any) => {
        if (val === undefined) return undefined;
        if (typeof val === 'string' && val.trim() === '') return null;
        return val || null;
    };

    const rows = data.map(d => {
        const row: any = {};
        if (d.rowIndex) row.id = d.rowIndex;

        // ONLY fields present in the new tally_entry schema
        if (d.liftNumber !== undefined) row.lift_number = d.liftNumber || null;
        if (d.indentNumber !== undefined) row.indent_number = d.indentNumber || null;
        if (d.isCompleted !== undefined) row.is_completed = d.isCompleted;

        // Workflow Fields (matching schema: delay1, status1, etc.)
        if (d.planned1 !== undefined) row.planned1 = cleanDate(d.planned1);
        if (d.actual1 !== undefined) row.actual1 = cleanDate(d.actual1);
        if (d.delay1 !== undefined) row.delay1 = d.delay1 ? parseInt(d.delay1.toString(), 10) : null;
        if (d.status1 !== undefined) row.status1 = d.status1 || null;
        if (d.remarks1 !== undefined) row.remarks1 = d.remarks1 || null;

        if (d.planned2 !== undefined) row.planned2 = cleanDate(d.planned2);
        if (d.actual2 !== undefined) row.actual2 = cleanDate(d.actual2);
        if (d.delay2 !== undefined) row.delay2 = d.delay2 ? parseInt(d.delay2.toString(), 10) : null;
        if (d.status2 !== undefined) row.status2 = d.status2 || null;
        if (d.remarks2 !== undefined) row.remarks2 = d.remarks2 || null;

        if (d.planned3 !== undefined) row.planned3 = cleanDate(d.planned3);
        if (d.actual3 !== undefined) row.actual3 = cleanDate(d.actual3);
        if (d.delay3 !== undefined) row.delay3 = d.delay3 ? parseInt(d.delay3.toString(), 10) : null;
        if (d.status3 !== undefined) row.status3 = d.status3 || null;
        if (d.remarks3 !== undefined) row.remarks3 = d.remarks3 || null;

        if (d.planned4 !== undefined) row.planned4 = cleanDate(d.planned4);
        if (d.actual4 !== undefined) row.actual4 = cleanDate(d.actual4);
        if (d.delay4 !== undefined) row.delay4 = d.delay4 ? parseInt(d.delay4.toString(), 10) : null;
        if (d.status4 !== undefined) row.status4 = d.status4 || null;
        if (d.remarks4 !== undefined) row.remarks4 = d.remarks4 || null;

        if (d.planned5 !== undefined) row.planned5 = cleanDate(d.planned5);
        if (d.actual5 !== undefined) row.actual5 = cleanDate(d.actual5);
        if (d.delay5 !== undefined) row.delay5 = d.delay5 ? parseInt(d.delay5.toString(), 10) : null;
        if (d.status5 !== undefined) row.status5 = d.status5 || null;

        return row;
    });

    const { data: result, error } = await supabase.from('tally_entry').upsert(rows).select();
    if (error) {
        console.error('Error saving tally_entry:', error);
        throw error;
    }
    return { success: true, data: result };
}
