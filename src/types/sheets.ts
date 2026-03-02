export type Sheet =
    | 'INDENT'
    | 'RECEIVED'
    | 'MASTER'
    | 'USER'
    | 'PO MASTER'
    | 'INVENTORY'
    | 'ISSUE'
    | 'STORE IN'
    | 'TALLY ENTRY'
    | 'Fullkitting'
    | 'Payment History'
    | 'VENDORS'
    | 'PI APPROVAL';  // ✅ Already included

export type IndentSheet = {
    issuedStatus: any;
    timestamp: string;
    indentNumber: string;
    firmName: string;
    indenterName: string;
    department: string;
    areaOfUse: string;
    groupHead: string;
    productName: string;
    productCode: string;
    quantity: number;
    uom: string;
    specifications: string;
    indentApprovedBy: string;
    indentType: string;
    attachment: string;
    planned1: string;
    actual1: string;
    timeDelay1: string;
    vendorType: string;
    approvedQuantity: number;
    planned2: string;
    actual2: string;
    timeDelay2: string;
    vendorName1: string;
    rate1: number;
    paymentTerm1: string;
    vendorName2: string;
    rate2: number;
    paymentTerm2: string;
    vendorName3: string;
    rate3: number;
    paymentTerm3: string;
    comparisonSheet: string;
    planned3: string;
    actual3: string;
    timeDelay3: string;
    approvedVendorName: string;
    approvedRate: number;
    approvedPaymentTerm: string;
    approvedDate: string;
    planned4: string;
    actual4: string;
    timeDelay4: string;
    poNumber: string;
    poCopy: string;
    planned5: string;
    actual5: string;
    timeDelay5: string;
    receiveStatus: string;
    planned6: string;
    actual6: string;
    timeDelay6: string;
    approvedBy: string;
    approvalDate: string;
    issuedQuantity: number;
    notes: string;
    planned7: string;
    actual7: string;
    timeDelay7: string;
    billStatus: string;
    billNumber: string;
    qty: number;
    leadTimeToLiftMaterial: string;
    typeOfBill: string;
    billAmount: number;
    discountAmount: number;
    paymentType: string;
    advanceAmountIfAny: number;
    photoOfBill: string;
    indentStatus: string;
    deliveryDate: string;
    noDay: number;
    pendingPoQty: number;
    status: string;
    poQty: string;
    totalQty: number;
    receivedQty: number;
    rowIndex: string;
    issueStatus: string;
    liftingStatus: string;
    pendingLiftQty: number;
    firmNameMatch: string;
    paymentype: string;
    approvedVendorId?: number;
    vendor1Id?: number;
    vendor2Id?: number;
    vendor3Id?: number;
};

// ✅ IMPROVED: Better field naming consistency
// Update PIApprovalSheet type with all fields from your image
// Update PIApprovalSheet type with all your columns
export type PIApprovalSheet = {
    rowIndex?: number;
    timestamp: string;
    piNo: string;                    // PI-No.
    indentNo: string;                // Indent No.
    partyName: string;               // Party Name
    productName: string;             // Product Name
    qty: number;                     // Qty
    piAmount: number;                // P.I Amount
    poRateWithoutTax: number;        // Po Rate Without Tax
    poNumber: string;                // PO Number
    deliveryDate: string;            // Delivery Date
    paymentTerms: string;            // Payment Terms
    internalCode: string;            // Internal Code
    totalPoAmount: number;           // Total PO Amount
    numberOfDays: number;            // Number Of Days
    totalPaidAmount: number;         // Total Paid Amount
    outstandingAmount: number;       // Outstanding Amount
    status: string;                  // First Status column
    planned: string;                 // Planned
    actual: string;                  // Actual
    delay: string;                   // Delay
    paymentForm: string;             // Payment Form
    firmNameMatch: string;           // Firm Name Match
    piCopy?: string;                 // PI Copy
    poCopy?: string;                 // PO Copy
    status1?: string;                // Status 1
};

