
import { supabase } from './supabaseClient';
import type { UserPermissions } from '@/types/sheets';

// ============================================================================
// Map a flat Supabase row → UserPermissions (no JSONB unpacking needed)
// ============================================================================
function mapUserToPermissions(user: any): UserPermissions {
    return {
        rowIndex: user.id,                      // UUID used as identifier
        username: user.name,                    // "name" column is the login username
        password: user.password,
        name: user.name,
        full_name: user.full_name,
        firmNameMatch: user.firm_name_match,

        // ── Flat boolean columns ──────────────────────────────────────────
        administrate: user.administrate ?? false,
        storeIssue: user.store_issue ?? false,
        issueData: user.issue_data ?? false,
        inventory: user.inventory ?? false,
        createIndent: user.create_indent ?? false,
        createPo: user.create_po ?? false,
        indentApprovalView: user.indent_approval_view ?? false,
        indentApprovalAction: user.indent_approval_action ?? false,
        updateVendorView: user.update_vendor_view ?? false,
        updateVendorAction: user.update_vendor_action ?? false,
        threePartyApprovalView: user.three_party_approval_view ?? false,
        threePartyApprovalAction: user.three_party_approval_action ?? false,
        receiveItemView: user.receive_item_view ?? false,
        receiveItemAction: user.receive_item_action ?? false,
        storeOutApprovalView: user.store_out_approval_view ?? false,
        storeOutApprovalAction: user.store_out_approval_action ?? false,
        pendingIndentsView: user.pending_indents_view ?? false,
        ordersView: user.orders_view ?? false,
        againAuditing: user.again_auditing ?? false,
        takeEntryByTelly: user.take_entry_by_telly ?? false,
        reauditData: user.reaudit_data ?? false,
        rectifyTheMistake: user.rectify_the_mistake ?? false,
        auditData: user.audit_data ?? false,
        sendDebitNote: user.send_debit_note ?? false,
        returnMaterialToParty: user.return_material_to_party ?? false,
        exchangeMaterials: user.exchange_materials ?? false,
        insteadOfQualityCheckInReceivedItem: user.instead_of_quality_check_in_received_item ?? false,
        dbForPc: user.db_for_pc ?? false,
        billNotReceived: user.bill_not_received ?? false,
        storeIn: user.store_in ?? false,
        poHistory: user.po_history ?? false,
        makePayment: user.make_payment ?? false,
        freightPayment: user.freight_payment ?? false,

        // Legacy / unused — kept for TS compatibility
        poMaster: false,
        getPurchase: false,
        piApprovalView: false,
        piApprovalAction: false,
        trainingVideo: false,
        license: false,
        link: false,
    } as any as UserPermissions;
}

// ============================================================================
// FETCH
// ============================================================================
export async function fetchUsersFromSupabase(): Promise<UserPermissions[]> {
    const { data, error } = await supabase
        .from('users')
        .select('*');

    if (error) {
        console.error('Error fetching users:', error);
        throw error;
    }

    return (data || []).map(mapUserToPermissions);
}

// ============================================================================
// SAVE (insert / update / delete)
// ============================================================================
export async function saveUsersToSupabase(
    data: Partial<UserPermissions>[],
    action: 'insert' | 'update' | 'delete'
) {
    if (action === 'delete') {
        const ids = data.map(d => d.rowIndex).filter(Boolean);
        if (ids.length === 0) return { success: true };
        const { error } = await supabase.from('users').delete().in('id', ids);
        if (error) throw error;
        return { success: true };
    }

    const rows = data.map(d => {
        const row: any = {};

        if (d.rowIndex) row.id = d.rowIndex;
        if (d.name !== undefined) row.name = d.name;
        if ((d as any).full_name !== undefined) row.full_name = (d as any).full_name;
        if (d.password !== undefined) row.password = d.password;
        if (d.firmNameMatch !== undefined) row.firm_name_match = d.firmNameMatch;

        // ── Flat boolean columns ──────────────────────────────────────────
        if (d.administrate !== undefined) row.administrate = d.administrate;
        if (d.storeIssue !== undefined) row.store_issue = d.storeIssue;
        if (d.issueData !== undefined) row.issue_data = d.issueData;
        if (d.inventory !== undefined) row.inventory = d.inventory;
        if (d.createIndent !== undefined) row.create_indent = d.createIndent;
        if (d.createPo !== undefined) row.create_po = d.createPo;
        if (d.indentApprovalView !== undefined) row.indent_approval_view = d.indentApprovalView;
        if (d.indentApprovalAction !== undefined) row.indent_approval_action = d.indentApprovalAction;
        if (d.updateVendorView !== undefined) row.update_vendor_view = d.updateVendorView;
        if (d.updateVendorAction !== undefined) row.update_vendor_action = d.updateVendorAction;
        if (d.threePartyApprovalView !== undefined) row.three_party_approval_view = d.threePartyApprovalView;
        if (d.threePartyApprovalAction !== undefined) row.three_party_approval_action = d.threePartyApprovalAction;
        if (d.receiveItemView !== undefined) row.receive_item_view = d.receiveItemView;
        if (d.receiveItemAction !== undefined) row.receive_item_action = d.receiveItemAction;
        if (d.storeOutApprovalView !== undefined) row.store_out_approval_view = d.storeOutApprovalView;
        if (d.storeOutApprovalAction !== undefined) row.store_out_approval_action = d.storeOutApprovalAction;
        if (d.pendingIndentsView !== undefined) row.pending_indents_view = d.pendingIndentsView;
        if (d.ordersView !== undefined) row.orders_view = d.ordersView;
        if (d.againAuditing !== undefined) row.again_auditing = d.againAuditing;
        if (d.takeEntryByTelly !== undefined) row.take_entry_by_telly = d.takeEntryByTelly;
        if (d.reauditData !== undefined) row.reaudit_data = d.reauditData;
        if (d.rectifyTheMistake !== undefined) row.rectify_the_mistake = d.rectifyTheMistake;
        if (d.auditData !== undefined) row.audit_data = d.auditData;
        if (d.sendDebitNote !== undefined) row.send_debit_note = d.sendDebitNote;
        if (d.returnMaterialToParty !== undefined) row.return_material_to_party = d.returnMaterialToParty;
        if (d.exchangeMaterials !== undefined) row.exchange_materials = d.exchangeMaterials;
        if (d.insteadOfQualityCheckInReceivedItem !== undefined) row.instead_of_quality_check_in_received_item = d.insteadOfQualityCheckInReceivedItem;
        if (d.dbForPc !== undefined) row.db_for_pc = d.dbForPc;
        if (d.billNotReceived !== undefined) row.bill_not_received = d.billNotReceived;
        if (d.storeIn !== undefined) row.store_in = d.storeIn;
        if (d.poHistory !== undefined) row.po_history = d.poHistory;
        if (d.makePayment !== undefined) row.make_payment = d.makePayment;
        if (d.freightPayment !== undefined) row.freight_payment = d.freightPayment;

        return row;
    });

    const { data: result, error } = await supabase.from('users').upsert(rows).select();
    if (error) {
        console.error('Error saving users:', error);
        throw error;
    }
    return { success: true, data: result };
}
