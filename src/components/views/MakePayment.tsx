import { useSheets } from '@/context/SheetsContext';
import { postToSheet } from '@/lib/fetchers';
import type { ColumnDef, Row } from '@tanstack/react-table';
import { useEffect, useState, useMemo } from 'react';
import DataTable from '../element/DataTable';
import { Button } from '../ui/button';
import { DollarSign, CreditCard, Building, FileText, ExternalLink, CheckCircle, Clock, AlertCircle, Calendar, History } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface MakePaymentData {
    piNo: string;
    indentNo: string;
    partyName: string;
    productName: string;
    qty: number;
    piAmount: number;
    poRateWithoutTax: number;
    poNumber: string;
    deliveryDate: string;
    paymentTerms: string;
    internalCode: string;
    totalPoAmount: number;
    numberOfDays: number;
    totalPaidAmount: number;
    outstandingAmount: number;
    status: string;
    planned: string;
    actual: string;
    delay: string;
    paymentFormLink: string;
    firmNameMatch: string;
    piCopy?: string;
    rowIndex?: number;
    sheetName?: string;
}

interface PIApprovalItem {
    timestamp?: string;
    piNo?: string;
    indentNo?: string;
    partyName?: string;
    productName?: string;
    qty?: number;
    piAmount?: number;
    poRateWithoutTax?: number;
    poNumber?: string;
    deliveryDate?: string;
    paymentTerms?: string;
    internalCode?: string;
    totalPoAmount?: number;
    numberOfDays?: number;
    totalPaidAmount?: number;
    outstandingAmount?: number;
    status?: string;
    planned?: string;
    actual?: string;
    delay?: string;
    paymentForm?: string;
    firmNameMatch?: string;
    piCopy?: string;
    rowIndex?: number;
    sheetName?: string;
}

interface PaymentHistoryItem {
    timestamp?: string;
    apPaymentNumber?: string;
    status?: string;
    uniqueNumber?: string;
    fmsName?: string;
    payTo?: string;
    amountToBePaid?: string | number;
    remarks?: string;
    anyAttachments?: string;
    rowIndex?: number;
}

interface DisplayPaymentHistory {
    rowIndex: number;
    formattedTimestamp: string; // Add this
    apPaymentNumber: string;
    status: string;
    uniqueNumber: string;
    fmsName: string;
    payTo: string;
    amountToBePaid: number;
    remarks: string;
    anyAttachments: string;
}

// Helper function to format date from various formats to DD/MM/YYYY
const formatDate = (dateString: string): string => {
    if (!dateString || dateString.trim() === '' || dateString === 'N/A' || dateString === 'null' || dateString === 'undefined') {
        return 'N/A';
    }

    try {
        const cleanDate = dateString.toString().trim();
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(cleanDate)) return cleanDate;
        if (/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
            const [year, month, day] = cleanDate.split('-');
            return `${day}/${month}/${year}`;
        }
        const date = new Date(cleanDate);
        if (!isNaN(date.getTime())) {
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        }
        return cleanDate;
    } catch (error) {
        return dateString;
    }
};

