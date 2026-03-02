import { useSheets } from '@/context/SheetsContext';
import type { ColumnDef, Row } from '@tanstack/react-table';
import { useEffect, useState } from 'react';
import DataTable from '../element/DataTable';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel } from '../ui/form';
import { PuffLoader as Loader } from 'react-spinners';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { postToSheet, uploadFile } from '@/lib/fetchers';
import type { ReceivedSheet } from '@/types';
import { Truck, Package, CheckCircle, Clock } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useAuth } from '@/context/AuthContext';
import { formatDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import Heading from '../element/Heading';
import { Badge } from '../ui/badge';

interface StoreInPendingData {
    rowIndex?: number;
    liftNumber: string;
    indentNo: string;
    billNo: string;
    vendorName: string;
    productName: string;
    typeOfBill: string;
    billAmount: number;
    paymentType: string;
    advanceAmountIfAny: number;
    photoOfBill: string;
    transportationInclude: string;
    transporterName: string;
    amount: number;
    poDate: string;
    poNumber: string;
    vendor: string;
    indentNumber: string;
    product: string;
    uom: string;
    qty: number;
    poCopy: string;
    billStatus: string;
    leadTimeToLiftMaterial: number;
    discountAmount: number;
    firmNameMatch: string;
    productAsPerPack?: string;
}

interface StoreInHistoryData {
    liftNumber: string;
    indentNo: string;
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
    billStatus: string;
    photoOfProduct: string;
    unitOfMeasurement: string;
    damageOrder: string;
    quantityAsPerBill: string;
    priceAsPerPo: number;
    remark: string;
    poDate: string;
    poNumber: string;
    receiveStatus: string;
    vendor: string;
    product: string;
    orderQuantity: number;
    receivedDate: string;
    warrantyStatus: string;
    warrantyEndDate: string;
    billNumber: string;
    anyTransport: string;
    transportingAmount: number;
    timestamp: string;
    leadTimeToLiftMaterial: number;
    discountAmount: number;
    billReceived: string;
    billImage: string;
    firmNameMatch: string;
    productAsPerPack?: string;
}

type RecieveItemsData = StoreInPendingData;
type HistoryData = StoreInHistoryData;

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
    planned6?: string;
    actual6?: string;
    status?: string;
    billCopyAttached?: string;
    debitNote?: string;
    reason?: string;
    damageOrder?: string;
    quantityAsPerBill?: string;
    priceAsPerPo?: number;
    remark?: string;
    firmNameMatch?: string;
    productAsPerPack?: string;
    rowIndex?: number;
    poDate?: string;
    poNumber?: string;
    vendor?: string;
    indentNumber?: string;
    product?: string;
    uom?: string;
    poCopy?: string;
    billStatus?: string;
    leadTimeToLiftMaterial?: number;
    discountAmount?: number;
    receivedQuantity?: number;
    photoOfProduct?: string;
    unitOfMeasurement?: string;
    timestamp?: string;
    billNumber?: string;
    anyTransport?: string;
    transportingAmount?: number;
    receivingStatus?: string;
}

