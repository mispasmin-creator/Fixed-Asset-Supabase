import { ListTodo } from 'lucide-react';
import Heading from '../element/Heading';
import { useSheets } from '@/context/SheetsContext';
import { useEffect, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { formatDate } from '@/lib/utils';
import DataTable from '../element/DataTable';
import { Calendar } from 'lucide-react';

const formatDateTime = (isoString?: string) => {
    if (!isoString) return '-';
    try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return isoString;
        const d = date.getDate().toString().padStart(2, '0');
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const y = date.getFullYear().toString().slice(-2);
        const time = date.toLocaleString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
        return `${d}/${m}/${y} ${time}`;
    } catch {
        return isoString;
    }
};

const formatDateTiny = (isoString?: string) => {
    if (!isoString) return '-';
    try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return isoString;
        const d = date.getDate().toString().padStart(2, '0');
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const y = date.getFullYear().toString().slice(-2);
        return `${d}/${m}/${y}`;
    } catch {
        return isoString;
    }
};

interface PendingIndentsData {
    timestamp: string;
    partyName: string;
    poNumber: string;
    quotationNumber: string;
    quotationDate: string;
    enquiryNumber: string;
    enquiryDate: string;
    internalCode: string;
    product: string;
    description: string;
    quantity: number;
    unit: string;
    rate: number;
    gstPercent: number;
    discountPercent: number;
    amount: number;
    totalPoAmount: number;
    // preparedBy: string;
    // approvedBy: string;
    pdf: string;
}

// Helper function to parse GST percentage value
const parseGSTPercent = (value: any): number => {
    if (value === null || value === undefined || value === '') {
        return 0;
    }

    // Convert to string first
    const stringValue = String(value).trim();

    // If it's already a percentage string (like "18%"), remove % and convert
    if (stringValue.includes('%')) {
        const numericPart = stringValue.replace('%', '').trim();
        const parsed = parseFloat(numericPart);
        return isNaN(parsed) ? 0 : parsed;
    }

    // If it's a decimal (like 0.18 for 18%), convert to percentage
    const numericValue = parseFloat(stringValue);
    if (isNaN(numericValue)) {
        return 0;
    }

    // If the value is between 0 and 1, it's likely a decimal representation
    // Convert it to percentage (0.18 -> 18)
    if (numericValue > 0 && numericValue < 1) {
        return numericValue * 100;
    }

    // Otherwise, assume it's already in percentage format
    return numericValue;
};

export default () => {
    const { poMasterSheet, poMasterLoading } = useSheets();

    const [tableData, setTableData] = useState<PendingIndentsData[]>([]);

    useEffect(() => {
        if (poMasterSheet && poMasterSheet.length > 0) {
            setTableData(
                poMasterSheet.map((sheet) => {
                    let gstValue = sheet.gstPercent ||
                        sheet['gst' as keyof typeof sheet] ||
                        0;

                    return {
                        timestamp: sheet.timestamp || '',
                        partyName: sheet.partyName || '',
                        poNumber: sheet.poNumber || '',
                        quotationNumber: sheet.quotationNumber || '',
                        quotationDate: sheet.quotationDate ? formatDate(new Date(sheet.quotationDate)) : '',
                        enquiryNumber: sheet.enquiryNumber || '',
                        enquiryDate: sheet.enquiryDate ? formatDate(new Date(sheet.enquiryDate)) : '',
                        internalCode: sheet.internalCode || '',
                        product: sheet.product || '',
                        description: sheet.description || '',
                        quantity: Number(sheet.quantity) || 0,
                        unit: sheet.unit || '',
                        rate: Number(sheet.rate) || 0,
                        gstPercent: parseGSTPercent(gstValue),
                        discountPercent: Number(sheet.discountPercent) || 0,
                        amount: Number(sheet.amount) || 0,
                        totalPoAmount: Number(sheet.totalPoAmount) || 0,
                        pdf: sheet.pdf || '',
                    };
                })
            );
        }
    }, [poMasterSheet]);

    const columns: ColumnDef<PendingIndentsData>[] = [
        {
            accessorKey: 'timestamp',
            header: () => (
                <div className="flex items-center justify-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Timestamp</span>
                </div>
            ),
            cell: ({ getValue }) => (
                <div className="text-center text-gray-600">
                    {formatDateTime(getValue() as string)}
                </div>
            )
        },
        { accessorKey: 'partyName', header: 'Party Name' },
        { accessorKey: 'poNumber', header: 'PO Number' },
        { accessorKey: 'quotationNumber', header: 'Quotation Number' },
        {
            accessorKey: 'quotationDate',
            header: () => (
                <div className="flex items-center justify-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Quotation Date</span>
                </div>
            ),
            cell: ({ getValue }) => (
                <div className="text-center">
                    {formatDateTiny(getValue() as string)}
                </div>
            )
        },
        { accessorKey: 'enquiryNumber', header: 'Enquiry Number' },
        {
            accessorKey: 'enquiryDate',
            header: () => (
                <div className="flex items-center justify-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Enquiry Date</span>
                </div>
            ),
            cell: ({ getValue }) => (
                <div className="text-center">
                    {formatDateTiny(getValue() as string)}
                </div>
            )
        },
        { accessorKey: 'internalCode', header: 'Internal Code' },
        { accessorKey: 'product', header: 'Product' },
        { accessorKey: 'description', header: 'Description' },
        { accessorKey: 'quantity', header: 'Quantity' },
        { accessorKey: 'unit', header: 'Unit' },
        {
            accessorKey: 'rate',
            header: 'Rate',
            cell: ({ row }) => {
                return <>&#8377;{row.original.rate.toLocaleString()}</>;
            },
        },
        {
            accessorKey: 'gstPercent',
            header: 'GST %',
            cell: ({ row }) => {
                return <>{row.original.gstPercent}%</>;
            },
        },
        {
            accessorKey: 'discountPercent',
            header: 'Discount %',
            cell: ({ row }) => {
                return <>{row.original.discountPercent}%</>;
            },
        },
        {
            accessorKey: 'amount',
            header: 'Amount',
            cell: ({ row }) => {
                return <>&#8377;{row.original.amount.toLocaleString()}</>;
            },
        },
        {
            accessorKey: 'totalPoAmount',
            header: 'Total PO Amount',
            cell: ({ row }) => {
                return <>&#8377;{row.original.totalPoAmount.toLocaleString()}</>;
            },
        },
        { accessorKey: 'preparedBy', header: 'Prepared By' },
        { accessorKey: 'approvedBy', header: 'Approved By' },
        {
            accessorKey: 'pdf',
            header: 'PDF',
            cell: ({ row }) => {
                return row.original.pdf ? (
                    <a
                        href={row.original.pdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                    >
                        View PDF
                    </a>
                ) : (
                    <span className="text-gray-400">No PDF</span>
                );
            },
        },
    ];

    return (
        <div>
            <Heading heading="Pending POs" subtext="View pending purchase orders from PO Master">
                <ListTodo size={50} className="text-primary" />
            </Heading>
            <DataTable
                data={tableData}
                columns={columns}
                searchFields={[
                    'partyName',
                    'poNumber',
                    'product',
                    'description',
                    'quotationNumber',
                    'enquiryNumber',
                    'preparedBy',
                    'approvedBy'
                ]}
                dataLoading={poMasterLoading}
                className="h-[80dvh]"
            />
        </div>
    );
};