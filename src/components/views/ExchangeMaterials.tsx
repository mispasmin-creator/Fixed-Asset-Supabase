import { Package2, FileText, Building, DollarSign, Calendar, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import Heading from '../element/Heading';
import { useSheets } from '@/context/SheetsContext';
import { useEffect, useState } from 'react';
import type { ColumnDef, Row } from '@tanstack/react-table';
import DataTable from '../element/DataTable';
import { useAuth } from '@/context/AuthContext';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { uploadFile } from '@/lib/fetchers';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { PuffLoader as Loader } from 'react-spinners';
import { toast } from 'sonner';
import { Input } from '../ui/input';
import { postToSheet } from '@/lib/fetchers';
import type { PIApprovalSheet } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';

interface PIPendingData {
    rowIndex: number;
    timestamp: string;
    partyName: string;
    poNumber: string;
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
    deliveryDate: string;
    paymentTerms: string;
    firmNameMatch: string;
    totalPaidAmount: number;
    outstandingAmount: number;
    status: string;
}
interface GroupedPIPendingData {
    poNumber: string;
    partyName: string;
    firmNameMatch: string;
    totalPoAmount: number;
    paymentTerms: string;
    itemCount: number;
    firstItem?: PIPendingData;
    isExpanded?: boolean;
}
interface POMasterRecord {
    rowIndex?: number;
    timestamp?: string;
    partyName?: string;
    poNumber?: string;
    quotationNumber?: string;
    quotationDate?: string;
    enquiryNumber?: string;
    enquiryDate?: string;
    internalCode?: string;
    product?: string;
    description?: string;
    quantity?: string | number;
    unit?: string;
    rate?: string | number;
    gstPercent?: string | number;
    discountPercent?: string | number;
    amount?: string | number;
    totalPoAmount?: string | number;
    preparedBy?: string;
    approvedBy?: string;
    pdf?: string;
    deliveryDate?: string;
    paymentTerms?: string;
    numberOfDays?: string | number;
    term1?: string;
    term2?: string;
    term3?: string;
    term4?: string;
    term5?: string;
    term6?: string;
    term7?: string;
    term8?: string;
    term9?: string;
    term10?: string;
    emailSendStatus?: string;
    deliveryDays?: string | number;
    deliveryType?: string;
    firmNameMatch?: string;
    piApprovalTimestamp?: string;
    piQty?: string | number;
    piAmount?: string | number;
    piCopy?: string;
    poRateWithoutTax?: string | number;
    totalPaidAmount?: string | number;
    outstandingAmount?: string | number;
    status?: string;
}

export default function PIApprovals() {
    const { poMasterLoading, poMasterSheet, piApprovalSheet, updateAll } = useSheets();
    const { user } = useAuth();
    const [pendingData, setPendingData] = useState<PIPendingData[]>([]);
    const [selectedItem, setSelectedItem] = useState<PIPendingData | null>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [stats, setStats] = useState({
        total: 0,
        totalAmount: 0,
        pendingCount: 0
    });

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


    const groupItemsByPO = (items: PIPendingData[]): GroupedPIPendingData[] => {
        const grouped: Record<string, GroupedPIPendingData> = {};

        items.forEach(item => {
            const poNumber = item.poNumber || '';

            if (!grouped[poNumber]) {
                grouped[poNumber] = {
                    poNumber: poNumber,
                    partyName: item.partyName || '',
                    firmNameMatch: item.firmNameMatch || '',
                    totalPoAmount: 0,
                    paymentTerms: item.paymentTerms || '',
                    itemCount: 0,
                    firstItem: item
                };
            }

            // Increment item count and sum amount
            grouped[poNumber].itemCount++;
            grouped[poNumber].totalPoAmount += item.totalPoAmount || 0;
        });

        return Object.values(grouped);
    };

    useEffect(() => {
        try {
            const safePoMasterSheet: POMasterRecord[] = Array.isArray(poMasterSheet) ? poMasterSheet : [];

            // Filter by firm
            const filteredByFirm = safePoMasterSheet.filter((sheet: POMasterRecord) =>
                user?.firmNameMatch?.toLowerCase() === "all" ||
                sheet?.firmNameMatch === user?.firmNameMatch
            );

            // Filter items that are NOT in PI Approval sheet yet
            // Check by both PO Number and Indent Number (internalCode)
            const approvedPONumbers = new Set(
                (piApprovalSheet || []).map(pi => pi.poNumber?.toString().trim()).filter(Boolean)
            );
            const approvedIndentNumbers = new Set(
                (piApprovalSheet || []).map(pi => pi.indentNo?.toString().trim()).filter(Boolean)
            );

            const pendingItems = filteredByFirm
                .filter((sheet: POMasterRecord) => {
                    const poNo = sheet?.poNumber?.toString().trim() || '';
                    const indentNo = sheet?.internalCode?.toString().trim() || '';
                    return !approvedPONumbers.has(poNo) && !approvedIndentNumbers.has(indentNo);
                })
                .map((sheet: POMasterRecord) => ({
                    rowIndex: sheet?.rowIndex || 0,
                    timestamp: sheet?.timestamp || '',
                    partyName: sheet?.partyName || '',
                    poNumber: sheet?.poNumber || '',
                    internalCode: sheet?.internalCode || '',
                    product: sheet?.product || '',
                    description: sheet?.description || '',
                    quantity: Number(sheet?.quantity || 0),
                    unit: sheet?.unit || '',
                    rate: Number(sheet?.rate || 0),
                    gstPercent: Number(sheet?.gstPercent || 0),
                    discountPercent: Number(sheet?.discountPercent || 0),
                    amount: Number(sheet?.amount || 0),
                    totalPoAmount: Number(sheet?.totalPoAmount || 0),
                    deliveryDate: sheet?.deliveryDate || '',
                    paymentTerms: sheet?.paymentTerms || '',
                    firmNameMatch: sheet?.firmNameMatch || '',
                    totalPaidAmount: Number(sheet?.totalPaidAmount || 0),
                    outstandingAmount: Number(sheet?.outstandingAmount || 0),
                    status: sheet?.status || 'Pending',
                }))
                .filter(item => {
                    const status = item.status?.toLowerCase() || '';
                    return status === 'pending' || status === '';
                });

            // ✅ NEW LOGIC: Group all items by Indent Number (internalCode) to show only the latest revised PO for each indent
            const finalItems: PIPendingData[] = [];
            const indentGroups: Record<string, PIPendingData[]> = {};
            const standaloneItems: PIPendingData[] = [];

            pendingItems.forEach(item => {
                const indent = item.internalCode?.trim();
                if (indent) {
                    if (!indentGroups[indent]) {
                        indentGroups[indent] = [];
                    }
                    indentGroups[indent].push(item);
                } else {
                    standaloneItems.push(item);
                }
            });

            // Process items with an indent: Take only the latest PO (most recent revision)
            Object.keys(indentGroups).forEach(indent => {
                const group = indentGroups[indent];
                if (group.length > 0) {
                    const sortedGroup = [...group].sort((a, b) => {
                        const dateA = new Date(a.timestamp || 0).getTime();
                        const dateB = new Date(b.timestamp || 0).getTime();
                        if (!isNaN(dateA) && !isNaN(dateB)) {
                            return dateB - dateA;
                        }
                        return (b.rowIndex || 0) - (a.rowIndex || 0);
                    });
                    finalItems.push(sortedGroup[0]);
                }
            });

            // Process standalone items (no indent number): Deduplicate by PO number
            const seenStandalonePOs = new Set<string>();
            standaloneItems.forEach(item => {
                if (!seenStandalonePOs.has(item.poNumber)) {
                    seenStandalonePOs.add(item.poNumber);
                    finalItems.push(item);
                }
            });

            // Sort all items by timestamp (newest first)
            const finalSortedItems = finalItems.sort((a, b) => {
                if (a.timestamp && b.timestamp) {
                    const dateA = new Date(a.timestamp);
                    const dateB = new Date(b.timestamp);
                    if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
                        return dateB.getTime() - dateA.getTime();
                    }
                }
                return (b.rowIndex || 0) - (a.rowIndex || 0);
            });

            setPendingData(finalSortedItems);

            // Calculate stats
            const totalAmount = finalSortedItems.reduce((sum, item) => sum + item.totalPoAmount, 0);
            setStats({
                total: finalSortedItems.length,
                totalAmount,
                pendingCount: finalSortedItems.length
            });

        } catch (error) {
            console.error('❌ Error in PI Approvals useEffect:', error);
            setPendingData([]);
        }
    }, [poMasterSheet, piApprovalSheet, user?.firmNameMatch]);



    const pendingColumns: ColumnDef<PIPendingData>[] = [
        {
            header: 'Action',
            cell: ({ row }: { row: Row<PIPendingData> }) => (
                <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                        setSelectedItem(row.original);
                        setOpenDialog(true);
                    }}
                    className="bg-purple-600 hover:bg-purple-700 shadow-sm"
                >
                    <FileText className="mr-2 h-3 w-3" />
                    PI Payment
                </Button>
            ),
        },
        {
            accessorKey: 'timestamp',
            header: () => (
                <div className="flex items-center justify-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Timestamp</span>
                </div>
            ),
            cell: ({ getValue }) => (
                <span className="text-sm text-gray-600">{formatDateTime(getValue() as string)}</span>
            )
        },
        {
            accessorKey: 'poNumber',
            header: 'PO Number',
            cell: ({ row }) => (
                <span className="font-medium text-purple-700">{row.original.poNumber || '-'}</span>
            )
        },
        {
            accessorKey: 'internalCode',
            header: 'Indent No.',
            cell: ({ row }) => (
                <Badge variant="outline" className="bg-gray-50">
                    {row.original.internalCode || '-'}
                </Badge>
            )
        },
        {
            accessorKey: 'partyName',
            header: 'Party Name',
            cell: ({ row }) => (
                <span className="font-medium">{row.original.partyName || '-'}</span>
            )
        },

        {
            accessorKey: 'product',
            header: 'Product Name',
            cell: ({ row }) => (
                <div className="max-w-[200px]">
                    <span className="text-sm font-medium text-gray-800">
                        {row.original.product || '-'}
                    </span>
                    {row.original.description && (
                        <p className="text-xs text-gray-500 truncate mt-1">
                            {row.original.description}
                        </p>
                    )}
                </div>
            )
        },

        {
            accessorKey: 'totalPoAmount',
            header: 'Total PO Amount',
            cell: ({ row }) => (
                <span className="font-bold text-purple-600">₹{row.original.totalPoAmount?.toLocaleString('en-IN')}</span>
            )
        },
        // ✅ ADD these three new columns
        {
            accessorKey: 'totalPaidAmount',
            header: 'Total Paid Amount',
            cell: ({ row }) => (
                <span className="font-semibold text-green-600">
                    ₹{row.original.totalPaidAmount?.toLocaleString('en-IN')}
                </span>
            )
        },
        {
            accessorKey: 'outstandingAmount',
            header: 'Outstanding Amount',
            cell: ({ row }) => (
                <span className="font-semibold text-red-600">
                    ₹{row.original.outstandingAmount?.toLocaleString('en-IN')}
                </span>
            )
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => {
                const status = row.original.status;
                const isPending = status?.toLowerCase() === 'pending';
                const isComplete = status?.toLowerCase() === 'complete' || status?.toLowerCase() === 'completed';

                return (
                    <Badge
                        variant={isComplete ? "default" : "outline"}
                        className={
                            isComplete
                                ? "bg-green-100 text-green-800 border-green-300"
                                : isPending
                                    ? "bg-amber-100 text-amber-800 border-amber-300"
                                    : ""
                        }
                    >
                        {status || 'Pending'}
                    </Badge>
                );
            }
        },
        {
            accessorKey: 'paymentTerms',
            header: 'Payment Terms',
            cell: ({ row }) => {
                const terms = row.original.paymentTerms;
                const isAdvance = terms?.toLowerCase().includes('advance');
                return (
                    <Badge variant={isAdvance ? "default" : "outline"} className={isAdvance ? "bg-amber-100 text-amber-800" : ""}>
                        {terms || '-'}
                    </Badge>
                );
            }
        },
        {
            accessorKey: 'deliveryDate',
            header: 'Delivery Date',
            cell: ({ row }) => {
                const deliveryDate = row.original.deliveryDate;

                // Check if deliveryDate exists and is a valid date string
                if (!deliveryDate) return <span className="text-sm">-</span>;

                try {
                    // Try to parse the date
                    const date = new Date(deliveryDate);

                    // Check if date is valid
                    if (isNaN(date.getTime())) {
                        // If not a valid Date object, return the original string
                        return <span className="text-sm">{deliveryDate}</span>;
                    }

                    // Format to dd/mm/yy
                    const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear().toString().slice(-2)}`;

                    return <span className="text-sm">{formattedDate}</span>;
                } catch (error) {
                    // If any error occurs, return the original string
                    return <span className="text-sm">{deliveryDate}</span>;
                }
            }
        },
        {
            accessorKey: 'firmNameMatch',
            header: 'Firm',
            cell: ({ row }) => (
                <Badge variant="outline" className="bg-gray-50">
                    <Building className="mr-1 h-3 w-3" />
                    {row.original.firmNameMatch || '-'}
                </Badge>
            )
        },
    ];

    const schema = z.object({
        qty: z.string().min(1, 'Quantity is required'),
        piAmount: z.string().min(1, 'P.I Amount is required'),
        poRateWithoutTax: z.string().min(1, 'PO Rate Without Tax is required'),
        piCopy: z.any().optional(),
    });

    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            qty: '',
            piAmount: '',
            poRateWithoutTax: '',
            piCopy: undefined,
        },
    });

    useEffect(() => {
        if (!openDialog) {
            form.reset();
        }
    }, [openDialog, form]);



    function generatePINumber(): string {
        const items = piApprovalSheet || [];
        if (items.length === 0) {
            return 'PI-48';
        }

        // Extract numbers from "PI-XX" format and find the maximum
        const numbers = items
            .map(item => {
                const piNo = item.piNo || '';
                const match = piNo.toString().match(/PI-(\d+)/i);
                return match ? parseInt(match[1], 10) : 0;
            })
            .filter(n => n > 0);

        const maxNum = numbers.length > 0 ? Math.max(...numbers) : 47;
        return `PI-${maxNum + 1}`;
    }

    async function onSubmit(values: z.infer<typeof schema>) {
        try {
            setSubmitting(true);
            const currentDateTime = new Date()
                .toLocaleString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false,
                })
                .replace(',', '');

            const piNumber = generatePINumber();

            let piCopyUrl = '';
            if (values.piCopy && values.piCopy[0]) {
                const file = values.piCopy[0];
                // Check if file size > 10MB
                if (file.size > 10 * 1024 * 1024) {
                    toast.error('File size must be less than 10MB');
                    setSubmitting(false);
                    return;
                }
                piCopyUrl = await uploadFile({
                    file,
                    bucket: 'bills'
                });
            }

            await postToSheet(
                [{
                    timestamp: currentDateTime,
                    piNo: piNumber,
                    poNumber: selectedItem?.poNumber,
                    indentNo: selectedItem?.internalCode,
                    partyName: selectedItem?.partyName,
                    productName: selectedItem?.product,
                    qty: values.qty && !isNaN(Number(values.qty)) ? Number(values.qty) : 0,
                    piAmount: values.piAmount && !isNaN(Number(values.piAmount)) ? Number(values.piAmount) : 0,
                    poRateWithoutTax: values.poRateWithoutTax && !isNaN(Number(values.poRateWithoutTax)) ? Number(values.poRateWithoutTax) : 0,
                    piCopy: piCopyUrl,
                    planned: '',
                    actual: '',
                    delay: '',
                    status: 'Approved',
                    firmNameMatch: selectedItem?.firmNameMatch,
                } as Partial<PIApprovalSheet>],
                'insert',
                'PI APPROVAL'
            );

            // Also update PO MASTER status to 'Approved'
            if (selectedItem?.rowIndex) {
                await postToSheet(
                    [{
                        rowIndex: selectedItem.rowIndex,
                        status: 'Approved'
                    }],
                    'update',
                    'PO MASTER'
                );
            }

            toast.success(`PI Payment submitted for PO: ${selectedItem?.poNumber}`);
            setOpenDialog(false);
            setTimeout(() => updateAll(), 1000);
        } catch (error) {
            toast.error('Failed to process PI approval');
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    }

    function onError(e: any) {
        console.log(e);
        toast.error('Please fill all required fields');
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 p-4 md:p-6">
            <div className="mx-auto max-w-7xl">
                {/* Header Section */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-purple-600 rounded-lg shadow">
                            <Package2 size={28} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">PI Approvals </h1>
                            <p className="text-gray-600">Process and approve Proforma Invoice payments</p>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <Card className="bg-white shadow border-0 hover:shadow-md transition-shadow">
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                                        <p className="text-2xl font-bold text-purple-600 mt-1">{stats.total}</p>
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
                                        <p className="text-2xl font-bold text-green-600 mt-1">
                                            ₹{stats.totalAmount.toLocaleString('en-IN')}
                                        </p>
                                    </div>
                                    <DollarSign className="h-10 w-10 text-green-500" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-white shadow border-0 hover:shadow-md transition-shadow">
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Approval Status</p>
                                        <p className="text-2xl font-bold text-amber-600 mt-1">
                                            {stats.pendingCount > 0 ? 'Pending' : 'Completed'}
                                        </p>
                                    </div>
                                    <div className={`h-10 w-10 flex items-center justify-center rounded-full ${stats.pendingCount > 0 ? 'bg-amber-100' : 'bg-green-100'
                                        }`}>
                                        {stats.pendingCount > 0 ? (
                                            <AlertCircle className="h-6 w-6 text-amber-600" />
                                        ) : (
                                            <CheckCircle className="h-6 w-6 text-green-600" />
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Main Content Card */}
                <Card className="bg-white shadow-lg border-0 mb-6">
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-xl font-bold text-gray-800">Pending PI Approvals</CardTitle>
                                <p className="text-gray-600 text-sm mt-1">Click "PI Payment" to process Proforma Invoice approval</p>
                            </div>
                            {stats.total === 0 ? (
                                <Badge variant="outline" className="bg-green-50 text-green-700">
                                    <CheckCircle className="mr-1 h-3 w-3" />
                                    All Approved
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="bg-purple-50 text-purple-700">
                                    <AlertCircle className="mr-1 h-3 w-3" />
                                    {stats.total} Pending
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {pendingData.length > 0 ? (
                            <DataTable
                                data={pendingData}
                                columns={pendingColumns}
                                searchFields={['poNumber', 'partyName', 'product', 'internalCode', 'firmNameMatch']}
                                dataLoading={poMasterLoading}
                                className="border rounded-lg"
                            />
                        ) : (
                            <div className="text-center py-12">
                                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Pending PI Approvals</h3>
                                <p className="text-gray-500">All Proforma Invoices have been approved.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* PI Payment Dialog */}
                <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                    {selectedItem && (
                        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-6">
                                    <DialogHeader>
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 bg-purple-100 rounded-lg">
                                                <FileText className="h-6 w-6 text-purple-600" />
                                            </div>
                                            <div>
                                                <DialogTitle className="text-xl">Process PI Approval 67</DialogTitle>
                                                <DialogDescription>
                                                    Process Proforma Invoice for PO: <span className="font-semibold text-purple-600">{selectedItem.poNumber}</span>
                                                </DialogDescription>
                                            </div>
                                        </div>
                                    </DialogHeader>

                                    <Separator />

                                    {/* PO Details Card */}
                                    <Card className="bg-purple-50 border-purple-200">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-base font-semibold text-purple-800 flex items-center gap-2">
                                                <Package2 className="h-4 w-4" />
                                                PO Details
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                <div className="space-y-1">
                                                    <p className="text-xs font-medium text-gray-600">PO Number</p>
                                                    <p className="text-sm font-semibold text-gray-800">{selectedItem.poNumber}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-medium text-gray-600">Party Name</p>
                                                    <p className="text-sm font-semibold text-gray-800">{selectedItem.partyName}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-medium text-gray-600">Indent No.</p>
                                                    <p className="text-sm font-semibold text-gray-800">{selectedItem.internalCode}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-medium text-gray-600">Product</p>
                                                    <p className="text-sm font-semibold text-gray-800">{selectedItem.product}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-medium text-gray-600">Quantity </p>
                                                    <p className="text-sm font-semibold text-gray-800">
                                                        {selectedItem.quantity} {selectedItem.unit}
                                                    </p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-medium text-gray-600">Total PO Amount</p>
                                                    <p className="text-sm font-semibold text-green-600">
                                                        ₹{selectedItem.totalPoAmount?.toLocaleString('en-IN')}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Form Fields */}
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="qty"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-medium">Remarks *</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="text"
                                                                placeholder="Enter remarks"
                                                                className="border-gray-300 focus:border-purple-500"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="piAmount"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-medium flex items-center gap-2">
                                                            <DollarSign className="h-4 w-4" />
                                                            P.I Amount *
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                placeholder="Enter PI amount"
                                                                className="border-gray-300 focus:border-purple-500"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>



                                        <FormField
                                            control={form.control}
                                            name="poRateWithoutTax"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-medium">PO Rate Without Tax *</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            placeholder="Enter PO rate without tax"
                                                            className="border-gray-300 focus:border-purple-500"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="piCopy"
                                            render={({ field: { value, onChange, ...fieldProps } }) => (
                                                <FormItem>
                                                    <FormLabel className="font-medium">
                                                        Upload PI copy (PDF, JPG, PNG - Max 10MB)
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            {...fieldProps}
                                                            type="file"
                                                            accept=".pdf,.jpg,.jpeg,.png"
                                                            onChange={(event) =>
                                                                onChange(event.target.files)
                                                            }
                                                            className="border-gray-300 focus:border-purple-500 h-auto py-1.5"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <Separator />

                                    <DialogFooter className="gap-2">
                                        <DialogClose asChild>
                                            <Button
                                                variant="outline"
                                                type="button"
                                                className="border-gray-300"
                                                disabled={form.formState.isSubmitting}
                                            >
                                                Cancel
                                            </Button>
                                        </DialogClose>
                                        <Button
                                            type="submit"
                                            className="bg-purple-600 hover:bg-purple-700 shadow-sm"
                                            disabled={form.formState.isSubmitting}
                                        >
                                            {form.formState.isSubmitting ? (
                                                <>
                                                    <Loader size={18} className="mr-2" />
                                                    Submitting...
                                                </>
                                            ) : (
                                                <>
                                                    <FileText className="mr-2 h-4 w-4" />
                                                    Submit PI Payment
                                                </>
                                            )}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    )}
                </Dialog>
            </div>
        </div>
    );
}