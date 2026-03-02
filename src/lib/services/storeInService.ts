
import { supabase } from './supabaseClient';
import type { StoreInSheet } from '@/types/sheets';

/**
 * Normalise any date-like value to a plain YYYY-MM-DD string
 * (Postgres `date` columns reject full ISO timestamps in strict mode).
 */
function toDate(value: unknown): string | null {
    if (!value) return null;
    const s = String(value);
    // Already in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    // ISO timestamp or any parseable date => take date part in local timezone
    const d = new Date(s);
    if (isNaN(d.getTime())) return null;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

export async function fetchStoreInFromSupabase(): Promise<StoreInSheet[]> {
    const { data, error } = await supabase
        .from('store_in')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching store_in:', error);
        throw error;
    }

    return (data || []).map((row: any) => ({
        rowIndex: row.id,
        timestamp: row.created_at,
        liftNumber: row.lift_number,
        indentNo: row.indent_no,
        poNumber: row.po_number,
        vendorName: row.vendor_name,
        productName: row.product_name,
        billNo: row.bill_no,
        billStatus: row.bill_status,
        billAmount: Number(row.bill_amount),
        discountAmount: Number(row.discount_amount),
        qty: Number(row.qty),
        receivedQuantity: Number(row.received_quantity),
        paymentType: row.payment_type,
        advanceAmountIfAny: row.advance_amount_if_any?.toString(),

        transporterName: row.transporter_name,
        vehicleNo: row.vehicle_no,
        driverName: row.driver_name,
        driverMobileNo: row.driver_mobile_no,
        transportationInclude: row.transportation_include ? 'Yes' : 'No',

        leadTimeToLiftMaterial: Number(row.lead_time_to_lift_material) || 0,
        typeOfBill: row.type_of_bill || '',
        photoOfBill: Array.isArray(row.photo_of_bill) && row.photo_of_bill.length > 0 ? row.photo_of_bill[0] : '',
        amount: Number(row.amount) || 0,
        warrantyStatus: '',
        endDateWarrenty: '',
        planned6: row.planned_6 || '',
        actual6: row.actual_6 || '',
        timeDelay6: row.time_delay_6?.toString() || '',
        sendDebitNote: row.send_debit_note ? 'Yes' : 'No',
        receivingStatus: row.receiving_status || '',
        photoOfProduct: Array.isArray(row.photo_of_product) && row.photo_of_product.length > 0 ? row.photo_of_product[0] : '',
        unitOfMeasurement: '',
        damageOrder: row.damage_order ? 'Yes' : 'No',
        quantityAsPerBill: row.quantity_as_per_bill ? 'Yes' : 'No',
        productAsPerPack: row.product_as_per_pack ? 'Yes' : 'No',
        priceAsPerPo: 0,
        remark: row.remark || '',
        debitNoteCopy: Array.isArray(row.debit_note_copy) && row.debit_note_copy.length > 0 ? row.debit_note_copy[0] : '',
        planned7: row.planned_7 || '',
        actual7: row.actual_7 || '',
        timeDelay7: row.time_delay_7?.toString() || '',
        status: row.status || '',
        reason: row.reason || '',
        billNumber: row.bill_no || '',
        planned8: '',
        actual8: '',
        delay8: '',
        statusPurchaser: '',
        planned9: row.planned_9 || '',
        actual9: row.actual_9 || '',
        timeDelay9: row.time_delay_9?.toString() || '',
        billCopy: row.bill_copy_attached ? 'Yes' : 'No',
        returnCopy: '',
        debitnotenumber: row.debit_note_number || '',
        planned10: '',
        actual10: '',
        timeDelay10: '',
        warrenty: '',
        billReceived: row.bill_received2 ? 'Yes' : 'No',
        billAmount2: '',
        billImage: '',
        exchangeQty: '',
        billNumber2: '',
        poDate: row.purchase_date || '',
        vendor: row.vendor_name,
        indentNumber: row.indent_no,
        product: row.product_name,
        uom: '',
        quantity: Number(row.qty),
        poCopy: '',
        planned11: row.planned_11 || '',
        actual11: row.actual_11 || '',
        billStatusNew: row.bill_status_new || '',
        materialStatus: '',
        billImageStatus: row.bill_image_status || '',
        billRemark: row.bill_remark || '',
        timeDelay11: row.time_delay_11?.toString() || '',
        firmNameMatch: row.firm_name_match || '',
        // Previously-saved-but-not-fetched columns
        indentDate: row.indent_date || '',
        indentQty: Number(row.indent_qty) || 0,
        materialDate: row.material_date || '',
        partyName: row.party_name || '',
        location: row.location || '',
        area: row.area || '',
        notBillReceivedNo: row.not_bill_received_no || '',
        indentedFor: row.indented_for || '',
        approvedPartyName: row.approved_party_name || '',
        rate: Number(row.rate) || 0,
        totalRate: Number(row.total_rate) || 0,
        liftingStatus: row.lifting_status || '',
    }));
}

