
import { supabase } from './supabaseClient';
import type { IndentSheet } from '@/types/sheets';

/**
 * Converts any date string to ISO format (YYYY-MM-DD) that Postgres accepts.
 * Returns null if the value is empty or unparseable.
 */
function toISODate(val: string | undefined | null): string | null {
    if (!val || val.toString().trim() === '') return null;
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
    return null;
}

export async function fetchIndentsFromSupabase(): Promise<IndentSheet[]> {
    const { data, error } = await supabase
        .from('indents')
        .select('*, v1:vendors!vendor1_id(*), v2:vendors!vendor2_id(*), v3:vendors!vendor3_id(*), av:vendors!approved_vendor_id(*)')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching indents:', error);
        throw error;
    }

    return (data || []).map((row: any) => ({
        indentNumber: row.indent_number,
        firmName: row.firm_name,
        indenterName: row.indenter_name,
        department: row.department,
        areaOfUse: row.area_of_use,
        groupHead: row.group_head,
        productName: row.product_name,
        productCode: row.product_code,
        quantity: Number(row.quantity),
        uom: row.uom,
        specifications: row.specifications,
        indentType: row.indent_type,
        indentStatus: row.indent_status,
        indentApprovedBy: row.approved_by,
        approvedQuantity: Number(row.approved_quantity),

        planned1: row.planned1,
        actual1: row.actual1,
        timeDelay1: row.time_delay1?.toString(),

        planned2: row.planned2,
        actual2: row.actual2,
        timeDelay2: row.time_delay2?.toString(),

        planned3: row.planned3,
        actual3: row.actual3,
        timeDelay3: row.time_delay3?.toString(),

        planned4: row.planned4,
        actual4: row.actual4,
        timeDelay4: row.time_delay4?.toString(),

        planned5: row.planned5,
        actual5: row.actual5,
        timeDelay5: row.time_delay5?.toString(),

        vendorType: row.vendor_type,
        approvedVendorName: row.av?.vendor_name || row.approved_vendor_name,
        approvedRate: Number(row.av?.rate || row.approved_rate),
        approvedPaymentTerm: row.av?.payment_term || row.approved_payment_term,
        approvedDate: row.approved_date,

        vendorName1: row.v1?.vendor_name || '',
        rate1: Number(row.v1?.rate || 0),
        paymentTerm1: row.v1?.payment_term || '',
        vendorName2: row.v2?.vendor_name || '',
        rate2: Number(row.v2?.rate || 0),
        paymentTerm2: row.v2?.payment_term || '',
        vendorName3: row.v3?.vendor_name || '',
        rate3: Number(row.v3?.rate || 0),
        paymentTerm3: row.v3?.payment_term || '',

        poNumber: row.po_number,
        // Guard: null po_qty would become "undefined" string without this check
        poQty: row.po_qty != null ? row.po_qty.toString() : '',
        pendingPoQty: Number(row.pending_po_qty),
        totalQty: Number(row.total_qty),
        receivedQty: Number(row.received_qty),

        status: row.status,
        timestamp: row.created_at,
        deliveryDate: row.delivery_date,
        paymentType: row.payment_type,

        // Fields not stored in indents table — defaulted
        issuedStatus: '',
        attachment: '',
        comparisonSheet: '',
        poCopy: '',
        receiveStatus: '',
        planned6: '',
        actual6: '',
        timeDelay6: '',
        approvedBy: row.approved_by,
        approvalDate: row.approved_date,
        issuedQuantity: 0,
        notes: '',
        planned7: '',
        actual7: '',
        timeDelay7: '',
        billStatus: '',
        billNumber: '',
        qty: 0,
        leadTimeToLiftMaterial: '',
        typeOfBill: '',
        billAmount: 0,
        discountAmount: 0,
        advanceAmountIfAny: 0,
        photoOfBill: '',
        noDay: 0,
        rowIndex: row.id,
        issueStatus: '',
        liftingStatus: row.lifting_status || 'Pending',
        pendingLiftQty: Number(row.pending_lift_qty) || 0,
        firmNameMatch: row.firm_name || '',
        paymentype: '',
        approvedVendorId: row.approved_vendor_id,
        vendor1Id: row.vendor1_id,
        vendor2Id: row.vendor2_id,
        vendor3Id: row.vendor3_id,
    }));
}

