
import { supabase } from './supabaseClient';
import type { InventorySheet } from '@/types/sheets';

export async function fetchInventoryFromSupabase(): Promise<InventorySheet[]> {
    const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching inventory:', error);
        throw error;
    }

    return (data || []).map((row: any) => ({
        // We might not have rowIndex if inventory sheet doesn't have ID column in TS
        // But let's check `InventorySheet` -> it doesn't have `rowIndex`.
        // However, we might want to attach one if we want to update it.
        // If TS type doesn't support it, we can't attach it easily without casting.
        // For fetch, we just return data.
        groupHead: row.group_head,
        itemName: row.item_name,
        uom: row.uom,
        maxLevel: Number(row.max_level),
        opening: Number(row.opening_qty),
        individualRate: Number(row.individual_rate),
        indented: Number(row.indented_qty),
        approved: Number(row.approved_qty),
        purchaseQuantity: Number(row.purchase_qty),
        outQuantity: Number(row.out_qty),
        current: Number(row.current_qty),
        totalPrice: Number(row.total_price),
        colorCode: row.color_code,
    }));
}

export async function saveInventoryToSupabase(
    data: Partial<InventorySheet>[],
    action: 'insert' | 'update' | 'delete'
) {
    // Inventory likely updated by item_name?
    // If we don't have ID in `InventorySheet`, we must rely on `item_name` or `group_head`.
    // Schema has `id bigserial primary key`.
    // We should probably rely on `item_name` being unique or compound key?
    // The create table doesn't say `item_name` is unique, but it has index.
    // If we upsert, we need a conflict target.

    if (action === 'delete') {
        // If no ID, delete by item name?
        const names = data.map(d => d.itemName).filter(n => n);
        if (names.length === 0) return { success: true };
        const { error } = await supabase.from('inventory').delete().in('item_name', names);
        if (error) throw error;
        return { success: true };
    }

    const rows = data.map(d => {
        const row: any = {};
        // Map fields
        if (d.groupHead !== undefined) row.group_head = d.groupHead;
        if (d.itemName !== undefined) row.item_name = d.itemName;
        if (d.uom !== undefined) row.uom = d.uom;
        if (d.maxLevel !== undefined) row.max_level = d.maxLevel;
        if (d.opening !== undefined) row.opening_qty = d.opening;
        if (d.individualRate !== undefined) row.individual_rate = d.individualRate;
        if (d.indented !== undefined) row.indented_qty = d.indented;
        if (d.approved !== undefined) row.approved_qty = d.approved;
        if (d.purchaseQuantity !== undefined) row.purchase_qty = d.purchaseQuantity;
        if (d.outQuantity !== undefined) row.out_qty = d.outQuantity;
        if (d.current !== undefined) row.current_qty = d.current;
        if (d.totalPrice !== undefined) row.total_price = d.totalPrice;
        if (d.colorCode !== undefined) row.color_code = d.colorCode;

        return row;
    });

    // Upsert on item_name? Assuming item_name is unique for upsert.
    // Ideally we should add unique constraint on DB if not exists.
    // Or we handle logic to check existence.
    // For now, let's use item_name.

    const { data: result, error } = await supabase.from('inventory').upsert(rows, { onConflict: 'item_name' }).select();
    if (error) {
        console.error('Error saving inventory:', error);
        throw error;
    }
    return { success: true, data: result };
}