export type PaymentHistory = {
    timestamp: string;
    apPaymentNumber: string;         // Standardized to camelCase
    status: string;
    uniqueNumber: string;            // Standardized to camelCase
    fmsName: string;
    payTo: string;
    amountToBePaid: number;          // Standardized to camelCase
    remarks: string;
    anyAttachments: string;
};

export type ReceivedSheet = {
    timestamp: string;
    indentNumber: string;
    poDate: string;
    poNumber: string;
    vendor: string;
    receivedStatus: string;
    receivedQuantity: number;
    uom: string;
    photoOfProduct: string;
    warrantyStatus: string;
    endDate: string;
    billStatus: string;
    billNumber: string;
    billAmount: number;
    photoOfBill: string;
    anyTransportations: string;
    transporterName: string;
    transportingAmount: number;
    actual6: string;
    damageOrder: string;
    quantityAsPerBill: string;
    priceAsPerPo: string;
    remark: string;
};

export type InventorySheet = {
    groupHead: string;
    itemName: string;
    uom: string;
    maxLevel: number;
    opening: number;
    individualRate: number;
    indented: number;
    approved: number;
    purchaseQuantity: number;
    outQuantity: number;
    current: number;
    totalPrice: number;
    colorCode: string;
};

export type PoMasterSheet = {
    rowIndex?: number;  // ✅ ADDED: Important for updates
    discountPercent: number;
    gstPercent: number;
    timestamp: string;
    partyName: string;
    poNumber: string;
    internalCode: string;
    product: string;
    description: string;
    quantity: number;
    unit: string;
    rate: number;
    gst: number;
    discount: number;
    amount: number;
    totalPoAmount: number;
    preparedBy?: string;  // ✅ ADDED: Based on your sheet
    approvedBy?: string;
    Guarantee?: string;
    FreightPayment?: string;
    pdf: string;
    quotationNumber: string;
    quotationDate: string;
    enquiryNumber: string;
    enquiryDate: string;
    deliveryDate?: string;  // ✅ ADDED: From your sheet
    paymentTerms?: string;  // ✅ ADDED: From your sheet
    numberOfDays?: number;  // ✅ ADDED: From your sheet
    term1: string;
    term2: string;
    term3: string;
    term4: string;
    term5: string;
    term6: string;
    term7: string;
    term8: string;
    term9: string;
    term10: string;
    deliveryDays: number;
    deliveryType: string;
    firmNameMatch: string;

    // ✅ ADDED: For PI Approval integration
    piApprovalTimestamp?: string;
    piQty?: number;
    piAmount?: number;
    piCopy?: string;
    poRateWithoutTax?: number;
    'Freight Payment'?: string;
};

export type Vendors = {
    id: number;
    created_at: string;
    vendor_name: string;
    rate_type: string;
    rate: number;
    with_tax: boolean;
    tax_value: number;
    payment_term: string;
    whatsapp_number: string;
    email: string;
};

export type Vendor = {
    id?: number;
    vendorName: string;
    gstin: string;
    address: string;
    email: string;
};

export type MasterSheet = {
    vendors: Vendor[];
    vendorNames: string[];
    paymentTerms: string[];
    departments: string[];
    groupHeads: Record<string, string[]>; // category: items[]
    companyName: string;
    companyAddress: string;
    companyGstin: string;
    companyPhone: string;
    billingAddress: string;
    companyPan: string;
    destinationAddress: string;
    defaultTerms: string[];
    uoms: string[];
    firmsnames: string[];
    firms: string[];
    fmsNames: string[];
    personNames: string[];
    locations: string[];
    partyNames: string[];
    firmCompanyMap: Record<string, {
        companyName: string;
        companyAddress: string;
        destinationAddress: string;
    }>;
};