export async function saveIndentsToSupabase(
    data: Partial<IndentSheet>[],
    action: 'insert' | 'update' | 'delete'
) {
    if (action === 'delete') {
        const ids = data.map(d => d.rowIndex).filter(id => id);
        if (ids.length === 0) return { success: true };

        const { error } = await supabase
            .from('indents')
            .delete()
            .in('id', ids);

        if (error) throw error;
        return { success: true };
    }

    const rows = data.map(d => {
        const row: any = {};
        if (d.rowIndex) row.id = d.rowIndex;

        if (d.indentNumber !== undefined) row.indent_number = d.indentNumber;
        if (d.firmName !== undefined) row.firm_name = d.firmName;
        if (d.indenterName !== undefined) row.indenter_name = d.indenterName;
        if (d.department !== undefined) row.department = d.department;
        if (d.areaOfUse !== undefined) row.area_of_use = d.areaOfUse;
        if (d.groupHead !== undefined) row.group_head = d.groupHead;
        if (d.productName !== undefined) row.product_name = d.productName;
        if (d.productCode !== undefined) row.product_code = d.productCode;
        if (d.quantity !== undefined) row.quantity = d.quantity;
        if (d.uom !== undefined) row.uom = d.uom;
        if (d.specifications !== undefined) row.specifications = d.specifications;
        if (d.indentType !== undefined) row.indent_type = d.indentType;
        if (d.indentStatus !== undefined) row.indent_status = d.indentStatus;
        if (d.indentApprovedBy !== undefined) row.approved_by = d.indentApprovedBy;
        if (d.approvedQuantity !== undefined) row.approved_quantity = d.approvedQuantity;

        // All date columns sanitized to ISO YYYY-MM-DD format before sending to Postgres
        if (d.planned1 !== undefined) row.planned1 = toISODate(d.planned1);
        if (d.actual1 !== undefined) row.actual1 = toISODate(d.actual1);
        if (d.timeDelay1 !== undefined) { const val = parseInt(d.timeDelay1 || '0'); row.time_delay1 = isNaN(val) ? 0 : val; }

        if (d.planned2 !== undefined) row.planned2 = toISODate(d.planned2);
        if (d.actual2 !== undefined) row.actual2 = toISODate(d.actual2);
        if (d.timeDelay2 !== undefined) { const val = parseInt(d.timeDelay2 || '0'); row.time_delay2 = isNaN(val) ? 0 : val; }

        if (d.planned3 !== undefined) row.planned3 = toISODate(d.planned3);
        if (d.actual3 !== undefined) row.actual3 = toISODate(d.actual3);
        if (d.timeDelay3 !== undefined) { const val = parseInt(d.timeDelay3 || '0'); row.time_delay3 = isNaN(val) ? 0 : val; }

        if (d.planned4 !== undefined) row.planned4 = toISODate(d.planned4);
        if (d.actual4 !== undefined) row.actual4 = toISODate(d.actual4);
        if (d.timeDelay4 !== undefined) { const val = parseInt(d.timeDelay4 || '0'); row.time_delay4 = isNaN(val) ? 0 : val; }

        if (d.planned5 !== undefined) row.planned5 = toISODate(d.planned5);
        if (d.actual5 !== undefined) row.actual5 = toISODate(d.actual5);
        if (d.timeDelay5 !== undefined) { const val = parseInt(d.timeDelay5 || '0'); row.time_delay5 = isNaN(val) ? 0 : val; }

        if (d.vendorType !== undefined) row.vendor_type = d.vendorType;
        if (d.approvedRate !== undefined) row.approved_rate = d.approvedRate;
        if (d.approvedPaymentTerm !== undefined) row.approved_payment_term = d.approvedPaymentTerm;
        if (d.approvedDate !== undefined) row.approved_date = toISODate(d.approvedDate);

        if (d.poNumber !== undefined) row.po_number = d.poNumber;
        if (d.poQty !== undefined) { const val = parseFloat(d.poQty || '0'); row.po_qty = isNaN(val) ? 0 : val; }
        if (d.pendingPoQty !== undefined) row.pending_po_qty = d.pendingPoQty;

        if (d.totalQty !== undefined) row.total_qty = d.totalQty;
        if (d.receivedQty !== undefined) row.received_qty = d.receivedQty;
        if (d.deliveryDate !== undefined) row.delivery_date = toISODate(d.deliveryDate);
        if (d.paymentType !== undefined) row.payment_type = d.paymentType;
        if (d.status !== undefined) row.status = d.status;
        if (d.approvedVendorId !== undefined) row.approved_vendor_id = d.approvedVendorId;
        if (d.vendor1Id !== undefined) row.vendor1_id = d.vendor1Id;
        if (d.vendor2Id !== undefined) row.vendor2_id = d.vendor2Id;
        if (d.vendor3Id !== undefined) row.vendor3_id = d.vendor3Id;
        if (d.liftingStatus !== undefined) row.lifting_status = d.liftingStatus;

        return row;
    });

    const { data: result, error } = await supabase
        .from('indents')
        .upsert(rows)
        .select();

    if (error) {
        console.error('Error saving indents:', error);
        throw error;
    }
    return { success: true, data: result };
}