export async function saveStoreInToSupabase(
    data: Partial<StoreInSheet>[],
    action: 'insert' | 'update' | 'delete'
) {
    if (action === 'delete') {
        const ids = data.map(d => d.rowIndex).filter(id => id);
        if (ids.length === 0) return { success: true };

        const { error } = await supabase.from('store_in').delete().in('id', ids);
        if (error) throw error;
        return { success: true };
    }

    const rows = data.map(d => {
        const row: any = {};
        if (d.rowIndex) row.id = d.rowIndex;

        // lift_number is auto-generated by tr_generate_lift_number trigger on INSERT.
        // Only include it on UPDATE (when rowIndex/id is present) to avoid trigger conflicts.
        if (d.liftNumber !== undefined && d.rowIndex) row.lift_number = d.liftNumber || null;

        if (d.indentNo !== undefined) row.indent_no = d.indentNo || null;
        if (d.poNumber !== undefined) row.po_number = d.poNumber || null;

        // purchase_date — accepts camelCase key "poDate" (mapped from StoreInSheet.poDate)
        if ((d as any).poDate !== undefined) row.purchase_date = toDate((d as any).poDate);

        if (d.vendorName !== undefined) row.vendor_name = d.vendorName || null;
        if (d.productName !== undefined) row.product_name = d.productName || null;
        if (d.billNo !== undefined) row.bill_no = d.billNo || null;
        if (d.billStatus !== undefined) row.bill_status = d.billStatus || null;

        if (d.billAmount !== undefined) row.bill_amount = isNaN(Number(d.billAmount)) ? null : Number(d.billAmount);
        if (d.discountAmount !== undefined) row.discount_amount = isNaN(Number(d.discountAmount)) ? null : Number(d.discountAmount);
        if (d.qty !== undefined) row.qty = isNaN(Number(d.qty)) ? null : Number(d.qty);
        if (d.receivedQuantity !== undefined) row.received_quantity = isNaN(Number(d.receivedQuantity)) ? null : Number(d.receivedQuantity);

        if (d.paymentType !== undefined) row.payment_type = d.paymentType || null;
        if (d.advanceAmountIfAny !== undefined) {
            const val = parseFloat(String(d.advanceAmountIfAny || '0'));
            row.advance_amount_if_any = isNaN(val) ? null : val;
        }

        if (d.transporterName !== undefined) row.transporter_name = d.transporterName || null;
        if (d.vehicleNo !== undefined) row.vehicle_no = d.vehicleNo || null;
        if (d.driverName !== undefined) row.driver_name = d.driverName || null;
        if (d.driverMobileNo !== undefined) row.driver_mobile_no = d.driverMobileNo || null;
        if (d.transportationInclude !== undefined) {
            row.transportation_include =
                d.transportationInclude === 'Yes' ? true
                    : d.transportationInclude === 'No' ? false
                        : null;
        }

        if (d.status !== undefined) row.status = d.status || null;

        // lead_time_to_lift_material is INTEGER — must be a whole number
        if (d.leadTimeToLiftMaterial !== undefined) {
            const val = Number(d.leadTimeToLiftMaterial);
            row.lead_time_to_lift_material = isNaN(val) ? null : Math.round(val);
        }

        if (d.typeOfBill !== undefined) row.type_of_bill = d.typeOfBill || null;
        if (d.amount !== undefined) row.amount = isNaN(Number(d.amount)) ? null : Number(d.amount);
        if (d.billRemark !== undefined) row.bill_remark = d.billRemark || null;

        // Array columns (text[])
        if (d.photoOfBill !== undefined) row.photo_of_bill = d.photoOfBill ? [d.photoOfBill] : null;
        if (d.photoOfProduct !== undefined) row.photo_of_product = d.photoOfProduct ? [d.photoOfProduct] : null;
        if (d.debitNoteCopy !== undefined) row.debit_note_copy = d.debitNoteCopy ? [d.debitNoteCopy] : null;

        // Date columns — schema type is `date`, must send YYYY-MM-DD strings
        if (d.planned6 !== undefined) row.planned_6 = toDate(d.planned6);
        if (d.actual6 !== undefined) row.actual_6 = toDate(d.actual6);
        if (d.timeDelay6 !== undefined) { const v = parseInt(d.timeDelay6 || '0'); row.time_delay_6 = isNaN(v) ? null : v; }

        if (d.planned7 !== undefined) row.planned_7 = toDate(d.planned7);
        if (d.actual7 !== undefined) row.actual_7 = toDate(d.actual7);
        if (d.timeDelay7 !== undefined) { const v = parseInt(d.timeDelay7 || '0'); row.time_delay_7 = isNaN(v) ? null : v; }

        if (d.planned9 !== undefined) row.planned_9 = toDate(d.planned9);
        if (d.actual9 !== undefined) row.actual_9 = toDate(d.actual9);
        if (d.timeDelay9 !== undefined) { const v = parseInt(d.timeDelay9 || '0'); row.time_delay_9 = isNaN(v) ? null : v; }

        if (d.planned11 !== undefined) row.planned_11 = toDate(d.planned11);
        if (d.actual11 !== undefined) row.actual_11 = toDate(d.actual11);
        if (d.timeDelay11 !== undefined) { const v = parseInt(d.timeDelay11 || '0'); row.time_delay_11 = isNaN(v) ? null : v; }

        if (d.receivingStatus !== undefined) row.receiving_status = d.receivingStatus || null;
        if (d.damageOrder !== undefined) {
            row.damage_order = d.damageOrder === 'Yes' ? true : d.damageOrder === 'No' ? false : null;
        }
        if (d.quantityAsPerBill !== undefined) {
            row.quantity_as_per_bill = d.quantityAsPerBill === 'Yes' ? true : d.quantityAsPerBill === 'No' ? false : null;
        }
        if (d.productAsPerPack !== undefined) {
            row.product_as_per_pack = d.productAsPerPack === 'Yes' ? true : d.productAsPerPack === 'No' ? false : null;
        }
        if (d.remark !== undefined) row.remark = d.remark || null;
        if (d.reason !== undefined) row.reason = d.reason || null;
        if (d.sendDebitNote !== undefined) {
            row.send_debit_note = d.sendDebitNote === 'Yes' ? true : d.sendDebitNote === 'No' ? false : null;
        }
        if (d.debitnotenumber !== undefined) row.debit_note_number = d.debitnotenumber || null;

        if (d.billStatusNew !== undefined) row.bill_status_new = d.billStatusNew || null;
        if (d.billImageStatus !== undefined) row.bill_image_status = d.billImageStatus || null;
        if (d.firmNameMatch !== undefined) row.firm_name_match = d.firmNameMatch || null;

        if (d.billCopy !== undefined) {
            row.bill_copy_attached = d.billCopy === 'Yes' ? true : d.billCopy === 'No' ? false : null;
        }
        if (d.billReceived !== undefined) {
            row.bill_received2 = d.billReceived === 'Yes' ? true : d.billReceived === 'No' ? false : null;
        }

        if ((d as any).location !== undefined) row.location = (d as any).location || null;
        if ((d as any).area !== undefined) row.area = (d as any).area || null;

        // Extra store_in columns (date typed — normalise to YYYY-MM-DD)
        if ((d as any).indentDate !== undefined) row.indent_date = toDate((d as any).indentDate);
        if ((d as any).indentQty !== undefined) {
            const v = Number((d as any).indentQty);
            row.indent_qty = isNaN(v) ? null : v;
        }
        if ((d as any).materialDate !== undefined) row.material_date = toDate((d as any).materialDate);
        if ((d as any).partyName !== undefined) row.party_name = (d as any).partyName || null;
        if ((d as any).notBillReceivedNo !== undefined) row.not_bill_received_no = (d as any).notBillReceivedNo || null;
        if ((d as any).indentedFor !== undefined) row.indented_for = (d as any).indentedFor || null;
        if ((d as any).approvedPartyName !== undefined) row.approved_party_name = (d as any).approvedPartyName || null;
        if ((d as any).rate !== undefined) {
            const v = Number((d as any).rate);
            row.rate = isNaN(v) ? null : v;
        }
        if ((d as any).totalRate !== undefined) {
            const v = Number((d as any).totalRate);
            row.total_rate = isNaN(v) ? null : v;
        }
        if (d.liftingStatus !== undefined) row.lifting_status = d.liftingStatus || null;

        return row;
    });

    let result, error;

    if (action === 'insert') {
        // Strip any `id` field so the trigger can auto-generate lift_number cleanly
        const insertRows = rows.map(({ id: _id, ...rest }) => rest);
        ({ data: result, error } = await supabase
            .from('store_in')
            .insert(insertRows)
            .select());
    } else {
        // UPDATE — use .update().eq('id') directly.
        // DO NOT use .upsert() here: upsert does INSERT...ON CONFLICT DO UPDATE,
        // which fires the BEFORE INSERT trigger `tr_generate_lift_number` and
        // generates a new lift_number that violates the unique constraint on the existing row.
        const updateResults = await Promise.all(
            rows.map(async (row) => {
                const { id, ...fields } = row;
                if (!id) return { data: null, error: null };
                return supabase
                    .from('store_in')
                    .update(fields)
                    .eq('id', id)
                    .select();
            })
        );
        // Bubble up the first error, if any
        error = updateResults.find(r => r.error)?.error ?? null;
        result = updateResults.flatMap(r => r.data ?? []);
    };

    if (error) {
        console.error('Error saving store_in:', error);
        throw error;
    }
    return { success: true, data: result };
}
