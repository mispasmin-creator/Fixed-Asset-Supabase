// Issue Service — connects to the `issue` table in Supabase
// DB columns: id, created_at, issue_no, issue_to, uom, group_head, product_name,
//             quantity, department, planned_date_1, actual_date_1, delay_days_1,
//             status, given_qty

import { supabase } from './supabaseClient';
import type { IssueSheet } from '@/types/sheets';

export async function fetchIssueFromSupabase(): Promise<IssueSheet[]> {
    const { data, error } = await supabase
        .from('issue')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching issue:', error);
        throw error;
    }

    return (data || []).map((row: any) => ({
        rowIndex: row.id,
        timestamp: row.created_at || '',
        issueNo: row.issue_no || '',
        issueTo: row.issue_to || '',
        uom: row.uom || '',
        groupHead: row.group_head || '',
        productName: row.product_name || '',
        quantity: Number(row.quantity) || 0,
        department: row.department || '',
        planned1: row.planned_date_1 || '',
        actual1: row.actual_date_1 || '',
        timeDelay1: row.delay_days_1?.toString() || '',
        status: row.status || '',
        givenQty: Number(row.given_qty) || 0,
    }));
}

export async function saveIssueToSupabase(
    data: Partial<IssueSheet>[],
    action: 'insert' | 'update' | 'delete'
) {
    if (action === 'delete') {
        const ids = data.map(d => d.rowIndex).filter(id => id);
        if (ids.length === 0) return { success: true };
        const { error } = await supabase.from('issue').delete().in('id', ids);
        if (error) throw error;
        return { success: true };
    }

    const rows = data.map(d => {
        const row: any = {};
        if (d.rowIndex) row.id = d.rowIndex;

        if (d.issueNo !== undefined) row.issue_no = d.issueNo;
        if (d.issueTo !== undefined) row.issue_to = d.issueTo;
        if (d.uom !== undefined) row.uom = d.uom;
        if (d.groupHead !== undefined) row.group_head = d.groupHead;
        if (d.productName !== undefined) row.product_name = d.productName;
        if (d.quantity !== undefined) row.quantity = d.quantity;
        if (d.department !== undefined) row.department = d.department;
        if (d.planned1 !== undefined) row.planned_date_1 = d.planned1 || null;
        if (d.actual1 !== undefined) row.actual_date_1 = d.actual1 || null;
        if (d.timeDelay1 !== undefined) {
            const val = parseInt(d.timeDelay1 || '0');
            row.delay_days_1 = isNaN(val) ? 0 : val;
        }
        if (d.status !== undefined) row.status = d.status;
        if (d.givenQty !== undefined) row.given_qty = d.givenQty;

        return row;
    });

    const { data: result, error } = await supabase.from('issue').upsert(rows).select();
    if (error) {
        console.error('Error saving issue:', error);
        throw error;
    }
    return { success: true, data: result };
}
