import Heading from '../element/Heading';
import {
    CalendarIcon,
    ClipboardList,
    LayoutDashboard,
    PackageCheck,
    Truck,
    Warehouse,
    TrendingUp,
    TrendingDown,
    DollarSign,
    BarChart3,
    PieChart,
    Activity,
    ShoppingCart,
    Users,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Eye,
    AlertCircle,
    Package,
    TrendingUp as TrendingUpIcon,
    Building
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Cell, PieChart as RePieChart, Pie, Legend, Tooltip as RechartsTooltip, LineChart, Line, Area, AreaChart } from 'recharts';
import { useEffect, useState } from 'react';
import { useSheets } from '@/context/SheetsContext';
import { Badge } from '../ui/badge';

// Define TypeScript interfaces
interface SheetItem {
    [key: string]: any;
    timestamp?: string | Date;
    indentNumber?: string;
    'Indent Number'?: string;
    firmName?: string;
    'Firm Name'?: string;
    productName?: string;
    'Product Name'?: string;
    quantity?: number;
    approvedQuantity?: number;
    'Approved Quantity'?: number;
    approvedRate?: number | string;
    'Approved Rate'?: number | string;
    rate?: number;
    poNumber?: string;
    'PO Number'?: string;
    poNo?: string;
    'PO No'?: string;
    issueNo?: string;
    'Issue No'?: string;
    issueNumber?: string;
    'Issue Number'?: string;
    givenQty?: number;
    'Given Quantity'?: number;
    liftNumber?: string;
    'Lift Number'?: string;
    liftNo?: string;
    'Lift No'?: string;
    indentNo?: string;
    'Indent No.'?: string;
    itemName?: string;
    'Item Name'?: string;
    totalPrice?: number;
    'Total Price'?: number;
    current?: number;
    'Current Stock'?: number;
    colorCode?: string;
    noDay?: number;
    status?: string;
    indentStatus?: string;
    purchaseStatus?: string;
    receiveStatus?: string;
    vendorName?: string;
    'Vendor Name'?: string;
    date?: string;
    'Date'?: string;
    vendorType?: string;
    approvedDate?: string;
}

interface ChartDataItem {
    name: string;
    quantity: number;
    frequency: number;
    value: number;
}

interface VendorDataItem {
    name: string;
    orders: number;
    quantity: number;
    value: number;
}

interface StockDataItem {
    name: string;
    value: number;
    quantity: number;
    status: string;
}

interface TrendDataItem {
    month: string;
    indents: number;
    purchases: number;
    issues: number;
}

interface StatsItem {
    count: number;
    quantity: number;
    value: number;
}

interface AlertItem {
    lowStock: number;
    outOfStock: number;
    totalValue: number;
}

// Custom Tooltip Components
function CustomBarTooltip({ active, payload, label }: any) {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-lg border-2 border-gray-200 bg-white px-4 py-3 shadow-xl text-sm font-medium">
                <p className="font-bold text-gray-900 mb-2">{label}</p>
                <div className="space-y-1">
                    <p className="text-blue-600 flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                        Quantity: <span className="font-bold ml-2">{payload[0].value}</span>
                    </p>
                    <p className="text-green-600 flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        Frequency: <span className="font-bold ml-2">{payload[0].payload.frequency}</span>
                    </p>
                    <p className="text-purple-600 flex items-center">
                        <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                        Value: ₹{payload[0].payload.value?.toLocaleString() || '0'}
                    </p>
                </div>
            </div>
        );
    }
    return null;
}

function CustomPieTooltip({ active, payload }: any) {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-lg border-2 border-gray-200 bg-white px-4 py-3 shadow-xl text-sm font-medium">
                <p className="font-bold text-gray-900 mb-2">{payload[0].name}</p>
                <p className="text-blue-600">Orders: {payload[0].value}</p>
                <p className="text-green-600">Items: {payload[0].payload.quantity}</p>
                <p className="text-purple-600">Value: ₹{payload[0].payload.value?.toLocaleString() || '0'}</p>
            </div>
        );
    }
    return null;
}

