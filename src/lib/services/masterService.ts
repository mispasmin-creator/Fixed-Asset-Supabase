
import { supabase } from './supabaseClient';
import type { MasterSheet, Vendor } from '@/types/sheets';

// Since we lack a dedicated 'master_data' table, we will construct the master sheet
// by aggregating unique values from existing tables.
// This is a common pattern when migrating while maintaining old data structures.

export async function fetchMasterFromSupabase(): Promise<MasterSheet> {
    const { data: masterData, error } = await supabase
        .from('master')
        .select('*');

    const { data: vendorsData, error: vendorsError } = await supabase
        .from('vendors')
        .select('*');

    if (error || vendorsError) {
        console.error('Error fetching master or vendors data:', error || vendorsError);
        // Fallback to empty structure if error
        return {
            vendors: [],
            vendorNames: [],
            paymentTerms: [],
            departments: [],
            groupHeads: {},
            companyName: 'Default Company',
            companyAddress: 'Default Address',
            companyGstin: '',
            companyPhone: '',
            billingAddress: '',
            companyPan: '',
            destinationAddress: '',
            defaultTerms: [],
            uoms: [],
            firmsnames: [],
            firms: [],
            fmsNames: [],
            personNames: [],
            locations: [],
            partyNames: [],
            firmCompanyMap: {}
        };
    }

    // Extract Unique Values from master table
    const departments = Array.from(new Set(masterData?.map((m: any) => m.department).filter(Boolean) || [])) as string[];
    const uoms = Array.from(new Set(masterData?.map((m: any) => m.uom).filter(Boolean) || [])) as string[];
    const paymentTerms = Array.from(new Set(masterData?.map((m: any) => m.payment_term).filter(Boolean) || [])) as string[];
    const firms = Array.from(new Set(masterData?.map((m: any) => m.firm_name).filter(Boolean) || [])) as string[];
    const fmsNames = Array.from(new Set(masterData?.map((m: any) => m.fms_name).filter(Boolean) || [])) as string[];
    const personNames = Array.from(new Set(masterData?.map((m: any) => m.person_name).filter(Boolean) || [])) as string[];
    const locations = Array.from(new Set(masterData?.map((m: any) => m.location_where).filter(Boolean) || [])) as string[];
    const partyNames = Array.from(new Set(masterData?.map((m: any) => m.party_name).filter(Boolean) || [])) as string[];

    // Construct Vendor Objects from both vendors table and master table
    const vendorMap = new Map<string, Vendor>();
    const normalize = (name: string) => name?.toString().toLowerCase().trim() || '';

    // 1. Add vendors from the dedicated 'vendors' table
    (vendorsData || []).forEach((v: any) => {
        const key = normalize(v.vendor_name);
        if (key) {
            vendorMap.set(key, {
                id: v.id,
                vendorName: v.vendor_name.trim(),
                gstin: v.gstin || '',
                address: v.address || '',
                email: v.email || ''
            });
        }
    });

    // 2. Enrich or add vendors from the 'master' table (for GST, Address, and Email)
    masterData?.forEach((m: any) => {
        const vendorName = m.vendor_name?.toString().trim();
        const key = normalize(vendorName);

        if (key) {
            const masterGstin = m.gstin || m.vendor_gstin || '';
            const masterAddress = m.address || m.vendor_address || '';
            const masterEmail = m.email || m.vendor_email || m.company_email || '';

            const existing = vendorMap.get(key);
            if (existing) {
                // Prioritize Master for details if available
                if (masterGstin) existing.gstin = masterGstin;
                if (masterAddress) existing.address = masterAddress;
                // Prioritize Master email, keep vendor table email if master is empty
                if (masterEmail) existing.email = masterEmail;
            } else {
                // Add new vendor from master
                vendorMap.set(key, {
                    vendorName: vendorName,
                    gstin: masterGstin,
                    address: masterAddress,
                    email: masterEmail
                });
            }
        }
    });

    const vendors: Vendor[] = Array.from(vendorMap.values());

    const vendorNames = Array.from(new Set([
        ...vendors.map(v => v.vendorName),
        ...(masterData?.map((m: any) => m.vendor_name).filter(Boolean) || [])
    ]));

    // Group Heads Map
    const groupHeadsMap: Record<string, string[]> = {};
    masterData?.forEach((m: any) => {
        if (m.group_head && m.item_name) {
            if (!groupHeadsMap[m.group_head]) {
                groupHeadsMap[m.group_head] = [];
            }
            if (!groupHeadsMap[m.group_head].includes(m.item_name)) {
                groupHeadsMap[m.group_head].push(m.item_name);
            }
        }
    });

    // Company Details (take from first entry that has them, or default)
    const companyInfo = masterData?.find((m: any) => m.company_name) || {};

    // Default Terms
    const defaultTerms = Array.from(new Set(masterData?.map((m: any) => m.default_terms).filter(Boolean) || [])) as string[];

    // Firm Company Mapping
    const firmCompanyMap: Record<string, any> = {};
    masterData?.forEach((m: any) => {
        if (m.firm_name && m.company_name) {
            firmCompanyMap[m.firm_name] = {
                companyName: m.company_name,
                companyAddress: m.company_address || '',
                destinationAddress: m.destination_address || ''
            };
        }
    });

    return {
        vendors,
        vendorNames,
        paymentTerms,
        departments,
        groupHeads: groupHeadsMap,
        companyName: companyInfo.company_name || 'Default Company',
        companyAddress: companyInfo.company_address || 'Default Address',
        companyGstin: companyInfo.company_gstin || '',
        companyPhone: companyInfo.company_phone || '',
        billingAddress: companyInfo.billing_address || '',
        companyPan: companyInfo.company_pan || '',
        destinationAddress: companyInfo.destination_address || '',
        defaultTerms,
        uoms,
        firmsnames: firms,
        firms,
        fmsNames,
        personNames,
        locations,
        partyNames,
        firmCompanyMap
    };
}