export type UserPermissions = {
    rowIndex: number;
    username: string;
    password: string;
    name: string;
    administrate: boolean;
    createIndent: boolean;
    createPo: boolean;
    indentApprovalView: boolean;
    indentApprovalAction: boolean;
    updateVendorView: boolean;
    updateVendorAction: boolean;
    threePartyApprovalView: boolean;
    threePartyApprovalAction: boolean;
    receiveItemView: boolean;
    receiveItemAction: boolean;
    storeOutApprovalView: boolean;
    storeOutApprovalAction: boolean;
    pendingIndentsView: boolean;
    ordersView: boolean;
    poMaster: boolean;
    getPurchase: boolean;
    storeIssue: boolean;
    firmNameMatch: string;
    againAuditing: boolean;
    takeEntryByTelly: boolean;
    reauditData: boolean;
    rectifyTheMistake: boolean;
    auditData: boolean;
    sendDebitNote: boolean;
    returnMaterialToParty: boolean;
    exchangeMaterials: boolean;
    insteadOfQualityCheckInReceivedItem: boolean;
    dbForPc: boolean;
    billNotReceived: boolean;
    storeIn: boolean;
    issueData: boolean;
    piApprovalView?: boolean;
    piApprovalAction?: boolean;

    // ✅ ADD THESE NEW PERMISSIONS BASED ON YOUR SHEET HEADER
    inventory?: boolean;          // For "Inventory" access
    poHistory?: boolean;          // For "PO History" access (mentioned in sheet)
    freightPayment?: boolean;     // For "Freight Payment" access
    makePayment?: boolean;        // For "Make Payment" access
    trainingVideo?: boolean;      // For "Training Video" access
    license?: boolean;            // For "License" access
    link?: boolean;               // For "Link" access (from sheet)
};


export const allPermissionKeys = [
    "administrate",
    "storeIssue",           // Updated to match sheet header
    "issueData",            // Updated to match sheet header
    "inventory",            // Added
    "createIndent",
    "createPo",
    "indentApprovalView",
    "indentApprovalAction",
    "updateVendorView",
    "updateVendorAction",
    "threePartyApprovalView",
    "threePartyApprovalAction",
    "receiveItemView",
    "receiveItemAction",
    "storeOutApprovalView",
    "storeOutApprovalAction",
    "pendingIndentsView",
    "ordersView",
    "poMaster",
    "getPurchase",          // From sheet
    "againAuditing",
    "takeEntryByTelly",
    "reauditData",
    "rectifyTheMistake",
    "auditData",
    "sendDebitNote",
    "returnMaterialToParty",
    "exchangeMaterials",
    "insteadOfQualityCheckInReceivedItem",
    "dbForPc",
    "billNotReceived",
    "storeIn",
    "poHistory",            // Added
    "freightPayment",       // Added
    "makePayment",          // Added
    "trainingVideo",        // Added
    "license",              // Added
    "link",                 // Added
    "piApprovalView",
    "piApprovalAction",
] as const;

export type IssueSheet = {
    timestamp: string;
    rowIndex: number;
    issueNo: string;
    issueTo: string;
    uom: string;
    groupHead: string;
    productName: string;
    quantity: number;
    department: string;
    planned1?: string;
    actual1?: string;
    timeDelay1?: string;
    status: string;
    givenQty?: number;
};

