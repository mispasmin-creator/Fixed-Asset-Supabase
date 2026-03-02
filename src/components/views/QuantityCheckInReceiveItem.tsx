import { useSheets } from '@/context/SheetsContext';
import type { ColumnDef, Row } from '@tanstack/react-table';
import { useEffect, useState } from 'react';
import DataTable from '../element/DataTable';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { postToSheet, uploadFile } from '@/lib/fetchers';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Truck, Package, CheckCircle, XCircle, FileText, AlertCircle, Building, DollarSign, Upload } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';

const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    try {
        const dateObj = new Date(dateString);
        if (isNaN(dateObj.getTime())) return dateString;
        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const year = String(dateObj.getFullYear()).slice(-2);
        return `${day}/${month}/${year}`;
    } catch {
        return dateString;
    }
};

interface StoreInPendingData {
    liftNumber: string;
    indentNumber: string;
    billNo: string;
    vendorName: string;
    productName: string;
    qty: number;
    typeOfBill: string;
    billAmount: number;
    paymentType: string;
    advanceAmountIfAny: number;
    photoOfBill: string;
    transportationInclude: string;
    transporterName: string;
    amount: number;
    firmNameMatch: string;
    damageOrder?: string;
    quantityAsPerBill?: string;
    priceAsPerPo?: number;
    remark?: string;
    timestamp: string;
    plannedDate: string;
}

interface StoreInHistoryData {
    liftNumber: string;
    indentNumber: string;
    billNo: string;
    vendorName: string;
    productName: string;
    qty: number;
    typeOfBill: string;
    billAmount: number;
    paymentType: string;
    advanceAmountIfAny: number;
    photoOfBill: string;
    transportationInclude: string;
    status: string;
    billCopyAttached: string;
    debitNote: string;
    reason: string;
    firmNameMatch: string;
    damageOrder?: string;
    quantityAsPerBill?: string;
    priceAsPerPo?: number;
    remark?: string;
}

interface StoreInSheetItem {
    liftNumber?: string;
    indentNo?: string;
    billNo?: string;
    vendorName?: string;
    productName?: string;
    qty?: number;
    typeOfBill?: string;
    billAmount?: number;
    paymentType?: string;
    advanceAmountIfAny?: number | string;
    photoOfBill?: string;
    transportationInclude?: string;
    transporterName?: string;
    amount?: number;
    planned7?: string;
    actual7?: string;
    status?: string;
    billCopyAttached?: string;
    debitNote?: string;
    reason?: string;
    damageOrder?: string;
    quantityAsPerBill?: string;
    priceAsPerPo?: number;
    remark?: string;
    firmNameMatch?: string;
    rowIndex?: number;
    timestamp?: string;
}

const schema = z.object({
    status: z.enum(['Accept', 'Reject']),
    billCopyAttached: z.instanceof(File).optional(),
    debitNote: z.enum(['Yes', 'No']),
    reason: z.string().min(1, 'Reason is required'),
});

type FormValues = z.infer<typeof schema>;

