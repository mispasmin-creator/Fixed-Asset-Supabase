import '@/index.css';

import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider, useAuth } from '@/context/AuthContext.tsx';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import Login from './components/views/Login';
import CreateIndent from './components/views/CreateIndent';
import Dashboard from './components/views/Dashboard';
import App from './App';
import ApproveIndent from '@/components/views/ApproveIndent';
import { SheetsProvider } from './context/SheetsContext';
import VendorUpdate from './components/views/VendorUpdate';
import RateApproval from './components/views/RateApproval';
import StoreOutApproval from './components/views/StoreOutApproval';
import TrainnigVideo from './components/views/TrainingVideo';
import Liecense from './components/views/License'
import MakePayment from './components/views/MakePayment';
import Exchange from './components/views/Exchange'
import FreightPayment from './components/views/Payment';
import type { RouteAttributes } from './types';
import {
    LayoutDashboard,
    ClipboardList,
    UserCheck,
    Users,
    ClipboardCheck,
    Truck,
    PackageCheck,
    ShieldUser,
    FilePlus2,
    ListTodo,
    Package2,
    Store,
    KeyRound,
    VideoIcon,
    RotateCcw,
    CreditCard,
    Calculator,
} from 'lucide-react';
import type { UserPermissions } from './types/sheets';
import Administration from './components/views/Administration';
import Loading from './components/views/Loading';
import CreatePO from './components/views/CreatePO';
import PendingIndents from './components/views/PendingIndents';
import Order from './components/views/Order';
import Inventory from './components/views/Inventory';
import POMaster from './components/views/POMaster';
import StoreIssue from './components/views/StoreIssue';
import QuantityCheckInReceiveItem from './components/views/QuantityCheckInReceiveItem';
import ReturnMaterialToParty from './components/views/ReturnMaterialToParty';
import SendDebitNote from './components/views/SendDebitNote';
import IssueData from './components/views/IssueData';
import GetLift from './components/views/GetLift';
import StoreIn from './components/views/StoreIn';
import AuditData from './components/views/AuditData';
import RectifyTheMistake from './components/views/RectifyTheMistake';
import ReauditData from './components/views/ReauditData';
import TakeEntryByTally from './components/views/TakeEntryByTally';
import ExchangeMaterials from './components/views/ExchangeMaterials';
import DBforPc from './components/views/DBforPC';
import AgainAuditing from './components/views/AgainAuditing'
import BillNotReceived from './components/views/BillNotReceived';
import FullKiting from './components/views/FullKiting';
import PendingPo from './components/views/PendingPo';
import PaymentStatus from './components/views/PaymentStatus';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { loggedIn, loading } = useAuth();
    if (loading) return <Loading />;
    return loggedIn ? children : <Navigate to="/login" />;
}

function GatedRoute({
    children,
    identifier,
}: {
    children: React.ReactNode;
    identifier?: keyof UserPermissions;
}) {
    const { user } = useAuth();
    if (!identifier) return children;
    if (!user || !(user as any)[identifier]) {
        return <Navigate to="/" replace />;
    }
    return children;
}