export type StoreInSheet = {
    rowIndex?: number;
    timestamp: string;
    liftNumber: string;
    indentNo: string;
    billNo: string;
    vendorName: string;
    productName: string;
    qty: number;
    leadTimeToLiftMaterial: number;
    discountAmount: number;
    typeOfBill: string;
    billAmount: number;
    paymentType: string;
    advanceAmountIfAny: string;
    photoOfBill: string;
    transportationInclude: string;
    transporterName: string;
    amount: number;
    warrantyStatus: string;
    endDateWarrenty: string;
    planned6: string;
    actual6: string;
    timeDelay6: string;
    sendDebitNote: string;
    receivingStatus: string;
    billStatus: string;
    receivedQuantity: number;
    photoOfProduct: string;
    unitOfMeasurement: string;
    damageOrder: string;
    quantityAsPerBill: string;
    priceAsPerPo: number;
    remark: string;
    debitNoteCopy: string;
    planned7: string;
    actual7: string;
    timeDelay7: string;
    status: string;
    reason: string;
    billNumber: string;
    planned8: string;
    actual8: string;
    delay8: string;
    statusPurchaser: string;
    planned9: string;
    actual9: string;
    timeDelay9: string;
    billCopy: string;
    returnCopy: string;
    debitnotenumber: string;
    planned10: string;
    actual10: string;
    timeDelay10: string;
    warrenty: string;
    billReceived: string;
    billAmount2: string;
    billImage: string;
    exchangeQty: string;
    billNumber2: string;
    poDate: string;
    poNumber: string;
    vendor: string;
    indentNumber: string;
    product: string;
    uom: string;
    quantity: number;
    poCopy: string;
    planned11: string;
    actual11: string;
    timeDelay11: string;
    billStatusNew: string;
    materialStatus: string;
    vehicleNo: string;
    driverName: string;
    driverMobileNo: string;
    billImageStatus: string;
    billRemark: string;
    productAsPerPack?: string;
    // DB columns saved but previously not fetched back
    indentDate?: string;
    indentQty?: number;
    materialDate?: string;
    partyName?: string;
    location?: string;
    area?: string;
    notBillReceivedNo?: string;
    indentedFor?: string;
    approvedPartyName?: string;
    rate?: number;
    totalRate?: number;
    liftingStatus?: string;
    firmNameMatch: string;
};

export type TallyEntrySheet = {
    timestamp: string;
    indentNo: string;
    purchaseDate: string;
    indentDate: string;
    indentNumber: string;
    liftNumber: string;
    poNumber: string;
    materialInDate: string;
    productName: string;
    billNo: string;
    qty: number;
    vendorName: string;
    billAmt: number;
    billStatus: string;
    billImage: string[] | string;
    billReceivedLater: boolean | string;
    notReceivedBillNo: string;
    location: string;
    typeOfBills: string;
    productImage: string[] | string;
    area: string;
    indentedFor: string;
    approvedVendorName: string;
    rate: number;
    indentQty: number;
    totalRate: number;
    planned1: string;
    actual1: string;
    delay1: string;
    status1: string;
    remarks1: string;
    planned2: string;
    actual2: string;
    delay2: string;
    status2: string;
    remarks2: string;
    planned3: string;
    actual3: string;
    delay3: string;
    status3: string;
    remarks3: string;
    planned4: string;
    actual4: string;
    delay4: string;
    status4: string;
    remarks4: string;
    planned5: string;
    actual5: string;
    delay5: string;
    status5: string;
    remarks5?: string;
    rowIndex: string;
    firmNameMatch: string;
    isCompleted?: boolean;
    approvedVendorId?: number;
};


// In your SheetContext types file
export type FullkittingSheet = {
    rowIndex?: number;
    timestamp: string;
    indentNumber: string;
    vendorName: string;
    productName: string;
    qty: number;
    billNo: string;
    transportingInclude: string;
    transporterName: string;
    amount: number;
    vehicleNo: string;
    driverName: string;
    driverMobileNo: string;
    planned: string;
    actual: string;
    timeDelay: string;
    fmsName: string;
    status?: string;
    vehicleNumber?: string;
    from?: string;
    to?: string;
    materialLoadDetails?: string;
    biltyNumber?: number;
    rateType?: string;
    amount1: number;
    biltyImage?: string;
    firmNameMatch: string;

    // ✅ NEW COLUMNS ADDED
    planned1?: string;           // New Planned column for freight payment
    actual1?: string;            // New Actual column for freight payment
    timeDelay1?: string;         // New Time Delay column for freight payment
    paymentForm?: string;        // Payment Form column
    fFPPaymentNumber?: string;   // FFP-Payment Number column
};