const formatDateTime = (dateString: string): string => {
    if (!dateString || dateString.trim() === '' || dateString === 'N/A' || dateString === 'null' || dateString === 'undefined') {
        return 'N/A';
    }

    try {
        const cleanDate = dateString.toString().trim();
        const date = new Date(cleanDate);
        if (!isNaN(date.getTime())) {
            return date.toLocaleString('en-IN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        }
        return cleanDate;
    } catch (error) {
        return dateString;
    }
};

export default function MakePayment() {
    const { piApprovalSheet, paymentHistorySheet, updateSheet, updateAll } = useSheets();
    const [tableData, setTableData] = useState<MakePaymentData[]>([]);
    const [historyData, setHistoryData] = useState<DisplayPaymentHistory[]>([]);
    const { user } = useAuth();
    const [isUpdating, setIsUpdating] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [debugInfo, setDebugInfo] = useState('');
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [stats, setStats] = useState({
        total: 0,
        totalPiAmount: 0,
        totalPoAmount: 0,
        totalOutstanding: 0,
        historyCount: 0
    });

    // Debug: Check if updateSheet function exists
    useEffect(() => {
        // updateSheet logic validated
    }, [updateSheet, piApprovalSheet, paymentHistorySheet]);

    // Filter data from PI APPROVAL sheet
    useEffect(() => {
        if (!piApprovalSheet || !Array.isArray(piApprovalSheet)) {
            setTableData([]);
            setLoading(false);
            return;
        }

        // Filter by firm
        const filteredByFirm = piApprovalSheet.filter((sheet: PIApprovalItem) => {
            const firmMatch = sheet.firmNameMatch || '';
            return user.firmNameMatch.toLowerCase() === "all" || firmMatch === user.firmNameMatch;
        });

        // Create a Set of paid indent numbers from Payment History
        const paidIndentNumbers = new Set();

        if (paymentHistorySheet && Array.isArray(paymentHistorySheet)) {
            paymentHistorySheet.forEach((item: PaymentHistoryItem) => {
                if (item.uniqueNumber) {
                    paidIndentNumbers.add(item.uniqueNumber.trim());
                }
            });
        }

        // Process PI APPROVAL data
        const processedData = filteredByFirm
            .filter((sheet: PIApprovalItem) => {
                const indentNumber = sheet.indentNo?.toString().trim() || '';

                // Check if indent number exists and is not already paid
                const isAlreadyPaid = indentNumber ? paidIndentNumbers.has(indentNumber) : false;

                // Check Planned and Actual conditions from PI APPROVAL sheet
                const plannedValue = sheet.planned?.toString().trim() || '';
                const actualValue = sheet.actual?.toString().trim() || '';

                const hasPlanned = plannedValue !== '' && plannedValue !== 'N/A' && plannedValue !== 'null' && plannedValue !== 'undefined';
                const hasActual = actualValue !== '' && actualValue !== 'N/A' && actualValue !== 'null' && actualValue !== 'undefined';

                // Check if payment form exists
                const hasPaymentForm = sheet.paymentForm?.toString().trim() !== '' &&
                    sheet.paymentForm?.toString().trim() !== 'N/A';

                const isApproved = sheet.status?.toLowerCase() === 'approved';
                const shouldShow = !isAlreadyPaid && (isApproved || (hasPlanned && hasPaymentForm)) && !hasActual;

                return shouldShow;
            })
            .map((sheet: PIApprovalItem) => {
                // Format dates
                const formattedDeliveryDate = formatDate(sheet.deliveryDate || '');
                const formattedPlannedDate = formatDate(sheet.planned || '');
                const formattedActualDate = formatDate(sheet.actual || '');

                return {
                    piNo: sheet.piNo?.toString().trim() || '',
                    indentNo: sheet.indentNo?.toString().trim() || '',
                    partyName: sheet.partyName?.toString().trim() || '',
                    productName: sheet.productName?.toString().trim() || '',
                    qty: Number(sheet.qty) || 0,
                    piAmount: Number(sheet.piAmount) || 0,
                    poRateWithoutTax: Number(sheet.poRateWithoutTax) || 0,
                    poNumber: sheet.poNumber?.toString().trim() || '',
                    deliveryDate: formattedDeliveryDate,
                    paymentTerms: sheet.paymentTerms?.toString().trim() || '',
                    internalCode: sheet.internalCode?.toString().trim() || '',
                    totalPoAmount: Number(sheet.totalPoAmount) || 0,
                    numberOfDays: Number(sheet.numberOfDays) || 0,
                    totalPaidAmount: Number(sheet.totalPaidAmount) || 0,
                    outstandingAmount: Number(sheet.outstandingAmount) || 0,
                    status: sheet.status?.toString().trim() || 'Pending',
                    planned: formattedPlannedDate,
                    actual: formattedActualDate,
                    delay: sheet.delay?.toString().trim() || '',
                    paymentFormLink: sheet.paymentForm?.toString().trim() || '',
                    firmNameMatch: sheet.firmNameMatch?.toString().trim() || '',
                    piCopy: sheet.piCopy,
                    rowIndex: sheet.rowIndex,
                    sheetName: sheet.sheetName || 'PI APPROVAL',
                } as MakePaymentData;
            })
            .sort((a, b) => b.indentNo.localeCompare(a.indentNo));

        setTableData(processedData);

        // Calculate stats
        const totalPiAmount = processedData.reduce((sum, item) => sum + item.piAmount, 0);
        const totalPoAmount = processedData.reduce((sum, item) => sum + item.totalPoAmount, 0);
        const totalOutstanding = processedData.reduce((sum, item) => sum + item.outstandingAmount, 0);

        setStats(prev => ({
            ...prev,
            total: processedData.length,
            totalPiAmount,
            totalPoAmount,
            totalOutstanding
        }));

        // Set debug info
        setDebugInfo(`Found ${processedData.length} items from ${filteredByFirm.length} filtered items (Total PI APPROVAL: ${piApprovalSheet.length})`);
        setLoading(false);
    }, [piApprovalSheet, paymentHistorySheet, user.firmNameMatch]);

    // Load Payment History data
    useEffect(() => {
        if (!paymentHistorySheet || !Array.isArray(paymentHistorySheet)) {
            setHistoryData([]);
            setHistoryLoading(false);
            return;
        }

        // Process Payment History data
        const processedHistoryData = paymentHistorySheet
            .filter(() => {
                // Filter by firm if needed
                return true; // Show all history data
            })
            .map((item: PaymentHistoryItem, index) => {
                const originalTimestamp = item.timestamp?.toString().trim() || '';
                const formattedTimestamp = originalTimestamp ? formatDateTime(originalTimestamp) : '';

                return {
                    rowIndex: item.rowIndex || index,
                    timestamp: item.timestamp?.toString().trim() || '',
                    formattedTimestamp: formattedTimestamp, // Add formatted version

                    apPaymentNumber: item.apPaymentNumber?.toString().trim() || '',
                    status: item.status?.toString().trim() || '',
                    uniqueNumber: item.uniqueNumber?.toString().trim() || '',
                    fmsName: item.fmsName?.toString().trim() || '',
                    payTo: item.payTo?.toString().trim() || '',
                    amountToBePaid: Number(item.amountToBePaid) || 0,
                    remarks: item.remarks?.toString().trim() || '',
                    anyAttachments: item.anyAttachments?.toString().trim() || '',
                } as DisplayPaymentHistory;
            })
            .sort((a, b) => b.formattedTimestamp.localeCompare(a.formattedTimestamp));

        setHistoryData(processedHistoryData);
        setStats(prev => ({
            ...prev,
            historyCount: processedHistoryData.length
        }));
        setHistoryLoading(false);
    }, [paymentHistorySheet]);

    // Handle Make Payment button click
    const handleMakePayment = async (item: MakePaymentData) => {
        if (!item.paymentFormLink || item.paymentFormLink === 'N/A') {
            alert("No payment link available for this item.");
            return;
        }

        window.open(item.paymentFormLink, '_blank');
    };

    // Handle bulk submission for selected items
    const handleBulkSubmit = async () => {
        if (selectedItems.size === 0) {
            alert("Please select at least one item to process payment.");
            return;
        }

        setIsUpdating("bulk");

        try {
            const today = new Date();
            const currentDate = today.toISOString();

            const selectedData = tableData.filter(item => selectedItems.has(item.indentNo));
            let successCount = 0;
            let errorCount = 0;

            for (const item of selectedData) {
                try {
                    const updateData = {
                        actual: currentDate,
                        status: "Paid"
                    };

                    if (!updateSheet || !item.rowIndex || item.rowIndex < 1) {
                        console.error('Invalid update for item:', item.indentNo);
                        errorCount++;
                        continue;
                    }

                    const result = await updateSheet('PI APPROVAL', item.rowIndex, updateData);

                    if (result && result.success) {
                        // Also insert into Payment History (payments table)
                        const paymentHistoryEntry = {
                            timestamp: currentDate,
                            apPaymentNumber: `PAY-${Date.now()}-${successCount}`,
                            status: 'Paid',
                            uniqueNumber: item.indentNo || item.poNumber,
                            fmsName: item.firmNameMatch,
                            payTo: item.partyName,
                            amountToBePaid: item.piAmount,
                            remarks: `Payment for Indent: ${item.indentNo}, PO: ${item.poNumber}`,
                            anyAttachments: ''
                        };

                        await postToSheet([paymentHistoryEntry], 'insert', 'Payment History');

                        // Helper to re-format date from DD/MM/YYYY to YYYY-MM-DD for Supabase
                        let mappedDeliveryDate = null;
                        if (item.deliveryDate && item.deliveryDate.includes('/')) {
                            const p = item.deliveryDate.split('/');
                            if (p.length === 3) mappedDeliveryDate = `${p[2]}-${p[1]}-${p[0]}`;
                        }

                        // ✅ NEW: Insert into Tally Entry (moving trigger logic to frontend)
                        const tallyEntryData = {
                            indentNumber: item.indentNo,
                            poNumber: item.poNumber,
                            partyName: item.partyName,
                            billAmt: item.piAmount,
                            planned1: currentDate.split('T')[0], // Stage 1 (Audit Data) planned date
                            firmNameMatch: item.firmNameMatch,
                            productName: item.productName,
                            qty: item.qty,

                            // Fill other details from PI Approval
                            billNo: item.piNo,
                            rate: item.poRateWithoutTax,
                            totalRate: item.totalPoAmount,
                            materialInDate: mappedDeliveryDate
                        };
                        await postToSheet([tallyEntryData], 'insert', 'TALLY ENTRY');

                        successCount++;

                        if (item.paymentFormLink && item.paymentFormLink !== 'N/A') {
                            window.open(item.paymentFormLink, '_blank');
                        }
                    } else {
                        errorCount++;
                        console.error('Update failed for item:', item.indentNo, result?.error);
                    }
                } catch (error) {
                    console.error('Error updating item:', item.indentNo, error);
                    errorCount++;
                }
            }

            // Refresh all sheets to update history and pending lists
            updateAll();

            setSelectedItems(new Set());

            if (successCount > 0) {
                const updatedIndentNos = selectedData
                    .filter((_, index) => index < successCount)
                    .map(item => item.indentNo);

                setTableData(prev => prev.filter(data => !updatedIndentNos.includes(data.indentNo)));

                updatedIndentNos.forEach(indentNo => {
                    const item = selectedData.find(d => d.indentNo === indentNo);
                    if (item) {
                        setStats(prev => ({
                            ...prev,
                            total: prev.total - 1,
                            totalPiAmount: prev.totalPiAmount - item.piAmount,
                            totalPoAmount: prev.totalPoAmount - item.totalPoAmount,
                            totalOutstanding: prev.totalOutstanding - item.outstandingAmount
                        }));
                    }
                });
            }

            alert(`✅ ${successCount} payment(s) updated successfully!${errorCount > 0 ? ` ${errorCount} failed.` : ''}${successCount > 0 ? ' Payment forms opened in new tabs.' : ''}`);

        } catch (error: any) {
            console.error('Error in bulk submission:', error);
            alert(`❌ Failed to process payments: ${error.message || 'Unknown error'}`);
        } finally {
            setIsUpdating(null);
        }
    };

    // Handle checkbox selection
    const handleCheckboxChange = (indentNo: string) => {
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(indentNo)) {
                newSet.delete(indentNo);
            } else {
                newSet.add(indentNo);
            }
            return newSet;
        });
    };

    // Handle select all/none
    const handleSelectAll = () => {
        if (selectedItems.size === tableData.length) {
            setSelectedItems(new Set());
        } else {
            const allIndentNos = tableData.map(item => item.indentNo);
            setSelectedItems(new Set(allIndentNos));
        }
    };

    // Function to handle file link clicks
    const handleFileLinkClick = (url: string, type: 'PI' | 'PO') => {
        if (!url || url === 'N/A' || url === '') {
            alert(`No ${type} copy available`);
            return;
        }

        if (url.startsWith('http') || url.startsWith('https')) {
            window.open(url, '_blank');
        } else {
            alert(`Please check the ${type} copy link: ${url}`);
        }
    };

    // Table columns for pending payments
    const columns: ColumnDef<MakePaymentData>[] = [
        {
            id: 'select',
            header: () => (
                <div className="flex items-center justify-center">
                    <input
                        type="checkbox"
                        checked={tableData.length > 0 && selectedItems.size === tableData.length}
                        onChange={handleSelectAll}
                        className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                </div>
            ),
            cell: ({ row }: { row: Row<MakePaymentData> }) => {
                const item = row.original;
                return (
                    <div className="flex items-center justify-center">
                        <input
                            type="checkbox"
                            checked={selectedItems.has(item.indentNo)}
                            onChange={() => handleCheckboxChange(item.indentNo)}
                            className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                    </div>
                );
            },
        },
        {
            header: 'Action',
            cell: ({ row }: { row: Row<MakePaymentData> }) => {
                const item = row.original;
                return (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMakePayment(item)}
                        disabled={!item.paymentFormLink}
                        className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    >
                        <ExternalLink className="mr-2 h-3 w-3" />
                        Make Payment
                    </Button>
                );
            },
        },
        {
            accessorKey: 'indentNo',
            header: 'Indent No.',
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-medium text-blue-700">{row.original.indentNo}</span>
                    {row.original.rowIndex && (
                        <span className="text-xs text-gray-500">Row: {row.original.rowIndex}</span>
                    )}
                </div>
            )
        },
        {
            accessorKey: 'firmNameMatch',
            header: 'Firm',
            cell: ({ row }) => (
                <Badge variant="outline" className="bg-gray-50">
                    <Building className="mr-1 h-3 w-3" />
                    {row.original.firmNameMatch}
                </Badge>
            )
        },
        {
            accessorKey: 'partyName',
            header: 'Party Name',
            cell: ({ row }) => (
                <span className="font-medium">{row.original.partyName}</span>
            )
        },
        {
            accessorKey: 'productName',
            header: 'Product',
            cell: ({ row }) => (
                <span className="font-medium">{row.original.productName}</span>
            )
        },
        {
            accessorKey: 'qty',
            header: 'Quantity',
            cell: ({ row }) => (
                <Badge variant="outline" className="bg-blue-50">
                    {row.original.qty}
                </Badge>
            )
        },
        {
            accessorKey: 'piAmount',
            header: 'P.I Amount',
            cell: ({ row }) => (
                <span className="font-semibold text-purple-600">₹{row.original.piAmount?.toLocaleString('en-IN')}</span>
            ),
        },
        {
            accessorKey: 'piCopy',
            header: 'PI Copy',
            cell: ({ row }) => (
                <div className="flex justify-center">
                    {row.original.piCopy ? (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => handleFileLinkClick(row.original.piCopy!, 'PI')}
                        >
                            <FileText className="mr-2 h-4 w-4" />
                            View PI
                        </Button>
                    ) : (
                        <span className="text-gray-400">N/A</span>
                    )}
                </div>
            )
        },
        {
            accessorKey: 'totalPoAmount',
            header: 'Total PO Amount',
            cell: ({ row }) => (
                <span className="font-semibold text-green-600">₹{row.original.totalPoAmount?.toLocaleString('en-IN')}</span>
            ),
        },
        {
            accessorKey: 'outstandingAmount',
            header: 'Outstanding',
            cell: ({ row }) => (
                <span className="font-semibold text-red-600">₹{row.original.outstandingAmount?.toLocaleString('en-IN')}</span>
            )
        },

        {
            accessorKey: 'paymentTerms',
            header: 'Payment Terms',
            cell: ({ row }) => {
                const type = row.original.paymentTerms;
                const isAdvance = type?.toLowerCase().includes('advance');
                return (
                    <Badge variant={isAdvance ? "default" : "outline"} className={isAdvance ? "bg-amber-100 text-amber-800" : ""}>
                        {type || 'N/A'}
                    </Badge>
                );
            }
        },
        {
            accessorKey: 'deliveryDate',
            header: 'Delivery Date',
            cell: ({ row }) => (
                <Badge variant="outline" className="bg-gray-50">
                    <Calendar className="mr-1 h-3 w-3" />
                    {row.original.deliveryDate}
                </Badge>
            )
        },
        {
            accessorKey: 'planned',
            header: 'Planned Date',
            cell: ({ row }) => (
                <Badge variant="outline" className="bg-blue-50">
                    <Clock className="mr-1 h-3 w-3" />
                    {row.original.planned}
                </Badge>
            )
        },
        {
            accessorKey: 'poNumber',
            header: 'PO Number',
            cell: ({ row }) => (
                <span className="font-medium text-blue-600">{row.original.poNumber || 'N/A'}</span>
            )
        },
        {
            accessorKey: 'internalCode',
            header: 'Internal Code',
            cell: ({ row }) => (
                <span className="font-medium text-gray-700">{row.original.internalCode || 'N/A'}</span>
            )
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => {
                const status = row.original.status;
                const isOk = status?.toLowerCase() === 'ok';
                return (
                    <Badge variant={isOk ? "default" : "outline"} className={isOk ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                        {status || 'Pending'}
                    </Badge>
                );
            }
        },
    ];

    // Table columns for payment history
    const historyColumns: ColumnDef<DisplayPaymentHistory>[] = [
        {
            accessorKey: 'formattedTimestamp', // Change from 'timestamp' to 'formattedTimestamp'
            header: 'Timestamp',
            cell: ({ row }) => (
                <div className="text-sm text-gray-600">
                    {row.original.formattedTimestamp || '-'}
                </div>
            )
        },

        {
            accessorKey: 'uniqueNumber',
            header: 'Unique Number',
            cell: ({ row }) => (
                <div className="bg-gray-50 py-1 px-3 rounded-md inline-block border">
                    {row.original.uniqueNumber || '-'}
                </div>
            )
        },
        {
            accessorKey: 'fmsName',
            header: 'FMS Name',
            cell: ({ row }) => (
                <span className="font-medium">{row.original.fmsName || '-'}</span>
            )
        },
        {
            accessorKey: 'payTo',
            header: 'Pay To',
            cell: ({ row }) => (
                <span className="font-medium">{row.original.payTo || '-'}</span>
            )
        },
        {
            accessorKey: 'amountToBePaid',
            header: 'Amount',
            cell: ({ row }) => (
                <span className="font-bold text-green-600">
                    ₹{row.original.amountToBePaid?.toLocaleString('en-IN')}
                </span>
            )
        },
        {
            accessorKey: 'remarks',
            header: 'Remarks',
            cell: ({ row }) => (
                <span className="text-sm text-gray-600 max-w-xs truncate">
                    {row.original.remarks || '-'}
                </span>
            )
        },
        {
            accessorKey: 'anyAttachments',
            header: 'Attachments',
            cell: ({ row }) => {
                const hasAttachments = row.original.anyAttachments?.trim() !== '';
                return (
                    <div>
                        {hasAttachments ? (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(row.original.anyAttachments, '_blank')}
                                className="text-blue-600 hover:text-blue-700"
                            >
                                <ExternalLink className="mr-1 h-3 w-3" />
                                View
                            </Button>
                        ) : (
                            <span className="text-gray-400">-</span>
                        )}
                    </div>
                );
            }
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 p-4 md:p-6">
            <div className="mx-auto max-w-7xl">
                {/* Header Section */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-green-600 rounded-lg shadow">
                            <CreditCard size={28} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Make Payment</h1>
                            <p className="text-gray-600">Process payments from PI APPROVAL sheet and view payment history</p>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                        <Card className="bg-white shadow border-0 hover:shadow-md transition-shadow">
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Pending Payments</p>
                                        <p className="text-2xl font-bold text-gray-800 mt-1">{stats.total}</p>
                                    </div>
                                    <Clock className="h-10 w-10 text-blue-500" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-white shadow border-0 hover:shadow-md transition-shadow">
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Total P.I Amount</p>
                                        <p className="text-2xl font-bold text-purple-600 mt-1">₹{stats.totalPiAmount.toLocaleString('en-IN')}</p>
                                    </div>
                                    <FileText className="h-10 w-10 text-purple-500" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-white shadow border-0 hover:shadow-md transition-shadow">
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Total PO Amount</p>
                                        <p className="text-2xl font-bold text-green-600 mt-1">₹{stats.totalPoAmount.toLocaleString('en-IN')}</p>
                                    </div>
                                    <DollarSign className="h-10 w-10 text-green-500" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-white shadow border-0 hover:shadow-md transition-shadow">
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Total Outstanding</p>
                                        <p className="text-2xl font-bold text-red-600 mt-1">₹{stats.totalOutstanding.toLocaleString('en-IN')}</p>
                                    </div>
                                    <AlertCircle className="h-10 w-10 text-red-500" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-white shadow border-0 hover:shadow-md transition-shadow">
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Payment History</p>
                                        <p className="text-2xl font-bold text-blue-600 mt-1">{stats.historyCount}</p>
                                    </div>
                                    <History className="h-10 w-10 text-blue-500" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Main Content Card */}
                <Card className="bg-white shadow-lg border-0 mb-6">
                    <CardContent className="p-0">
                        <Tabs defaultValue="pending" className="w-full">
                            <TabsList className="w-full max-w-md grid grid-cols-2 m-6">
                                <TabsTrigger value="pending" className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    Pending Payments
                                    {stats.total > 0 && (
                                        <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">
                                            {stats.total}
                                        </span>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger value="history" className="flex items-center gap-2">
                                    <History className="h-4 w-4" />
                                    Payment History
                                    {stats.historyCount > 0 && (
                                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
                                            {stats.historyCount}
                                        </span>
                                    )}
                                </TabsTrigger>
                            </TabsList>

                            {/* Pending Payments Tab */}
                            <TabsContent value="pending" className="px-6 pb-6">
                                {stats.total > 0 && (
                                    <div className="mb-4 px-6 py-3 bg-blue-50 border-b">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-2">
                                                    <div className={`h-3 w-3 rounded-full ${selectedItems.size > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                                    <span className="text-sm font-medium">
                                                        {selectedItems.size} of {stats.total} selected
                                                    </span>
                                                </div>
                                                {selectedItems.size > 0 && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setSelectedItems(new Set())}
                                                        className="h-7 px-2 text-red-600 hover:text-red-800 hover:bg-red-50"
                                                    >
                                                        Clear selection
                                                    </Button>
                                                )}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                Click checkboxes to select items, then click Submit
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {loading ? (
                                    <div className="text-center py-12">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                                        <p className="text-gray-600">Loading PI APPROVAL data...</p>
                                    </div>
                                ) : tableData.length > 0 ? (
                                    <div>
                                        {stats.total > 0 && (
                                            <div className="mb-4 flex items-center justify-between">
                                                <div className="flex-1">
                                                    <p className="text-sm text-gray-600">
                                                        Showing {tableData.length} pending payments
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {stats.total > 0 && (
                                                        <Button
                                                            variant="default"
                                                            onClick={handleBulkSubmit}
                                                            disabled={selectedItems.size === 0 || isUpdating === "bulk"}
                                                            className={`bg-green-600 hover:bg-green-700 ${isUpdating === "bulk" ? 'opacity-70 cursor-not-allowed' : ''}`}
                                                        >
                                                            {isUpdating === "bulk" ? (
                                                                <>
                                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                                    Processing...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <CheckCircle className="mr-2 h-4 w-4" />
                                                                    Submit Selected ({selectedItems.size})
                                                                </>
                                                            )}
                                                        </Button>
                                                    )}
                                                    {stats.total === 0 ? (
                                                        <Badge variant="outline" className="bg-green-50 text-green-700">
                                                            <CheckCircle className="mr-1 h-3 w-3" />
                                                            All Payments Processed
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="bg-amber-50 text-amber-700">
                                                            <Clock className="mr-1 h-3 w-3" />
                                                            {stats.total} Payments Pending
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        <DataTable
                                            data={tableData}
                                            columns={columns}
                                            searchFields={['indentNo', 'partyName', 'productName', 'poNumber', 'paymentTerms', 'firmNameMatch', 'internalCode']}
                                            dataLoading={false}
                                            className="border rounded-lg"
                                        />
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <CheckCircle className="h-16 w-16 text-green-300 mx-auto mb-4" />
                                        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Pending Payments Found</h3>
                                        <p className="text-gray-500 mb-4">All PI payments have been processed or no payments meet the criteria.</p>
                                        <div className="mt-6 text-sm text-gray-600 max-w-md mx-auto bg-gray-50 p-4 rounded-lg">
                                            <p className="font-medium mb-3 text-gray-800">📋 To appear in this list, PI APPROVAL items must:</p>
                                            <ul className="list-disc list-inside text-left space-y-2">
                                                <li>Have a <span className="font-medium">Planned</span> date set (not empty)</li>
                                                <li>Have an <span className="font-medium">Actual</span> date empty</li>
                                                <li>Have a <span className="font-medium">Payment Form</span> link (not empty)</li>
                                                <li>Not be marked as paid in Payment History sheet</li>
                                                <li>Match your firm filter: <span className="font-medium">{user.firmNameMatch === "all" ? "All firms" : user.firmNameMatch}</span></li>
                                            </ul>
                                            <div className="mt-4 p-3 bg-blue-50 rounded">
                                                <p className="text-blue-700 text-sm">
                                                    <strong>Debug Info:</strong> Found {piApprovalSheet?.length || 0} rows in PI APPROVAL sheet
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </TabsContent>

                            {/* Payment History Tab */}
                            <TabsContent value="history" className="px-6 pb-6">
                                {historyLoading ? (
                                    <div className="text-center py-12">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                        <p className="text-gray-600">Loading Payment History...</p>
                                    </div>
                                ) : historyData.length > 0 ? (
                                    <>
                                        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <History className="h-5 w-5 text-gray-600" />
                                                    <span className="font-medium text-gray-700">
                                                        Total Records: {stats.historyCount}
                                                    </span>
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    Showing all payment history records
                                                </div>
                                            </div>
                                        </div>

                                        <DataTable<DisplayPaymentHistory, ColumnDef<DisplayPaymentHistory>>
                                            data={historyData}
                                            columns={historyColumns}
                                            searchFields={['timestamp', 'apPaymentNumber', 'uniqueNumber', 'fmsName', 'payTo', 'remarks']}
                                            dataLoading={false}
                                            className="border rounded-lg"
                                        />
                                    </>
                                ) : (
                                    <div className="text-center py-12">
                                        <History className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Payment History Found</h3>
                                        <p className="text-gray-500">No payment history records available</p>
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}