const routes: RouteAttributes[] = [
    {
        path: '',
        name: 'Dashboard',
        icon: <LayoutDashboard size={20} />,
        element: <Dashboard />,
        notifications: () => 0,
    },
    //     {
    //         path: 'store-issue',
    //         gateKey: 'storeIssue',
    //         name: 'Store Issue',
    //         icon: <ClipboardList size={20} />,
    //         element: <StoreIssue />,
    //         notifications: () => 0,
    //     },

    //     {
    //     path: 'Issue-data',
    //     gateKey: 'issueData',
    //     name: 'Issue Data',
    //     icon: <ClipboardCheck size={20} />,
    //     element: <IssueData />,
    //     notifications: (issueSheet: any[]) =>
    //         issueSheet.filter((sheet: any) =>
    //             sheet.planned1 &&
    //             sheet.planned1.toString().trim() !== '' &&
    //             (!sheet.actual1 || sheet.actual1.toString().trim() === '')
    //         ).length,
    // },


    {
        path: 'inventory',
        name: 'Fixed Asset Register',
        icon: <Store size={20} />,
        element: <Inventory />,
        notifications: () => 0,
    },

    {
        path: 'create-indent',
        gateKey: 'createIndent',
        name: 'Create Indent',
        icon: <ClipboardList size={20} />,
        element: <CreateIndent />,
        notifications: () => 0,
    },
    {
        path: 'approve-indent',
        gateKey: 'indentApprovalView',
        name: 'Approve Indent',
        icon: <ClipboardCheck size={20} />,
        element: <ApproveIndent />,
        notifications: (sheets: any[], context?: any) => {
            const user = context?.user;
            return sheets.filter(
                (sheet: any) =>
                    (user?.firmNameMatch?.toLowerCase() === "all" ||
                        sheet.firmName === user?.firmNameMatch ||
                        sheet.firmNameMatch === user?.firmNameMatch) &&
                    sheet.planned1 && sheet.planned1.toString().trim() !== '' &&
                    (!sheet.actual1 || sheet.actual1.toString().trim() === '')
            ).length;
        },
    },
    {
        path: 'vendor-rate-update',
        gateKey: 'updateVendorView',
        name: 'Vendor Rate Update',
        icon: <UserCheck size={20} />,
        element: <VendorUpdate />,
        notifications: (sheets: any[], context?: any) => {
            const user = context?.user;
            return sheets.filter(
                (sheet: any) =>
                    (user?.firmNameMatch?.toLowerCase() === "all" ||
                        sheet.firmName === user?.firmNameMatch ||
                        sheet.firmNameMatch === user?.firmNameMatch) &&
                    sheet.planned2 && sheet.planned2.toString().trim() !== '' &&
                    (!sheet.actual2 || sheet.actual2.toString().trim() === '') &&
                    sheet.vendorType?.toLowerCase() !== 'reject'
            ).length;
        },
    },
    {
        path: 'three-party-approval',
        gateKey: 'threePartyApprovalView',
        name: 'Three Party Approval',
        icon: <Users size={20} />,
        element: <RateApproval />,
        notifications: (sheets: any[], context?: any) => {
            const user = context?.user;
            return sheets.filter(
                (sheet: any) =>
                    (user?.firmNameMatch?.toLowerCase() === "all" ||
                        sheet.firmName === user?.firmNameMatch ||
                        sheet.firmNameMatch === user?.firmNameMatch) &&
                    sheet.planned3 && sheet.planned3.toString().trim() !== '' &&
                    (!sheet.actual3 || sheet.actual3.toString().trim() === '') &&
                    sheet.vendorType === 'Three Party'
            ).length;
        },
    },
    // {
    //     path: 'pending-pos',
    //     gateKey: 'pendingIndentsView',
    //     name: 'PO to Make/Not',
    //     icon: <ListTodo size={20} />,
    //     element: <PendingIndents />,
    //     notifications: (sheets: any[]) =>
    //         sheets.filter((sheet: any) => sheet.planned4 !== '' && sheet.actual4 === '').length,
    // },
    //     {
    //     path: 'pending-poss',
    //     name: 'Pending PO',
    //     icon: <FilePlus2 size={20} />,
    //     element: <PendingPo />,
    //     notifications: (sheets: any[]) =>
    //         sheets.filter((sheet: any) => 
    //             sheet.poRequred && 
    //             sheet.poRequred.toString().trim() === 'Yes'
    //         ).length,
    // },
    {
        path: 'create-po',
        gateKey: 'createPo',
        name: 'Create PO',
        icon: <FilePlus2 size={20} />,
        element: <CreatePO />,
        notifications: () => 0,
    },

    {
        path: 'po-history',
        // gateKey: 'undefined',  // ✅ CHANGED from 'ordersView' to match sheet
        name: 'PO History',
        icon: <Package2 size={20} />,
        element: <Order />,
        notifications: (sheets: any[]) => {
            // Get all unique PO numbers
            const uniquePoNumbers = new Set(
                sheets
                    .filter((sheet: any) =>
                        sheet.poNumber &&
                        sheet.poNumber.toString().trim() !== ''
                    )
                    .map((sheet: any) => sheet.poNumber.toString().trim())
            );

            // Return count of unique PO numbers
            return uniquePoNumbers.size;
        },
    },


    {
        path: 'get-lift',
        gateKey: 'ordersView',
        name: 'Lifting',
        icon: <Package2 size={20} />,
        element: <GetLift />,
        notifications: (sheets: any[], context?: any) => {
            const user = context?.user;
            return sheets.filter(
                (sheet: any) =>
                    (user?.firmNameMatch?.toLowerCase() === "all" || sheet.firmNameMatch === user?.firmNameMatch) &&
                    sheet.liftingStatus === 'Pending' &&
                    sheet.planned5 &&
                    sheet.planned5.toString().trim() !== ''
            ).length;
        },
    },


    {
        path: 'store-in',
        gateKey: 'storeIn',
        name: 'Store In',
        icon: <Truck size={20} />,
        element: <StoreIn />,
        notifications: (sheets: any[], context?: any) => {
            const user = context?.user;
            return sheets.filter((sheet: any) =>
                (user?.firmNameMatch?.toLowerCase() === "all" || sheet.firmNameMatch === user?.firmNameMatch) &&
                sheet.planned6 !== '' &&
                sheet.actual6 === ''
            ).length;
        },
    },

    {
        path: 'Full-Kiting',
        gateKey: 'ordersView',
        name: 'Freight Full Kiting',
        icon: <FilePlus2 size={20} />,
        element: <FullKiting />,
        notifications: (sheets: any[], context?: any) => {
            const user = context?.user;
            return sheets.filter((sheet: any) =>
                (user?.firmNameMatch?.toLowerCase() === "all" || sheet.firmNameMatch === user?.firmNameMatch) &&
                sheet.planned &&
                sheet.planned.toString().trim() !== '' &&
                (!sheet.actual || sheet.actual.toString().trim() === '')
            ).length;
        },
    },
    // In your routes configuration
    // In your routes configuration
    {
        name: 'Freight Payment',
        path: 'freight-payment',
        icon: <CreditCard size={18} />,
        element: <FreightPayment />,
        notifications: (sheetData: any[], context?: any) => {
            const user = context?.user;
            if (!sheetData || !Array.isArray(sheetData)) return 0;

            // Filter items where transportingInclude is 'Yes', Planned1 is not empty and Actual1 is empty
            const pendingPayments = sheetData.filter(item =>
                (user?.firmNameMatch?.toLowerCase() === "all" || item.firmNameMatch === user?.firmNameMatch) &&
                item.transportingInclude === 'Yes' &&
                item.planned1 &&
                item.planned1 !== '' &&
                (!item.actual1 || item.actual1 === '')
            );

            return pendingPayments.length;
        }
    }
    ,
    {
        name: 'HOD Approval',
        path: 'pi-approvals',
        element: <ExchangeMaterials />,
        icon: <Package2 size={18} />,
        notifications: (poMasterData: any[], context?: any) => {
            // Get sheets from context
            const piApprovalSheet = context?.piApprovalSheet || [];
            const user = context?.user || {};

            if (!poMasterData || !Array.isArray(poMasterData)) return 0;

            // Create Sets for approved POs and Indents
            const approvedPONumbers = new Set(
                piApprovalSheet.map((pi: any) => pi.poNumber?.toString().trim()).filter(Boolean)
            );
            const approvedIndentNumbers = new Set(
                piApprovalSheet.map((pi: any) => pi.indentNo?.toString().trim()).filter(Boolean)
            );

            // Get unique pending POs/Indents
            const uniquePendingPOs = new Set<string>();
            const seenIndents = new Set<string>();

            poMasterData.forEach((po: any) => {
                const poNumber = po.poNumber?.toString().trim() || '';
                const indentNo = po.internalCode?.toString().trim() || '';
                const firmNameMatch = po.firmNameMatch?.trim() || '';
                const status = po.status?.toLowerCase()?.trim() || '';
                const userFirm = user?.firmNameMatch?.toLowerCase() || '';

                if (!poNumber) return;

                // Skip if already approved (by PO or Indent)
                if (approvedPONumbers.has(poNumber) || approvedIndentNumbers.has(indentNo)) return;

                // Filter by status and firm
                if (status !== 'pending' && status !== '') return;
                if (userFirm !== 'all' && firmNameMatch.toLowerCase() !== userFirm) return;

                // Only count unique indents to match "latest revision" logic in UI
                if (indentNo && seenIndents.has(indentNo)) return;
                if (indentNo) seenIndents.add(indentNo);

                uniquePendingPOs.add(poNumber);
            });

            return uniquePendingPOs.size;
        }
    },
    // In your routes configuration
    {
        name: 'Fixed Asset Payment',
        path: 'Make-Payment',
        icon: <CreditCard size={18} />,
        element: <MakePayment />,
        notifications: (sheetData: any[], context?: any) => {
            if (!sheetData || !Array.isArray(sheetData)) return 0;

            // Get user firm from context
            const userFirm = context?.user?.firmNameMatch || 'all';

            // Get paymentHistorySheet from context
            const paymentHistorySheet = context?.paymentHistorySheet || [];

            // Create Set of paid indent numbers from Payment History
            const paidIndentNumbers = new Set();

            paymentHistorySheet.forEach((item: any) => {
                const indentNo = item.uniqueNumber || item['Unique Number'] || item['UniqueNumber'];
                if (indentNo) {
                    paidIndentNumbers.add(indentNo.toString().trim());
                }
            });

            // Count items that meet the criteria (matching MakePayment.tsx logic)
            const pendingPayments = sheetData.filter((item: any) => {
                // Filter by firm
                const firmMatch = item.firmNameMatch || '';
                const matchesFirm = userFirm.toLowerCase() === "all" || firmMatch === userFirm;

                if (!matchesFirm) return false;

                // Get indent number
                const indentNumber = item.indentNo?.toString().trim() || '';

                // Check if already paid
                const isAlreadyPaid = indentNumber ? paidIndentNumbers.has(indentNumber) : false;

                // Check Planned and Actual conditions
                const plannedValue = item.planned?.toString().trim() || '';
                const actualValue = item.actual?.toString().trim() || '';

                const hasPlanned = plannedValue !== '' &&
                    plannedValue !== 'N/A' &&
                    plannedValue !== 'null' &&
                    plannedValue !== 'undefined';

                const hasActual = actualValue !== '' &&
                    actualValue !== 'N/A' &&
                    actualValue !== 'null' &&
                    actualValue !== 'undefined';

                // Check if payment form exists
                const hasPaymentForm = item.paymentForm?.toString().trim() !== '' &&
                    item.paymentForm?.toString().trim() !== 'N/A';

                // Return true if all conditions are met
                return !isAlreadyPaid && hasPlanned && !hasActual && hasPaymentForm;
            });

            return pendingPayments.length;
        }
    },

    // {
    //     path: 'exchange-materials',
    //     gateKey: 'exchangeMaterials',  // ✅ Fixed: use existing permission
    //     // Kept similar but different
    //     name: 'Exchange Materials',
    //     icon: <PackageCheck size={20} />,
    //     element: <Exchange />,
    //     notifications: () => 0,
    // },

    // {
    //     path: 'Payment-Status',
    //     name: 'Payment Status',
    //     icon: <RotateCcw size={20} />,
    //     element: <PaymentStatus />,
    //     notifications: (paymentHistorySheet: any[]) => {
    //         if (!paymentHistorySheet || paymentHistorySheet.length === 0) {
    //             return 0;
    //         }

    //         // Count records where status is "Yes"
    //         return paymentHistorySheet.filter((record: any) => {
    //             const status = record.status || record.Status || '';
    //             return status.toString().trim().toLowerCase() === 'yes';
    //         }).length;
    //     }
    // },


    {
        path: 'Quality-Check-In-Received-Item',
        gateKey: 'insteadOfQualityCheckInReceivedItem',
        name: 'Reject For GRN',
        icon: <Users size={20} />,
        element: <QuantityCheckInReceiveItem />,
        notifications: (sheets: any[]) => {
            if (!sheets || !Array.isArray(sheets)) return 0;

            let count = 0;

            // Debug: Show what's being counted
            const debugItems = [];

            sheets.forEach((sheet: any, index: number) => {
                // Get all possible column names
                const planned7 = sheet.planned7 || sheet['Planned 7'] || sheet['Planned7'];
                const actual7 = sheet.actual7 || sheet['Actual 7'] || sheet['Actual7'];
                const status = sheet.status || sheet['Status'] || sheet.reject || sheet['Reject'];

                // Convert to strings and trim
                const planned7Str = planned7?.toString().trim() || '';
                const actual7Str = actual7?.toString().trim() || '';
                const statusStr = status?.toString().trim().toLowerCase() || '';

                // Check conditions
                const hasPlanned7 = planned7Str !== '';
                const hasNoActual7 = actual7Str === '';

                // Status should NOT be reject AND should not have actual7 filled
                const isNotReject = statusStr !== 'reject';

                // If it has planned7 but no actual7 AND status is not reject
                if (hasPlanned7 && hasNoActual7 && isNotReject) {
                    count++;

                    // Debug info
                    if (debugItems.length < 5) {
                        debugItems.push({
                            row: index + 1,
                            indentNo: sheet.indentNo || sheet.indentNumber || 'N/A',
                            planned7: planned7Str,
                            actual7: actual7Str,
                            status: statusStr,
                            firmNameMatch: sheet.firmNameMatch
                        });
                    }
                }
            });

            // Log debug info

            return count;
        }
    },

    // {
    //     path: 'Return-Material-To-Party',
    //     gateKey: 'returnMaterialToParty',
    //     name: 'Return Material To Party',
    //     icon: <Users size={20} />,
    //     element: <ReturnMaterialToParty />,
    //     notifications: () => 0,
    // },

    {
        path: 'Send-Debit-Note',
        gateKey: 'sendDebitNote',
        name: 'Send Debit Note',
        icon: <FilePlus2 size={20} />,
        element: <SendDebitNote />,
        notifications: (sheets: any[]) =>
            sheets.filter((sheet: any) =>
                sheet.planned9 &&
                sheet.planned9.toString().trim() !== '' &&
                (!sheet.actual9 || sheet.actual9.toString().trim() === '')
            ).length,
    },

    {
        path: 'audit-data',
        gateKey: 'auditData',
        name: 'Audit Data',
        icon: <Users size={20} />,
        element: <AuditData />,
        notifications: (sheets: any[]) =>
            sheets.filter((sheet: any) => {
                const isComp = sheet.isCompleted || sheet.is_completed;
                const hasAnyPlanned = sheet.planned1 || sheet.planned2 || sheet.planned3 || sheet.planned4 || sheet.planned5;
                return !isComp && hasAnyPlanned;
            }).length,
    },

    //    // In your routes configuration
    // {
    //     name: 'Rectify The Mistake',
    //     path: 'rectify-mistake',
    //     icon: <Calculator size={18} />,
    //     element: <RectifyTheMistake />,
    //     notifications: (sheetData: any[]) => {
    //         // Type cast to tallyEntrySheet array
    //         const tallyData = sheetData as any[];
    //         if (!tallyData || !Array.isArray(tallyData)) return 0;

    //         // Count items where planned2 is not empty and actual2 is empty
    //         const pendingRectifications = tallyData.filter((item: any) => 
    //             item.planned2 && 
    //             item.planned2 !== '' && 
    //             (!item.actual2 || item.actual2 === '')
    //         );

    //         return pendingRectifications.length;
    //     }
    // },
    //    // In your routes configuration
    // {
    //     name: 'Reauditing Data',
    //     path: 'reauditing-data',
    //     icon: <Calculator size={18} />,  // Or use <SearchCheck size={18} /> if you have it
    //     element: <ReauditData />,
    //     notifications: (sheetData: any[]) => {
    //         // Type cast to tallyEntrySheet array
    //         const tallyData = sheetData as any[];
    //         if (!tallyData || !Array.isArray(tallyData)) return 0;

    //         // Count items where planned3 is not empty and actual3 is empty
    //         const pendingReaudits = tallyData.filter((item: any) => 
    //             item.planned3 && 
    //             item.planned3 !== '' && 
    //             (!item.actual3 || item.actual3 === '')
    //         );

    //         return pendingReaudits.length;
    //     }
    // },
    //    // In your routes configuration
    // {
    //     name: 'Tally Entry',
    //     path: 'tally-entry',
    //     icon: <Calculator size={18} />,  // Or use <FileDigit size={18} /> or <BookOpen size={18} />
    //     element: <TakeEntryByTally />,
    //     notifications: (sheetData: any[]) => {
    //         // Type cast to tallyEntrySheet array
    //         const tallyData = sheetData as any[];
    //         if (!tallyData || !Array.isArray(tallyData)) return 0;

    //         // Count items where planned4 is not empty and actual4 is empty
    //         const pendingTallyEntries = tallyData.filter((item: any) => 
    //             item.planned4 && 
    //             item.planned4 !== '' && 
    //             (!item.actual4 || item.actual4 === '')
    //         );

    //         return pendingTallyEntries.length;
    //     }
    // },
    //     // In your routes configuration
    // {
    //     name: 'Again Auditing',
    //     path: 'again-auditing',
    //     icon: <Package2 size={18} />,  // Or use <SearchCheck size={18} /> or <FileSearch size={18} />
    //     element: <AgainAuditing />,
    //     notifications: (sheetData: any[]) => {
    //         // Type cast to tallyEntrySheet array
    //         const tallyData = sheetData as any[];
    //         if (!tallyData || !Array.isArray(tallyData)) return 0;

    //         // Count items where planned5 is not empty and actual5 is empty
    //         const pendingAgainAudits = tallyData.filter((item: any) => 
    //             item.planned5 && 
    //             item.planned5 !== '' && 
    //             (!item.actual5 || item.actual5 === '')
    //         );

    //         return pendingAgainAudits.length;
    //     }
    // },

    // {
    //     path: 'store-out-approval',
    //     gateKey: 'storeOutApprovalView',
    //     name: 'Store Out Approval',
    //     icon: <PackageCheck size={20} />,
    //     element: <StoreOutApproval />,
    //     notifications: (sheets: any[]) =>
    //         sheets.filter(
    //             (sheet: any) =>
    //                 sheet.planned6 !== '' &&
    //                 sheet.actual6 === '' &&
    //                 sheet.indentType === 'Store Out'
    //         ).length,
    // },
    //     {
    //     path: 'Bill-Not-Received',
    //     gateKey: 'billNotReceived',
    //     name: 'Bill Not Received',
    //     icon: <ClipboardList size={20} />,
    //     element: <BillNotReceived />,
    //     notifications: (sheets: any[]) => {
    //         // Count items where planned11 is set but actual11 is not
    //         return sheets.filter((sheet: any) => {
    //             const hasPlanned11 = sheet.planned11 && sheet.planned11.toString().trim() !== '';
    //             const noActual11 = !sheet.actual11 || sheet.actual11.toString().trim() === '';

    //             return hasPlanned11 && noActual11;
    //         }).length;
    //     },
    // },

    {
        path: 'DBforPc',
        gateKey: 'dbForPc',
        name: 'DB For PC',
        icon: <PackageCheck size={20} />,
        element: <DBforPc />,
        notifications: () => 0,
    },
    {
        path: 'administration',
        gateKey: 'administrate',
        name: 'Adminstration',
        icon: <ShieldUser size={20} />,
        element: <Administration />,
        notifications: () => 0,
    },
    {
        path: 'training-video',
        name: 'Training Video',
        icon: <VideoIcon size={20} />,
        element: <TrainnigVideo />,
        notifications: () => 0,
    },
    {
        path: 'license',
        name: 'License',
        icon: <KeyRound size={20} />,
        element: <Liecense />,
        notifications: () => 0,

    },

];

const rootElement = document.getElementById('root');
if (rootElement) {
    createRoot(rootElement).render(
        <StrictMode>
            <AuthProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route
                            path="/"
                            element={
                                <ProtectedRoute>
                                    <SheetsProvider>
                                        <App routes={routes} />
                                    </SheetsProvider>
                                </ProtectedRoute>
                            }
                        >
                            {routes.map(({ path, element, gateKey }) => (
                                <Route
                                    key={path}
                                    path={path}
                                    element={
                                        <GatedRoute identifier={gateKey}>
                                            {element}
                                        </GatedRoute>
                                    }
                                />
                            ))}
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Route>
                    </Routes>
                </BrowserRouter>
            </AuthProvider>
        </StrictMode>
    );
}

