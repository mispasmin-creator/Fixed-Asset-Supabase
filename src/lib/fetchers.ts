// ============================================================================
// fetchers.ts — ALL data operations go through Supabase (NO Google Sheets)
//
// Supabase Tables:
//   1. indents        → INDENT
//   2. store_in       → STORE IN, RECEIVED
//   3. pi_approvals   → PI APPROVAL
//   4. payments       → Payment History
//   5. po_master      → PO MASTER
//   6. tally_entry  → TALLY ENTRY
//   7. users          → USER
//   8. inventory      → INVENTORY
//   9. master         → MASTER (read-only)
//  10. issue          → ISSUE
//  11. fullkitting    → Fullkitting
// ============================================================================

import type { IndentSheet, MasterSheet, ReceivedSheet, Sheet, StoreInSheet, PoMasterSheet } from '@/types';
import type {
    InventorySheet,
    IssueSheet,
    TallyEntrySheet,
    UserPermissions,
    PIApprovalSheet,
    FullkittingSheet,
    Vendors,
} from '@/types/sheets';
import {
    fetchIndentsFromSupabase,
    saveIndentsToSupabase,
    fetchStoreInFromSupabase,
    saveStoreInToSupabase,
    fetchPIApprovalsFromSupabase,
    savePIApprovalsToSupabase,
    fetchPaymentsFromSupabase,
    savePaymentsToSupabase,
    fetchPoMasterFromSupabase,
    savePoMasterToSupabase,
    fetchTallyEntriesFromSupabase,
    saveTallyEntriesToSupabase,
    fetchUsersFromSupabase,
    saveUsersToSupabase,
    fetchInventoryFromSupabase,
    saveInventoryToSupabase,
    uploadFileToSupabase,
    BUCKETS,
    fetchMasterFromSupabase,
    fetchIssueFromSupabase,
    saveIssueToSupabase,
    fetchFullkittingFromSupabase,
    saveFullkittingToSupabase,
    fetchVendorsFromSupabase,
    saveVendorsToSupabase,
} from './services/index';


// ============================================================================
// PaymentHistoryData interface
// ============================================================================
export interface PaymentHistoryData {
    timestamp: string;
    apPaymentNumber: string | number;
    status: string;
    uniqueNumber: string;
    fmsName: string;
    payTo: string;
    amountToBePaid: string | number;
    remarks: string;
    anyAttachments: string;
}


// ============================================================================
// uploadFile — Upload files to Supabase Storage
// ============================================================================
export async function uploadFile({
    file,
    uploadType = 'upload',
    bucket: explicitBucket
}: {
    file: File;
    folderId?: string;
    uploadType?: 'upload' | 'email';
    email?: string;
    emailSubject?: string;
    emailBody?: string;
    bucket?: string;
}): Promise<string> {
    let bucket = explicitBucket || BUCKETS.MISC;

    if (!explicitBucket) {
        if (uploadType === 'email') bucket = BUCKETS.REPORTS;
    }

    return await uploadFileToSupabase({
        file,
        bucket
    });
}


// ============================================================================
// fetchSheet — Fetch data from Supabase (ALL sheets handled, NO Google fallback)
// ============================================================================
export async function fetchSheet(
    sheetName: Sheet
): Promise<
    | MasterSheet
    | IndentSheet[]
    | ReceivedSheet[]
    | UserPermissions[]
    | PoMasterSheet[]
    | InventorySheet[]
    | StoreInSheet[]
    | IssueSheet[]
    | TallyEntrySheet[]
    | PaymentHistoryData[]
    | PIApprovalSheet[]
    | FullkittingSheet[]
    | Vendors[]