export default () => {
    const { storeInSheet, updateAll } = useSheets();
    const { user } = useAuth();

    const [pendingData, setPendingData] = useState<StoreInPendingData[]>([]);
    const [historyData, setHistoryData] = useState<StoreInHistoryData[]>([]);
    const [selectedItem, setSelectedItem] = useState<StoreInPendingData | null>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [activeTab, setActiveTab] = useState('pending');

    const [stats, setStats] = useState({
        pending: 0,
        accepted: 0,
        rejected: 0,
        totalAmount: 0
    });

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            status: undefined,
            billCopyAttached: undefined,
            debitNote: undefined,
            reason: '',
        },
    });

    useEffect(() => {
        const filteredByFirm = storeInSheet.filter((item: StoreInSheetItem) =>
            user.firmNameMatch?.toLowerCase() === "all" || item.firmNameMatch === user.firmNameMatch
        );

        const pendingItems = filteredByFirm.filter((i: StoreInSheetItem) => i.planned7 && i.planned7 !== '' && !i.actual7);
        const historyItems = filteredByFirm.filter((i: StoreInSheetItem) => i.planned7 && i.planned7 !== '' && i.actual7);

        setPendingData(
            pendingItems.map((i: StoreInSheetItem) => ({
                liftNumber: i.liftNumber || '',
                indentNumber: i.indentNo || '',
                billNo: i.billNo || '',
                vendorName: i.vendorName || '',
                productName: i.productName || '',
                qty: i.qty || 0,
                typeOfBill: i.typeOfBill || '',
                billAmount: i.billAmount || 0,
                paymentType: i.paymentType || '',
                advanceAmountIfAny: Number(i.advanceAmountIfAny) || 0,
                photoOfBill: i.photoOfBill || '',
                transportationInclude: i.transportationInclude || '',
                transporterName: i.transporterName || '',
                amount: i.amount || 0,
                damageOrder: i.damageOrder || '',
                quantityAsPerBill: i.quantityAsPerBill || 'No',
                priceAsPerPo: i.priceAsPerPo || 0,
                remark: i.remark || '',
                firmNameMatch: i.firmNameMatch || '',
                timestamp: i.timestamp || '',
                plannedDate: i.planned7 || '',
            }))
        );

        setHistoryData(
            historyItems.map((i: StoreInSheetItem) => ({
                liftNumber: i.liftNumber || '',
                indentNumber: i.indentNo || '',
                billNo: i.billNo || '',
                vendorName: i.vendorName || '',
                productName: i.productName || '',
                qty: i.qty || 0,
                typeOfBill: i.typeOfBill || '',
                billAmount: i.billAmount || 0,
                paymentType: i.paymentType || '',
                advanceAmountIfAny: Number(i.advanceAmountIfAny) || 0,
                photoOfBill: i.photoOfBill || '',
                transportationInclude: i.transportationInclude || '',
                status: i.status || '',
                billCopyAttached: i.billCopyAttached || '',
                debitNote: i.debitNote || '',
                reason: i.reason || '',
                damageOrder: i.damageOrder || '',
                quantityAsPerBill: i.quantityAsPerBill || 'No',
                priceAsPerPo: i.priceAsPerPo || 0,
                remark: i.remark || '',
                firmNameMatch: i.firmNameMatch || '',
            }))
        );

        const acceptedCount = historyItems.filter(item => item.status === 'Accept').length;
        const rejectedCount = historyItems.filter(item => item.status === 'Reject').length;
        const totalAmount = pendingItems.reduce((sum, item) => sum + (item.billAmount || 0), 0);

        setStats({
            pending: pendingItems.length,
            accepted: acceptedCount,
            rejected: rejectedCount,
            totalAmount
        });

    }, [storeInSheet, user.firmNameMatch]);

    const pendingColumns: ColumnDef<StoreInPendingData>[] = [
        ...(user.receiveItemView
            ? [
                {
                    header: 'Action',
                    cell: ({ row }: { row: Row<StoreInPendingData> }) => {
                        const item = row.original;
                        return (
                            <Button
                                variant="default"
                                size="sm"
                                onClick={() => {
                                    setSelectedItem(item);
                                    setOpenDialog(true);
                                }}
                                className="bg-blue-600 hover:bg-blue-700 shadow-sm"
                            >
                                <Package className="mr-2 h-3 w-3" />
                                Process
                            </Button>
                        );
                    },
                },
            ]
            : []),
        {
            accessorKey: 'timestamp',
            header: 'Timestamp',
            cell: ({ row }) => (
                <span className="text-gray-500 text-xs">{formatDate(row.original.timestamp)}</span>
            )
        },
        {
            accessorKey: 'plannedDate',
            header: 'Planned Date',
            cell: ({ row }) => (
                <Badge variant="outline" className="bg-amber-50">
                    {formatDate(row.original.plannedDate)}
                </Badge>
            )
        },
        {
            accessorKey: 'liftNumber',
            header: 'Lift No.',
            cell: ({ row }) => (
                <span className="font-medium text-blue-700">{row.original.liftNumber}</span>
            )
        },
        {
            accessorKey: 'indentNumber',
            header: 'Indent No.',
            cell: ({ row }) => (
                <span className="font-medium">{row.original.indentNumber}</span>
            )
        },
        {
            accessorKey: 'billNo',
            header: 'Bill No.',
            cell: ({ row }) => (
                <span className="font-medium">{row.original.billNo}</span>
            )
        },
        {
            accessorKey: 'vendorName',
            header: 'Vendor',
            cell: ({ row }) => (
                <span className="font-medium">{row.original.vendorName}</span>
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
            accessorKey: 'productName',
            header: 'Product',
            cell: ({ row }) => (
                <span className="font-medium">{row.original.productName}</span>
            )
        },
        {
            accessorKey: 'qty',
            header: 'Qty',
            cell: ({ row }) => (
                <Badge variant="outline" className="bg-blue-50">
                    {row.original.qty}
                </Badge>
            )
        },
        {
            accessorKey: 'billAmount',
            header: 'Bill Amount',
            cell: ({ row }) => (
                <span className="font-semibold text-green-600">₹{row.original.billAmount?.toLocaleString('en-IN')}</span>
            )
        },
        {
            accessorKey: 'paymentType',
            header: 'Payment',
            cell: ({ row }) => {
                const type = row.original.paymentType;
                const isAdvance = type?.toLowerCase().includes('advance');
                return (
                    <Badge variant={isAdvance ? "default" : "outline"} className={isAdvance ? "bg-amber-100 text-amber-800" : ""}>
                        {type || '-'}
                    </Badge>
                );
            }
        },
        {
            accessorKey: 'photoOfBill',
            header: 'Bill',
            cell: ({ row }) => {
                const photo = row.original.photoOfBill;
                return photo ? (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(photo, '_blank')}
                        className="text-blue-600 hover:text-blue-800"
                    >
                        <FileText className="mr-1 h-3 w-3" />
                        View
                    </Button>
                ) : (
                    <span className="text-gray-400">-</span>
                );
            },
        },
        {
            accessorKey: 'transportationInclude',
            header: 'Transport'
        },
        {
            accessorKey: 'transporterName',
            header: 'Transporter'
        },
        {
            accessorKey: 'amount',
            header: 'Amount',
            cell: ({ row }) => (
                <span className="font-medium">₹{row.original.amount?.toLocaleString('en-IN')}</span>
            )
        },
    ];

    const historyColumns: ColumnDef<StoreInHistoryData>[] = [
        {
            accessorKey: 'liftNumber',
            header: 'Lift No.',
            cell: ({ row }) => (
                <span className="font-medium text-blue-700">{row.original.liftNumber}</span>
            )
        },
        {
            accessorKey: 'indentNumber',
            header: 'Indent No.',
            cell: ({ row }) => (
                <span className="font-medium">{row.original.indentNumber}</span>
            )
        },
        {
            accessorKey: 'billNo',
            header: 'Bill No.',
            cell: ({ row }) => (
                <span className="font-medium">{row.original.billNo}</span>
            )
        },
        {
            accessorKey: 'vendorName',
            header: 'Vendor',
            cell: ({ row }) => (
                <span className="font-medium">{row.original.vendorName}</span>
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
            accessorKey: 'productName',
            header: 'Product',
            cell: ({ row }) => (
                <span className="font-medium">{row.original.productName}</span>
            )
        },
        {
            accessorKey: 'qty',
            header: 'Qty',
            cell: ({ row }) => (
                <Badge variant="outline" className="bg-blue-50">
                    {row.original.qty}
                </Badge>
            )
        },
        {
            accessorKey: 'billAmount',
            header: 'Bill Amount',
            cell: ({ row }) => (
                <span className="font-semibold text-green-600">₹{row.original.billAmount?.toLocaleString('en-IN')}</span>
            )
        },
        {
            accessorKey: 'paymentType',
            header: 'Payment',
            cell: ({ row }) => {
                const type = row.original.paymentType;
                const isAdvance = type?.toLowerCase().includes('advance');
                return (
                    <Badge variant={isAdvance ? "default" : "outline"} className={isAdvance ? "bg-amber-100 text-amber-800" : ""}>
                        {type || '-'}
                    </Badge>
                );
            }
        },
        {
            accessorKey: 'photoOfBill',
            header: 'Bill',
            cell: ({ row }) => {
                const photo = row.original.photoOfBill;
                return photo ? (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(photo, '_blank')}
                        className="text-blue-600 hover:text-blue-800"
                    >
                        <FileText className="mr-1 h-3 w-3" />
                        View
                    </Button>
                ) : (
                    <span className="text-gray-400">-</span>
                );
            },
        },
        {
            accessorKey: 'transportationInclude',
            header: 'Transport'
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => {
                const status = row.original.status;
                const isAccepted = status === 'Accept';
                return (
                    <Badge
                        variant={isAccepted ? "default" : "destructive"}
                        className={`inline-flex items-center gap-1 ${isAccepted
                            ? 'bg-green-100 text-green-800 hover:bg-green-100'
                            : 'bg-red-100 text-red-800 hover:bg-red-100'
                            }`}
                    >
                        {isAccepted ? (
                            <CheckCircle className="h-3 w-3" />
                        ) : (
                            <XCircle className="h-3 w-3" />
                        )}
                        {status}
                    </Badge>
                );
            },
        },
        {
            accessorKey: 'billCopyAttached',
            header: 'Bill Copy',
            cell: ({ row }) => {
                const billCopy = row.original.billCopyAttached;
                return billCopy ? (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(billCopy, '_blank')}
                        className="text-blue-600 hover:text-blue-800"
                    >
                        <FileText className="mr-1 h-3 w-3" />
                        View
                    </Button>
                ) : (
                    <span className="text-gray-400">-</span>
                );
            },
        },
        {
            accessorKey: 'debitNote',
            header: 'Debit Note',
            cell: ({ row }) => {
                const note = row.original.debitNote;
                const hasDebitNote = note === 'Yes';
                return (
                    <Badge variant={hasDebitNote ? "default" : "outline"} className={hasDebitNote ? "bg-blue-100 text-blue-800" : ""}>
                        {note || '-'}
                    </Badge>
                );
            }
        },
        {
            accessorKey: 'reason',
            header: 'Reason',
            cell: ({ row }) => (
                <div className="max-w-xs truncate" title={row.original.reason}>
                    {row.original.reason || '-'}
                </div>
            )
        },
    ];

    useEffect(() => {
        if (!openDialog) {
            form.reset({
                status: undefined,
                billCopyAttached: undefined,
                debitNote: undefined,
                reason: '',
            });
        }
    }, [openDialog, form]);

    async function onSubmit(values: FormValues) {
        try {

            let billCopyAttachedUrl = '';

            if (values.billCopyAttached) {
                try {
                    billCopyAttachedUrl = await uploadFile({
                        file: values.billCopyAttached,
                        folderId: import.meta.env.VITE_BILL_COPY_FOLDER || import.meta.env.VITE_PRODUCT_PHOTO_FOLDER
                    });
                } catch (uploadError) {
                    console.error('❌ Upload error:', uploadError);
                    toast.error('Failed to upload bill copy');
                    return;
                }
            }

            const currentDateTime = new Date().toISOString();

            const filteredData = storeInSheet.filter(
                (s: StoreInSheetItem) => s.liftNumber === selectedItem?.liftNumber
            );

            if (filteredData.length === 0) {
                console.error('❌ No matching record found');
                toast.error('No matching record found');
                return;
            }

            const updateData = filteredData.map((prev: StoreInSheetItem) => {
                const updatedRow: any = {
                    rowIndex: prev.rowIndex || 0,
                    liftNumber: prev.liftNumber,
                    indentNo: prev.indentNo,
                    actual7: currentDateTime,
                    status: values.status,
                    billCopyAttached: billCopyAttachedUrl,
                    sendDebitNote: values.debitNote,
                    reason: values.reason,
                };

                // Set planned9 dynamically when debit note is marked as "Yes"
                if (values.debitNote === 'Yes') {
                    const plannedDate = new Date();
                    plannedDate.setDate(plannedDate.getDate() + 2); // 2 days standard
                    updatedRow.planned9 = plannedDate.toISOString().split('T')[0];
                }

                return updatedRow;
            });


            await postToSheet(updateData, 'update', 'STORE IN');

            toast.success(`Updated status for ${selectedItem?.liftNumber}`);
            setOpenDialog(false);
            setTimeout(() => updateAll(), 1000);
        } catch (error) {
            console.error('❌ Error in onSubmit:', error);

            if (error instanceof Error) {
                toast.error(`Failed to update: ${error.message}`);
            } else {
                toast.error('Failed to update status');
            }
        }
    }

    function onError(e: any) {
        console.log(e);
        toast.error('Please fill all required fields');
    }

    const status = form.watch('status');

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-red-50 p-4 md:p-6">
            <div className="mx-auto max-w-7xl">
                {/* Header Section */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-red-600 rounded-lg shadow">
                            <Truck size={28} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Reject For GRN</h1>
                            <p className="text-gray-600">Process and manage store item accept/reject for GRN</p>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <Card className="bg-white shadow border-0 hover:shadow-md transition-shadow">
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Pending Items</p>
                                        <p className="text-2xl font-bold text-amber-600 mt-1">{stats.pending}</p>
                                    </div>
                                    <AlertCircle className="h-10 w-10 text-amber-500" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-white shadow border-0 hover:shadow-md transition-shadow">
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Total Amount</p>
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
                                        <p className="text-sm font-medium text-gray-600">Accepted</p>
                                        <p className="text-2xl font-bold text-green-600 mt-1">{stats.accepted}</p>
                                    </div>
                                    <CheckCircle className="h-10 w-10 text-green-500" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-white shadow border-0 hover:shadow-md transition-shadow">
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Rejected</p>
                                        <p className="text-2xl font-bold text-red-600 mt-1">{stats.rejected}</p>
                                    </div>
                                    <XCircle className="h-10 w-10 text-red-500" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Main Content */}
                <Card className="bg-white shadow-lg border-0 overflow-hidden mb-6">
                    <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <div className="bg-gray-50/50 border-b">
                            <TabsList className="w-full max-w-md grid grid-cols-2 p-1 bg-gray-100/50 m-4 rounded-xl">
                                <TabsTrigger
                                    value="pending"
                                    className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-red-700 h-10 px-4 transition-all flex items-center justify-center gap-2"
                                >
                                    <AlertCircle size={16} className={activeTab === 'pending' ? 'text-red-500' : 'text-gray-400'} />
                                    <span>Pending Items</span>
                                    {stats.pending > 0 && (
                                        <span className="ml-1 bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                            {stats.pending}
                                        </span>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger
                                    value="history"
                                    className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-green-700 h-10 px-4 transition-all flex items-center justify-center gap-2"
                                >
                                    <FileText size={16} className={activeTab === 'history' ? 'text-green-500' : 'text-gray-400'} />
                                    <span>History</span>
                                    {stats.accepted + stats.rejected > 0 && (
                                        <span className="ml-1 bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                            {stats.accepted + stats.rejected}
                                        </span>
                                    )}
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <CardContent className="p-0">
                            <div className="p-6">
                                {/* PENDING TAB CONTENT */}
                                <TabsContent value="pending" className="m-0">
                                    {pendingData.length > 0 ? (
                                        <DataTable
                                            data={pendingData}
                                            columns={pendingColumns}
                                            searchFields={['liftNumber', 'indentNumber', 'productName', 'vendorName', 'firmNameMatch', 'billNo']}
                                            dataLoading={false}
                                            className="border rounded-lg"
                                        />
                                    ) : (
                                        <div className="text-center py-12">
                                            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Pending Items</h3>
                                            <p className="text-gray-500">All items have been processed for GRN.</p>
                                        </div>
                                    )}
                                </TabsContent>

                                {/* HISTORY TAB CONTENT */}
                                <TabsContent value="history" className="m-0">
                                    {historyData.length > 0 ? (
                                        <DataTable
                                            data={historyData}
                                            columns={historyColumns}
                                            searchFields={['liftNumber', 'indentNumber', 'productName', 'vendorName', 'status', 'firmNameMatch']}
                                            dataLoading={false}
                                            className="border rounded-lg"
                                        />
                                    ) : (
                                        <div className="text-center py-12">
                                            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                            <h3 className="text-lg font-semibold text-gray-700 mb-2">No History Available</h3>
                                            <p className="text-gray-500">No items have been processed for GRN yet.</p>
                                        </div>
                                    )}
                                </TabsContent>
                            </div>
                        </CardContent>
                    </Tabs>
                </Card>

                {/* Process Dialog */}
                <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                    {selectedItem && (
                        <DialogContent className="sm:max-w-2xl">
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-6">
                                    <DialogHeader>
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 bg-red-100 rounded-lg">
                                                <Truck className="h-6 w-6 text-red-600" />
                                            </div>
                                            <div>
                                                <DialogTitle className="text-xl">Process Store Item</DialogTitle>
                                                <DialogDescription>
                                                    Process item from Lift No: <span className="font-semibold text-red-600">{selectedItem.liftNumber}</span>
                                                </DialogDescription>
                                            </div>
                                        </div>
                                    </DialogHeader>

                                    <Separator />

                                    {/* Item Details Card */}
                                    <Card className="bg-red-50 border-red-200">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-base font-semibold text-red-800 flex items-center gap-2">
                                                <Package className="h-4 w-4" />
                                                Item Details
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <p className="text-xs font-medium text-gray-600">Lift Number</p>
                                                    <p className="text-sm font-semibold text-gray-800">{selectedItem.liftNumber}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-medium text-gray-600">Indent Number</p>
                                                    <p className="text-sm font-semibold text-gray-800">{selectedItem.indentNumber}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-medium text-gray-600">Product</p>
                                                    <p className="text-sm font-semibold text-gray-800">{selectedItem.productName}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-medium text-gray-600">Vendor</p>
                                                    <p className="text-sm font-semibold text-gray-800">{selectedItem.vendorName}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-medium text-gray-600">Quantity</p>
                                                    <p className="text-sm font-semibold text-gray-800">{selectedItem.qty}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-medium text-gray-600">Bill Amount</p>
                                                    <p className="text-sm font-semibold text-green-600">₹{selectedItem.billAmount?.toLocaleString('en-IN')}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Form Fields */}
                                    <div className="space-y-4">
                                        <FormField
                                            control={form.control}
                                            name="status"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-medium">GRN Status *</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="border-gray-300 focus:border-blue-500">
                                                                <SelectValue placeholder="Select GRN status" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="Accept" className="flex items-center gap-2">
                                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                                                Accept
                                                            </SelectItem>
                                                            <SelectItem value="Reject" className="flex items-center gap-2">
                                                                <XCircle className="h-4 w-4 text-red-600" />
                                                                Reject
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {status === 'Accept' && (
                                            <FormField
                                                control={form.control}
                                                name="billCopyAttached"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-medium flex items-center gap-2">
                                                            <Upload className="h-4 w-4" />
                                                            Bill Copy (PDF/Image)
                                                        </FormLabel>
                                                        <FormControl>
                                                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors">
                                                                <Input
                                                                    type="file"
                                                                    accept="image/*,.pdf"
                                                                    className="cursor-pointer border-0"
                                                                    onChange={(e) => field.onChange(e.target.files?.[0])}
                                                                />
                                                                <p className="text-xs text-gray-500 mt-2">
                                                                    Upload bill copy for accepted items (optional)
                                                                </p>
                                                            </div>
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                        )}

                                        {(status === 'Accept' || status === 'Reject') && (
                                            <FormField
                                                control={form.control}
                                                name="reason"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-medium">Reason *</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="Enter reason for accept/reject"
                                                                className="border-gray-300 focus:border-blue-500"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        )}

                                        {(status === 'Accept' || status === 'Reject') && (
                                            <FormField
                                                control={form.control}
                                                name="debitNote"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-medium">Send Debit Note</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger className="border-gray-300 focus:border-blue-500">
                                                                    <SelectValue placeholder="Select option" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="Yes">Yes</SelectItem>
                                                                <SelectItem value="No">No</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        )}
                                    </div>

                                    <Separator />

                                    <DialogFooter className="gap-2">
                                        <DialogClose asChild>
                                            <Button variant="outline" className="border-gray-300">
                                                Cancel
                                            </Button>
                                        </DialogClose>
                                        <Button
                                            type="submit"
                                            className={`${status === 'Reject' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} shadow-sm`}
                                            disabled={form.formState.isSubmitting}
                                        >
                                            {form.formState.isSubmitting ? (
                                                <>
                                                    <Loader size={18} className="mr-2" />
                                                    Processing...
                                                </>
                                            ) : (
                                                <>
                                                    {status === 'Reject' ? (
                                                        <XCircle className="mr-2 h-4 w-4" />
                                                    ) : (
                                                        <CheckCircle className="mr-2 h-4 w-4" />
                                                    )}
                                                    Update Status
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
};