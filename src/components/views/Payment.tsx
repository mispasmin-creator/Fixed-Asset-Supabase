import { useSheets } from '@/context/SheetsContext';
import type { ColumnDef, Row } from '@tanstack/react-table';
import { useEffect, useState, useCallback } from 'react';
import DataTable from '../element/DataTable';
import { useAuth } from '@/context/AuthContext';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { CreditCard, ExternalLink, Truck, DollarSign, FileText, Package, MapPin, Receipt, Car, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { postToSheet } from '@/lib/fetchers';
import { Loader2, Check, Clock, CheckCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface FreightPaymentData {
    rowIndex?: number;
    indentNumber: string;
    vendorName: string;
    vehicleNumber: string;
    from: string;
    to: string;
    materialLoadDetails: string;
    biltyNumber: number;
    rateType: string;
    amount1: number;
    biltyImage: string;
    firmNameMatch: string;
    paymentForm: string;  // Contains the Google Form link
    fFPPaymentNumber: string;
    transportingInclude: string;
    actual1?: string;
    timestamp: string;
    planned1: string;
}

export default function FreightPayment() {
    const { fullkittingSheet, fullkittingLoading, updateAll } = useSheets();

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

    const [tableData, setTableData] = useState<FreightPaymentData[]>([]);
    const [historyData, setHistoryData] = useState<FreightPaymentData[]>([]);
    const [activeTab, setActiveTab] = useState('pending');
    const { user } = useAuth();
    const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
    const [submitting, setSubmitting] = useState(false);

    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        completed: 0
    });

    // Function to validate and clean Google Form URLs
    const getValidGoogleFormLink = useCallback((link: string): string => {
        if (!link || link.trim() === '') return '';

        const trimmedLink = link.trim();

        // Check if it's a valid Google Form URL
        const isGoogleForm = trimmedLink.includes('docs.google.com/forms') ||
            trimmedLink.includes('forms.gle');

        // If it's already a Google Form link, return it as is
        if (isGoogleForm) {
            return trimmedLink.startsWith('http') ? trimmedLink : `https://${trimmedLink}`;
        }

        // If it's not a Google Form, show error
        console.warn('Invalid Google Form link:', trimmedLink);
        return '';
    }, []);

    // Function to handle payment button click
    const handleMakePayment = useCallback((item: FreightPaymentData) => {
        const googleFormLink = getValidGoogleFormLink(item.paymentForm);

        if (!googleFormLink) {
            toast.error('No valid Google Form link available for this item');
            return;
        }

        // Open Google Form in a new tab with security attributes
        const newWindow = window.open(
            googleFormLink,
            '_blank',
            'noopener,noreferrer,width=800,height=600'
        );

        if (newWindow) {
            newWindow.opener = null;
            toast.info(`Opening payment form for ${item.indentNumber}...`);
        } else {
            toast.error('Please allow popups to open the payment form');
        }
    }, [getValidGoogleFormLink]);

    const handleSelectRow = useCallback((rowIndex: number) => {
        const newSelectedRows = new Set(selectedRows);
        if (newSelectedRows.has(rowIndex)) {
            newSelectedRows.delete(rowIndex);
        } else {
            newSelectedRows.add(rowIndex);
        }
        setSelectedRows(newSelectedRows);
    }, [selectedRows]);

    const handleSelectAll = useCallback(() => {
        if (selectedRows.size === tableData.length) {
            setSelectedRows(new Set());
        } else {
            setSelectedRows(new Set(tableData.map(item => item.rowIndex!).filter(Boolean)));
        }
    }, [selectedRows, tableData]);

    const handleSubmitCompleted = async () => {
        if (selectedRows.size === 0) {
            toast.error('Please select at least one item');
            return;
        }

        setSubmitting(true);
        try {
            const currentDateTime = new Date().toISOString();
            const updates = Array.from(selectedRows).map(id => ({
                rowIndex: id,
                actual1: currentDateTime
            }));

            await postToSheet(updates, 'update', 'Fullkitting');
            toast.success(`Successfully updated ${selectedRows.size} items`);
            setSelectedRows(new Set());
            updateAll();
        } catch (error) {
            console.error('Error updating items:', error);
            toast.error('Failed to update items');
        } finally {
            setSubmitting(false);
        }
    };

    useEffect(() => {
        // Filter items where Planned1 is not empty and Actual1 is empty
        const filteredByFirm = fullkittingSheet.filter(item =>
            user.firmNameMatch.toLowerCase() === "all" || item.firmNameMatch === user.firmNameMatch
        );

        const pendingItems = filteredByFirm.filter(item => {
            const planned1 = (item.planned1 || '').toString().trim();
            const actual1 = (item.actual1 || '').toString().trim();
            const hasPlanned = planned1 !== '' && planned1 !== 'N/A' && planned1 !== 'null' && planned1 !== 'undefined';
            const hasActual = actual1 !== '' && actual1 !== 'N/A' && actual1 !== 'null' && actual1 !== 'undefined';

            return item.transportingInclude === 'Yes' && hasPlanned && !hasActual;
        });

        const completedItems = filteredByFirm.filter(item => {
            const actual1 = (item.actual1 || '').toString().trim();
            const hasActual = actual1 !== '' && actual1 !== 'N/A' && actual1 !== 'null' && actual1 !== 'undefined';

            return item.transportingInclude === 'Yes' && hasActual;
        });

        // Process data and validate links
        const processedData = pendingItems.map((item) => {
            const paymentFormLink = getValidGoogleFormLink(item.paymentForm || '');

            return {
                rowIndex: item.rowIndex,
                indentNumber: item.indentNumber || '',
                vendorName: item.vendorName || '',
                vehicleNumber: item.vehicleNumber || item.vehicleNo || '',
                from: item.from || '',
                to: item.to || '',
                materialLoadDetails: item.materialLoadDetails || '',
                biltyNumber: item.biltyNumber || 0,
                rateType: item.rateType || '',
                amount1: item.amount1 || 0,
                biltyImage: item.biltyImage || '',
                firmNameMatch: item.firmNameMatch || '',
                paymentForm: paymentFormLink, // Store validated link
                fFPPaymentNumber: item.fFPPaymentNumber || '',
                transportingInclude: item.transportingInclude || '',
                timestamp: item.timestamp || '',
                planned1: item.planned1 || '',
            };
        });

        setTableData(processedData);

        const processedHistoryData = completedItems.map((item) => {
            const paymentFormLink = getValidGoogleFormLink(item.paymentForm || '');

            return {
                rowIndex: item.rowIndex,
                indentNumber: item.indentNumber || '',
                vendorName: item.vendorName || '',
                vehicleNumber: item.vehicleNumber || item.vehicleNo || '',
                from: item.from || '',
                to: item.to || '',
                materialLoadDetails: item.materialLoadDetails || '',
                biltyNumber: item.biltyNumber || 0,
                rateType: item.rateType || '',
                amount1: item.amount1 || 0,
                biltyImage: item.biltyImage || '',
                firmNameMatch: item.firmNameMatch || '',
                paymentForm: paymentFormLink,
                fFPPaymentNumber: item.fFPPaymentNumber || '',
                transportingInclude: item.transportingInclude || '',
                actual1: item.actual1,
                timestamp: item.timestamp || '',
                planned1: item.planned1 || '',
            };
        });

        setHistoryData(processedHistoryData);

        setStats({
            total: filteredByFirm.filter(item => item.transportingInclude === 'Yes').length,
            pending: pendingItems.length,
            completed: completedItems.length
        });
    }, [fullkittingSheet, user.firmNameMatch, getValidGoogleFormLink]);

    const columns: ColumnDef<FreightPaymentData>[] = [
        {
            id: 'select',
            header: () => (
                <Checkbox
                    checked={selectedRows.size === tableData.length && tableData.length > 0}
                    onCheckedChange={() => handleSelectAll()}
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={selectedRows.has(row.original.rowIndex!)}
                    onCheckedChange={() => handleSelectRow(row.original.rowIndex!)}
                />
            ),
        },
        {
            header: 'Action',
            cell: ({ row }: { row: Row<FreightPaymentData> }) => {
                const item = row.original;
                const hasValidLink = item.paymentForm && item.paymentForm !== '';

                return (
                    <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleMakePayment(item)}
                        disabled={!hasValidLink}
                        className={`${hasValidLink ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'} shadow-sm`}
                    >
                        <ExternalLink className="mr-2 h-3 w-3" />
                        {hasValidLink ? 'Make Payment' : 'No Form'}
                    </Button>
                );
            },
        },
        {
            accessorKey: 'timestamp',
            header: () => (
                <div className="flex items-center justify-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Timestamp</span>
                </div>
            ),
            cell: ({ row }) => (
                <span className="text-sm text-gray-600">{formatDateTime(row.original.timestamp)}</span>
            )
        },
        {
            accessorKey: 'planned1',
            header: () => (
                <div className="flex items-center justify-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Planned Date</span>
                </div>
            ),
            cell: ({ row }) => (
                <span className="text-sm">{formatDateTiny(row.original.planned1)}</span>
            )
        },
        {
            accessorKey: 'indentNumber',
            header: 'Indent No.',
            cell: ({ row }) => (
                <span className="font-medium text-blue-700">{row.original.indentNumber}</span>
            )
        },
        {
            accessorKey: 'firmNameMatch',
            header: 'Firm',
            cell: ({ row }) => (
                <Badge variant="outline" className="bg-gray-50">
                    {row.original.firmNameMatch}
                </Badge>
            )
        },
        {
            accessorKey: 'vendorName',
            header: 'Vendor Name',
            cell: ({ row }) => (
                <span className="font-medium">{row.original.vendorName}</span>
            )
        },
        {
            accessorKey: 'vehicleNumber',
            header: 'Vehicle No.',
            cell: ({ row }) => (
                <div className="flex items-center gap-1">
                    <Car className="h-3 w-3 text-gray-500" />
                    <span className="font-medium text-gray-800">{row.original.vehicleNumber}</span>
                </div>
            )
        },
        {
            accessorKey: 'from',
            header: 'From',
            cell: ({ row }) => (
                <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-gray-500" />
                    <span className="text-gray-700">{row.original.from}</span>
                </div>
            )
        },
        {
            accessorKey: 'to',
            header: 'To',
            cell: ({ row }) => (
                <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-gray-500" />
                    <span className="text-gray-700">{row.original.to}</span>
                </div>
            )
        },
        {
            accessorKey: 'materialLoadDetails',
            header: 'Material Details',
            cell: ({ row }) => (
                <div className="max-w-[150px] truncate" title={row.original.materialLoadDetails}>
                    <Package className="inline h-3 w-3 mr-1 text-gray-500" />
                    {row.original.materialLoadDetails || '-'}
                </div>
            )
        },
        {
            accessorKey: 'biltyNumber',
            header: 'Bilty No.',
            cell: ({ row }) => (
                <div className="flex items-center gap-1">
                    <Receipt className="h-3 w-3 text-gray-500" />
                    <span className="font-medium text-gray-800">{row.original.biltyNumber || '-'}</span>
                </div>
            )
        },
        {
            accessorKey: 'rateType',
            header: 'Rate Type',
            cell: ({ row }) => (
                <Badge variant="outline" className={row.original.rateType === 'Fixed' ? "bg-blue-50 text-blue-700" : "bg-green-50 text-green-700"}>
                    {row.original.rateType}
                </Badge>
            )
        },
        {
            accessorKey: 'amount1',
            header: 'Amount',
            cell: ({ row }) => (
                <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3 text-green-600" />
                    <span className="font-semibold text-green-600">₹{row.original.amount1?.toFixed(2) || '0.00'}</span>
                </div>
            )
        },
        {
            accessorKey: 'biltyImage',
            header: 'Bilty Image',
            cell: ({ row }) => (
                row.original.biltyImage ? (
                    <a
                        href={row.original.biltyImage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm underline flex items-center gap-1"
                    >
                        <FileText size={12} />
                        View
                    </a>
                ) : (
                    <span className="text-gray-400 text-sm">No Image</span>
                )
            )
        },
        //     }
        // },
        // {
        //     accessorKey: 'fFPPaymentNumber',
        //     header: 'FFP No.',
        //     cell: ({ row }) => (
        //         <span className="font-medium text-purple-700">{row.original.fFPPaymentNumber || '-'}</span>
        //     )
        // },
    ];

    const historyColumns: ColumnDef<FreightPaymentData>[] = [
        ...columns.filter(col => col.id !== 'select' && (col as any).header !== 'Action'),
        {
            accessorKey: 'actual1',
            header: () => (
                <div className="flex items-center justify-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Payment Date</span>
                </div>
            ),
            cell: ({ row }) => (
                <span className="text-sm">{formatDateTiny(row.original.actual1)}</span>
            )
        }
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
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Freight Payment</h1>
                            <p className="text-gray-600">Click "Make Payment" to open Google Form for each freight item</p>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <Card className="bg-white shadow border-0 hover:shadow-md transition-shadow">
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Total Freight Items</p>
                                        <p className="text-2xl font-bold text-gray-800 mt-1">{stats.total}</p>
                                    </div>
                                    <Truck className="h-10 w-10 text-green-500" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-white shadow border-0 hover:shadow-md transition-shadow">
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Pending Payment</p>
                                        <p className="text-2xl font-bold text-amber-600 mt-1">{stats.pending}</p>
                                    </div>
                                    <div className="h-10 w-10 flex items-center justify-center bg-amber-100 rounded-full">
                                        <DollarSign className="h-5 w-5 text-amber-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-white shadow border-0 hover:shadow-md transition-shadow">
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Payment Completed</p>
                                        <p className="text-2xl font-bold text-green-600 mt-1">{stats.completed}</p>
                                    </div>
                                    <div className="h-10 w-10 flex items-center justify-center bg-green-100 rounded-full">
                                        <FileText className="h-5 w-5 text-green-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Tabs Section */}
                <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="mb-6 bg-white shadow-sm border p-1 rounded-xl flex gap-1 justify-start">
                        <TabsTrigger
                            value="pending"
                            className="flex justify-center items-center gap-2 data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700 data-[state=active]:shadow-sm px-6 py-2.5 rounded-lg transition-all"
                        >
                            <Clock size={16} className={activeTab === 'pending' ? 'text-amber-500' : 'text-gray-400'} />
                            Pending Payments
                            <Badge variant="secondary" className="ml-2 bg-white/60">
                                {stats.pending}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger
                            value="history"
                            className="flex justify-center items-center gap-2 data-[state=active]:bg-green-50 data-[state=active]:text-green-700 data-[state=active]:shadow-sm px-6 py-2.5 rounded-lg transition-all"
                        >
                            <CheckCircle size={16} className={activeTab === 'history' ? 'text-green-500' : 'text-gray-400'} />
                            Payment History
                            <Badge variant="secondary" className="ml-2 bg-white/60">
                                {stats.completed}
                            </Badge>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="pending" className="mt-0">
                        <Card className="bg-white shadow-lg border-0 mb-6 ring-1 ring-gray-100">
                            <CardHeader className="pb-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-xl font-bold text-gray-800">
                                            Pending Freight Payments ({stats.pending})
                                        </CardTitle>
                                        <p className="text-gray-600 text-sm mt-1">
                                            Items with Planned1 date but no Actual1 date
                                        </p>
                                    </div>
                                </div>
                                {selectedRows.size > 0 && (
                                    <div className="flex gap-2 mt-4">
                                        <Button
                                            onClick={handleSubmitCompleted}
                                            disabled={submitting}
                                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg animate-in fade-in slide-in-from-top-2"
                                        >
                                            {submitting ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : (
                                                <Check className="mr-2 h-4 w-4" />
                                            )}
                                            Submit {selectedRows.size} Selected as Completed
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => setSelectedRows(new Set())}
                                            disabled={submitting}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                )}
                            </CardHeader>
                            <CardContent>
                                <DataTable
                                    data={tableData}
                                    columns={columns}
                                    searchFields={['indentNumber', 'vendorName', 'vehicleNumber', 'from', 'to', 'biltyNumber', 'fFPPaymentNumber']}
                                    dataLoading={fullkittingLoading}
                                    className="border rounded-lg"
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="history" className="mt-0">
                        <Card className="bg-white shadow-lg border-0 mb-6 ring-1 ring-gray-100">
                            <CardHeader className="pb-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-xl font-bold text-gray-800">
                                            Completed Freight Payments History
                                        </CardTitle>
                                        <p className="text-gray-600 text-sm mt-1">
                                            Items where payment has been successfully recorded
                                        </p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <DataTable
                                    data={historyData}
                                    columns={historyColumns}
                                    searchFields={['indentNumber', 'vendorName', 'vehicleNumber', 'from', 'to', 'biltyNumber', 'fFPPaymentNumber', 'actual1']}
                                    dataLoading={fullkittingLoading}
                                    className="border rounded-lg"
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}