> {
    switch (sheetName) {
        case 'INDENT':
            return await fetchIndentsFromSupabase();

        case 'STORE IN':
            return await fetchStoreInFromSupabase();

        case 'PI APPROVAL':
            return await fetchPIApprovalsFromSupabase();

        case 'Payment History':
            return await fetchPaymentsFromSupabase();

        case 'PO MASTER':
            return await fetchPoMasterFromSupabase();

        case 'TALLY ENTRY':
            return await fetchTallyEntriesFromSupabase();

        case 'USER':
            return await fetchUsersFromSupabase();

        case 'INVENTORY':
            return await fetchInventoryFromSupabase();

        case 'MASTER':
            return await fetchMasterFromSupabase();

        case 'ISSUE':
            return await fetchIssueFromSupabase();


        case 'Fullkitting':
            return await fetchFullkittingFromSupabase();

        case 'VENDORS':
            return await fetchVendorsFromSupabase();

        case 'RECEIVED':
            // RECEIVED data lives in the store_in table
            return await fetchStoreInFromSupabase() as any;

        default: {
            const _exhaustiveCheck: never = sheetName;
            throw new Error(`Unhandled sheet name: ${_exhaustiveCheck}`);
        }
    }
}


// ============================================================================
// postToSheet — Write data to Supabase (ALL sheets handled, NO Google fallback)
// ============================================================================
export async function postToSheet(
    data:
        | Partial<IndentSheet>[]
        | Partial<ReceivedSheet>[]
        | Partial<UserPermissions>[]
        | Partial<PoMasterSheet>[]
        | Partial<StoreInSheet>[]
        | Partial<TallyEntrySheet>[]
        | Partial<PIApprovalSheet>[]
        | Partial<PaymentHistoryData>[]
        | Partial<IssueSheet>[]
        | Partial<FullkittingSheet>[]
        | Partial<Vendors>[],
    action: 'insert' | 'update' | 'delete' = 'insert',
    sheet: Sheet = 'INDENT'
) {
    switch (sheet) {
        // ---- Table: indents ----
        case 'INDENT':
            return saveIndentsToSupabase(data as Partial<IndentSheet>[], action);

        // ---- Table: store_in ----
        case 'STORE IN':
            return saveStoreInToSupabase(data as Partial<StoreInSheet>[], action);
        case 'RECEIVED':
            return saveStoreInToSupabase(data as Partial<StoreInSheet>[], action);

        // ---- Table: fullkitting ----
        case 'Fullkitting':
            return saveFullkittingToSupabase(data as Partial<FullkittingSheet>[], action);

        // ---- Table: pi_approvals ----
        case 'PI APPROVAL':
            return savePIApprovalsToSupabase(data as Partial<PIApprovalSheet>[], action);

        // ---- Table: payments ----
        case 'Payment History':
            return savePaymentsToSupabase(data as any, action);

        // ---- Table: po_master ----
        case 'PO MASTER':
            return savePoMasterToSupabase(data as Partial<PoMasterSheet>[], action);

        // ---- Table: tally_entry ----
        case 'TALLY ENTRY':
            return saveTallyEntriesToSupabase(data as Partial<TallyEntrySheet>[], action);

        // ---- Table: users ----
        case 'USER':
            return saveUsersToSupabase(data as Partial<UserPermissions>[], action);

        // ---- Table: inventory ----
        case 'INVENTORY':
            return saveInventoryToSupabase(data as Partial<InventorySheet>[], action);

        // ---- Table: issue ----
        case 'ISSUE':
            return saveIssueToSupabase(data as Partial<IssueSheet>[], action);

        // ---- Table: vendors ----
        case 'VENDORS':
            return saveVendorsToSupabase(data as Partial<Vendors>[], action);

        // ---- Read-only tables ----
        case 'MASTER':
            console.warn('⚠️ MASTER is read-only. No save operation performed.');
            return { success: true };

        default: {
            const _exhaustiveCheck: never = sheet;
            throw new Error(`Unhandled sheet name in postToSheet: ${_exhaustiveCheck}`);
        }
    }
}


// ============================================================================
// postToIssueSheet — Legacy function (delegates to issue service)
// ============================================================================
export const postToIssueSheet = async (
    data: Partial<IssueSheet>[],
    action: 'insert' | 'update' | 'delete' = 'insert'
) => {
    return saveIssueToSupabase(data, action);
};
