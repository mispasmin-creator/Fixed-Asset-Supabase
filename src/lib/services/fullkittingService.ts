// Fullkitting Service — connects to the `fullkitting` table in Supabase
// DB columns: id, created_at, indent_number, vendor_name, product_name, qty,
//   bill_no, transporting_include, transporter_name, amount, vehicle_no,
//   driver_name, driver_mobile_no, planned, actual, time_delay, fms_name,
//   status, vehicle_number, from_location, to_location, material_load_details,
//   bilty_number, rate_type, amount1, bilty_image, firm_name_match,
//   planned1, actual1, time_delay1, payment_form, ffp_payment_number

import { supabase } from './supabaseClient';
import type { FullkittingSheet } from '@/types/sheets';

export async function fetchFullkittingFromSupabase(): Promise<FullkittingSheet[]> {
    const { data, error } = await supabase
        .from('fullkitting')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching fullkitting:', error);
        throw error;
    }

    return (data || []).map((row: any) => ({
        rowIndex: row.id,
        timestamp: row.created_at || '',
        indentNumber: row.indent_number || '',
        vendorName: row.vendor_name || '',
        productName: row.product_name || '',
        qty: Number(row.qty) || 0,
        billNo: row.bill_no || '',
        transportingInclude: row.transporting_include || '',
        transporterName: row.transporter_name || '',
        amount: Number(row.amount) || 0,
        vehicleNo: row.vehicle_no || '',
        driverName: row.driver_name || '',
        driverMobileNo: row.driver_mobile_no || '',
        planned: row.planned || '',
        actual: row.actual || '',
        timeDelay: row.time_delay?.toString() || '',
        fmsName: row.fms_name || '',
        status: row.status || '',
        vehicleNumber: row.vehicle_number || '',
        from: row.from_location || '',
        to: row.to_location || '',
        materialLoadDetails: row.material_load_details || '',
        biltyNumber: row.bilty_number ? Number(row.bilty_number) : undefined,
        rateType: row.rate_type || '',
        amount1: Number(row.amount1) || 0,
        biltyImage: row.bilty_image || '',
        firmNameMatch: row.firm_name_match || '',
        planned1: row.planned1 || '',
        actual1: row.actual1 || '',
        timeDelay1: row.time_delay1?.toString() || '',
        paymentForm: row.payment_form || '',
        fFPPaymentNumber: row.ffp_payment_number || '',
    }));
}

export async function saveFullkittingToSupabase(
    data: Partial<FullkittingSheet>[],
    action: 'insert' | 'update' | 'delete'
) {
    if (action === 'delete') {
        const ids = data.map(d => d.rowIndex).filter(id => id);
        if (ids.length === 0) return { success: true };
        const { error } = await supabase.from('fullkitting').delete().in('id', ids);
        if (error) throw error;
        return { success: true };
    }

    const rows = data.map(d => {
        const row: any = {};
        if (d.rowIndex) row.id = d.rowIndex;

        if (d.indentNumber !== undefined) row.indent_number = d.indentNumber;
        if (d.vendorName !== undefined) row.vendor_name = d.vendorName;
        if (d.productName !== undefined) row.product_name = d.productName;
        if (d.qty !== undefined) row.qty = d.qty;
        if (d.billNo !== undefined) row.bill_no = d.billNo;
        if (d.transportingInclude !== undefined) row.transporting_include = d.transportingInclude;
        if (d.transporterName !== undefined) row.transporter_name = d.transporterName;
        if (d.amount !== undefined) row.amount = d.amount;
        if (d.vehicleNo !== undefined) row.vehicle_no = d.vehicleNo;
        if (d.driverName !== undefined) row.driver_name = d.driverName;
        if (d.driverMobileNo !== undefined) row.driver_mobile_no = d.driverMobileNo;
        if (d.planned !== undefined) row.planned = d.planned || null;
        if (d.actual !== undefined) row.actual = d.actual || null;
        if (d.timeDelay !== undefined) {
            const val = parseInt(d.timeDelay || '0');
            row.time_delay = isNaN(val) ? 0 : val;
        }
        if (d.fmsName !== undefined) row.fms_name = d.fmsName;
        if (d.status !== undefined) row.status = d.status;
        if (d.vehicleNumber !== undefined) row.vehicle_number = d.vehicleNumber;
        if (d.from !== undefined) row.from_location = d.from;
        if (d.to !== undefined) row.to_location = d.to;
        if (d.materialLoadDetails !== undefined) row.material_load_details = d.materialLoadDetails;
        if (d.biltyNumber !== undefined) row.bilty_number = d.biltyNumber?.toString();
        if (d.rateType !== undefined) row.rate_type = d.rateType;
        if (d.amount1 !== undefined) row.amount1 = d.amount1;
        if (d.biltyImage !== undefined) row.bilty_image = d.biltyImage;
        if (d.firmNameMatch !== undefined) row.firm_name_match = d.firmNameMatch;
        if (d.planned1 !== undefined) row.planned1 = d.planned1 || null;
        if (d.actual1 !== undefined) row.actual1 = d.actual1 || null;
        if (d.timeDelay1 !== undefined) {
            const val = parseInt(d.timeDelay1 || '0');
            row.time_delay1 = isNaN(val) ? 0 : val;
        }
        if (d.paymentForm !== undefined) row.payment_form = d.paymentForm;
        if (d.fFPPaymentNumber !== undefined) row.ffp_payment_number = d.fFPPaymentNumber;

        return row;
    });

    const { data: result, error } = await supabase.from('fullkitting').upsert(rows).select();
    if (error) {
        console.error('Error saving fullkitting:', error);
        throw error;
    }
    return { success: true, data: result };
}