export default function Dashboard() {
    const { indentSheet, receivedSheet, inventorySheet, issueSheet, poMasterSheet, storeInSheet } = useSheets();

    const [chartData, setChartData] = useState<ChartDataItem[]>([]);
    const [topVendorsData, setTopVendors] = useState<VendorDataItem[]>([]);
    const [stockData, setStockData] = useState<StockDataItem[]>([]);
    const [trendData, setTrendData] = useState<TrendDataItem[]>([]);

    // Stats items
    const [indent, setIndent] = useState<StatsItem>({ count: 0, quantity: 0, value: 0 });
    const [purchase, setPurchase] = useState<StatsItem>({ count: 0, quantity: 0, value: 0 });
    const [out, setOut] = useState<StatsItem>({ count: 0, quantity: 0, value: 0 });
    const [alerts, setAlerts] = useState<AlertItem>({ lowStock: 0, outOfStock: 0, totalValue: 0 });
    const [completionRate, setCompletionRate] = useState<number>(0);
    const [avgLeadTime, setAvgLeadTime] = useState<number>(0);
    const [stockValue, setStockValue] = useState<number>(0);

    // Chart colors
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

    useEffect(() => {
        if (!indentSheet || !inventorySheet || !issueSheet || !storeInSheet) {
            return;
        }


        // 1. Calculate Total Indents - count unique indent numbers from INDENT sheet
        const indentNumbers = new Set<string>();
        let totalIndentQuantity = 0;
        let totalIndentValue = 0;

        (indentSheet as SheetItem[]).forEach((item: SheetItem) => {
            const indentNo = item.indentNumber || item['Indent Number'];
            if (indentNo && typeof indentNo === 'string' && indentNo.trim() !== '') {
                indentNumbers.add(indentNo.trim());

                // Calculate quantity and value
                const quantity = Number(item.quantity || item.approvedQuantity || item['Approved Quantity'] || 0);
                totalIndentQuantity += quantity;

                const rateStr = String(item.approvedRate || item['Approved Rate'] || item.rate || '0');
                const rate = parseFloat(rateStr.replace(/,/g, ''));
                if (!isNaN(rate)) {
                    totalIndentValue += quantity * rate;
                }
            }
        });

        // 2. Calculate Total Purchases - count unique lift numbers from STORE IN sheet
        const purchaseNumbers = new Set<string>();
        let totalPurchaseQuantity = 0;
        let totalPurchaseValue = 0;

        (storeInSheet as SheetItem[]).forEach((item: SheetItem) => {
            const liftNo = item.liftNumber || item['Lift Number'] || item.liftNo || item['Lift No'];
            if (liftNo && typeof liftNo === 'string' && liftNo.trim() !== '') {
                const trimmedLiftNo = liftNo.trim();
                // Check if it's a valid lift number format (contains "LN-" or similar)
                if (trimmedLiftNo && trimmedLiftNo.length > 0) {
                    purchaseNumbers.add(trimmedLiftNo);

                    // Try to get quantity from indent sheet using indent number
                    const indentNo = item.indentNo || item['Indent No.'] || item.indentNumber;
                    if (indentNo) {
                        const matchingIndent = (indentSheet as SheetItem[]).find(
                            (indent: SheetItem) =>
                                (indent.indentNumber === indentNo) ||
                                (indent['Indent Number'] === indentNo) ||
                                (String(indent.indentNumber || '').includes(String(indentNo))) ||
                                (String(indent['Indent Number'] || '').includes(String(indentNo)))
                        );

                        if (matchingIndent) {
                            const quantity = Number(matchingIndent.quantity || matchingIndent.approvedQuantity || 0);
                            totalPurchaseQuantity += quantity;

                            const rateStr = String(matchingIndent.approvedRate || matchingIndent['Approved Rate'] || matchingIndent.rate || '0');
                            const rate = parseFloat(rateStr.replace(/,/g, ''));
                            if (!isNaN(rate)) {
                                totalPurchaseValue += quantity * rate;
                            }
                        }
                    }
                }
            }
        });

        // 3. Calculate Total Issues - count unique issue numbers from ISSUE sheet
        const issueNumbers = new Set<string>();
        let totalIssueQuantity = 0;
        let totalIssueValue = 0;

        (issueSheet as SheetItem[]).forEach((item: SheetItem) => {
            const issueNo = item.issueNo || item['Issue No'] || item.issueNumber || item['Issue Number'];
            if (issueNo && typeof issueNo === 'string' && issueNo.trim() !== '') {
                const trimmedIssueNo = issueNo.trim();
                if (trimmedIssueNo && trimmedIssueNo.length > 0) {
                    issueNumbers.add(trimmedIssueNo);
                }
            }

            // Calculate quantity and value
            const quantity = Number(item.quantity || item.givenQty || item['Given Quantity'] || 0);
            totalIssueQuantity += quantity;
            totalIssueValue += quantity * 1000; // Default rate
        });

        // 4. Calculate Stock Value from INDENT sheet Approved Rate
        let calculatedStockValue = 0;
        (indentSheet as SheetItem[]).forEach((item: SheetItem) => {
            const rateStr = String(item.approvedRate || item['Approved Rate'] || '0');
            const rate = parseFloat(rateStr.replace(/,/g, ''));
            const quantity = Number(item.quantity || item.approvedQuantity || item['Approved Quantity'] || 0);

            if (!isNaN(rate) && rate > 0 && quantity > 0) {
                calculatedStockValue += quantity * rate;
            }
        });
        setStockValue(calculatedStockValue);

        // 5. Calculate Indent Completion Rate from STORE IN sheet
        const storeInWithLift = (storeInSheet as SheetItem[]).filter((item: SheetItem) => {
            const liftNo = item.liftNumber || item['Lift Number'] || item.liftNo || item['Lift No'];
            return liftNo && typeof liftNo === 'string' && liftNo.trim() !== '';
        }).length;

        const completionRateValue = indentNumbers.size > 0
            ? Math.round((storeInWithLift / indentNumbers.size) * 100)
            : 0;
        setCompletionRate(Math.min(completionRateValue, 100));

        // 6. Update stats
        setIndent({
            count: indentNumbers.size,
            quantity: totalIndentQuantity,
            value: totalIndentValue
        });

        setPurchase({
            count: purchaseNumbers.size,
            quantity: totalPurchaseQuantity,
            value: totalPurchaseValue
        });

        setOut({
            count: issueNumbers.size,
            quantity: totalIssueQuantity,
            value: totalIssueValue
        });

        // 7. Set chart data for top products
        const productFrequency: Record<string, { frequency: number, quantity: number, value: number }> = {};

        (indentSheet as SheetItem[]).forEach((item: SheetItem) => {
            const productName = item.productName || item['Product Name'] || item.itemName || item['Item Name'] || 'Unknown';
            if (productName && productName !== 'Unknown') {
                const name = String(productName).trim();
                if (!productFrequency[name]) {
                    productFrequency[name] = { frequency: 0, quantity: 0, value: 0 };
                }
                productFrequency[name].frequency += 1;
                const quantity = Number(item.quantity || item.approvedQuantity || 0);
                const rateStr = String(item.approvedRate || item.rate || '1000');
                const rate = parseFloat(rateStr.replace(/,/g, ''));
                productFrequency[name].quantity += quantity;
                productFrequency[name].value += quantity * (isNaN(rate) ? 1000 : rate);
            }
        });

        const sortedProducts = Object.entries(productFrequency)
            .sort((a, b) => b[1].frequency - a[1].frequency)
            .slice(0, 8)
            .map(([name, data]) => ({
                name: name.length > 15 ? name.substring(0, 15) + '...' : name,
                frequency: data.frequency,
                quantity: data.quantity,
                value: data.value
            }));

        setChartData(sortedProducts);

        // 8. Set top vendors data
        const vendorStats: Record<string, { orders: number, quantity: number, value: number }> = {};

        (indentSheet as SheetItem[]).forEach((item: SheetItem) => {
            const vendorName = item.firmName || item['Firm Name'] || item.vendorName || item['Vendor Name'] || 'Unknown Vendor';
            if (vendorName && vendorName !== 'Unknown Vendor') {
                const name = String(vendorName).trim();
                if (!vendorStats[name]) {
                    vendorStats[name] = { orders: 0, quantity: 0, value: 0 };
                }
                vendorStats[name].orders += 1;
                const quantity = Number(item.quantity || item.approvedQuantity || 0);
                const rateStr = String(item.approvedRate || item.rate || '1000');
                const rate = parseFloat(rateStr.replace(/,/g, ''));
                vendorStats[name].quantity += quantity;
                vendorStats[name].value += quantity * (isNaN(rate) ? 1000 : rate);
            }
        });

        const sortedVendors = Object.entries(vendorStats)
            .sort((a, b) => b[1].orders - a[1].orders)
            .slice(0, 6)
            .map(([name, data]) => ({
                name: name.length > 20 ? name.substring(0, 20) + '...' : name,
                orders: data.orders,
                quantity: data.quantity,
                value: data.value
            }));

        setTopVendors(sortedVendors);

        // 9. Set stock data
        const stockItems = (inventorySheet as SheetItem[]).length > 0
            ? (inventorySheet as SheetItem[]).slice(0, 6).map((item: SheetItem) => ({
                name: (item.itemName || item['Item Name'] || 'Unknown').toString().length > 15
                    ? (item.itemName || item['Item Name'] || 'Unknown').toString().substring(0, 15) + '...'
                    : item.itemName || item['Item Name'] || 'Unknown',
                value: Number(item.totalPrice || item['Total Price'] || 0),
                quantity: Number(item.current || item['Current Stock'] || 0),
                status: item.colorCode || (Number(item.current || 0) === 0 ? 'red' : (Number(item.current || 0) < 10 ? 'yellow' : 'green'))
            }))
            : (indentSheet as SheetItem[]).slice(0, 6).map((item: SheetItem) => ({
                name: (item.productName || item['Product Name'] || 'Unknown').toString().length > 15
                    ? (item.productName || item['Product Name'] || 'Unknown').toString().substring(0, 15) + '...'
                    : item.productName || item['Product Name'] || 'Unknown',
                value: (parseFloat(String(item.approvedRate || 0).replace(/,/g, '')) || 0) * (Number(item.quantity || 0)),
                quantity: Number(item.quantity || item.approvedQuantity || 0),
                status: 'green'
            }));

        setStockData(stockItems);

        // 10. Calculate stock alerts
        const lowStockItems = stockItems.filter(item => item.status === 'yellow' || item.status === 'red').length;
        const outOfStockItems = stockItems.filter(item => item.status === 'red').length;

        setAlerts({
            lowStock: lowStockItems,
            outOfStock: outOfStockItems,
            totalValue: calculatedStockValue
        });

        // 11. Calculate trend data
        const last6MonthsData = Array.from({ length: 6 }, (_, i) => {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            return {
                month: date.toLocaleString('default', { month: 'short' }),
                year: date.getFullYear(),
                indents: 0,
                purchases: 0,
                issues: 0
            };
        }).reverse();

        // Fill trend data
        (indentSheet as SheetItem[]).forEach((item: SheetItem) => {
            const timestamp = item.timestamp || item['Timestamp'] || item.date || item['Date'];
            if (timestamp) {
                try {
                    const date = new Date(timestamp);
                    const monthIndex = last6MonthsData.findIndex(m =>
                        m.month === date.toLocaleString('default', { month: 'short' }) &&
                        m.year === date.getFullYear()
                    );
                    if (monthIndex !== -1) {
                        last6MonthsData[monthIndex].indents += 1;
                    }
                } catch (e) {
                    // Ignore parsing errors
                }
            }
        });

        (storeInSheet as SheetItem[]).forEach((item: SheetItem) => {
            const timestamp = item.timestamp || item['Timestamp'] || item.date || item['Date'];
            if (timestamp) {
                try {
                    const date = new Date(timestamp);
                    const monthIndex = last6MonthsData.findIndex(m =>
                        m.month === date.toLocaleString('default', { month: 'short' }) &&
                        m.year === date.getFullYear()
                    );
                    if (monthIndex !== -1) {
                        last6MonthsData[monthIndex].purchases += 1;
                    }
                } catch (e) {
                    // Ignore parsing errors
                }
            }
        });

        (issueSheet as SheetItem[]).forEach((item: SheetItem) => {
            const timestamp = item.timestamp || item['Timestamp'] || item.date || item['Date'];
            if (timestamp) {
                try {
                    const date = new Date(timestamp);
                    const monthIndex = last6MonthsData.findIndex(m =>
                        m.month === date.toLocaleString('default', { month: 'short' }) &&
                        m.year === date.getFullYear()
                    );
                    if (monthIndex !== -1) {
                        last6MonthsData[monthIndex].issues += 1;
                    }
                } catch (e) {
                    // Ignore parsing errors
                }
            }
        });

        const trend = last6MonthsData.map(item => ({
            month: item.month,
            indents: item.indents,
            purchases: item.purchases,
            issues: item.issues
        }));
        setTrendData(trend);

        // 12. Calculate average lead time
        const validLeadTimes = (indentSheet as SheetItem[])
            .filter(item => item.noDay && Number(item.noDay) > 0)
            .map(item => Number(item.noDay) || 0);

        const avgTime = validLeadTimes.length > 0
            ? validLeadTimes.reduce((sum, time) => sum + time, 0) / validLeadTimes.length
            : 7;
        setAvgLeadTime(Math.round(avgTime));

    }, [indentSheet, inventorySheet, issueSheet, storeInSheet]);

    // JSX return remains exactly the same as in the previous code...
    // [Rest of your JSX code stays exactly the same - just copy from previous answer]

    return (
        <div className="bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg">
                                <LayoutDashboard size={32} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                                    Dashboard Overview
                                </h1>
                                <p className="text-gray-600 mt-1">
                                    Real-time analytics and insights for your operations
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-white border-blue-200">
                                <Activity className="h-3 w-3 mr-1" />
                                Live Data
                            </Badge>
                            <span className="text-sm text-gray-500 hidden md:inline">
                                Last updated: {new Date().toLocaleTimeString()}
                            </span>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Indent Completion</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <p className="text-2xl font-bold text-gray-900">{completionRate}%</p>
                                        <Badge
                                            variant="outline"
                                            className={`${completionRate >= 80
                                                ? 'bg-green-100 text-green-800 border-green-200'
                                                : completionRate >= 50
                                                    ? 'bg-amber-100 text-amber-800 border-amber-200'
                                                    : 'bg-red-100 text-red-800 border-red-200'
                                                }`}
                                        >
                                            {completionRate >= 80 ? (
                                                <ArrowUpRight className="h-3 w-3 mr-1" />
                                            ) : completionRate >= 50 ? (
                                                <TrendingUpIcon className="h-3 w-3 mr-1" />
                                            ) : (
                                                <ArrowDownRight className="h-3 w-3 mr-1" />
                                            )}
                                            {completionRate >= 80 ? 'Good' : completionRate >= 50 ? 'Average' : 'Low'}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <ClipboardList className="text-blue-600" size={24} />
                                </div>
                            </div>
                            {/* Custom Progress Bar */}
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                                <div
                                    className={`h-2 rounded-full transition-all duration-300 ${completionRate >= 80 ? 'bg-green-500' :
                                            completionRate >= 50 ? 'bg-amber-500' :
                                                'bg-red-500'
                                        }`}
                                    style={{ width: `${Math.min(completionRate, 100)}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Avg. Lead Time</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-2">{avgLeadTime} days</p>
                                    <p className="text-xs text-gray-500 mt-1">From indent to delivery</p>
                                </div>
                                <div className="p-2 bg-green-50 rounded-lg">
                                    <Calendar className="text-green-600" size={24} />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Active Vendors</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-2">{topVendorsData.length}</p>
                                    <p className="text-xs text-gray-500 mt-1">In last 6 months</p>
                                </div>
                                <div className="p-2 bg-purple-50 rounded-lg">
                                    <Users className="text-purple-600" size={24} />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Stock Value</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-2">
                                        ₹{stockValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">Total inventory worth</p>
                                </div>
                                <div className="p-2 bg-amber-50 rounded-lg">
                                    <DollarSign className="text-amber-600" size={24} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Stats Cards */}
                <div className="grid md:grid-cols-4 gap-4 mb-6">
                    <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl rounded-2xl hover:shadow-2xl transition-shadow duration-300">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <p className="font-bold text-lg flex items-center gap-2">
                                        <ClipboardList size={20} className="text-blue-200" />
                                        Total Indents
                                    </p>
                                    <div className="mt-2">
                                        <p className="text-4xl font-black mb-1">{indent.count}</p>
                                        <div className="flex items-center gap-2">
                                            <div className="w-full bg-blue-400/30 rounded-full h-2">
                                                <div
                                                    className="bg-white h-2 rounded-full"
                                                    style={{ width: `${Math.min((indent.count / 50) * 100, 100)}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-sm font-medium text-blue-100">
                                                {indent.count > 0 ? 'Active' : 'None'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-blue-100 pt-3 border-t border-blue-400/30">
                                <p className="text-sm font-semibold flex items-center gap-2">
                                    <TrendingUpIcon size={16} />
                                    Total Quantity
                                </p>
                                <p className="font-bold text-lg">{indent.quantity.toLocaleString()}</p>
                            </div>
                            <div className="flex justify-between items-center text-blue-100 mt-2">
                                <p className="text-sm font-semibold">Total Value</p>
                                <p className="font-bold">₹{indent.value.toLocaleString('en-IN')}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-xl rounded-2xl hover:shadow-2xl transition-shadow duration-300">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <p className="font-bold text-lg flex items-center gap-2">
                                        <Truck size={20} className="text-green-200" />
                                        Total Purchases
                                    </p>
                                    <div className="mt-2">
                                        <p className="text-4xl font-black mb-1">{purchase.count}</p>
                                        <div className="flex items-center gap-2">
                                            <div className="w-full bg-green-400/30 rounded-full h-2">
                                                <div
                                                    className="bg-white h-2 rounded-full"
                                                    style={{ width: `${Math.min((purchase.count / 50) * 100, 100)}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-sm font-medium text-green-100">
                                                {purchase.count > 0 ? 'Active' : 'None'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-green-100 pt-3 border-t border-green-400/30">
                                <p className="text-sm font-semibold flex items-center gap-2">
                                    <ShoppingCart size={16} />
                                    Purchased Quantity
                                </p>
                                <p className="font-bold text-lg">{purchase.quantity.toLocaleString()}</p>
                            </div>
                            <div className="flex justify-between items-center text-green-100 mt-2">
                                <p className="text-sm font-semibold">Purchase Value</p>
                                <p className="font-bold">₹{purchase.value.toLocaleString('en-IN')}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-xl rounded-2xl hover:shadow-2xl transition-shadow duration-300">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <p className="font-bold text-lg flex items-center gap-2">
                                        <PackageCheck size={20} className="text-orange-200" />
                                        Total Issued
                                    </p>
                                    <div className="mt-2">
                                        <p className="text-4xl font-black mb-1">{out.count}</p>
                                        <div className="flex items-center gap-2">
                                            <div className="w-full bg-orange-400/30 rounded-full h-2">
                                                <div
                                                    className="bg-white h-2 rounded-full"
                                                    style={{ width: `${Math.min((out.count / 50) * 100, 100)}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-sm font-medium text-orange-100">
                                                {out.count > 0 ? 'Active' : 'None'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-orange-100 pt-3 border-t border-orange-400/30">
                                <p className="text-sm font-semibold flex items-center gap-2">
                                    <TrendingDown size={16} />
                                    Issued Quantity
                                </p>
                                <p className="font-bold text-lg">{out.quantity.toLocaleString()}</p>
                            </div>
                            <div className="flex justify-between items-center text-orange-100 mt-2">
                                <p className="text-sm font-semibold">Issued Value</p>
                                <p className="font-bold">₹{out.value.toLocaleString('en-IN')}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-xl rounded-2xl hover:shadow-2xl transition-shadow duration-300">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <p className="font-bold text-lg flex items-center gap-2">
                                        <Warehouse size={20} className="text-purple-200" />
                                        Stock Alerts
                                    </p>
                                    <div className="mt-2">
                                        <p className="text-4xl font-black mb-1">{alerts.outOfStock}</p>
                                        <div className="flex items-center gap-2">
                                            <div className="w-full bg-purple-400/30 rounded-full h-2">
                                                <div
                                                    className="bg-white h-2 rounded-full"
                                                    style={{ width: `${Math.min(((alerts.outOfStock + alerts.lowStock) / (stockData.length || 1)) * 100, 100)}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-sm font-medium text-purple-100">
                                                {alerts.lowStock + alerts.outOfStock} Alerts
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-purple-100 pt-3 border-t border-purple-400/30">
                                <p className="text-sm font-semibold flex items-center gap-2">
                                    <Eye size={16} />
                                    Low in Stock
                                </p>
                                <p className="font-bold text-lg">{alerts.lowStock}</p>
                            </div>
                            <div className="flex justify-between items-center text-purple-100 mt-2">
                                <p className="text-sm font-semibold">Stock Value</p>
                                <p className="font-bold">₹{stockValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Top Products Chart */}
                    <Card className="border-2 border-gray-200 shadow-xl rounded-2xl overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-t-2xl border-b-2 border-gray-200 py-5">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                    <BarChart3 className="text-blue-600" />
                                    Top Requested Products
                                </CardTitle>
                                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                    {chartData.length} Products
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            {chartData.length > 0 ? (
                                <>
                                    <div className="h-80">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={chartData}
                                                layout="vertical"
                                                margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
                                            >
                                                <CartesianGrid horizontal={false} stroke="#e5e7eb" strokeDasharray="3 3" />
                                                <XAxis
                                                    type="number"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fill: '#6b7280', fontSize: 12 }}
                                                    tickFormatter={(value) => value.toLocaleString()}
                                                />
                                                <YAxis
                                                    dataKey="name"
                                                    type="category"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fill: '#374151', fontSize: 12, fontWeight: 500 }}
                                                    width={90}
                                                />
                                                <RechartsTooltip content={<CustomBarTooltip />} />
                                                <Bar
                                                    dataKey="quantity"
                                                    layout="vertical"
                                                    radius={[0, 8, 8, 0]}
                                                    barSize={24}
                                                >
                                                    {chartData.map((_, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="flex flex-wrap gap-3 mt-4">
                                        {chartData.slice(0, 4).map((item, index) => (
                                            <Badge key={index} variant="outline" className="bg-white border-gray-200">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                                    {item.name}
                                                </div>
                                            </Badge>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="h-80 flex items-center justify-center">
                                    <div className="text-center text-gray-500">
                                        <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                                        <p className="text-lg font-medium">No product data available</p>
                                        <p className="text-sm">Add products to indents to see analytics</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Top Vendors Chart */}
                    <Card className="border-2 border-gray-200 shadow-xl rounded-2xl overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-gray-50 to-green-50 rounded-t-2xl border-b-2 border-gray-200 py-5">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                    <Users className="text-green-600" />
                                    Top Vendors
                                </CardTitle>
                                <Badge variant="outline" className="bg-green-50 text-green-700">
                                    {topVendorsData.length} Vendors
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            {topVendorsData.length > 0 ? (
                                <>
                                    <div className="h-80 flex items-center justify-center">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RePieChart>
                                                <Pie
                                                    data={topVendorsData}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={(entry) => entry.name}
                                                    outerRadius={80}
                                                    fill="#8884d8"
                                                    dataKey="orders"
                                                >
                                                    {topVendorsData.map((_, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip content={<CustomPieTooltip />} />
                                                <Legend
                                                    verticalAlign="bottom"
                                                    height={36}
                                                    formatter={(_, entry: any) => (
                                                        <span style={{ color: '#374151', fontSize: '12px', fontWeight: 500 }}>
                                                            {entry.payload.name}
                                                        </span>
                                                    )}
                                                />
                                            </RePieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 mt-4">
                                        {topVendorsData.map((vendor, index) => (
                                            <div key={index} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium text-sm text-gray-700 truncate">
                                                        {vendor.name}
                                                    </span>
                                                    <Badge variant="outline" className="bg-white">
                                                        {vendor.orders} orders
                                                    </Badge>
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {vendor.quantity} items • ₹{vendor.value.toLocaleString()}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="h-80 flex items-center justify-center">
                                    <div className="text-center text-gray-500">
                                        <Building className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                                        <p className="text-lg font-medium">No vendor data available</p>
                                        <p className="text-sm">Create indents to see vendor analytics</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Additional Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Trend Analysis */}
                    <Card className="border-2 border-gray-200 shadow-xl rounded-2xl overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-gray-50 to-amber-50 rounded-t-2xl border-b-2 border-gray-200 py-5">
                            <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <TrendingUp className="text-amber-600" />
                                Monthly Trend Analysis
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            {trendData.length > 0 && trendData.some(d => d.indents > 0 || d.purchases > 0 || d.issues > 0) ? (
                                <>
                                    <div className="h-72">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart
                                                data={trendData}
                                                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                                <XAxis
                                                    dataKey="month"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fill: '#6b7280', fontSize: 12 }}
                                                />
                                                <YAxis
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fill: '#6b7280', fontSize: 12 }}
                                                    tickFormatter={(value) => value.toLocaleString()}
                                                />
                                                <RechartsTooltip
                                                    contentStyle={{
                                                        borderRadius: '8px',
                                                        border: '2px solid #e5e7eb',
                                                        backgroundColor: 'white'
                                                    }}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="indents"
                                                    stackId="1"
                                                    stroke="#3b82f6"
                                                    fill="#3b82f6"
                                                    fillOpacity={0.2}
                                                    strokeWidth={2}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="purchases"
                                                    stackId="1"
                                                    stroke="#10b981"
                                                    fill="#10b981"
                                                    fillOpacity={0.2}
                                                    strokeWidth={2}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="issues"
                                                    stackId="1"
                                                    stroke="#8b5cf6"
                                                    fill="#8b5cf6"
                                                    fillOpacity={0.2}
                                                    strokeWidth={2}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="flex justify-center gap-6 mt-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                            <span className="text-sm text-gray-600">Indents ({trendData.reduce((sum, d) => sum + d.indents, 0)})</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                            <span className="text-sm text-gray-600">Purchases ({trendData.reduce((sum, d) => sum + d.purchases, 0)})</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                                            <span className="text-sm text-gray-600">Issues ({trendData.reduce((sum, d) => sum + d.issues, 0)})</span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="h-72 flex items-center justify-center">
                                    <div className="text-center text-gray-500">
                                        <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                                        <p className="text-lg font-medium">No trend data available</p>
                                        <p className="text-sm">Activities will appear here over time</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Stock Status */}
                    <Card className="border-2 border-gray-200 shadow-xl rounded-2xl overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-gray-50 to-red-50 rounded-t-2xl border-b-2 border-gray-200 py-5">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                    <Activity className="text-red-600" />
                                    Stock Status Overview
                                </CardTitle>
                                <Badge variant="outline" className="bg-red-50 text-red-700">
                                    {alerts.lowStock + alerts.outOfStock} Alerts
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            {stockData.length > 0 ? (
                                <>
                                    <div className="h-72">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={stockData}
                                                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                                                <XAxis
                                                    dataKey="name"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fill: '#6b7280', fontSize: 11 }}
                                                    angle={-45}
                                                    textAnchor="end"
                                                    height={60}
                                                />
                                                <YAxis
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fill: '#6b7280', fontSize: 12 }}
                                                    tickFormatter={(value) => value.toLocaleString()}
                                                />
                                                <RechartsTooltip
                                                    contentStyle={{
                                                        borderRadius: '8px',
                                                        border: '2px solid #e5e7eb',
                                                        backgroundColor: 'white'
                                                    }}
                                                    formatter={(value, name) => [
                                                        name === 'quantity' ? `${value} units` : `₹${value.toLocaleString()}`,
                                                        name === 'quantity' ? 'Quantity' : 'Value'
                                                    ]}
                                                />
                                                <Bar
                                                    dataKey="value"
                                                    radius={[4, 4, 0, 0]}
                                                    barSize={30}
                                                >
                                                    {stockData.map((entry, index) => (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={entry.status === 'red' ? '#ef4444' : entry.status === 'yellow' ? '#f59e0b' : '#10b981'}
                                                        />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="flex flex-wrap gap-4 justify-center mt-4">
                                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                            <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                                            Good Stock ({stockData.filter(s => s.status === 'green').length})
                                        </Badge>
                                        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                                            <div className="w-2 h-2 rounded-full bg-amber-500 mr-2"></div>
                                            Low Stock ({stockData.filter(s => s.status === 'yellow').length})
                                        </Badge>
                                        <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                                            <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div>
                                            Critical ({stockData.filter(s => s.status === 'red').length})
                                        </Badge>
                                    </div>
                                </>
                            ) : (
                                <div className="h-72 flex items-center justify-center">
                                    <div className="text-center text-gray-500">
                                        <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                                        <p className="text-lg font-medium">No inventory data available</p>
                                        <p className="text-sm">Add items to inventory to see stock status</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Summary Section */}
                <Card className="mt-6 border-2 border-gray-200 shadow-xl rounded-2xl">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-indigo-50 rounded-t-2xl border-b-2 border-gray-200 py-5">
                        <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <LayoutDashboard className="text-indigo-600" />
                            Performance Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-4">
                                <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                                    <ClipboardList size={18} />
                                    Indent Performance
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Completion Rate</span>
                                        <span className={`font-bold ${completionRate >= 80 ? 'text-green-600' :
                                                completionRate >= 50 ? 'text-amber-600' :
                                                    'text-red-600'
                                            }`}>
                                            {completionRate}%
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Total Indents</span>
                                        <span className="font-bold text-blue-600">
                                            {indent.count}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Indent Value</span>
                                        <span className="font-bold text-blue-600">
                                            ₹{indent.value.toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                                    <Truck size={18} />
                                    Purchase Efficiency
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Purchase Rate</span>
                                        <span className={`font-bold ${purchase.count > 0 ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            {indent.count > 0 ? `${Math.round((purchase.count / indent.count) * 100)}%` : '0%'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Total Purchases</span>
                                        <span className="font-bold text-green-600">
                                            {purchase.count}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Purchase Value</span>
                                        <span className="font-bold text-green-600">
                                            ₹{purchase.value.toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                                    <Warehouse size={18} />
                                    Inventory Health
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Issue Rate</span>
                                        <span className={`font-bold ${out.count > 0 ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            {purchase.count > 0 ? `${Math.round((out.count / purchase.count) * 100)}%` : '0%'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Total Issues</span>
                                        <span className="font-bold text-orange-600">
                                            {out.count}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Stock Value</span>
                                        <span className="font-bold text-amber-600">
                                            ₹{stockValue.toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Footer Stats */}
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-center">
                        <p className="text-sm font-medium text-gray-500">Total Indents</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                            {indent.count}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-center">
                        <p className="text-sm font-medium text-gray-500">Total Purchases</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                            {purchase.count}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-center">
                        <p className="text-sm font-medium text-gray-500">Total Issues</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                            {out.count}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-center">
                        <p className="text-sm font-medium text-gray-500">Stock Value</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                            ₹{stockValue.toLocaleString('en-IN')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}