export default () => {
    const { storeInSheet, indentSheet, updateAll } = useSheets();
    const { user } = useAuth();

    const [tableData, setTableData] = useState<StoreInPendingData[]>([]);
    const [historyData, setHistoryData] = useState<StoreInHistoryData[]>([]);
    const [selectedIndent, setSelectedIndent] = useState<StoreInPendingData | null>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [activeTab, setActiveTab] = useState('pending');

    const [indentLoading, setIndentLoading] = useState(false);
    const [receivedLoading, setReceivedLoading] = useState(false);

    // Stats for UI enhancement
    const [stats, setStats] = useState({
        pending: 0,
        completed: 0,
        total: 0
    });

    // Fetching table data
    useEffect(() => {
        const filteredByFirm = storeInSheet.filter((item: StoreInSheetItem) =>
            user.firmNameMatch.toLowerCase() === "all" || item.firmNameMatch === user.firmNameMatch
        );

        const pendingItems = filteredByFirm.filter((i: StoreInSheetItem) => i.planned6 && i.planned6 !== '' && !i.actual6);
        const completedItems = filteredByFirm.filter((i: StoreInSheetItem) => i.actual6 && i.actual6 !== '');

        setTableData(
            pendingItems.map((i: StoreInSheetItem) => ({
                rowIndex: i.rowIndex,
                liftNumber: i.liftNumber || '',
                indentNo: i.indentNo || '',
                billNo: String(i.billNo) || '',
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
                poDate: i.poDate || '',
                poNumber: i.poNumber || '',
                vendor: i.vendor || '',
                indentNumber: i.indentNumber || '',
                product: i.product || '',
                uom: i.uom || '',
                poCopy: i.poCopy || '',
                billStatus: i.billStatus || '',
                leadTimeToLiftMaterial: i.leadTimeToLiftMaterial || 0,
                discountAmount: i.discountAmount || 0,
                firmNameMatch: i.firmNameMatch || '',
                productAsPerPack: i.productAsPerPack || '',
            }))
        );

        setStats({
            pending: pendingItems.length,
            completed: completedItems.length,
            total: filteredByFirm.length
        });
    }, [storeInSheet, user.firmNameMatch]);

    useEffect(() => {
        const filteredByFirm = storeInSheet.filter((item: StoreInSheetItem) =>
            user.firmNameMatch.toLowerCase() === "all" || item.firmNameMatch === user.firmNameMatch
        );

        setHistoryData(
            filteredByFirm
                .filter((i: StoreInSheetItem) => i.actual6 && i.actual6 !== '')
                .map((i: StoreInSheetItem) => ({
                    rowIndex: i.rowIndex,
                    liftNumber: i.liftNumber || '',
                    indentNo: i.indentNo || '',
                    billNo: String(i.billNo) || '',
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
                    billStatus: i.billStatus || '',
                    receivedQuantity: i.receivedQuantity || 0,
                    photoOfProduct: i.photoOfProduct || '',
                    unitOfMeasurement: i.unitOfMeasurement || '',
                    damageOrder: i.damageOrder || 'No',
                    quantityAsPerBill: i.quantityAsPerBill || 'No',
                    priceAsPerPo: i.priceAsPerPo || 0,
                    remark: i.remark || '',
                    poDate: i.poDate || '',
                    poNumber: i.poNumber || '',
                    receiveStatus: i.receivingStatus || '',
                    vendor: i.vendorName || '',
                    product: i.productName || '',
                    orderQuantity: i.qty || 0,
                    receivedDate: i.timestamp || '',
                    warrantyStatus: '',
                    warrantyEndDate: '',
                    billNumber: i.billNumber || '',
                    anyTransport: i.transportationInclude || '',
                    transportingAmount: i.amount || 0,
                    timestamp: i.timestamp || '',
                    leadTimeToLiftMaterial: i.leadTimeToLiftMaterial || 0,
                    discountAmount: i.discountAmount || 0,
                    billReceived: i.billStatus || '',
                    billImage: i.photoOfBill || '',
                    firmNameMatch: i.firmNameMatch || '',
                    productAsPerPack: i.productAsPerPack || '',
                }))
        );
    }, [storeInSheet, user.firmNameMatch]);

    const columns: ColumnDef<RecieveItemsData>[] = [
        ...(user.receiveItemView
            ? [
                {
                    header: 'Action',
                    cell: ({ row }: { row: Row<RecieveItemsData> }) => {
                        const indent = row.original;
                        return (
                            <Button
                                variant="default"
                                size="sm"
                                onClick={() => {
                                    setSelectedIndent(indent);
                                    setOpenDialog(true); // Open dialog directly
                                }}
                                className="bg-blue-600 hover:bg-blue-700 shadow-sm"
                            >
                                <Package className="mr-2 h-4 w-4" />
                                Store In
                            </Button>
                        );
                    },
                },
            ]
            : []),
        { accessorKey: 'liftNumber', header: 'Lift Number' },
        { accessorKey: 'indentNo', header: 'Indent No.' },
        { accessorKey: 'poNumber', header: 'PO Number' },
        { accessorKey: 'vendorName', header: 'Vendor Name' },
        { accessorKey: 'productName', header: 'Product Name' },
        { accessorKey: 'firmNameMatch', header: 'Firm Name' },
        {
            accessorKey: 'billStatus',
            header: 'Bill Status',
            cell: ({ row }: { row: Row<StoreInPendingData> }) => {
                const status = row.original.billStatus;
                if (!status || status === 'Pending') {
                    return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pending</Badge>;
                }
                return (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        {status}
                    </Badge>
                );
            }
        },
        { accessorKey: 'billNo', header: 'Bill No.' },
        {
            accessorKey: 'qty',
            header: 'Qty',
            cell: ({ row }) => (
                <span className="font-semibold text-gray-800">{row.original.qty}</span>
            )
        },
        { accessorKey: 'leadTimeToLiftMaterial', header: 'Lead Time' },
        { accessorKey: 'typeOfBill', header: 'Type Of Bill' },
        {
            accessorKey: 'billAmount',
            header: 'Bill Amount',
            cell: ({ row }) => (
                <span className="font-semibold text-gray-800">₹{row.original.billAmount?.toFixed(2)}</span>
            )
        },
        {
            accessorKey: 'discountAmount',
            header: 'Discount',
            cell: ({ row }) => (
                <span className="font-medium text-green-600">₹{row.original.discountAmount?.toFixed(2)}</span>
            )
        },
        { accessorKey: 'paymentType', header: 'Payment Type' },
        { accessorKey: 'advanceAmountIfAny', header: 'Advance' },
        {
            accessorKey: 'photoOfBill',
            header: 'Bill Photo',
            cell: ({ row }) => {
                const photo = row.original.photoOfBill;
                return photo ? (
                    <a
                        href={photo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                    >
                        View
                    </a>
                ) : (
                    <span className="text-gray-400">-</span>
                );
            },
        },
        { accessorKey: 'transportationInclude', header: 'Transport' },
        { accessorKey: 'transporterName', header: 'Transporter' },
        {
            accessorKey: 'amount',
            header: 'Amount',
            cell: ({ row }) => (
                <span className="font-semibold text-gray-800">₹{row.original.amount?.toFixed(2)}</span>
            )
        },
    ];

    const historyColumns: ColumnDef<HistoryData>[] = [
        ...(user.receiveItemView
            ? [
                {
                    header: 'Action',
                    cell: ({ row }: { row: Row<HistoryData> }) => {
                        const item = row.original;
                        return (
                            <div className="flex justify-center">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        // Map history row back to pending shape so dialog works
                                        setSelectedIndent({
                                            rowIndex: (item as any).rowIndex,
                                            liftNumber: item.liftNumber,
                                            indentNo: item.indentNo,
                                            billNo: item.billNo,
                                            vendorName: item.vendorName,
                                            productName: item.productName,
                                            typeOfBill: item.typeOfBill,
                                            billAmount: item.billAmount,
                                            paymentType: item.paymentType,
                                            advanceAmountIfAny: item.advanceAmountIfAny,
                                            photoOfBill: item.photoOfBill,
                                            transportationInclude: item.transportationInclude,
                                            transporterName: item.transporterName,
                                            amount: item.amount,
                                            poDate: item.poDate,
                                            poNumber: item.poNumber,
                                            vendor: item.vendor,
                                            indentNumber: item.indentNo,
                                            product: item.product,
                                            uom: item.unitOfMeasurement || '',
                                            qty: item.qty,
                                            poCopy: '',
                                            billStatus: item.billStatus,
                                            leadTimeToLiftMaterial: item.leadTimeToLiftMaterial,
                                            discountAmount: item.discountAmount,
                                            firmNameMatch: item.firmNameMatch,
                                        });
                                        setOpenDialog(true);
                                    }}
                                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 font-semibold rounded-lg shadow-md"
                                >
                                    Edit
                                </Button>
                            </div>
                        );
                    },
                },
            ]
            : []),
        {
            accessorKey: 'timestamp',
            header: 'Timestamp',
            cell: ({ row }: { row: Row<HistoryData> }) => (
                <div className="text-gray-500">
                    {formatDateTime(row.original.timestamp)}
                </div>
            )
        },
        { accessorKey: 'liftNumber', header: 'Lift Number' },
        { accessorKey: 'indentNo', header: 'Indent No.' },
        { accessorKey: 'poNumber', header: 'PO Number' },
        { accessorKey: 'firmNameMatch', header: 'Firm Name' },
        { accessorKey: 'vendorName', header: 'Vendor Name' },
        { accessorKey: 'productName', header: 'Product Name' },
        {
            accessorKey: 'billStatus',
            header: 'Bill Status',
            cell: ({ row }: { row: Row<HistoryData> }) => {
                const status = row.original.billStatus;
                return (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <CheckCircle className="inline mr-1 h-3 w-3" />
                        {status || 'Completed'}
                    </Badge>
                );
            }
        },
        { accessorKey: 'billNo', header: 'Bill No.' },
        { accessorKey: 'qty', header: 'Qty' },
        { accessorKey: 'productAsPerPack', header: 'As Per Pack' },
        { accessorKey: 'leadTimeToLiftMaterial', header: 'Lead Time' },
        { accessorKey: 'typeOfBill', header: 'Type Of Bill' },
        { accessorKey: 'billAmount', header: 'Bill Amount' },
        { accessorKey: 'discountAmount', header: 'Discount' },
        { accessorKey: 'paymentType', header: 'Payment Type' },
        { accessorKey: 'advanceAmountIfAny', header: 'Advance' },
        {
            accessorKey: 'photoOfBill',
            header: 'Bill Photo',
            cell: ({ row }) => {
                const photo = row.original.photoOfBill;
                return photo ? (
                    <a
                        href={photo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                    >
                        View
                    </a>
                ) : (
                    <span className="text-gray-400">-</span>
                );
            },
        },
        { accessorKey: 'transportationInclude', header: 'Transport' },
        { accessorKey: 'transporterName', header: 'Transporter' },
        { accessorKey: 'amount', header: 'Amount' },
        {
            accessorKey: 'receiveStatus',
            header: 'Status',
            cell: ({ row }) => (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {row.original.receiveStatus || 'Received'}
                </span>
            )
        },
        { accessorKey: 'receivedQuantity', header: 'Received Qty' },
        {
            accessorKey: 'photoOfProduct',
            header: 'Product Photo',
            cell: ({ row }) => {
                const photo = row.original.photoOfProduct;
                return photo ? (
                    <a
                        href={photo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                    >
                        View
                    </a>
                ) : (
                    <span className="text-gray-400">-</span>
                );
            },
        },
        { accessorKey: 'warrantyStatus', header: 'Warranty' },
        { accessorKey: 'warrantyEndDate', header: 'Warranty End' },
        { accessorKey: 'billReceived', header: 'Bill Received' },
        { accessorKey: 'billNumber', header: 'Bill Number' },
        { accessorKey: 'billAmount', header: 'Bill Amount' },
        {
            accessorKey: 'billImage',
            header: 'Bill Image',
            cell: ({ row }) => {
                const photo = row.original.photoOfBill;
                return photo ? (
                    <a
                        href={photo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                    >
                        View
                    </a>
                ) : (
                    <span className="text-gray-400">-</span>
                );
            },
        },
        {
            accessorKey: 'damageOrder',
            header: 'Damage',
            cell: ({ row }) => {
                const isDamaged = row.original.damageOrder === 'Yes';
                return (
                    <Badge variant={isDamaged ? "destructive" : "outline"} className={isDamaged ? "" : "bg-gray-100"}>
                        {row.original.damageOrder || 'No'}
                    </Badge>
                );
            }
        },
        {
            accessorKey: 'quantityAsPerBill',
            header: 'Qty As Per Bill',
            cell: ({ row }) => {
                const isCorrect = row.original.quantityAsPerBill === 'Yes';
                return (
                    <Badge variant={isCorrect ? "default" : "outline"} className={isCorrect ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                        {row.original.quantityAsPerBill || 'No'}
                    </Badge>
                );
            }
        },
        { accessorKey: 'priceAsPerPo', header: 'Price' },
        { accessorKey: 'remark', header: 'Remark' },
    ];

    const schema = z.object({
        status: z.enum(['Received']),
        qty: z.coerce.number().min(1, 'Quantity is required'),
        photoOfProduct: z.instanceof(File).optional(),
        damageOrder: z.enum(['Yes', 'No']),
        quantityAsPerBill: z.enum(['Yes', 'No']),
        productAsPerPack: z.enum(['Yes', 'No']),
        remark: z.string().optional(),
    });

    type FormValues = z.infer<typeof schema>;

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            status: 'Received',
            qty: 0,
            photoOfProduct: undefined,
            damageOrder: undefined,
            quantityAsPerBill: undefined,
            productAsPerPack: undefined,
            remark: '',
        },
    });

    const status = form.watch('status');

    useEffect(() => {
        if (!openDialog) {
            form.reset({
                status: 'Received',
                qty: 0,
                photoOfProduct: undefined,
                damageOrder: undefined,
                quantityAsPerBill: undefined,
                productAsPerPack: undefined,
                remark: '',
            });
        }
    }, [openDialog, form]);

    async function onSubmit(values: FormValues) {
        try {
            let photoUrl = '';

            if (values.photoOfProduct) {
                photoUrl = await uploadFile({
                    file: values.photoOfProduct,
                    folderId: import.meta.env.VITE_PRODUCT_PHOTO_FOLDER
                });
            }

            const currentDateTime = new Date().toISOString();

            const filteredData = storeInSheet.filter(
                (s: StoreInSheetItem) => s.rowIndex === selectedIndent?.rowIndex
            );

            if (filteredData.length === 0) {
                console.error('❌ No matching record found');
                toast.error('No matching record found in sheet');
                return;
            }

            await postToSheet(
                filteredData.map((prev: StoreInSheetItem) => ({
                    rowIndex: prev.rowIndex || 0,
                    liftNumber: prev.liftNumber,
                    indentNo: prev.indentNo,
                    firmNameMatch: prev.firmNameMatch,
                    actual6: currentDateTime,
                    receivingStatus: values.status,
                    receivedQuantity: values.qty,
                    photoOfProduct: photoUrl,
                    damageOrder: values.damageOrder,
                    quantityAsPerBill: values.quantityAsPerBill,
                    productAsPerPack: values.productAsPerPack,
                    remark: values.remark,
                })),
                'update',
                'STORE IN'
            );

            toast.success(`Items stored in successfully`);
            setOpenDialog(false);
            setTimeout(() => updateAll(), 1000);
        } catch (error) {
            console.error('Error in onSubmit:', error);
            toast.error('Failed to store items');
        }
    }

    function onError(e: any) {
        console.log(e);
        toast.error('Please fill all required fields');
    }

    const formatDateTime = (isoString?: string) => {
        if (!isoString) return '-';
        const date = new Date(isoString);
        return date.toLocaleString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    // Replace the current return statement with this one:

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-6">
            <div className="mx-auto max-w-7xl">
                <Tabs defaultValue="pending" className="w-full" onValueChange={setActiveTab}>
                    {/* Header Section */}
                    <div className="mb-6">
                        <Heading
                            heading="Store In"
                            subtext="Receive and manage incoming items from purchase orders"
                        >
                            <Truck size={50} className="text-primary" />
                        </Heading>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                            <Card className="bg-white shadow border-0 hover:shadow-md transition-shadow">
                                <CardContent className="p-5">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600">Total Items</p>
                                            <p className="text-2xl font-bold text-gray-800 mt-1">{stats.total}</p>
                                        </div>
                                        <Package className="h-10 w-10 text-blue-500" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-white shadow border-0 hover:shadow-md transition-shadow">
                                <CardContent className="p-5">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600">Pending</p>
                                            <p className="text-2xl font-bold text-amber-600 mt-1">{stats.pending}</p>
                                        </div>
                                        <Clock className="h-10 w-10 text-amber-500" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-white shadow border-0 hover:shadow-md transition-shadow">
                                <CardContent className="p-5">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-600">Completed</p>
                                            <p className="text-2xl font-bold text-green-600 mt-1">{stats.completed}</p>
                                        </div>
                                        <CheckCircle className="h-10 w-10 text-green-500" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Main Content */}
                    <Card className="bg-white shadow-lg border-0 overflow-hidden">
                        <div className="bg-gray-50/50 border-b">
                            <TabsList className="w-full max-w-md grid grid-cols-2 p-1 bg-gray-100/50 m-4 rounded-xl">
                                <TabsTrigger
                                    value="pending"
                                    className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-700 h-10 px-4 transition-all"
                                >
                                    <Clock className="mr-2 h-4 w-4" />
                                    Pending Items
                                    {stats.pending > 0 && (
                                        <span className="ml-2 bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                            {stats.pending}
                                        </span>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger
                                    value="history"
                                    className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-green-700 h-10 px-4 transition-all"
                                >
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    History
                                    {stats.completed > 0 && (
                                        <span className="ml-2 bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                            {stats.completed}
                                        </span>
                                    )}
                                </TabsTrigger>
                            </TabsList>
                        </div>
                        <CardContent className="p-0">

                            <div className="p-6">
                                {/* PENDING TAB CONTENT */}
                                <TabsContent value="pending" className="m-0">
                                    {tableData.length > 0 ? (
                                        <DataTable
                                            data={tableData}
                                            columns={columns}
                                            searchFields={['productName', 'billNo', 'indentNo', 'vendorName', 'poNumber']}
                                            dataLoading={indentLoading}
                                            className="border rounded-lg"
                                        />
                                    ) : (
                                        <div className="text-center py-12">
                                            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Pending Items</h3>
                                            <p className="text-gray-500">All items have been stored in successfully.</p>
                                        </div>
                                    )}
                                </TabsContent>

                                {/* HISTORY TAB CONTENT */}
                                <TabsContent value="history" className="m-0">
                                    {historyData.length > 0 ? (
                                        <DataTable
                                            data={historyData}
                                            columns={historyColumns}
                                            searchFields={['productName', 'billNo', 'indentNo', 'vendorName']}
                                            dataLoading={receivedLoading}
                                            className="border rounded-lg"
                                        />
                                    ) : (
                                        <div className="text-center py-12">
                                            <CheckCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                            <h3 className="text-lg font-semibold text-gray-700 mb-2">No History Available</h3>
                                            <p className="text-gray-500">No items have been stored in yet.</p>
                                        </div>
                                    )}
                                </TabsContent>
                            </div>
                        </CardContent>
                    </Card>
                </Tabs>

                {/* Store In Dialog - MOVE THIS INSIDE THE MAIN RETURN BUT OUTSIDE OF TABS */}
                <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                    {selectedIndent && (
                        <DialogContent className="sm:max-w-2xl">
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-6">
                                    <DialogHeader>
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 bg-blue-100 rounded-lg">
                                                <Package className="h-6 w-6 text-blue-600" />
                                            </div>
                                            <div>
                                                <DialogTitle className="text-xl">Store Items</DialogTitle>
                                                <DialogDescription>
                                                    Store items from Indent: <span className="font-semibold text-blue-600">{selectedIndent.indentNo}</span>
                                                </DialogDescription>
                                            </div>
                                        </div>
                                    </DialogHeader>

                                    <Separator />

                                    {/* Item Details Card */}
                                    <Card className="bg-blue-50 border-blue-200">
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-base font-semibold text-blue-800 flex items-center gap-2">
                                                <Package className="h-4 w-4" />
                                                Item Details
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <p className="text-xs font-medium text-gray-600">Indent Number</p>
                                                    <p className="text-sm font-semibold text-gray-800">{selectedIndent.indentNo}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-medium text-gray-600">Product</p>
                                                    <p className="text-sm font-semibold text-gray-800">{selectedIndent.productName}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-medium text-gray-600">Quantity</p>
                                                    <p className="text-sm font-semibold text-gray-800">{selectedIndent.qty} {selectedIndent.uom}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-medium text-gray-600">Vendor</p>
                                                    <p className="text-sm font-semibold text-gray-800">{selectedIndent.vendorName}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Form Fields */}
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="status"
                                                render={() => (  // ✅ Remove { field } parameter
                                                    <FormItem>
                                                        <FormLabel className="font-medium">Status</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                value="Received"
                                                                readOnly
                                                                className="bg-gray-50 font-medium"
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="qty"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-medium">Received Quantity *</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                placeholder="Enter quantity"
                                                                className="border-gray-300 focus:border-blue-500"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <FormField
                                            control={form.control}
                                            name="photoOfProduct"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-medium">Product Photo</FormLabel>
                                                    <FormControl>
                                                        <div className="border border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors">
                                                            <Input
                                                                type="file"
                                                                accept="image/*"
                                                                className="cursor-pointer"
                                                                onChange={(e) => field.onChange(e.target.files?.[0])}
                                                            />
                                                            <p className="text-xs text-gray-500 mt-2">Upload product image (optional)</p>
                                                        </div>
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />

                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="damageOrder"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-medium">Damage Status</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <SelectTrigger className="border-gray-300 focus:border-blue-500">
                                                                <SelectValue placeholder="Select status" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="Yes">Yes</SelectItem>
                                                                <SelectItem value="No">No</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="quantityAsPerBill"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-medium">Quantity as per Bill</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <SelectTrigger className="border-gray-300 focus:border-blue-500">
                                                                <SelectValue placeholder="Select status" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="Yes">Yes</SelectItem>
                                                                <SelectItem value="No">No</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="productAsPerPack"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-medium">Product as per Pack</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <SelectTrigger className="border-gray-300 focus:border-blue-500">
                                                                <SelectValue placeholder="Select status" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="Yes">Yes</SelectItem>
                                                                <SelectItem value="No">No</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="remark"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-medium">Remarks</FormLabel>
                                                        <FormControl>
                                                            <Textarea
                                                                placeholder="Enter any remarks"
                                                                className="min-h-[80px] border-gray-300 focus:border-blue-500"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>

                                    <Separator />

                                    <DialogFooter>
                                        <DialogClose asChild>
                                            <Button variant="outline" className="border-gray-300">
                                                Cancel
                                            </Button>
                                        </DialogClose>
                                        <Button
                                            type="submit"
                                            className="bg-blue-600 hover:bg-blue-700 shadow-sm"
                                            disabled={form.formState.isSubmitting}
                                        >
                                            {form.formState.isSubmitting && (
                                                <Loader size={18} className="mr-2" />
                                            )}
                                            Confirm Store In
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