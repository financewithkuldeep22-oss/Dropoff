// =====================================================================
// CONSTANTS & HELPERS
// =====================================================================
const BACKUP_SHEET_URL = "https://script.google.com/macros/s/AKfycbxyCr7RtqFSGkKcs87TV2Oc_xNrxGsJtkYCDh9U8UD0ciSkoajNFpF60PKDNaZ1E0QN/exec";

const SVG = {
    check: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    x:     '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
    trash: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>'
};

// =====================================================================
// GLOBAL DROPDOWN HANDLERS
// =====================================================================
function toggleDropdown(id) {
    document.getElementById(id).classList.toggle('hidden');
}
document.addEventListener('click', function(event) {
    const downloadMenu = document.getElementById('download-menu');
    const downloadBtn = document.getElementById('download-btn-container');
    if (downloadMenu && downloadBtn && !downloadBtn.contains(event.target)) {
        downloadMenu.classList.add('hidden');
    }
    
    const docMenu = document.getElementById('doc-type-menu');
    const docBtn = document.getElementById('doc-type-btn');
    if (docMenu && docBtn && !docBtn.contains(event.target) && !docMenu.contains(event.target)) {
        docMenu.classList.add('hidden');
    }

    // Close item comboboxes
    if (!event.target.closest('.combo-container')) {
        document.querySelectorAll('.combobox-dropdown').forEach(el => el.remove());
    }
});

// =====================================================================
// MODAL HELPER
// =====================================================================
function showModal(message, type = 'alert', onConfirm = null) {
    const modal = document.getElementById('custom-modal');
    const msgEl = document.getElementById('modal-message');
    const cancelBtn = document.getElementById('modal-cancel');
    const confirmBtn = document.getElementById('modal-confirm');

    msgEl.innerText = message;
    
    // Setup button handlers before opening to avoid animation lag
    const hideWithAnim = (callback) => {
        closeModal('custom-modal');
        setTimeout(() => {
            if (callback) callback();
        }, 200); // Wait for close animation
    };

    if (type === 'alert') {
        cancelBtn.classList.add('hidden');
        confirmBtn.innerHTML = SVG.check + ' OK';
        confirmBtn.onclick = () => { hideWithAnim(onConfirm); };
    } else if (type === 'confirm') {
        cancelBtn.classList.remove('hidden');
        confirmBtn.innerHTML = SVG.check + ' Confirm';
        cancelBtn.innerHTML = SVG.x + ' Cancel';
        cancelBtn.onclick = () => { hideWithAnim(); };
        confirmBtn.onclick = () => { hideWithAnim(onConfirm); };
    }
    
    openModal('custom-modal');
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    const colors = {
        success: 'bg-emerald-600 text-white shadow-emerald-900/20',
        error: 'bg-red-600 text-white shadow-red-900/20',
        info: 'bg-[#053763] text-white shadow-blue-900/20'
    };
    const icons = {
        success: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
        error: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
        info: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
    };
    toast.className = `toast-msg flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl font-bold text-xs pointer-events-auto border border-white/10 ${colors[type] || colors.info}`;
    toast.innerHTML = `${icons[type] || icons.info} <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 250);
    }, 3200);
}

function showLoadingOverlay(text = "Generating High-Resolution PDF...") {
    const el = document.getElementById('pdf-loading-overlay');
    const txt = document.getElementById('pdf-loading-text');
    if (txt) txt.textContent = text;
    if (el) {
        const isHidden = el.classList.contains('hidden');
        el.classList.remove('hidden');
        if (isHidden && window.gsap) gsap.fromTo(el.firstElementChild, { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.25, ease: "power2.out" });
    }
}

function hideLoadingOverlay() {
    const el = document.getElementById('pdf-loading-overlay');
    if (el) el.classList.add('hidden');
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        ['custom-modal', 'onboarding-modal', 'post-download-modal', 'download-confirm-modal', 'bulk-challan-modal', 'mail-log-modal', 'history-detail-modal', 'bulk-settings-modal'].forEach(id => {
            const m = document.getElementById(id);
            if (m && !m.classList.contains('hidden')) closeModal(id);
        });
        const hist = document.getElementById('history-view');
        if (hist && !hist.classList.contains('hidden')) toggleHistory();
        document.querySelectorAll('.combobox-dropdown').forEach(el => el.remove());
    }
});

// =====================================================================
// SESSION STATE
// =====================================================================
let currentDocType = 'DC'; // 'DC' or 'GP'

let sessionData = {
    contextType: "camp",
    recipientName: "",
    recipientAddress: "",
    clientName: "",
    city: "",
    state: "",
    pincode: "",
    requestedBy: "",
    recipientPhone: "",
    spocName: "",
    spocContact: "",
    campCode: "",
    campDate: "",
    approxCampReturn: "",
    transportNo: "NA",
    purpose: "",
    approxReturn: "",
    actualReturn: "",
    isReturnable: false,
    isNonReturnable: false,
    docIds: { DC: "", GP: "" },
    clientMailSubject: "",
    clientMailDate: "",
    ourMailSubject: "",
    ourMailDate: ""
};

let itemsData = [
    { desc: "Complete Kit with Urine Container and Gloves", hsn: "", unit: "Pcs", qty: "1", rate: "25", rem: "Consumable" }
];

function normalizeHistoryLog(list) {
    if (!Array.isArray(list)) return [];
    return list.map(item => {
        if (item && typeof item === 'object') {
            if (item.context) item.context = String(item.context).toLowerCase();
            if (item.fullSession && item.fullSession.contextType) {
                item.fullSession.contextType = String(item.fullSession.contextType).toLowerCase();
            }
            if (item.fullItems && Array.isArray(item.fullItems)) {
                const uniqueItems = [];
                const seen = new Set();
                for (const it of item.fullItems) {
                    if (!it.desc) continue;
                    const key = `${it.desc.trim().toLowerCase()}_${it.qty}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        uniqueItems.push(it);
                    }
                }
                item.fullItems = uniqueItems;
                item.items = uniqueItems.length;
                
                let tQty = 0, tVal = 0;
                uniqueItems.forEach(u => {
                    tQty += parseFloat(u.qty) || 0;
                    tVal += (parseFloat(u.qty) || 0) * (parseFloat(u.rate) || 0);
                });
                item.totalQty = tQty;
                item.totalVal = tVal > 0 ? '\u20B9' + tVal.toLocaleString('en-IN') : '-';
            }
        }
        return item;
    });
}

let historyLog = normalizeHistoryLog(JSON.parse(localStorage.getItem('rcl_dispatch_history')) || []);
let uploadedCsvRecords = [];

// =====================================================================
// INVENTORY MASTER LIST
// =====================================================================
const inventoryItems = [
    { name: "Complete Kit with Urine Container and Gloves", category: "Kits", price: 25, uom: "Pcs" },
    { name: "Complete Kit without Gloves and Urine Container", category: "Kits", price: 19, uom: "Pcs" },
    { name: "Kits (Sst & Edta)", category: "Kits", price: 15, uom: "Pcs" },
    { name: "Band-Aid", category: "Medical Consumables", price: 1, uom: "Pcs" },
    { name: "Blood Ziplock", category: "Medical Consumables", price: 1, uom: "Pcs" },
    { name: "Bp Machine", category: "Equipment", price: 1500, uom: "Nos" },
    { name: "Ecg Gel", category: "Medical Consumables", price: 50, uom: "Pcs" },
    { name: "Edta Vial", category: "Medical Consumables", price: 5, uom: "Nos" },
    { name: "Fluoride Vial", category: "Medical Consumables", price: 5, uom: "Nos" },
    { name: "Gloves Box", category: "Medical Consumables", price: 180, uom: "Nos" },
    { name: "Holder", category: "Medical Consumables", price: 5, uom: "Nos" },
    { name: "Lbc Kits", category: "Medical Consumables", price: 20, uom: "Pcs" },
    { name: "Lithium Heparin", category: "Medical Consumables", price: 5, uom: "Nos" },
    { name: "Marker", category: "Stationery", price: 10, uom: "Nos" },
    { name: "Mask", category: "Medical Consumables", price: 10, uom: "Pcs" },
    { name: "Needle", category: "Medical Consumables", price: 5, uom: "Nos" },
    { name: "Sanitizer", category: "Medical Consumables", price: 20, uom: "Pcs" },
    { name: "Sodium Citrate", category: "Medical Consumables", price: 5, uom: "Nos" },
    { name: "Sodium Heparin", category: "Medical Consumables", price: 5, uom: "Nos" },
    { name: "Sst Vial", category: "Medical Consumables", price: 7, uom: "Nos" },
    { name: "Swab", category: "Medical Consumables", price: 1, uom: "Nos" },
    { name: "Syringe 3Ml", category: "Medical Consumables", price: 5, uom: "Nos" },
    { name: "Syringe 5Ml", category: "Medical Consumables", price: 7, uom: "Nos" },
    { name: "T-Shirt", category: "Marketing", price: 350, uom: "Nos" },
    { name: "Tourniquet", category: "Medical Consumables", price: 15, uom: "Nos" },
    { name: "Urethal Swab", category: "Medical Consumables", price: 10, uom: "Nos" },
    { name: "Urine Container", category: "Medical Consumables", price: 1, uom: "Nos" },
    { name: "Urine Ziplock", category: "Medical Consumables", price: 1, uom: "Nos" },
    { name: "Weight Machine", category: "Equipment", price: 500, uom: "Nos" },
    { name: "Thermocol Box", category: "Medical Consumables", price: 20, uom: "Nos" },
    { name: "Gel Pack", category: "Medical Consumables", price: 10, uom: "Nos" },
    { name: "Garbage Bag", category: "Medical Consumables", price: 20, uom: "Nos" },
    { name: "Alcohol Swab", category: "Medical Consumables", price: 1, uom: "Pcs" },
    { name: "Butterfly Needle", category: "Medical Consumables", price: 5, uom: "Pcs" },
    { name: "Cotton (Roll 500gm)", category: "Medical Consumables", price: 130, uom: "Roll" },
    { name: "Disposal Syringe (5ml)", category: "Medical Consumables", price: 4, uom: "Pcs" },
    { name: "Disposal Syringe (10ml)", category: "Medical Consumables", price: 5, uom: "Pcs" },
    { name: "Disposal Syringe (3ml)", category: "Medical Consumables", price: 3, uom: "Pcs" },
    { name: "Gloves Nitrile (Box of 100)", category: "Medical Consumables", price: 450, uom: "Box" },
    { name: "Lancet Needle", category: "Medical Consumables", price: 1, uom: "Pcs" },
    { name: "Urine Container (Non Sterile)", category: "Medical Consumables", price: 3, uom: "Pcs" },
    { name: "Urine Container (Sterile)", category: "Medical Consumables", price: 8, uom: "Pcs" },
    { name: "Stool Container", category: "Medical Consumables", price: 10, uom: "Pcs" },
    { name: "Spirit (500ml)", category: "Medical Consumables", price: 60, uom: "Bottle" }
];

// =====================================================================
// SMART CLINIC & PARTNER AUTOCOMPLETE PRESETS
// =====================================================================
const CLINIC_PRESETS = [{"clinicName":"Moon Beverages Limited","clientName":"PolicyBazaar","partnerCode":"COCACF59368","recipientAddress":"Plot no 109, Sector 44 Rd, B, Sector 44, Gurugram, Haryana 122003","city":"Gurgaon","state":"","pincode":122003,"spocName":"Muskan Sood","spocContact":8130209565,"transportNo":"Porter"},{"clinicName":"Visit - Bangalore Clinic","clientName":"Visit_Tatva Bangalore Clinic","partnerCode":"Visit_Tatva Bangalore Clinic","recipientAddress":"Ground floor, Visit Clinic, Marathahalli - Sarjapur Outer Ring Rd, Chandana, Bengaluru, Karnataka 560103","city":"Banglore","state":"Karnataka","pincode":560103,"spocName":"98846 69257","spocContact":"Ratna","transportNo":"Rider"},{"clinicName":"Allohealth - Asha Clinic_Jaipur","clientName":"Allohealth","partnerCode":"Allohealth(CORP11694)","recipientAddress":"Chamber 101, Asha Clinic, 69, Sirsi Rd, near Dmart, opposite Hotel Nilax, Officers Campus Extension, Hanuman Nagar Extension, Officers Campus, Khatipura, Jaipur, Rajasthan 302012","city":"Jaipur","state":"Rajasthan","pincode":302012,"spocName":"Ritesh","spocContact":6376507533,"transportNo":"Rider"},{"clinicName":"Allohealth - Velachery","clientName":"Allohealth","partnerCode":"Allohealth(CORP11694)","recipientAddress":"Allo Sexual Health Clinic, Ground floor, Lapser Multispeciality Clinic, 25, 15th St, below Apollo Dental, Tansi Nagar, Velachery, Chennai, Tamil Nadu 600042","city":"Chennai","state":"Tamil Nadu","pincode":600042,"spocName":"Karthikeyan","spocContact":9384375801,"transportNo":"rider"},{"clinicName":"VLSR Clinic - Allohealth","clientName":"Allohealth","partnerCode":"Allohealth(CORP11694)","recipientAddress":"Allo Health, VLSR The Clinic, 2nd floor, corinthian, Linking Rd, opposite DBS bank, Khar, Khar West, Mumbai, Maharashtra 400052.","city":"Mumbai","state":"Maharashtra","pincode":400052,"spocName":"Mohammad ","spocContact":" 77387 51496","transportNo":"Rider"},{"clinicName":"Allohealth- Bundgarden","clientName":"Allohealth","partnerCode":"Allohealth(CORP11694)","recipientAddress":"Aadhar Polyclinic G41/B30, Akshay Condominium, Complex, Dhole Patil Road, Pune -  411001","city":"Bundgarden ","state":"Maharashtra","pincode":411001,"spocName":"Ajay ","spocContact":9922829251,"transportNo":"RIDER"},{"clinicName":"Allohealth-Kolhapur","clientName":"Allohealth","partnerCode":"Allohealth(CORP11694)","recipientAddress":"SHREYAS MULTISPECIALITY HOSPITAL 152/B/2, Hanuman Nagar, Ujalaiwadi, Maharashtra 416004","city":"Kolhapur ","state":"Maharashtra","pincode":416004,"spocName":"Ajay ","spocContact":9922829251,"transportNo":"RIDER"},{"clinicName":"Noida - Incuspaze","clientName":"Alyve/IBM","partnerCode":"-","recipientAddress":"IBM pvt ltd, Green Boulevard, B-9/A, B Block, Noida Sec-62, UP- 201309, UP","city":"Noida","state":"Uttarpradesh","pincode":201309,"spocName":"Neeraj Kumar","spocContact":9968894429,"transportNo":"Courier"},{"clinicName":"Noida - Table space","clientName":"Alyve/IBM","partnerCode":"-","recipientAddress":"IBM pvt ltd, 12th Floor, BPTP capital city, Sector-94, Noida 201301, UP","city":"Noida","state":"Uttarpradesh","pincode":201301,"spocName":"Varsha Kaushal","spocContact":8588850532,"transportNo":"Courier"},{"clinicName":"BNY Mellon International Operations India Private Ltd","clientName":"Bajaj Corporate","partnerCode":"33AAKCR7631M1ZY","recipientAddress":"BNY Mellon Technology Pvt Ltd, Ground Floor, Coral Block 3, Embassy Splendid Tech Zone, 181/183, Pallavaram Thoraipakkam Radial Road, Pallavaram, Chennai � 600043, TN","city":"Chennai","state":"Tamilnadu","pincode":600043,"spocName":"Deepthi Murugesan","spocContact":9789337327,"transportNo":"Courier"},{"clinicName":"Allohealth - Chinchwad","clientName":"Allohealth","partnerCode":"Allohealth(CORP11694)","recipientAddress":"Shree Sadguru Multi-speciality Hospital, Talawad RD, Vishwamala Housing society, Adaresh Society, Triveni nagar, Chikali, Pimpri Chinchwad, Pune-411062, Maharashtra","city":"Pune","state":"Maharashtra","pincode":411062,"spocName":"Ganesh","spocContact":7620649180,"transportNo":"Rider"},{"clinicName":"Allohealth - Baner","clientName":"Allohealth","partnerCode":"Allohealth(CORP11694)","recipientAddress":"Baner Multi-speciality Clinic, 1 st floor, OPD 3, PMC Garden, Pan card Club RD, Gaon, Baner, Pune-411069, Maharashtra","city":"Pune","state":"Maharashtra","pincode":411069,"spocName":"Snehal","spocContact":9356183430,"transportNo":"Rider"},{"clinicName":"Allohealth - Katarj","clientName":"Allohealth","partnerCode":"Allohealth(CORP11694)","recipientAddress":"Dosti apartments N, Shree Sainath Hospital, Trimurti Chowk, Chandrabhaganagar, Katraj, Pune-411043, Maharashtra","city":"Pune","state":"Maharashtra","pincode":411043,"spocName":"Abdul","spocContact":7775079389,"transportNo":"Rider"},{"clinicName":"Allohealth - Kothrud","clientName":"Allohealth","partnerCode":"Allohealth(CORP11694)","recipientAddress":"1st, floor, DMS Diagnostics, above VAN Heusen showroom, Ramakrishna Paramhansnagar, Kothrud, Pune - 411038, Maharashtra","city":"Pune","state":"Maharashtra","pincode":411038,"spocName":"Mayur","spocContact":7219077440,"transportNo":"Rider"},{"clinicName":"Allohealth -  Kharadi","clientName":"Allohealth","partnerCode":"Allohealth(CORP11694)","recipientAddress":"2 nd floor,near city lights, Acolad RD, Bypass RD, Kharadi, Pune-411014, Maharashtra","city":"Pune","state":"Maharashtra","pincode":411014,"spocName":"Lavanya","spocContact":8197729044,"transportNo":"Rider"},{"clinicName":"Allohealth - Hadapsar","clientName":"Allohealth","partnerCode":"Allohealth(CORP11694)","recipientAddress":"Savali multi-speciality clinic, Yash Complex, 1 st floor, Bhosale garden RD, Hadapsar, Pune. 411028, Maharashtra","city":"Pune","state":"Maharashtra","pincode":411028,"spocName":"Sarika","spocContact":7498291630,"transportNo":"Rider"},{"clinicName":"BangaloreBCIT (Mandarin)","clientName":"RCL","partnerCode":"-","recipientAddress":"715, 7th Floor, Tower C Unitech Cyber Park","city":"Gurgaon","state":"Haryana","pincode":122003,"spocName":"Riwan","spocContact":9410400414,"transportNo":"Courier"},{"clinicName":"Allohealth - Surat","clientName":"Allohealth","partnerCode":"Allohealth(CORP11694)","recipientAddress":"4th Floor, Atlanta Mall, Bombay Multi Speciality Hospital, Bhimrad-Althan Rd, Apcha Nagar, Bhimrad, Surat, Gujarat 395017","city":"Surat","state":"Gujarat","pincode":395017,"spocName":"Keyur","spocContact":7573031519,"transportNo":"rider"},{"clinicName":"Allohealth - Ranchi","clientName":"Allohealth","partnerCode":"Allohealth(CORP11694)","recipientAddress":"B, 327, Jeevah Health Care, Rd Number 4, Ashok Kunj, Ashok Nagar, Ranchi, Jharkhand 834002","city":"Ranchi","state":"Jharkhand ","pincode":834002,"spocName":"Rakshitha","spocContact":9304758905,"transportNo":"rider"},{"clinicName":"Allohealth - Mysuru","clientName":"Allohealth","partnerCode":"Allohealth(CORP11694)","recipientAddress":"Darlas Health Care – Endocrinologist & Diabetes, Chamber No. 10, 1st Floor, New CH 44th Main, Swimming Pool Rd, JSS College Road, Saraswathipuram, Mysuru, Karnataka 570005","city":"Mysuru","state":"Karnataka","pincode":570005,"spocName":"Apsara","spocContact":9019800948,"transportNo":"rider"},{"clinicName":"Alyve/IBM","clientName":"Alyve/IBM","partnerCode":"-","recipientAddress":"IBM pvt ltd, 6th Floor, Building no. 5&6, Airoli Mindspace, Navi-Mumbai, 400708, MH","city":"Mumbai","state":"Maharashtra","pincode":400708,"spocName":"Prashant","spocContact":8007684663,"transportNo":"Poter"},{"clinicName":"Bangalore - EGL Pine Valley","clientName":"Alyve/IBM","partnerCode":"-","recipientAddress":"IBM pvt ltd, Block C , Embassy Golf Links Road, Embassy Golf Links Business Park, Domlur, Bengaluru, Karnataka 560071, KR","city":"Bangalore","state":"Karnataka","pincode":122002,"spocName":"Ganesh S","spocContact":9600444020,"transportNo":"Courier"},{"clinicName":"Bangalore - Bhagmane Solarium City, Radon","clientName":"Alyve/IBM","partnerCode":"-","recipientAddress":"IBM pvt ltd, 356, Chinnappanahalli Main Road, Bengaluru East, Karnataka, KR","city":"Bangalore","state":"Karnataka","pincode":122002,"spocName":"Santhosh ","spocContact":9741978292,"transportNo":"Courier"},{"clinicName":"Coimbatore - Indialand KGISL-SEZ","clientName":"Alyve/IBM","partnerCode":"","recipientAddress":"IBM India Private Limited, 3rd Floor, Tower-B, India land Tech park, KGISL-SEZ, Keeranatham, Coimbatore-641035, TN","city":"Coimbatore","state":"Tamilnadu","pincode":122002,"spocName":"Prakash","spocContact":8124363386,"transportNo":"Courier"},{"clinicName":"Ahmedabad - Titanium City","clientName":"Alyve/IBM","partnerCode":"-","recipientAddress":"IBM pvt ltd, 1, Ground Floor, Titanium City Centre, Near Prahlad Nagar Garden, Corporate Road, Prahladnagar, Ahmedabad - 380015, GJ","city":"Ahmedabad","state":"Gujrat","pincode":201306,"spocName":"Prince Kumar","spocContact":9680276401,"transportNo":"Courier"},{"clinicName":"Zydus Lifesciences","clientName":"Visit Health","partnerCode":"-","recipientAddress":"Zydus Pharmaceutical Technology Centre (PTC)Company: Zydus Lifesciences LimitedLocation: Sarkhej-Bavla NH No. 8382210A, Moraiya, Taluka: Sanand, Ahmedabad, Gujarat 382210, GJ","city":"Moraiya","state":"","pincode":382210,"spocName":"Saurin Shah","spocContact":9904362211,"transportNo":"Courier"},{"clinicName":"N/A","clientName":"Visit Health","partnerCode":"-","recipientAddress":"Zydus Pharmaceutical Technology Centre (PTC)Company: Zydus Lifesciences LimitedLocation: Sarkhej-Bavla NH No. 8382210A, Moraiya, Taluka: Sanand, Ahmedabad, Gujarat 382210","city":"Ahmedabad","state":"GJ","pincode":382210,"spocName":"Saurin Shah","spocContact":9904362211,"transportNo":"Courier"},{"clinicName":"HyderabadMindspace","clientName":"Alyve/IBM","partnerCode":"-","recipientAddress":"IBM pvt ltd, SUNDEW Property Private Limited., 11th Floor ,Mind Space Building, Survey No. 64, TSIIC, Software Units Layout, Madhapur, Hyderabad, Telangana 500081, TG","city":"Hyderabad","state":"Telangana","pincode":500081,"spocName":"Poulraju Eleti","spocContact":7702493777,"transportNo":"Courier"},{"clinicName":"BangaloreMTP- D4","clientName":"Alyve/IBM","partnerCode":"-","recipientAddress":"IBM India Pvt Ltd, BLOCK D4, MANYATA EMBASSY-BUSINESS PARK (MEBP) OUTER RING ROAD, RACHENA HALLI, NAGAVARA, Bangalore 560045, KR","city":"Bangalore","state":"Karnataka","pincode":560045,"spocName":"Navarasu","spocContact":9751080568,"transportNo":"Courier"},{"clinicName":"BangaloreMTP- G2","clientName":"Alyve/IBM","partnerCode":"-","recipientAddress":"IBM India Pvt Ltd, BLOCK G2, MANYATA EMBASSY-BUSINESS PARK (MEBP) OUTER RING ROAD, RACHENA HALLI, NAGAVARA, Bangalore 5600453, KR","city":"Bangalore","state":"Karnataka","pincode":600453,"spocName":"Gnanaprakasan","spocContact":8012648586,"transportNo":"Courier"},{"clinicName":"MumbaiAiroli","clientName":"Alyve/IBM","partnerCode":"-","recipientAddress":"IBM pvt ltd, 6th Floor, Building no. 5&6, Airoli Mindspace, Navi-Mumbai, 400708, MH","city":"Mumbai","state":"Maharashtra","pincode":400708,"spocName":"Prashant","spocContact":8007684663,"transportNo":"Courier"},{"clinicName":"BHMC Clinic Bokaro","clientName":"Bharat Home Medicare (BHMC)","partnerCode":"Bharat Home Medicare (BHMC)(CORP20769)","recipientAddress":"ELECTROSTEEL VEDANTA,16 KHATA, HUNDRU GATE, VILL AND PS SIYALJURI, PO-JOGIDIH, PIN 827013","city":"Bokaro","state":"Jharkhand","pincode":827013,"spocName":"Dalip","spocContact":"62396 75041","transportNo":"Rider"},{"clinicName":"Gurgaon Intellion Park","clientName":"Alyve/IBM","partnerCode":"-","recipientAddress":"IBM India Pvt. Ltd. - Intellion Park 7th (P), 8th, 9th, 10th, 11th & 12th floors, Tower 04 ; Electronic Hardware, IT/ITES SEZ of Mikado Realtors Private Limited at Village Behrampur, District Gurugram (Haryana) 122004, Haryana","city":"Gurgaon","state":"Haryana","pincode":120001,"spocName":"Mayank","spocContact":7042545699,"transportNo":"Courier"},{"clinicName":"PuneETZ -Cong","clientName":"Alyve/IBM","partnerCode":"-","recipientAddress":"IBM pvt ltd, Embassy tech zone , Block 1.1 Phase 2 , Cong 1.3-A & B, near to wipro circle , Rajiv Gandhi infotech park , Hinjawadi Pune - 411057., MH","city":"Pune","state":"Maharashtra","pincode":411057,"spocName":"Sangram","spocContact":9881019296,"transportNo":"Courier"},{"clinicName":"HyderabadDivyashree Orion - INC6","clientName":"Alyve/IBM","partnerCode":"-","recipientAddress":"IBM pvt ltd, Block 6 North & South ,11th Floor ,Divyashree Tech Park Divyashree SEZ, Raidurgam Sy 66/1, Divyasree Orion Rd, Hyderabad, Telangana 500032, TG","city":"Hyderabad","state":"Telangana","pincode":500032,"spocName":"Murali","spocContact":9949552198,"transportNo":"Courier"},{"clinicName":"Bangalore BCIT - ( Phase 1 & 2 )","clientName":"Alyve/IBM","partnerCode":"-","recipientAddress":"IBM pvt ltd, BCIT Campus,Thanisandra Main Rd, Kannuru, Bengaluru, Karnataka 560064, KR","city":"Bangalore","state":"Karnataka","pincode":560064,"spocName":"Suresh ; suresh.kumar.r3@ibm.com","spocContact":7899476855,"transportNo":"Courier"},{"clinicName":"Hyderabad Divyashree Orion -INC5","clientName":"Alyve/IBM","partnerCode":"-","recipientAddress":"IBM pvt ltd, Orion B5 West ,4th floor ,Divyashree Tech Park Divyashree SEZ, Raidurgam Sy 66/1, Divyasree Orion Rd, Hyderabad, Telangana 500032, TG","city":"Hyderabad","state":"Telangana","pincode":500032,"spocName":"Murali","spocContact":9949552198,"transportNo":"Courier"},{"clinicName":"BangaloreEGLA","clientName":"Alyve/IBM","partnerCode":"-","recipientAddress":"IBM pvt ltd, Block A, Embassy Golf Links Road, Embassy Golf Links Business Park, Domlur, Bengaluru, Karnataka 560071, KR","city":"Bangalore","state":"Karnataka","pincode":560071,"spocName":"Roshni","spocContact":9916468946,"transportNo":"Courier"},{"clinicName":"PuneETZ- B1","clientName":"Alyve/IBM","partnerCode":"-","recipientAddress":"IBM pvt ltd, Embassy tech zone , Block 1.1 Phase 2 , ETZ 1.1 Tower A& B, near to wipro circle , Rajiv Gandhi infotech park , Hinjawadi Pune - 411057., MH","city":"Pune","state":"Maharashtra","pincode":411057,"spocName":"Akshay","spocContact":9657626689,"transportNo":"Courier"},{"clinicName":"HCL- Noida","clientName":"HCL - Sample Drop","partnerCode":"HCL - Sample Drop(CORP17687)","recipientAddress":"A5, Sector 24 Block A,Sector 24, Noida,Uttar Pradesh – 201301","city":"Noida","state":"Uttar Pradesh","pincode":201301,"spocName":"Reena Kumari","spocContact":7508513436,"transportNo":"rider"},{"clinicName":"Allohealth - Visakhapatnam","clientName":"Allohealth","partnerCode":"Allohealth(CORP11694)","recipientAddress":"Ground Floor, Chamber No 4, Lalit Health Care, 1-69-4/1, Rythu Bazaar Rd,opposite Anna Canteen, Opposite Rythu Bazar, Sector 4, Sector 3, MVP Colony, Visakhapatnam, Andhra Pradesh 530017","city":"Visakhapatnam","state":"Andhra Pradesh","pincode":530017,"spocName":"Deepak","spocContact":7285969226,"transportNo":"rider"},{"clinicName":"Allohealth - Navalur","clientName":"Allohealth","partnerCode":"Allohealth(CORP11694)","recipientAddress":"Allo Sexual Health Clinic, Arockiya Speciality Clinic & Diagnostics, MR Complex, 2nd Floor Chamber No. 4, 12, Rajiv Gandhi Salai, near Tollgate, Egattur, Navalur, Chennai, Tamil Nadu 600130","city":"Chennai","state":"Tamil Nadu","pincode":600130,"spocName":"Sunil","spocContact":9587673311,"transportNo":"Rider"},{"clinicName":"Allohealth - Nungambakkam","clientName":"Allohealth","partnerCode":"Allohealth(CORP11694)","recipientAddress":"Allo Sexual Health Clinic, The Birthwaye Gynaecology Clinic, 8/15, Mahalingapuram Main Rd, Mahalingapuram, Nungambakkam, Chennai, Tamil Nadu 600034","city":"Chennai","state":"Tamil Nadu","pincode":600034,"spocName":"Pandian","spocContact":9940467422,"transportNo":"rider"},{"clinicName":"Aditya Birla_Ludhiana","clientName":"Aditya Birla Wellness(CORP16101)","partnerCode":"COCAPU55980","recipientAddress":"Ground and First Floor SCO 130-132, Apra Tower, Feroze Gandhi Market, Ludhiana, Punjab  141 001., PB","city":"Ludhiana","state":"","pincode":141001,"spocName":"Vinod Kumar","spocContact":9464688228,"transportNo":"Courier"},{"clinicName":"Aditya Birla_Lucknow","clientName":"Aditya Birla Wellness(CORP16101)","partnerCode":"COCAMZ55975","recipientAddress":"Unit No. 201,202,205, 206, 207, 208 & 209, 2nd Floor, Urbanac Business Park, Plot A-1A and A1-B,Vibhuti Khand, Gomti Nagar, Lucknow, Uttar Pradesh - 226 010, UP","city":"Lucknow","state":"","pincode":226010,"spocName":"Vipin Choudhary","spocContact":9205443098,"transportNo":"Courier"},{"clinicName":"Aditya Birla_Pune","clientName":"Aditya Birla Wellness(CORP16101)","partnerCode":"COCADG55970","recipientAddress":"Unit No. 113-116, 1st Floor, Pride Silicon Plaza, S/No. 106A/2A/7A, Shivaji Nagar, Pune 411016, MH","city":"Pune","state":"Maharashtra","pincode":411016,"spocName":"Manoranjan Kumar","spocContact":8308821592,"transportNo":"Courier"},{"clinicName":"Aditya Birla_Mumbai","clientName":"Aditya Birla Wellness(CORP16101)","partnerCode":"COCAJS55965","recipientAddress":"10th Floor, R-TECH PARK, Nirlon Complex, Off Western Express Highway , Goregaon (E) Mumbai- 400063, MH","city":"Mumbai","state":"Maharashtra","pincode":400063,"spocName":"Nilesh Sagwekar","spocContact":9702212999,"transportNo":"Courier"},{"clinicName":"Aditya Birla_Thane","clientName":"Aditya Birla Wellness(CORP16101)","partnerCode":"COCASA55960","recipientAddress":"C/o Aditya Birla Finance Ltd, Gcorp Tech Park, 5th Floor, Ghodbunder Rd, Next to Hypercity Mall, Thane - 400601, MH","city":"Thane","state":"","pincode":400601,"spocName":"Aniket Rajkumar Kharat","spocContact":9768283508,"transportNo":"Courier"},{"clinicName":"Aditya Birla_Jaipur","clientName":"Aditya Birla Wellness(CORP16101)","partnerCode":"COCA9055950","recipientAddress":"1st, 2nd & 3rd Floor, C-23, Ashok Marg, C-Scheme Jaipur, Rajasthan  302001, RJ","city":"Jaipur","state":"","pincode":302001,"spocName":"Peeyus Sharma","spocContact":9887242082,"transportNo":"Courier"},{"clinicName":"Aditya Birla_Indore","clientName":"Aditya Birla Wellness(CORP16101)","partnerCode":"COCA5255945","recipientAddress":"Benchmark Business Park, 5th Floor, Block No A-3, Scheme No-54, PU-4, Opposite Satya Sai School, Vijaynagar, Indore-452010, MP","city":"Indore","state":"Madhyapradesh","pincode":452010,"spocName":"Tushar Gupta","spocContact":8982599072,"transportNo":"Courier"},{"clinicName":"Aditya Birla_Secunderabad","clientName":"Aditya Birla Wellness(CORP16101)","partnerCode":"COCAII55940","recipientAddress":"3rd and 4th Floor, Mayfair Complex, Opp. Hockey Stadium, S. P. Road, Secunderabad, District Hyderabad, Telangana  500003, TG","city":"Secunderabad","state":"","pincode":500003,"spocName":"G V V Shiva Prasad","spocContact":8367722888,"transportNo":"Courier"},{"clinicName":"Aditya Birla_Ranchi","clientName":"Aditya Birla Wellness(CORP16101)","partnerCode":"COCA7755935","recipientAddress":"3rd Floor, Saluja Tower, Pepee Compound, Ranchi, Jharkhand  834 001., JH","city":"Ranchi","state":"","pincode":834001,"spocName":"Mdjamshaid Khan","spocContact":9958437640,"transportNo":"Courier"},{"clinicName":"Aditya Birla_Delhi","clientName":"Aditya Birla Wellness(CORP16101)","partnerCode":"COCAE655930","recipientAddress":"Ground floor, 1st Floor & 2nd Floor, Vijaya Building, Barakhamba Road Connaught Place, Delhi-110001, DL","city":"Delhi","state":"Delhi","pincode":110001,"spocName":"Rajni Sundriyal","spocContact":9891995179,"transportNo":"Courier"},{"clinicName":"Aditya Birla_Coimbatore","clientName":"Aditya Birla Wellness(CORP16101)","partnerCode":"COCAJG55925","recipientAddress":"1st & 2nd floor, Sri Ram Towers, 739, Avanashi Road, Anna Silai, Coimbatore, Tamil Nadu - 641018, TN","city":"Coimbatore","state":"Tamilnadu","pincode":641018,"spocName":"S Babu","spocContact":9841723243,"transportNo":"Courier"},{"clinicName":"Aditya Birla_Bhubaneshwar","clientName":"Aditya Birla Wellness(CORP16101)","partnerCode":"COCAXZ55920","recipientAddress":"3rd Floor, Broadway Heights Plot No. 7 & 8, Jharpada, Cuttack Puri Road, Bhubaneshwar, Odisha  751 006, OD","city":"Bhubaneshwar","state":"Odisha","pincode":751006,"spocName":"Subhashree Mohanty","spocContact":9937306220,"transportNo":"Courier"},{"clinicName":"Aditya Birla_Bangalore","clientName":"Aditya Birla Wellness(CORP16101)","partnerCode":"COCAGL55915","recipientAddress":"1st Floor, Sanjana Plaza, #74/2, PID no.59-10-2, Elephant rock road, 3rd block, Jayanagar, Bangalore  560 011, KR","city":"Bangalore","state":"Karnataka","pincode":560011,"spocName":"Vani Km","spocContact":8722393888,"transportNo":"Courier"},{"clinicName":"Aditya Birla_Ahmedabad","clientName":"Aditya Birla Wellness(CORP16101)","partnerCode":"COCAWN55905","recipientAddress":"Units 218 to 222, 2nd Floor, ICONIC Shyamal, Shyamal Cross Raod, Satellite, Ahmedabad, Gujarat  380 015, GJ","city":"Ahmedabad","state":"Gujrat","pincode":380015,"spocName":"Mohmmadsohil Rangrej","spocContact":7621827489,"transportNo":"Courier"},{"clinicName":"Aditya Birla_Kolkata","clientName":"Aditya Birla Wellness(CORP16101)","partnerCode":"COCA2055900","recipientAddress":"2nd Floor, Bangur BFL Estate, 31 Chowringhee Road, Kolkata, West Bengal � 700 016, WB","city":"Kolkata","state":"","pincode":700016,"spocName":"Sumanta Chatterjee","spocContact":9088020841,"transportNo":"Courier"},{"clinicName":"Aditya Birla_Chennai","clientName":"Aditya Birla Wellness(CORP16101)","partnerCode":"COCAR255895","recipientAddress":"Sai Sagar , Plot no: M7, Thiru-Vi-Ka (SIDCO) Industrial Estate , Guindy , Chennai 600032., TN","city":"Chennai","state":"Tamilnadu","pincode":600032,"spocName":"S Kavitha","spocContact":9841854920,"transportNo":"Courier"},{"clinicName":"Aditya Birla_Varanasi","clientName":"Aditya Birla Wellness(CORP16101)","partnerCode":"COCA5455890","recipientAddress":"Second Floor, Shop bearing no. 1&2 Kuber Complex, D-58/2, D-58/2-1, D-58/2-2, D-58/2-3, Sigra Varanasi-221010 Uttar Pradesh, UP","city":"Varanasi","state":"","pincode":221010,"spocName":"Pankaj Laha","spocContact":9889031390,"transportNo":"Courier"},{"clinicName":"Aditya Birla_Raipur","clientName":"Aditya Birla Wellness(CORP16101)","partnerCode":"COCADE55885","recipientAddress":"4th Flr., Skypark, Adjacent to E Road, Ravi Nagar, Opp Rani Sati Mandir,,Raipur -,Raipur,Chhattisgarh-492001, CG","city":"Raipur","state":"","pincode":492001,"spocName":"NIKHIL Kukreja","spocContact":9098474745,"transportNo":"Courier"},{"clinicName":"Aditya Birla_Guwahati","clientName":"Aditya Birla Wellness(CORP16101)","partnerCode":"COCA4H55880","recipientAddress":"5th Floor, Sureka Square, Lachit Nagar, Near Hanuman Mandir, G.S. Road, Guwahati, Assam- 781 007, AS","city":"Guwahati","state":"Assam","pincode":781007,"spocName":"Gautam Parasar Sarma","spocContact":9864348868,"transportNo":"Courier"},{"clinicName":"Aditya Birla_Bhopal","clientName":"Aditya Birla Wellness(CORP16101)","partnerCode":"COCAKG55875","recipientAddress":"Ground Floor, 2nd & 3rd Floor, Prem Kamla Tower, Plot No. 82, MP Nagar, Zone - 2, Ward No. 45, Inside Main Road, Tehsil Huzur, Bhopal, Madhya Pradesh - 462011, MP","city":"Bhopal","state":"Madhyapradesh","pincode":462011,"spocName":"Ankit Joshi","spocContact":9977688819,"transportNo":"Porter"},{"clinicName":"Aditya Birla_Nashik","clientName":"Aditya Birla Wellness(CORP16101)","partnerCode":"COCAS455870","recipientAddress":"1st Floor, Kaviata Commercial Complex, opp. Vasant Market, Canada Corner, Nasik- 422005, MH","city":"Nashik","state":"Maharashtra","pincode":422005,"spocName":"Archit Vishnupant Madake","spocContact":7767898914,"transportNo":"Courier"},{"clinicName":"HCL-Lucknow","clientName":"HCL - Sample Drop","partnerCode":"HCL - Sample Drop(CORP17687)","recipientAddress":"SEZ Unit-I, First Floor, SDC 02, Village Kanjehara & Chack Gajaria Farms, Sultanpur Road, Mastemau, Lucknow, Uttar Pradesh 226002","city":"Lucknow","state":"Uttar Pradesh","pincode":226002,"spocName":"Arpit Gautam","spocContact":8685032559,"transportNo":"rider"},{"clinicName":"Hyderabad - Kompally","clientName":"Allohealth","partnerCode":"Allohealth(CORP11694)","recipientAddress":"Allo Sexual Health Clinic ,3rd Floor, Opps to sai Krishna gold appartments, Jeevan Rohit Women and Child Clinic, H. No. 02/65, RB COMPLEX, Spring Fields Colony, Jeedimetla, Hyderabad, Secunderabad, Telangana 500067","city":"Hyderabad","state":"Telangana","pincode":500067,"spocName":"Nagendra","spocContact":8297272201,"transportNo":"Rider"},{"clinicName":"Hyderabad - Uppal","clientName":"Allohealth","partnerCode":"Allohealth(CORP11694)","recipientAddress":"Allo Sexual Health Clinic Uno Super Speciality Clinic Uppal Uppal Bus Stop, 2-3-44, Uppal Main Rd, opposite Uppal, Hanumasai Nagar, Vijayapuri Colony, Uppal, Hyderabad, Telangana 500039","city":"Hyderabad","state":"Telangana","pincode":500039,"spocName":"Gayathri","spocContact":6305877061,"transportNo":"Rider"},{"clinicName":"Hyderabad - Borabanda","clientName":"Allohealth","partnerCode":"Allohealth(CORP11694)","recipientAddress":"Allo Sexual Health Sai Darbar, Leaf Hospitals, Chamber Number 4, Ground Floor, Building H 677/152 B, Allapur Rd, next to Biryani Bell, Sri Vivekananda Nagar, Borabanda, Hyderabad, Telangana 500114","city":"Hyderabad","state":"Telangana","pincode":500114,"spocName":"Abdul","spocContact":7672030244,"transportNo":"Rider"},{"clinicName":"Hyderabad -Vanasthalipuram","clientName":"Allohealth","partnerCode":"Allohealth(CORP11694)","recipientAddress":"Allo sexual Health Ground Floor, Shop No, Percy Poly Clinic Pharmacy & Diagnostics, 5-5, 457/1, Grand Hotel Lane, near Kinera, Prashanth Nagar , Vanasthalipuram, Hyderabad, Telangana 500070","city":"Hyderabad","state":"Telangana","pincode":500070,"spocName":"Abhishek","spocContact":8309814525,"transportNo":"Rider"},{"clinicName":"Hyderabad - Nallagandla","clientName":"Allohealth","partnerCode":"Allohealth(CORP11694)","recipientAddress":"MIG 91 Nalagandla Tellapur road Nalagandla, Serilingampalle (M), Hyderabad, Telangana 500019","city":"Hyderabad","state":"Telangana","pincode":500019,"spocName":"Reehana","spocContact":9676745493,"transportNo":"Rider"},{"clinicName":"Hyderabad-Kondapur","clientName":"Allohealth","partnerCode":"Allohealth(CORP11694)","recipientAddress":"Allo Sexual Health Clinic, Hale Clinics, Cabin No. 8, 1st Floor, 3rd St, Sri Ramnagar - Block C, Botanical Garden Rd, Above SBI, Near Burfi Ghar Sweet Shop, Kondapur, Hyderabad, Telangana 500084","city":"Hyderabad","state":"Telangana","pincode":500084,"spocName":"Priyanka","spocContact":7981997249,"transportNo":"Rider"},{"clinicName":"Hyderabad-Sainikpuri","clientName":"Allohealth","partnerCode":"Allohealth(CORP11694)","recipientAddress":"Allo Sexual Health Clinic, The Olive Tree Multispeciality Clinic, 2nd Floor, Cabin no 1, Crescent, Cresena Krishna Metropolis, Dr. AS Rao Nagar Rd, near Poloumi hospital, Lakshmipuram Colony, A. S. Rao Nagar, Hyderabad, Secunderabad, Telangana 500062","city":"Hyderabad","state":"Telangana","pincode":500062,"spocName":"Subash","spocContact":9849670911,"transportNo":"Rider"},{"clinicName":"Hyderabad-Narsingi","clientName":"Allohealth","partnerCode":"Allohealth(CORP11694)","recipientAddress":"Allo Sexual Health Clinic, MedSurge Clinics, Room No. 2, 2nd Floor, NO: 1-82, PLOT NO: 120, X ROADS, Opp to Golden Gym, Manchirevula, Narsingi, Telangana 500075","city":"Hyderabad","state":"Telangana","pincode":500075,"spocName":"Durgaprasad","spocContact":9248575714,"transportNo":"Rider"},{"clinicName":"Hyderabad-Kukatpally","clientName":"Allohealth","partnerCode":"Allohealth(CORP11694)","recipientAddress":"Sudershan Hospital 4 th Floor Phase 5, Plot no 99/A, Dmart Lane, opp. to Nsl Sushaanta Block-B, Kukatpally Housing Board Colony, KPHB 5th Phase, Kukatpally, Hyderabad, Telangana 500072","city":"Hyderabad","state":"Telangana","pincode":500072,"spocName":"Priskilla","spocContact":9182191460,"transportNo":"Rider"},{"clinicName":"Hyderabad-Ameerpet","clientName":"Allohealth","partnerCode":"Allohealth(CORP11694)","recipientAddress":"Allo Sexual Health Clinic, Radiance Diagnostics, Chamber No. 2, 1st Floor, Opp Value Zone, Ameerpet, Hyderabad, Telangana 500038","city":"Hyderabad","state":"Telangana","pincode":500038,"spocName":"Rupa","spocContact":7396614389,"transportNo":"Rider"},{"clinicName":"Allohealth - Rajkot","clientName":"Allohealth","partnerCode":"Allohealth(CORP11694)","recipientAddress":" Allo Health, 4th Floor, Diva Women's Hospital, 6, University Rd, Near Panchayat Chowk, Royal Park, Rajkot, Gujarat 360005","city":"Rajkot","state":"Gujrat","pincode":360005,"spocName":"Meghna","spocContact":"797278 8179","transportNo":"Rider"},{"clinicName":"Kengeri","clientName":"Allohealth","partnerCode":"CORP11694","recipientAddress":"3 Site, OPD, Aarohi Hospital, Ground Floor, 81/2, Uttarahalli Main Rd, near Kodipalya, Kengeri, Bengaluru, Karnataka 560060, KR","city":"Bangalore","state":"Karnataka","pincode":560060,"spocName":"Kavya","spocContact":8105257263,"transportNo":"Rider"},{"clinicName":"Rajajinagar","clientName":"Allohealth","partnerCode":"Allohealth(CORP11694)","recipientAddress":"Room No 6, 34, Tamara Hospital & IVF Centre, 1st Floor, 3, 10th Cross Rd, opp. Vardhaka Saradar Patel School, 1st N Block, 2nd Stage, Rajajinagar, Bengaluru, Karnataka 560010, KR","city":"Bangalore","state":"Karnataka","pincode":560010,"spocName":"Bhargavi DB","spocContact":9380936151,"transportNo":"Rider"},{"clinicName":"Brookefield","clientName":"Allohealth","partnerCode":"Allohealth(CORP11694)","recipientAddress":"Ground Floor, Building No. 297, D7 Med Multispeciality Clinic, AECS Layout - A Block, Kundalahalli, Brookefield, Bengaluru, Karnataka 560037, KR","city":"Bangalore","state":"Karnataka","pincode":560037,"spocName":"Pallavi","spocContact":7671863843,"transportNo":"Rider"},{"clinicName":"RT Nagar","clientName":"Allohealth","partnerCode":"Allohealth(CORP11694)","recipientAddress":"Ekaiva Medical Care, 2nd Floor #28, 1st Main, CBI Main Rd, Ganganagar, Bengaluru, Karnataka 560032, KR","city":"Bangalore","state":"Karnataka","pincode":560032,"spocName":"jeevitha","spocContact":8940174897,"transportNo":"Rider"},{"clinicName":"Bangalore - Bilekalahalli","clientName":"Allohealth","partnerCode":"Allohealth(CORP11694)","recipientAddress":"Swara Square, Ments Superspeciality, 2nd Floor, Chamber 6, DC Halli, 1065/A8, 9th Main Hongasandra GB Palya Rd, opp. Kotak Mahindra Bank, Vijaya Bank Layout, Bilekahalli, Bengaluru, Karnataka 560076, KR","city":"Bangalore","state":"Karnataka","pincode":560076,"spocName":"Shobha","spocContact":6366619017,"transportNo":"Rider"},{"clinicName":"Bangalore - KR Puram","clientName":"Allohealth","partnerCode":"Allohealth(CORP11694)","recipientAddress":"NO 70, SHOP, Health Plus Multispeciality Hospital, 2nd Floor, 6, Thambu Chetty Palya Main Rd, near ST.ANTHONY CHURCH, Sunshine Layout, Krishnarajapuram, Bengaluru, Karnataka 560036, KR","city":"Bangalore","state":"Karnataka","pincode":560036,"spocName":"Bhargavi","spocContact":9160894616,"transportNo":"Rider"},{"clinicName":"Bangalore - Indiranagar","clientName":"Allohealth","partnerCode":"Allohealth(CORP11694)","recipientAddress":"4th floor, The Life Plus Hospital, 2, 80 Feet Rd, near CHINMAYA MISSION HOSPITAL, HAL 3rd Stage, Indiranagar, Bengaluru, Karnataka 560075, KR","city":"Bangalore","state":"Karnataka","pincode":560075,"spocName":"Sarah","spocContact":9633762175,"transportNo":"Rider"},{"clinicName":"Bangalore - HSR","clientName":"Allohealth","partnerCode":"Allohealth(CORP11694)","recipientAddress":"Allo Health - HSR ,UMC (United Medical Center) - Chamber, 4, 27th Main Rd, below Kotak Mahindra Bank, Sector 2, HSR Layout, Bengaluru, Karnataka 560102, KR","city":"Bangalore","state":"Karnataka","pincode":560102,"spocName":"Nihal","spocContact":7619103605,"transportNo":"Rider"},{"clinicName":"Bangalore - Bellandur","clientName":"Allohealth","partnerCode":"Allohealth(CORP11694)","recipientAddress":"3rd Floor, Nurture Multispeciality Clinic, 76/1B, Doddakannelli - Kaadubeesanahalli Rd, next to New Horizon Gurukul School, Kaverappa Layout, Kadubeesanahalli, Panathur, Bengaluru, Karnataka 560103, KR","city":"Bangalore","state":"Karnataka","pincode":560103,"spocName":"Suraj","spocContact":6389713435,"transportNo":"Rider"},{"clinicName":"Bangalore - Vijayanagar","clientName":"Allohealth","partnerCode":"Allohealth(CORP11694)","recipientAddress":"1st floor, Jeevasare Healthcare, Raj complex, 9th Cross Rd, Hampi Nagar, RPC Layout, Vijayanagar, Bengaluru, Karnataka 560104, KR","city":"Bangalore","state":"Karnataka","pincode":560104,"spocName":"Sukanya","spocContact":9380356490,"transportNo":"Rider"},{"clinicName":"Bangalore - Electronic City","clientName":"Allohealth","partnerCode":"Allohealth(CORP11694)","recipientAddress":"Allo Health- Electronic City ,Chamber No. 6, Neo Health Clinic, Legacy Apartment, 1st Floor, Neeladri Rd, above IDFC First Bank, Neeladri Nagar, Electronic City Phase I, Electronic City, Bengaluru, Karnataka 560100, KR","city":"Bangalore","state":"Karnataka","pincode":560100,"spocName":"Dipthi","spocContact":9022617248,"transportNo":"Rider"},{"clinicName":"Bangalore - Jayanagar","clientName":"Allohealth","partnerCode":"Allohealth(CORP11694)","recipientAddress":"Allo health- Jayanagar, Adhventha Hospital 31,45th Cross, Sangam Circle, opposite Metro Pillar No 16, 8th Block, Jayanagar, Bengaluru, Karnataka 560070, KR","city":"Bangalore","state":"Karnataka","pincode":560070,"spocName":"Geeta N","spocContact":7349403345,"transportNo":"Rider"},{"clinicName":"Bangalore - Sahakarnagar","clientName":"Allohealth","partnerCode":"Allohealth(CORP11694)","recipientAddress":"No.61, G Block, Vikyath Diagnostics Center, Sahakar Nagar Main Rd, G Block, Sahakar Nagar, Byatarayanapura, Bengaluru, Karnataka 560092, KR","city":"Bangalore","state":"Karnataka","pincode":560092,"spocName":"jeevitha","spocContact":8940174897,"transportNo":"Rider"},{"clinicName":"HCL  Shiv Nadar","clientName":"HCL - Sample Drop","partnerCode":"HCL - Sample Drop(CORP17687)","recipientAddress":"Pooja Health Care , Vill - Chithera Near Canara Bank , G T Road Dadri , Pincode - 203207","city":"Dadri ","state":"Uttar Pradesh","pincode":203207,"spocName":"Kapil Phlebo","spocContact":8383845383,"transportNo":"Rider"},{"clinicName":"NoidaIBM Tower- A26","clientName":"Alyve/IBM","partnerCode":"-","recipientAddress":"IBM India Pvt.Ltd.Block-A , Plot no-26 ,Sector-62 , Noida , UP-201307, UP","city":"Noida","state":"","pincode":201307,"spocName":"","spocContact":"","transportNo":"Courier"},{"clinicName":"GurgaonDLF Infinity Tower-C","clientName":"Alyve/IBM","partnerCode":"-","recipientAddress":"Tower C ,IBM India Pvt.Ltd DLF InfinityTower, 5th Floor Tower-C, DLF Cyber City Phase-II Gurgaon, Pin code - 122 001, Haryana, HR","city":"Gurgaon","state":"Haryana","pincode":122001,"spocName":"","spocContact":"","transportNo":"Courier"},{"clinicName":"GurgaonDLF Infinity Tower-A","clientName":"Alyve/IBM","partnerCode":"-","recipientAddress":"Tower A, IBM India Pvt.Ltd DLF InfinityTower,4th Floor Tower-C, DLF Cyber City Phase-II Gurgaon, Pin code - 122 001, Haryana, HR","city":"Gurgaon","state":"Haryana","pincode":122001,"spocName":"","spocContact":"","transportNo":"Courier"},{"clinicName":"BangaloreEGLC","clientName":"Alyve/IBM","partnerCode":"-","recipientAddress":"Block C , Embassy Golf Links Road, Embassy Golf Links Business Park, Domlur, Bengaluru, Karnataka 560071, KR","city":"Bangalore","state":"Karnataka","pincode":560071,"spocName":"","spocContact":"","transportNo":"Courier"},{"clinicName":"Mumbai One Lodha - 32nd floor","clientName":"Alyve/IBM","partnerCode":"-","recipientAddress":"New Site will be One Lodha Place. IBM, 32nd Floor, One Lodha Place ( Plot No C.S 443, 444, 445 & 446 ) Lower Parel Mumbai.., MH","city":"Mumbai","state":"Maharashtra","pincode":400013,"spocName":"","spocContact":"","transportNo":"Courier"},{"clinicName":"KolkataDLF-B","clientName":"Alyve/IBM","partnerCode":"-","recipientAddress":"Tower B ,DLF IT Park I, New Town, Rajarhat, 24 Parganas, Kolkata-700156, WB","city":"Kolkata","state":"","pincode":700156,"spocName":"","spocContact":"","transportNo":"Courier"},{"clinicName":"PuneSP Info City (Ozone)","clientName":"Alyve/IBM","partnerCode":"-","recipientAddress":"Ozone Complex,SP Infocity Surve # 208,Manjari Studfarm Phursungi Taluka Pune, MAH 412308 India, MH","city":"Pune","state":"Maharashtra","pincode":412308,"spocName":"","spocContact":"","transportNo":"Courier"},{"clinicName":"AhmedabadGIFT","clientName":"Alyve/IBM","partnerCode":"-","recipientAddress":"IBM India Private Limited, Gujarat International, Finance Tech City (GIFT)18th 19th & 20th Floors, Gandhi Nagar, Ahmedabad, Gujarat � 382 355, India., GJ","city":"Ahmedabad","state":"Gujrat","pincode":382355,"spocName":"","spocContact":"","transportNo":"Courier"},{"clinicName":"MysoreSliver Spirit Teck Park","clientName":"Alyve/IBM","partnerCode":"-","recipientAddress":"M/S Specialized process Innovation Private Limited., No.317- P,-317-P2 & 318 ,Hebbal Industrial Area, KR","city":"Mysore","state":"","pincode":560045,"spocName":"","spocContact":"","transportNo":"Courier"},{"clinicName":"MumbaiMagnus","clientName":"Alyve/IBM","partnerCode":"-","recipientAddress":"IBM India Pvt.Ltd. 5th floor, Magnus Towers, New Link Road, Mindspace, Malad West, Mumbai-400064, MH","city":"Mumbai","state":"Maharashtra","pincode":400064,"spocName":"","spocContact":"","transportNo":"Courier"},{"clinicName":"BangaloreSA3","clientName":"Alyve/IBM","partnerCode":"-","recipientAddress":"SA 3, No.12, Subramanya Arcade, Bannerghatta Road, Bangalore-560029. Karnataka, KR","city":"Bangalore","state":"Karnataka","pincode":560029,"spocName":"","spocContact":"","transportNo":"Courier"},{"clinicName":"BangaloreFTP Altius","clientName":"Alyve/IBM","partnerCode":"-","recipientAddress":"Altius IBM First Technology Place, adjacent to Satya Sai Baba Hospital, KIADB Export Promotion Industrial Area, Whitefield, Bengaluru, Karnataka 560066, KR","city":"Bangalore","state":"Karnataka","pincode":560066,"spocName":"","spocContact":"","transportNo":"Courier"},{"clinicName":"PunePanchshil Tech Park One (TPO)","clientName":"Alyve/IBM","partnerCode":"-","recipientAddress":"IBM India Private Limited Tech Park One (TPO - 1 ), Tower No. B Survey No. : 191A/2A/1/2, Off Airport Road , Next To Don Bosco School, Yerwada, Pune - 411006, MH","city":"Pune","state":"Maharashtra","pincode":411006,"spocName":"","spocContact":"","transportNo":"Courier"},{"clinicName":"KolkataBCS Salt Lake","clientName":"Alyve/IBM","partnerCode":"-","recipientAddress":"A78, IBM India Private Ltd, BCS Building, Plot - X1-7, Block EP/GP,Sector-V, Salt Lake,Kolkata - 700 091, WB","city":"Kolkata","state":"","pincode":"700 091","spocName":"","spocContact":"","transportNo":"Courier"},{"clinicName":"Coimbatore Tidel Park","clientName":"Alyve/IBM","partnerCode":"-","recipientAddress":"Tidel Park Coimbatore Ltd, Elcot- SEZ, IT/ITES, Villankuruchi Road, Aerodrome Post., TN","city":"Coimbatore","state":"Tamilnadu","pincode":641014,"spocName":"","spocContact":"","transportNo":"Courier"},{"clinicName":"Lucknow","clientName":"Alyve/IBM","partnerCode":"-","recipientAddress":"IBM India Pvt. Ltd. 4th & 5th Floor , Platinum Mall � T-6, IBB-2, Sushant Golf City, Shaheed Path, Lucknow , UP, India. Pin Code : 226030, UP","city":"Lucknow","state":"","pincode":226030,"spocName":"","spocContact":"","transportNo":"Courier"},{"clinicName":"Kochi Brigade world tread center","clientName":"Alyve/IBM","partnerCode":"-","recipientAddress":"IBM India Private Limited World Trade Center, Tower B Infopark SEZ, Phase-I, Kakkanad, Kochi-682042, KA","city":"Kochi","state":"","pincode":682042,"spocName":"","spocContact":"","transportNo":"Courier"},{"clinicName":"ChennaiDLF IT Park - Tower1A","clientName":"Alyve/IBM","partnerCode":"-","recipientAddress":"IBM India Pvt Ltd, Tower 1A, DLF IT Park, Shivaji Garden, Moon Light Stop, Ramapuram, Chennai 600089., TN","city":"Chennai","state":"Tamil Nadu","pincode":600089,"spocName":"","spocContact":"","transportNo":"Courier"},{"clinicName":"Chennai Software AG.","clientName":"Alyve/IBM","partnerCode":"-","recipientAddress":"5th floor, Unit 3,Pinnacle Building, Ascendas IT Park, CSIR Road, Taramani, chennai-600113 Tamil Nadu, India., TN","city":"Chennai","state":"Tamil Nadu","pincode":600113,"spocName":"","spocContact":"","transportNo":"Courier"},{"clinicName":"Bhubaneswar - Infocity","clientName":"Alyve/IBM","partnerCode":"-","recipientAddress":"1st & 2nd floor partial, E/43,i-HUB, Infocity, Chandrasekharpur, Patia, Bhubaneswar, Khordha, Odisha, 751024, OD","city":"Bhubaneshwar","state":"Odisha ","pincode":751024,"spocName":"","spocContact":"","transportNo":"Courier"},{"clinicName":"BangaloreEGLD","clientName":"Alyve/IBM","partnerCode":"-","recipientAddress":"Block D, Embassy Golf Links Road, Embassy Golf Links Business Park, Domlur, Bengaluru, Karnataka 560071, KR","city":"Bangalore ","state":"Karnataka","pincode":560071,"spocName":"","spocContact":"","transportNo":"Courier"},{"clinicName":"HCL-Noida","clientName":"HCL - Sample Drop","partnerCode":"HCL - Sample Drop(CORP17687)","recipientAddress":"A5, Sector 24 Block A,Sector 24, Noida,Uttar Pradesh – 201301","city":"Noida","state":"Uttar Pradesh","pincode":201301,"spocName":"","spocContact":"","transportNo":"rider"},{"clinicName":"Allohealth - Secunderabad","clientName":"Allohealth","partnerCode":"Allohealth(CORP11694)","recipientAddress":"H no 02/65, RB COMPLEX, Spring Fields Colony, Jeedimetla, Hyderabad, Secunderabad, Telangana 500067","city":"Hyderabad","state":"Telangana ","pincode":500067,"spocName":"","spocContact":"","transportNo":"Rider"},{"clinicName":"Ekin Care","clientName":"Ekin Care","partnerCode":"COCANJ53249","recipientAddress":"Winway world offices, Awfis 2nd Floor American Express, Beside Dhan Trident Vijay Nagar Indore - 452010, MP","city":"Indore","state":"Madhyapradesh","pincode":452010,"spocName":"","spocContact":"","transportNo":"Rider"},{"clinicName":"Aallohealth - Malad","clientName":"Allohealth","partnerCode":"Allohealth(CORP11694)","recipientAddress":"Sun Hospital, Ground Floor, Excel House No 6, BJ Patel Rd, opp SNDT College, near Liberty Garden, Malad, Kanchpada, Malad West, Mumbai, Maharashtra 400064","city":"Mumbai","state":"Maharastra","pincode":400064,"spocName":"","spocContact":"","transportNo":"Rider"},{"clinicName":"Allohealth - Ghatkopar","clientName":"Allohealth","partnerCode":"Allohealth(CORP11694)","recipientAddress":"Room No - 6, 1st floor, Pasaydan Bhavan, Vedant Central Hospital, Ramchandra B Kadam Marg, next to Jain Temple in, Bhim Nagar, Jivdaya Lane, Ghatkopar West, Mumbai, Maharashtra 400084","city":"Mumbai","state":"Maharastra","pincode":400084,"spocName":"","spocContact":"","transportNo":"Rider"},{"clinicName":"Chandigarh-Sector 34-A","clientName":"Aditya Birla","partnerCode":"COCAG752581","recipientAddress":"1st Floor, SCO 232 - 233, 234, Sector 34A, Chandigarh - 160 034, CH","city":"Chandigarh","state":"Punjab","pincode":160034,"spocName":"","spocContact":"","transportNo":"Porter"},{"clinicName":"One ABC-Chandigarh-Sector 8C","clientName":"Aditya Birla","partnerCode":"COCAG752581","recipientAddress":"Basement, Ground, First and Second Floor, SCO-43-44, Sector 8 C, Chandigarh � 160 008, CH","city":"Chandigarh","state":"Punjab","pincode":160008,"spocName":"","spocContact":"","transportNo":"Porter"},{"clinicName":"Bengaluru-Sanjay Plaza","clientName":"Aditya Birla","partnerCode":"COCAGF50394","recipientAddress":"1st Floor, �Sanjana Plaza�, #74/2, PID no.59-10-2, Elephant rock road, 3rd block, Jayanagar, Bangalore � 560 011, KR","city":"Bangalore ","state":"Karnataka","pincode":560011,"spocName":"","spocContact":"","transportNo":"Porter"},{"clinicName":"Bengaluru-Cunningham Road","clientName":"Aditya Birla","partnerCode":"COCAGF50394","recipientAddress":"1st Floor, 19/4 above Axis Bank Sairbagh, Cunningham Road Bangalore Karnataka - 560052, KR","city":"Bangalore ","state":"Karnataka","pincode":560052,"spocName":"","spocContact":"","transportNo":"Porter"},{"clinicName":"One ABC-Thane-GCorp","clientName":"Aditya Birla","partnerCode":"COCAMN50404","recipientAddress":"Unit No. 1301 to 1304, 13th Floor, Gcorp Tech Park, Sector 6, Ghodbunder Rd, Village Wadhavli, Thane,Maharashtra- 400615, MH","city":"Thane","state":"","pincode":400615,"spocName":"","spocContact":"","transportNo":"Porter"},{"clinicName":"One ABC-Mumbai-Goregaon R Tech","clientName":"Aditya Birla","partnerCode":"COCAMN50404","recipientAddress":"10th Floor, R-TECH PARK, Nirlon Complex, Off Western Express Highway , Goregaon (E) Mumbai- 400063, MH","city":"Goregaon","state":"Maharashtra","pincode":400063,"spocName":"","spocContact":"","transportNo":"Porter"},{"clinicName":"One ABC-Mumbai-One World Centre Lower Parel","clientName":"Aditya Birla","partnerCode":"COCAMN50404","recipientAddress":"One ABC-Mumbai-One World Centre Lower Parel, MH 400013","city":"Mumbai","state":"Maharastra","pincode":400013,"spocName":"","spocContact":"","transportNo":"Porter"},{"clinicName":"One ABC-Nagpur-Genesis Square","clientName":"Aditya Birla","partnerCode":"COCAZC52546","recipientAddress":"3rd, 4th, 5th 6th and 7th Floor, Genesis Square, 72, Shankar Nagar, WHC Road, Nagpur, Maharashtra � 440 010, MH","city":"Nagpur","state":"Maharashtra","pincode":440010,"spocName":"","spocContact":"","transportNo":"Porter"},{"clinicName":"One ABC-Ludhiana-FG Market","clientName":"Aditya Birla","partnerCode":"COCAG752581","recipientAddress":"Ground, 1st & 5th Floor, SCO - 130-132, Apra Tower, Feroze Gandhi Market, Ludhiana, Punjab - 141001, PB","city":"Ludhiana","state":"","pincode":141001,"spocName":"","spocContact":"","transportNo":"Porter"},{"clinicName":"One ABC-Vijayawada-Patamatalanka","clientName":"Aditya Birla","partnerCode":"COCAHR52461","recipientAddress":"3rd Floor, 40-1-52C, MG road, Patamatalanka, Vijayawada, Andhra Pradesh � 520 010, TG","city":"Vijayawada","state":"","pincode":520010,"spocName":"","spocContact":"","transportNo":"Porter"},{"clinicName":"One ABC-Hyderabad-Roxana","clientName":"Aditya Birla","partnerCode":"COCAZH52601","recipientAddress":"M.No. 7-1-24/1/RT/101 to 104, 1st floor, Roxana Towers, Greenlands, Begumpet, Hyderabad, Telangana - 500016, TG","city":"Hyderabad","state":"Telangana","pincode":500016,"spocName":"","spocContact":"","transportNo":"Porter"},{"clinicName":"One ABC-Cochin-Chammany Chambers","clientName":"Aditya Birla","partnerCode":"COCAIP52536","recipientAddress":"3rd Floor, Chammany Chambers, Kaloor-Kadavanthra Road, Kaloor PO, Cochin, Kerala- 682017, KA","city":"Cochin","state":"Karnataka","pincode":682017,"spocName":"","spocContact":"","transportNo":"Porter"},{"clinicName":"Patna-Twin Tower","clientName":"Aditya Birla","partnerCode":"COCA0A52476","recipientAddress":"First Floor, Twin � Tower Hatwha, South Gandhi Maidan, Patna � 800001., BR","city":"Patna","state":"","pincode":800001,"spocName":"","spocContact":"","transportNo":"Porter"},{"clinicName":"One ABC-Noida-Sector 18","clientName":"Aditya Birla","partnerCode":"COCA3V52611","recipientAddress":"Plot No. 3, Near Vijay Sales, Sector- 18, Noida- 201301, UP","city":"Noida","state":"","pincode":201301,"spocName":"","spocContact":"","transportNo":"Porter"},{"clinicName":"Noida-Sector 15","clientName":"Aditya Birla","partnerCode":"COCA3V52611","recipientAddress":"3rd Floor, Plot no C-171/2, Sector 15 Noida, UP","city":"Noida","state":"","pincode":201301,"spocName":"","spocContact":"","transportNo":"Porter"},{"clinicName":"One ABC-Kanpur-J S Tower","clientName":"Aditya Birla","partnerCode":"COCA3V52611","recipientAddress":"1st Floor, J. S. Tower, 16/106, The Mall, Kanpur - 208 001 (U.P), UP","city":"Kanpur","state":"","pincode":208001,"spocName":"","spocContact":"","transportNo":"Porter"},{"clinicName":"One ABC-Bhubaneswar-Broadway Heights","clientName":"Aditya Birla","partnerCode":"COCARM52571","recipientAddress":"3rd Floor, �Broadway Heights� Plot No. 7 & 8, Jharpada, Cuttack Puri Road, Bhubaneshwar, Odisha � 751 006, OD","city":"Bhubaneshwar","state":"Odisha ","pincode":751006,"spocName":"","spocContact":"","transportNo":"Porter"},{"clinicName":"One ABC-Agra-Sanjay Place","clientName":"Aditya Birla","partnerCode":"COCA3V52611","recipientAddress":"7th Floor, Unit No. � 710/B, Corporate Park, B-109, Sanjay Place, Agra, Uttar Pradesh � 282 005, UP","city":"Agra","state":"Uttar Pradesh","pincode":282005,"spocName":"","spocContact":"","transportNo":"Porter"},{"clinicName":"WB-Kolkata-Ajc Bose Road","clientName":"Zyla Health","partnerCode":"COCA6853484","recipientAddress":"Constantia,11 U N Bramachari road, 6th Floor, Wing B,Kolkata-700017, WB","city":"Kolkata","state":"","pincode":700017,"spocName":"","spocContact":"","transportNo":"Porter"},{"clinicName":"MP-Indore-Indore","clientName":"Zyla Health","partnerCode":"COCAOR53479","recipientAddress":"Unit No. 319, Shekhar Central, Plot No. 4-5, Block No.1, Manormaganj, A.B. Road, Palasia Squre, Indore - 452001, Madhya Pradesh, MP","city":"Indore","state":"Madhyapradesh","pincode":452001,"spocName":"","spocContact":"","transportNo":"Porter"},{"clinicName":"MH-Pune-F. C. Road","clientName":"Zyla Health","partnerCode":"COCAZL53474","recipientAddress":"Millenium Towers, 5 th Floor,S.R.No.885/1/A Bhandarkar Road,Shivaji Nagar, Pune - 411004, MH","city":"Pune","state":"Maharashtra","pincode":411004,"spocName":"","spocContact":"","transportNo":"Porter"},{"clinicName":"RJ-Jaipur-Jaipur","clientName":"Zyla Health","partnerCode":"COCARH53469","recipientAddress":"4th (401 & 402) floor, KJ City Tower, Ashok Marg, C-scheme. Jaipur - 302001, Rajasthan, RJ","city":"Jaipur","state":"","pincode":302001,"spocName":"","spocContact":"","transportNo":"Porter"},{"clinicName":"DL-Delhi-Tolstoy House","clientName":"Zyla Health","partnerCode":"COCASJ53464","recipientAddress":"Tolstoy House 10th Floor, Office No. 1009, 1010, 1011, Tolstoy House 15-17, Tolstoy Marg, Delhi -110001, DL","city":"Delhi","state":"Delhi","pincode":110001,"spocName":"","spocContact":"","transportNo":"Porter"},{"clinicName":"TS-Hyderabad-Banjara Hills","clientName":"Zyla Health","partnerCode":"COCALD53459","recipientAddress":"4th floor Midtown Building opp. Jalgam Vengal Rao, Dwarkapuri Banjara Hills. Hyderabad Telangana 500082, TG","city":"Hyderabad","state":"Telangana","pincode":122002,"spocName":"","spocContact":"","transportNo":"Porter"},{"clinicName":"GJ-Ahmedabad-MOT","clientName":"Zyla Health","partnerCode":"COCA7V53454","recipientAddress":"Motilal Oswal Tower, Opp Zion Z1 Building, Ramdas Marg, Off Sindhubhavan Road, Bodekdev, Ahmedabad - 3800054, Gujarat, GJ","city":"Ahmedabad","state":"Gujrat","pincode":201306,"spocName":"","spocContact":"","transportNo":"Porter"},{"clinicName":"VIist Banglore Clinic","clientName":"Visit_Tatva Bangalore Clinic","partnerCode":"Visit_Tatva Bangalore Clinic(CORP20534)","recipientAddress":"Ground floor, Visit Clinic, Marathahalli - Sarjapur Outer Ring Rd, Chandana, Bengaluru, Karnataka 560103","city":"Bangalore ","state":"Karnataka","pincode":560103,"spocName":"","spocContact":"","transportNo":"Rider"},{"clinicName":"Allohealth - Mulund","clientName":"Allohealth","partnerCode":"Allohealth(CORP11694)","recipientAddress":"Allo Health, 1st Floor, Vasundhara Heights, Shrirang Hospital, ACC Cement Rd, near Esquire Skytower, Ashok Nagar, Mulund West, Mumbai, Maharashtra 400080\n","city":"Mumbai","state":"Maharastra","pincode":400080,"spocName":"","spocContact":"","transportNo":"Rider"},{"clinicName":"One ABC-Coimbatore-Sri Ram Towers","clientName":"Aditya Birla","partnerCode":"COCA5U52596","recipientAddress":"1st & 2nd floor, Sri Ram Towers, 739, Avanashi Road, Anna Silai, Coimbatore, Tamil Nadu - 641 018, TN","city":"Coimbatore","state":"Tamilnadu","pincode":641018,"spocName":"","spocContact":"","transportNo":"Courier"},{"clinicName":"One ABC-Delhi-Connaught Place","clientName":"Aditya Birla","partnerCode":"COCAS750399","recipientAddress":"Ground floor, 1st Floor & 2nd Floor, Vijaya Building, Barakhamba Road Connaught Place, Delhi-110001, DL","city":"Delhi","state":"Delhi","pincode":110001,"spocName":"","spocContact":"","transportNo":"Courier"},{"clinicName":"One ABC-Vizag-Navaratna Trade Center","clientName":"Aditya Birla","partnerCode":"COCAHR52461","recipientAddress":"5th Floor, Navaratna Trade Center, D. No. 10-4-15/1, Ramnagar, Beside Hotel Meghalaya, Vizag, Andhra Pradesh � 530 003, AP","city":"Vizag","state":"","pincode":530003,"spocName":"","spocContact":"","transportNo":"Courier"},{"clinicName":"One ABC-Vadodara-Sarabhai Campus","clientName":"Aditya Birla","partnerCode":"COCA4352506","recipientAddress":"Unit No. 201 & Part of Unit No. 202, 2nd Floor, A1 Smeet, Sarabhai Campus, Nr. Ganda Circle, Gorwa Road, Vadodara, Gujarat � 390 023, GJ","city":"Vadodara","state":"","pincode":390023,"spocName":"","spocContact":"","transportNo":"Courier"},{"clinicName":"One ABC-Jaipur-Ashok Marg","clientName":"Aditya Birla","partnerCode":"COCAS652586","recipientAddress":"1st, 2nd & 3rd Floor, C-23, Ashok Marg, C-Scheme Jaipur, Rajasthan � 302001, RJ","city":"Jaipur","state":"","pincode":302001,"spocName":"","spocContact":"","transportNo":"Courier"},{"clinicName":"One ABC-Dehradun-MJ Tower","clientName":"Aditya Birla","partnerCode":"COCA8X52616","recipientAddress":"Shop No. 3, 4 and 5, 3rd Floor, M J Tower, Plot No. 235/413, Rajpur Road, Dehradun, Uttarakhand - 248001, UK","city":"Dehradun","state":"Uttrakhand","pincode":248001,"spocName":"","spocContact":"","transportNo":"Courier"},{"clinicName":"Allohealth Clinic","clientName":"Allohealth","partnerCode":"Allohealth(CORP11694)","recipientAddress":"Allo Sexual Health Clinic, 1st Floor, Pearl Singapore Fertility Centre, Plot no 5&3, Vinayaga Ave, next to Apollo Dental Clinic, Okkiyampettai, Sri Sowdeswari Nagar, Thoraipakkam, Chennai- 600097, Chennai","city":"Chennai","state":"Tamil Nadu","pincode":600097,"spocName":"","spocContact":"","transportNo":"Rider"},{"clinicName":"Noida-Sector 3","clientName":"Aditya Birla","partnerCode":"COCA3V52611","recipientAddress":"D-17, Sector 3, Noida,Uttar Pradesh - 201301, UP","city":"Noida","state":"","pincode":201301,"spocName":"","spocContact":"","transportNo":"Courier"},{"clinicName":"One ABC-Gurgaon-Platina Tower","clientName":"Aditya Birla","partnerCode":"COCAXQ52511","recipientAddress":"Unit no 301, 301 A, 308, 309, 310 & 311, 3rd Floor, Platina Tower, M G Road, Gurgaon, Haryana � 122 002, HR","city":"Gurgaon","state":"Haryana","pincode":122002,"spocName":"","spocContact":"","transportNo":"Courier"},{"clinicName":"One ABC-Chennai-Guindy","clientName":"Aditya Birla","partnerCode":"COCA5U52596","recipientAddress":"Sai Sagar , Plot no: M7, Thiru-Vi-Ka (SIDCO) Industrial Estate , Guindy , Chennai 600032., TN","city":"Chennai","state":"Tamil Nadu","pincode":600032,"spocName":"","spocContact":"","transportNo":"Courier"},{"clinicName":"Pune-Tandale Heights","clientName":"Aditya Birla","partnerCode":"COCAZC52546","recipientAddress":"Tandale Heights 1st & 2nd, 815, Shivajinagar, Law College Road, Pune � 411 004., MH","city":"Pune","state":"Maharashtra","pincode":11004,"spocName":"","spocContact":"","transportNo":"Courier"},{"clinicName":"One ABC-Hyderabad-Somajiguda-Bhupal Tower","clientName":"Aditya Birla","partnerCode":"COCAZH52601","recipientAddress":"2nd & 3rd Floor, Bhupal Towers, 6-3-1090 /A/ T-2 & 6-3-1090 /A/ S Raj Bhavan Road, Hyderabad, Telangana � 500 082, TG","city":"Hyderabad","state":"Telangana","pincode":500082,"spocName":"","spocContact":"","transportNo":"Courier"},{"clinicName":"MH-Mumbai-Malad (Interface-7)","clientName":"Zyla Health","partnerCode":"","recipientAddress":"Unit No. 601, 6th Floor, Interface, Building No. 07, Malad West, Mumbai. 400064, MH","city":"Mumbai","state":"Maharastra","pincode":400064,"spocName":"","spocContact":"","transportNo":"Courier"},{"clinicName":"Saurav","clientName":"RCL Gurgaon","partnerCode":"-","recipientAddress":"707, 7th Floor, Tower C, Unitech Cyber Park, Durga Colony, Sector 39, Jharsa Village, Gurgaon, Haryana 122003.","city":"Gurgaon","state":"Haryana","pincode":122003,"spocName":"","spocContact":"","transportNo":"Porter"},{"clinicName":"One ABC-Lucknow-Urbanac Business Park","clientName":"Aditya Birla","partnerCode":"COCA3V52611","recipientAddress":"Unit No. 201,202,205, 206, 207, 208 & 209, 2nd Floor, Urbanac Business Park, Plot A-1A and A1-B,Vibhuti Khand, Gomti Nagar, Lucknow, Uttar Pradesh - 226 010, UP","city":"Lucknow","state":"","pincode":226010,"spocName":"","spocContact":"","transportNo":"Courier"},{"clinicName":"One ABC-Ahmedabad-Iconic Shyamal","clientName":"Aditya Birla","partnerCode":"COCA4352506","recipientAddress":"Units 217 to 222, 2nd Floor, ICONIC Shyamal, Shyamal Cross Road, Satellite, Ahmedabad, Gujarat - 380 015, GJ","city":"Ahmedabad","state":"Gujrat","pincode":380015,"spocName":"","spocContact":"","transportNo":"Courier"},{"clinicName":"Bajaj Bangalore","clientName":"Bajaj Corporate Camp","partnerCode":"-","recipientAddress":"Bajaj Finance ltd, 5th floor,Prestige Towers, Residency road,Bangalore -560025, KR","city":"Bangalore ","state":"Karnataka","pincode":560025,"spocName":"","spocContact":"","transportNo":"Courier"},{"clinicName":"Bajaj New Delhi","clientName":"Bajaj Corporate Camp","partnerCode":"-","recipientAddress":"Bajaj Finance Limited Off. No. 1051, 10th Floor, Aggarwal Metro Heights, Plot - E5, Netaji Subhash Place,Pitampura, New Delhi - 110 034, DL","city":"New Delhi","state":"","pincode":110034,"spocName":"","spocContact":"","transportNo":"Courier"},{"clinicName":"Bajaj Mumbai","clientName":"Bajaj Corporate Camp","partnerCode":"-","recipientAddress":"3rd Floor, 271 Business Park, Model Industrial Estate, Near Virwani Industrial Estate, Off. Western Eststate Exp. Highway, Goregaon (E) Mumbai - 400 063., MH","city":"Mumbai","state":"Maharastra","pincode":400063,"spocName":"","spocContact":"","transportNo":"Courier"},{"clinicName":"Bajaj Pune","clientName":"Bajaj Corporate Camp","partnerCode":"-","recipientAddress":"Bajaj Finserv Mantri Office, Pune - Ahmednagar Hwy, Viman Nagar, Pune, Maharashtra 411014, MH","city":"Pune","state":"Maharashtra","pincode":411014,"spocName":"","spocContact":"","transportNo":"Courier"},{"clinicName":"Surat-Rockford Business Center","clientName":"Aditya Birla","partnerCode":"COCA4352506","recipientAddress":"IWC - 106, first floor, Internation Wealth Center, Vip Road, Vesu, Surat, Gujarat, GJ","city":"Surat","state":"Gujrat","pincode":395009,"spocName":"","spocContact":"","transportNo":"Courier"},{"clinicName":"One ABC-Indore-Benchmark Business Park","clientName":"Aditya Birla","partnerCode":"COCAPC52541","recipientAddress":"Benchmark Business Park, 5th Floor, Block No A-3, Scheme No-54, PU-4, Opposite Satya Sai School, Vijaynagar, Indore-452010, MP","city":"Indore","state":"Madhtapradesh","pincode":452010,"spocName":"","spocContact":"","transportNo":"Courier"},{"clinicName":"MH-Mumbai-MOT","clientName":"Zyla Health","partnerCode":"COCAP853427","recipientAddress":"Motilal Oswal Tower , Gokhale Sayani Road , Opp. Parel S T Depot, Prabhadevi, Mumbai - 400 025, MH","city":"Mumbai","state":"Maharastra","pincode":400025,"spocName":"","spocContact":"","transportNo":"Courier"},{"clinicName":"One ABC-Secunderabad-Mayfair Complex","clientName":"Aditya Birla","partnerCode":"COCAZH52601","recipientAddress":"3rd and 4th Floor, Mayfair Complex, Opp. Hockey Stadium, S. P. Road, Secunderabad, District Hyderabad, Telangana � 500003, TG","city":"Hyderabad","state":"Telangana","pincode":600006,"spocName":"","spocContact":"","transportNo":"Courier"},{"clinicName":"One ABC-Chennai-Nungambakkam","clientName":"Aditya Birla","partnerCode":"COCAAV53224","recipientAddress":"Old Door No.8, New No. 15 (Corporation Door No. 153), Wallace Garden 2nd Street, Nungambakkam, Chennai - 600 006, TN","city":"Chennai","state":"Tamil Nadu","pincode":560037,"spocName":"","spocContact":"","transportNo":"Courier"},{"clinicName":"Amex/Ekin Care","clientName":"Ekin Care","partnerCode":"COCAAV53224","recipientAddress":"5th floor, Luxor South, Bagmane Capital, Doddanekundi Village KR Puram Hobli, Bangalore East-560037, KR","city":"Bangalore ","state":"Karnataka","pincode":560037,"spocName":"","spocContact":"","transportNo":"Porter"},{"clinicName":"Zydus Life Sciences","clientName":"Health Assure","partnerCode":"-","recipientAddress":"ZYDUS LIFE SCIENCES LTD (MORAIYA PLANT)-Sarkhej- Bavla N.H. No.8A, Moraiya, Tal: Sanand, Dist: Ahmedabad- 382210, Gujarat, India","city":"Sanand","state":"Gujrat","pincode":250001,"spocName":"","spocContact":"","transportNo":"Porter"},{"clinicName":"Ranchi – Jeevah Health Care","clientName":"Allohealth","partnerCode":"Allohealth(CORP11694)","recipientAddress":"B-327, Jeevah Health Care, Rd Number 4, Ashok Kunj, Ashok Nagar, Ranchi, Jharkhand 834002, ","city":"Ranchi","state":"Jharkhand","pincode":834002,"spocName":"","spocContact":"","transportNo":"Rider"},{"clinicName":"Mangaluru – Falnir Health Centre","clientName":"Allohealth","partnerCode":"Allohealth(CORP11694)","recipientAddress":"1st floor, Falnir Health Centre, Lifeline Healthcare Plus, Falnir Rd, Attavar, Mangaluru, Karnataka 575002, Karnataka","city":"Mangaluru","state":"Karnataka ","pincode":575002,"spocName":"","spocContact":"","transportNo":"Rider"},{"clinicName":"Visakapatanam - MVP Colony","clientName":"Allohealth","partnerCode":"Allohealth(CORP11694)","recipientAddress":"Ground Floor, Chamber No 4, Lalit Health Care, 1-69-4/1, Rythu Bazaar Rd,opposite Anna Canteen, Opposite Rythu Bazar, Sector 4, Sector 3, MVP Colony, Visakhapatnam, Andhra Pradesh 530017, Andhra Pradesh","city":"Visakhapatnam","state":"Andhra Pradesh","pincode":530017,"spocName":"","spocContact":"","transportNo":"Rider"},{"clinicName":"Allo Health -Vanasthalipuram","clientName":"Allohealth","partnerCode":"Allohealth(CORP11694)","recipientAddress":"Ground Floor, Shop No, Percy Poly Clinic Pharmacy & Diagnostics, 5-5, 457/1, Grand Hotel Lane, near Kinera, Prashanth Nagar, Vanasthalipuram,Hyderabad, Telangana 500070, Telangana","city":"Hyderabad","state":"Telangana","pincode":500070,"spocName":"","spocContact":"","transportNo":"Rider"},{"clinicName":"Allo Health -Uppal","clientName":"Allohealth","partnerCode":"Allohealth(CORP11694)","recipientAddress":"Uppal Bus Stop, 2-3-44, Uppal Main Rd, opposite Uppal, Hanumasai Nagar, Vijayapuri Colony, Uppal, Hyderabad, Telangana 500039, ","city":"Hyderabad","state":"Telangana","pincode":500039,"spocName":"","spocContact":"","transportNo":"Rider"},{"clinicName":"Allohealth -Navalur","clientName":"Allohealth","partnerCode":"Allohealth(CORP11694)","recipientAddress":"Allo Sexual Health Clinic, MR Complex, No:12, Rajiv Gandhi Salai, near Bhuhari Hotel, near Tollgate, Egattur, Navalur, Tamil Nadu 600130, Tamil Nadu","city":"Navalur","state":"Telangana","pincode":600130,"spocName":"","spocContact":"","transportNo":"Rider"},{"clinicName":"Indian Expo","clientName":"Indian  Expo","partnerCode":"COCAC352627","recipientAddress":"Plot No. 23–25 & 27–29, Knowledge Park II, Gautam Budh Nagar, Greater Noida – 201306, Uttar Pradesh, India","city":"Greater Noida","state":"Uttar Pradesh","pincode":201306,"spocName":"","spocContact":"","transportNo":"Porter"},{"clinicName":"IQVIA","clientName":"Zyla Health","partnerCode":"COCAHO52233","recipientAddress":"IQVIA RDS India Pvt ltd, Prestige TMS Square, Opposite Oberon Mall, NH 47 Bypass, Padivattom, Edappally, Kochi, Kerala 682024","city":"Kochi","state":"Karnataka","pincode":682024,"spocName":"","spocContact":"","transportNo":"Trackon Courier"},{"clinicName":"Bangalore - Arekere","clientName":"Allohealth","partnerCode":"Allohealth(CORP11694)","recipientAddress":"1st Floor, Care Diagnostics (Formerly Svasti Diagnostics), GS Towers, 116, Sai Baba Temple Rd, near Arekere, Royal Residency Layout - BTM 4th stg, Royal Residency Layout, Hulimavu, Bengaluru, Karnataka 560076, Karnataka","city":"Bangalore ","state":"Karnataka","pincode":560076,"spocName":"","spocContact":"","transportNo":"Rider"},{"clinicName":"Bangalore-Jayanagar","clientName":"Allohealth","partnerCode":"Allohealth(CORP11694)","recipientAddress":"Allo health- Jayanagar, Adhventha Hospital 31,45th Cross, Sangam Circle, opposite Metro Pillar No 16, 8th Block, Jayanagar, Bengaluru, Karnataka 560070, Karnataka","city":"Bangalore ","state":"Karnataka","pincode":560070,"spocName":"","spocContact":"","transportNo":"Rider"},{"clinicName":"Bangalore - Koramangala","clientName":"Allohealth","partnerCode":"Allohealth(CORP11694)","recipientAddress":"33, Ground floor, Cudur Speciality Clinics, 1st Main Rd, 1st Block Koramangala, Koramangala, Bengaluru, Karnataka 560034, Karnataka","city":"Bangalore ","state":"Karnataka","pincode":560034,"spocName":"","spocContact":"","transportNo":"Rider"},{"clinicName":"Zydus Life Scineces","clientName":"Visit Health Camp","partnerCode":"COCA8252419","recipientAddress":"Zydus lifescience Limited (Vaccine Technology Center ), Opposite Ramdev Masala, Sarkhej Bavla N.H. 8A, Changodar Road, Ahmedabad-382213, Gujarat, India","city":"Ahmedabad","state":"Gujrat","pincode":380001,"spocName":"","spocContact":"","transportNo":"Porter"}];

function getSuggestions(query, fieldType) {
    const q = (query || '').toLowerCase().trim();
    if (!q) return [];
    
    const list = new Set();
    
    CLINIC_PRESETS.forEach(item => {
        let val = '';
        if (fieldType === 'recipientName') val = item.clinicName;
        else if (fieldType === 'clientName') val = item.clientName;
        else if (fieldType === 'campCode') val = item.partnerCode;
        if (val && val.toLowerCase().includes(q)) list.add(val);
    });
    
    const currentCtx = (sessionData.contextType || '').toLowerCase();
    
    historyLog.forEach(h => {
        const s = h.fullSession || {};
        const hCtx = String(h.context || s.contextType || 'camp').toLowerCase();
        if (hCtx !== currentCtx) return; // Only show suggestions matching active tab context
        
        let val = '';
        if (fieldType === 'recipientName') val = s.recipientName || h.consignee || '';
        else if (fieldType === 'clientName') val = s.clientName || h.clientName || '';
        else if (fieldType === 'campCode') val = s.campCode || h.campCode || '';
        
        if (val && val.toLowerCase().includes(q)) list.add(val);
    });
    
    return Array.from(list).slice(0, 10);
}

function triggerAutocomplete(fieldType, inputEl) {
    closeAutocomplete();
    
    const query = inputEl.value;
    const matches = getSuggestions(query, fieldType);
    if (matches.length === 0) return;
    
    const dropdown = document.createElement('div');
    dropdown.id = 'clinic-autocomp-dropdown';
    dropdown.className = 'absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-indigo-200 rounded-2xl shadow-xl overflow-hidden divide-y divide-slate-100 animate-in fade-in slide-in-from-top-1 duration-150';
    
    dropdown.innerHTML = matches.map((m) => {
        const safeVal = m.replace(/'/g, "\\'").replace(/"/g, "&quot;");
        return `
        <div class="p-2.5 hover:bg-indigo-50/60 cursor-pointer transition flex items-center group" onclick="selectSuggestion('${safeVal}', '${fieldType}')">
            <div class="text-xs font-black text-slate-800 group-hover:text-indigo-900 flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                ${m}
            </div>
        </div>
    `}).join('');
    
    inputEl.parentNode.classList.add('relative');
    inputEl.parentNode.appendChild(dropdown);

    // Window click outside listener
    setTimeout(() => {
        window.addEventListener('click', handleOutsideClinicClick);
    }, 10);
}

function handleOutsideClinicClick(e) {
    const dropdown = document.getElementById('clinic-autocomp-dropdown');
    if (dropdown && !dropdown.contains(e.target)) {
        closeAutocomplete();
    }
}

function closeAutocomplete() {
    const dd = document.getElementById('clinic-autocomp-dropdown');
    if (dd) dd.remove();
    window.removeEventListener('click', handleOutsideClinicClick);
}

function selectSuggestion(val, fieldType) {
    if (fieldType === 'recipientName') {
        sessionData.recipientName = val;
        
        // Smart Autofill: Populate all related fields when a Clinic/Recipient is selected from dropdown
        const currentCtx = (sessionData.contextType || '').toLowerCase();
        
        // Find the most recent matching record in history
        const match = historyLog.find(h => {
            const s = h.fullSession || {};
            const hCtx = String(h.context || s.contextType || 'camp').toLowerCase();
            const rName = s.recipientName || h.consignee || '';
            return hCtx === currentCtx && rName.toLowerCase() === val.toLowerCase();
        });
        
        if (match) {
            const s = match.fullSession || {};
            if (s.clientName) sessionData.clientName = s.clientName;
            if (s.campCode) sessionData.campCode = s.campCode;
            if (s.recipientAddress) sessionData.recipientAddress = s.recipientAddress;
            if (s.city) sessionData.city = s.city;
            if (s.state) sessionData.state = s.state;
            if (s.pincode) sessionData.pincode = s.pincode;
            if (s.spocName) sessionData.spocName = s.spocName;
            if (s.spocContact) sessionData.spocContact = s.spocContact;
            if (s.transportNo) sessionData.transportNo = s.transportNo;
        } else {
            // Check presets if not in history
            const presetMatch = CLINIC_PRESETS.find(p => p.clinicName && p.clinicName.toLowerCase() === val.toLowerCase());
            if (presetMatch) {
                if (presetMatch.clientName) sessionData.clientName = presetMatch.clientName;
                if (presetMatch.partnerCode) sessionData.campCode = presetMatch.partnerCode;
                if (presetMatch.recipientAddress) sessionData.recipientAddress = presetMatch.recipientAddress;
                if (presetMatch.city) sessionData.city = presetMatch.city;
                if (presetMatch.state) sessionData.state = presetMatch.state;
                if (presetMatch.pincode) sessionData.pincode = presetMatch.pincode;
                if (presetMatch.spocName) sessionData.spocName = presetMatch.spocName;
                if (presetMatch.spocContact) sessionData.spocContact = presetMatch.spocContact;
                if (presetMatch.transportNo) sessionData.transportNo = presetMatch.transportNo;
            }
        }
    }
    else if (fieldType === 'clientName') {
        sessionData.clientName = val;
    }
    else if (fieldType === 'campCode') {
        sessionData.campCode = val;
    }
    
    closeAutocomplete();
    saveDraft();
    renderLeftForm();
    renderDocument();
}

function setDocType(type) {
    currentDocType = type;
    const menu = document.getElementById('doc-type-menu');
    if (menu) menu.classList.add('hidden');
    const lbl = document.getElementById('doc-type-label');
    if (lbl) lbl.innerText = type === 'DC' ? 'Returnable Delivery Challan' : 'Material Gate Pass';
    saveDraft();
    renderLeftForm();
    renderDocument();
}

function saveDraft() {
    try {
        localStorage.setItem('rcl_draft', JSON.stringify({ sessionData, itemsData, currentDocType }));
    } catch(e) {}
}

function loadDraft() {
    try {
        const d = JSON.parse(localStorage.getItem('rcl_draft'));
        if (d) { 
            sessionData = d.sessionData || sessionData; 
            itemsData = d.itemsData || itemsData; 
            currentDocType = d.currentDocType || 'DC'; 
        }
    } catch(e) {}
}

function initChallanApp() {
    if (!document.getElementById('challan-wrapper')) return;
    loadDraft();
    updateThemeUI(); 
    try { if (typeof fetchHistoryFromSheet === 'function') fetchHistoryFromSheet(false); } catch(e) {}
    
    // Onboarding Check
    const savedName = localStorage.getItem('rcl_user_name');
    if (!savedName) {
        const obInput = document.getElementById('onboarding-name-input');
        const obPhone = document.getElementById('onboarding-phone-input');
        const obEmail = document.getElementById('onboarding-email-input');
        const obBtn = document.getElementById('onboarding-save-btn');
        if (typeof openModal === 'function' && document.getElementById('onboarding-modal')) {
            openModal('onboarding-modal');
        }

        if (obBtn && obInput) {
            obBtn.onclick = () => {
                const val = obInput.value.trim();
                const phone = obPhone ? obPhone.value.trim() : '';
                const email = obEmail ? obEmail.value.trim() : '';
                
                if (val) {
                    localStorage.setItem('rcl_user_name', val);
                    if (phone) localStorage.setItem('rcl_user_phone', phone);
                    if (email) localStorage.setItem('rcl_user_email', email);
                    
                    sessionData.requestedBy = val;
                    
                    fetch(BACKUP_SHEET_URL, {
                        method: "POST",
                        mode: "no-cors",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            action: "registerUser",
                            name: val,
                            phone: phone,
                            email: email,
                            timestamp: new Date().toISOString()
                        })
                    }).catch(err => console.error("Error syncing user info", err));

                    if (typeof closeModal === 'function') closeModal('onboarding-modal');
                    saveDraft();
                    renderLeftForm();
                    renderDocument();
                }
            };
        }
    } else if (!sessionData.requestedBy) {
        sessionData.requestedBy = savedName;
    }

    renderLeftForm();
    renderDocument();
    
    // Initialize Drag Handles and Canvas Panning
    initResizablePanels();
    initChallanPan();
}
window.initChallanApp = initChallanApp;

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initChallanApp);
} else {
    initChallanApp();
}

// =====================================================================
// CONTEXT PILL TABS
// =====================================================================
function getMonthEndDate() {
    const d = new Date();
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    const y = lastDay.getFullYear();
    const m = String(lastDay.getMonth() + 1).padStart(2, '0');
    const day = String(lastDay.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function getTwoDaysFromNow() {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function switchContext(val) {
    sessionData.contextType = val;
    
    // Clinic Automations
    if (val === 'clinic') {
        sessionData.transportNo = "Rider";
        sessionData.approxCampReturn = getMonthEndDate();
        sessionData.campDate = getTwoDaysFromNow();
    } else {
        sessionData.transportNo = "";
        sessionData.approxCampReturn = "";
        sessionData.campDate = "";
    }
    
    updateThemeUI();
    saveDraft();
    renderLeftForm();
    renderDocument();
}

// Bulk Download Variables
let currentBulkMode = null; // 'csv' or 'history'

async function showBulkSettingsModal(mode) {
    currentBulkMode = mode;
    const count = mode === 'csv' ? uploadedCsvRecords.length : historyLog.length;
    
    if (count === 0) {
        showToast("No challans available to download!", "error");
        return;
    }
    
    document.getElementById('bulk-settings-count').textContent = `Configure settings for downloading ${count} challans as a single ZIP folder.`;
    
    // Pre-fill existing data if any
    const hidePriceEl = document.getElementById('bulk-hide-price');
    if (hidePriceEl) hidePriceEl.checked = !!sessionData.bulkHidePrice;
    document.getElementById('bulk-client-subject').value = sessionData.clientMailSubject || "";
    document.getElementById('bulk-client-date').value = sessionData.clientMailDate || "";
    document.getElementById('bulk-our-subject').value = sessionData.ourMailSubject || "";
    document.getElementById('bulk-our-date').value = sessionData.ourMailDate || "";
    
    document.getElementById('bulk-settings-start-btn').onclick = startBulkDownloadProcess;
    
    openModal('bulk-settings-modal');
}

function downloadAllCsvRecords() {
    showBulkSettingsModal('csv');
}

async function startBulkDownloadProcess() {
    closeModal('bulk-settings-modal');
    
    const count = currentBulkMode === 'csv' ? uploadedCsvRecords.length : historyLog.length;
    const isSaveBackend = document.getElementById('bulk-save-backend').checked;
    const hidePriceEl = document.getElementById('bulk-hide-price');
    const isHidePrice = hidePriceEl ? hidePriceEl.checked : false;
    const clientSubject = document.getElementById('bulk-client-subject').value.trim();
    const clientDate = document.getElementById('bulk-client-date').value;
    const ourSubject = document.getElementById('bulk-our-subject').value.trim();
    const ourDate = document.getElementById('bulk-our-date').value;
    
    let isClinic = sessionData.contextType === 'clinic';
    if (!isClinic && currentBulkMode === 'csv') {
        isClinic = uploadedCsvRecords.some(r => {
            const p = (r['purpose'] || "").toLowerCase();
            return p.includes('clinic') || r['clinic name'];
        });
    } else if (!isClinic && currentBulkMode === 'history') {
        isClinic = historyLog.some(h => (h.context || "").toLowerCase() === 'clinic');
    }
    
    if (isClinic && !clientSubject && isSaveBackend) {
        showToast("Client Mail Subject Line is compulsory for Clinic challans when saving to backend!", "error");
        return;
    }
    
    document.body.style.cursor = 'wait';
    showLoadingOverlay(`Downloading ${count} challans...`);

    let successCount = 0;
    let failCount = 0;
    
    try {
        const zip = new JSZip();
        let firstClientName = "Bulk_Challans";
        
        await executeWithoutLosingState(async () => {
            for (let i = 0; i < count; i++) {
                showLoadingOverlay(`Generating PDF ${i + 1} of ${count} for ZIP...`);
                
                try {
                    if (currentBulkMode === 'csv') {
                        loadCsvRecord(i);
                    } else {
                        loadFromHistory(i, true, true);
                    }
                    
                    if (i === 0) {
                        firstClientName = (sessionData.clientName || sessionData.recipientName || "Bulk_Challans").replace(/[^a-zA-Z0-9_\-]/g, '_');
                    }
                    
                    // Override with common settings if provided
                    if (clientSubject) sessionData.clientMailSubject = clientSubject;
                    if (clientDate) sessionData.clientMailDate = clientDate;
                    if (ourSubject) sessionData.ourMailSubject = ourSubject;
                    if (ourDate) sessionData.ourMailDate = ourDate;
                    
                    renderDocument();
                    let waitTime = 0;
                    while (sessionData.isFetchingId && waitTime < 10000) {
                        await new Promise(r => setTimeout(r, 200));
                        waitTime += 200;
                    }
                    await new Promise(r => setTimeout(r, 100)); // slight delay for DOM
                    
                    const result = await downloadChallan(isHidePrice, true, !isSaveBackend, true, true);
                    if (result && result.blob) {
                        zip.file(result.filename, result.blob);
                        successCount++;
                    } else {
                        failCount++;
                    }
                } catch(e) {
                    failCount++;
                    console.error("Failed to generate PDF for record " + i, e);
                }
                
                await new Promise(r => setTimeout(r, 300));
            }
        });
        
        if (successCount > 0) {
            showLoadingOverlay(`Zipping ${successCount} files...`);
            const zipBlob = await zip.generateAsync({ type: "blob" });
            const zipFilename = `${firstClientName}_${successCount}_challans.zip`;
            
            // Download the zip
            const url = window.URL.createObjectURL(zipBlob);
            const a = document.createElement("a");
            a.style.display = "none";
            a.href = url;
            a.download = zipFilename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        }
    } finally {
        hideLoadingOverlay();
        closeModal('bulk-settings-modal');
        document.body.style.cursor = 'default';
        
        if (failCount > 0) {
            showToast(`Downloaded ${successCount} of ${count} challans. ${failCount} failed.`, "alert");
        } else if (successCount > 0) {
            showToast(`Successfully downloaded all ${successCount} challans!`, "success");
        }
    }
}

function updateThemeUI() {
    document.getElementById('doc-type-label').innerText = currentDocType === 'DC' ? 'Returnable Delivery Challan' : 'Material Gate Pass';
    
    document.querySelectorAll('.context-pill').forEach(pill => {
        pill.classList.toggle('active', pill.dataset.context === sessionData.contextType);
        if (pill.dataset.context === sessionData.contextType) {
            pill.classList.remove('bg-transparent', 'text-slate-500');
            pill.classList.add('bg-white', 'text-[#053763]', 'shadow-sm'); // Navy active state
        } else {
            pill.classList.add('bg-transparent', 'text-slate-500');
            pill.classList.remove('bg-white', 'text-[#053763]', 'shadow-sm');
        }
    });
}

// =====================================================================
// CUSTOM COMBOBOX LOGIC
// =====================================================================
function openCombobox(index, el) {
    // Remove existing
    document.querySelectorAll('.combobox-dropdown').forEach(e => e.remove());
    
    const container = document.createElement('div');
    container.className = 'combobox-dropdown';
    container.id = 'combo-' + index;
    
    el.parentNode.appendChild(container);
    renderComboboxItems(index, el.value);
}

function renderComboboxItems(index, query) {
    const container = document.getElementById('combo-' + index);
    if (!container) return;
    
    const q = query.toLowerCase().trim();
    let matches = inventoryItems;
    if (q) {
        matches = inventoryItems.filter(i => i.name.toLowerCase().includes(q));
    }
    
    if (matches.length === 0) {
        container.innerHTML = `
            <div class="p-3 bg-indigo-50/50 flex flex-col gap-2 border-b border-indigo-100">
                <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Item not in master list</span>
                <button type="button" onclick="selectComboboxItem(${index}, '${query.replace(/'/g, "\\'")}')" class="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-black transition shadow-sm">
                    Add "${query}" as Custom Item
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = matches.map(item => `
        <div class="combobox-item" onclick="selectComboboxItem(${index}, '${item.name.replace(/'/g, "\\'")}')">
            ${item.name} <span class="float-right text-[10px] text-slate-400 font-normal">₹${item.price}</span>
        </div>
    `).join('');
}

function filterCombobox(index, el) {
    updateItem(index, 'desc', el.value);
    const container = document.getElementById('combo-' + index);
    if (!container) {
        openCombobox(index, el);
    } else {
        renderComboboxItems(index, el.value);
    }
}

function selectComboboxItem(index, itemName) {
    const found = inventoryItems.find(i => i.name === itemName);
    if (found) {
        itemsData[index].desc = found.name;
        itemsData[index].unit = found.uom;
        itemsData[index].rate = found.price;
        // Auto default Qty to 1 if empty
        if (!itemsData[index].qty || itemsData[index].qty === "0") itemsData[index].qty = "1";
        itemsData[index].rem = (found.category === 'Equipment' || found.name.includes('Box') || found.name.includes('Machine') || found.name.includes('Pack')) ? 'Returnable' : 'Consumable';
    } else {
        itemsData[index].desc = itemName;
    }
    document.querySelectorAll('.combobox-dropdown').forEach(e => e.remove());
    saveDraft();
    renderDocument();
    renderLeftForm(); // Refresh to update fields visually
}

// =====================================================================
// LEFT FORM RENDERER
// =====================================================================
function renderLeftForm() {
    const formFieldsEl = document.getElementById('left-form-fields');
    const itemsEl = document.getElementById('left-form-items');
    if (!formFieldsEl || !itemsEl) return;
    
    // Render Fields into Section Cards
    let html = '';
    if (currentDocType === 'DC') {
        let lblCampCode = "Camp Code";
        let lblClientName = "Client / Partner Name";
        let lblCampDate = "Camp Date";
        let hintCampCode = "";
        let hintClientName = "";
        if (sessionData.contextType === 'clinic') { 
            lblCampCode = "Clinic Name"; 
            lblClientName = "Partner Name and Code"; 
            hintCampCode = "e.g. allohealth kondapur";
            hintClientName = "e.g. ALLOHEALTH- CORP1234";
        }
        else if (sessionData.contextType === 'lab') { lblCampCode = "Lab GST Number"; lblClientName = "Lab / Client Name"; lblCampDate = "Expected Delivery Date"; }
        else if (sessionData.contextType === 'courier') { lblCampCode = "GSTIN"; }

        // Clinic Mail Tracking (BEFORE Clinic Info - Clinic tab only)
        if (sessionData.contextType === 'clinic') {
            html += `
            <div class="form-section space-y-3 mb-4 border border-indigo-200/80 bg-indigo-50/20 p-3.5 rounded-2xl">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <div class="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a 1.94 1.94 0 0 1 -2.06 0L2 7"/></svg>
                        </div>
                        <h4 class="text-[11px] font-black uppercase tracking-wider text-indigo-950">Mail Tracking</h4>
                    </div>
                    <span class="text-[8px] font-bold bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">Clinic Only</span>
                </div>
                <div class="grid grid-cols-2 gap-2.5">
                    <div>
                        <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 ml-1">Client Mail Subject <span class="text-red-500">*</span></label>
                        <input type="text" class="w-full bg-white border ${!sessionData.clientMailSubject ? 'border-amber-300 ring-1 ring-amber-100' : 'border-slate-200'} rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-[#053763] focus:ring-2 focus:ring-indigo-50 transition" value="${sessionData.clientMailSubject || ''}" placeholder="e.g. Request for Consumables" oninput="updateSession('clientMailSubject', this.value);">
                    </div>
                    ${createInputGroup('Client Mail Date', 'clientMailDate', sessionData.clientMailDate, 'datetime-local')}
                    ${createInputGroup('Our Reply Subject', 'ourMailSubject', sessionData.ourMailSubject, 'text', 'Optional — add later from History')}
                    ${createInputGroup('Our Mail Date', 'ourMailDate', sessionData.ourMailDate, 'datetime-local')}
                </div>
            </div>`;
        }

        if (sessionData.contextType === 'clinic') {
            html += `
            <div class="form-section space-y-4 mb-4">
                <div class="flex items-center justify-between pb-2 border-b border-slate-100 text-[#053763]">
                    <div class="flex items-center gap-2">
                        <div class="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a 4 4 0 0 0 -4 -4H9a 4 4 0 0 1 4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        </div>
                        <h4 class="text-xs font-black uppercase tracking-wider">Clinic Info</h4>
                    </div>
                    <span class="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="inline-block text-indigo-600"><path d="m12 3-1.912 5.813a 2 2 0 0 1 -1.275 1.275L3 12l5.813 1.912a 2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a 2 2 0 0 1 -1.275 -1.275L12 3Z"/></svg>Smart Autofill Active</span>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 relative">
                    <div class="relative">
                        <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Clinic Name</label>
                        <input type="text" id="input-clinic-name" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-[#053763] focus:bg-white transition" value="${sessionData.recipientName || ''}" placeholder="e.g. allohealth kondapur" oninput="updateSession('recipientName', this.value); triggerAutocomplete('recipientName', this);" onfocus="triggerAutocomplete('recipientName', this);" autocomplete="off">
                    </div>
                    <div class="relative">
                        <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Client Name</label>
                        <input type="text" id="input-client-name" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-[#053763] focus:bg-white transition" value="${sessionData.clientName || ''}" placeholder="e.g. ALLOHEALTH" oninput="updateSession('clientName', this.value); triggerAutocomplete('clientName', this);" onfocus="triggerAutocomplete('clientName', this);" autocomplete="off">
                    </div>
                    <div class="relative sm:col-span-2">
                        <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Partner Name & Code</label>
                        <input type="text" id="input-partner-code" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-[#053763] focus:bg-white transition" value="${sessionData.campCode || ''}" placeholder="e.g. ALLOHEALTH- CORP1234" oninput="updateSession('campCode', this.value); triggerAutocomplete('campCode', this);" onfocus="triggerAutocomplete('campCode', this);" autocomplete="off">
                    </div>
                    ${createInputGroup('Expected Delivery', 'campDate', sessionData.campDate, 'date')}
                    ${createInputGroup('Approx Return', 'approxCampReturn', sessionData.approxCampReturn, 'date')}
                </div>
            </div>`;
        } else {
            html += `
            <div class="form-section space-y-4 mb-4">
                <div class="flex items-center justify-between pb-2 border-b border-slate-100 text-[#053763]">
                    <div class="flex items-center gap-2">
                        <div class="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a 4 4 0 0 0 -4 -4H9a 4 4 0 0 1 4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        </div>
                        <h4 class="text-xs font-black uppercase tracking-wider">${sessionData.contextType === 'lab' ? 'Lab Details' : 'Camp / Client Details'}</h4>
                    </div>
                    <span class="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="inline-block text-indigo-600"><path d="m12 3-1.912 5.813a 2 2 0 0 1 -1.275 1.275L3 12l5.813 1.912a 2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a 2 2 0 0 1 -1.275 -1.275L12 3Z"/></svg>Smart Autofill Active</span>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 relative">
                    ${createInputGroup(lblCampCode, 'campCode', sessionData.campCode, 'text', hintCampCode)}
                    ${createInputGroup(lblClientName, 'clientName', sessionData.clientName, 'text', hintClientName)}
                    ${createInputGroup(lblCampDate, 'campDate', sessionData.campDate, 'date')}
                    ${createInputGroup('Approx Return', 'approxCampReturn', sessionData.approxCampReturn, 'date')}
                </div>
            </div>`;
        }
        
        // Section 2: Location Card (Address, City, Pincode)
        html += `
        <div class="form-section space-y-4 mb-4">
            <div class="flex items-center gap-2 pb-2 border-b border-slate-100 text-[#053763]">
                <div class="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
                <h4 class="text-xs font-black uppercase tracking-wider">Location & Address</h4>
            </div>
            ${createTextareaGroup('Consignee Address', 'recipientAddress', sessionData.recipientAddress)}
            <div class="grid grid-cols-3 gap-2 sm:gap-3">
                ${createInputGroup('City', 'city', sessionData.city)}
                ${createInputGroup('State', 'state', sessionData.state || '')}
                ${createInputGroup('Pincode', 'pincode', sessionData.pincode)}
            </div>
        </div>`;

        // Section 3: Contact & Transport Card
        html += `
        <div class="form-section space-y-4 mb-4">
            <div class="flex items-center gap-2 pb-2 border-b border-slate-100 text-[#053763]">
                <div class="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="13" x="4" y="5" rx="2"/><path d="M16 2v3"/><path d="M8 2v3"/><path d="M4 10h16"/></svg>
                </div>
                <h4 class="text-xs font-black uppercase tracking-wider">Contact & Transport</h4>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                ${createInputGroup('Requested By', 'requestedBy', sessionData.requestedBy)}
                ${createInputGroup('Transport No', 'transportNo', sessionData.transportNo)}
                ${createInputGroup('SPOC Name', 'spocName', sessionData.spocName)}
                ${createInputGroup('SPOC Number', 'spocContact', sessionData.spocContact)}
            </div>
        </div>`;

    } else {
        // Gate Pass Mode
        html += `
        <div class="form-section space-y-4 mb-4">
            <div class="flex items-center gap-2 pb-2 border-b border-slate-100 text-[#053763]">
                <div class="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a 2 2 0 0 0 -2 2v16a 2 2 0 0 0 2 2h12a 2 2 0 0 0 2 -2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <h4 class="text-xs font-black uppercase tracking-wider">Gate Pass Options</h4>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <label class="flex items-center gap-2.5 text-xs font-extrabold text-[#053763] cursor-pointer bg-slate-50 p-3 rounded-xl border border-slate-200 hover:border-[#053763] transition">
                    <input type="checkbox" onchange="updateSession('isReturnable', this.checked); renderDocument();" ${sessionData.isReturnable ? 'checked' : ''} class="w-4 h-4 rounded border-slate-300 text-[#053763] focus:ring-[#053763]"> Returnable
                </label>
                <label class="flex items-center gap-2.5 text-xs font-extrabold text-[#053763] cursor-pointer bg-slate-50 p-3 rounded-xl border border-slate-200 hover:border-[#053763] transition">
                    <input type="checkbox" onchange="updateSession('isNonReturnable', this.checked); renderDocument();" ${sessionData.isNonReturnable ? 'checked' : ''} class="w-4 h-4 rounded border-slate-300 text-[#053763] focus:ring-[#053763]"> Non-Returnable
                </label>
                ${createInputGroup('Approx Return', 'approxReturn', sessionData.approxReturn, 'text')}
                ${createInputGroup('Actual Return', 'actualReturn', sessionData.actualReturn, 'text')}
            </div>
        </div>
        
        <div class="form-section space-y-4 mb-4">
            <div class="flex items-center gap-2 pb-2 border-b border-slate-100 text-[#053763]">
                <div class="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
                <h4 class="text-xs font-black uppercase tracking-wider">Consignee (TO) & Purpose</h4>
            </div>
            ${createInputGroup('Consignee Name', 'recipientName', sessionData.recipientName)}
            ${createTextareaGroup('Address', 'recipientAddress', sessionData.recipientAddress)}
            <div class="grid grid-cols-3 gap-2 sm:gap-3">
                ${createInputGroup('City', 'city', sessionData.city)}
                ${createInputGroup('State', 'state', sessionData.state || '')}
                ${createInputGroup('Pincode', 'pincode', sessionData.pincode)}
            </div>
            <div class="grid grid-cols-2 gap-3">
                ${createInputGroup('Phone No', 'recipientPhone', sessionData.recipientPhone)}
                ${createInputGroup('Requested By', 'requestedBy', sessionData.requestedBy)}
            </div>
            ${createInputGroup('Purpose', 'purpose', sessionData.purpose)}
        </div>`;
    }

    formFieldsEl.innerHTML = html;
    
    // Trigger slide-up animation on tab switch
    formFieldsEl.classList.remove('animate-slide-up');
    void formFieldsEl.offsetWidth; // Trigger reflow to restart animation
    formFieldsEl.classList.add('animate-slide-up');

    // Render Items
    let itemsHtml = '';
    const isCourier = (currentDocType === 'DC' && sessionData.contextType === 'courier');
    
    itemsData.forEach((item, idx) => {
        const isFilled = (item.desc && item.desc.trim() !== '') || (item.qty && item.qty > 0);
        const itemVal = (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0);
        itemsHtml += `
            <div class="item-card ${isFilled ? 'is-filled' : ''} relative group combo-container mt-3">
                <div class="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                    <div class="flex items-center gap-2">
                        <span class="w-6 h-6 rounded-lg bg-[#053763] text-white flex items-center justify-center font-black text-[11px]">#${idx + 1}</span>
                        <span class="text-xs font-black text-slate-700 truncate max-w-[200px] sm:max-w-[240px]">${item.desc || 'New Empty Item'}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        ${itemVal > 0 ? `<span class="text-[11px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">₹${itemVal.toLocaleString('en-IN')}</span>` : ''}
                        <button onclick="removeRow(${idx})" class="w-7 h-7 rounded-full bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-400 flex items-center justify-center transition shadow-sm border border-slate-200" title="Remove Item">
                            ${SVG.trash}
                        </button>
                    </div>
                </div>
                <div class="space-y-3">
                    <div class="relative">
                        <label class="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Description (Search Item)</label>
                        <input type="text" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:border-[#053763] focus:bg-white focus:ring-4 focus:ring-indigo-50 transition" 
                            value="${item.desc}" 
                            placeholder="Type to search master list..."
                            onfocus="openCombobox(${idx}, this)" 
                            oninput="filterCombobox(${idx}, this)">
                    </div>
                    <div class="grid grid-cols-4 gap-2.5">
                        ${isCourier ? `<div class="col-span-4 lg:col-span-1"><label class="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">HSN</label><input type="text" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-[#053763] focus:bg-white transition" value="${item.hsn || ''}" oninput="updateItem(${idx}, 'hsn', this.value)"></div>` : ''}
                        <div class="col-span-2 lg:col-span-1"><label class="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Qty</label><input type="number" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-blue-700 outline-none focus:border-[#053763] focus:bg-white transition" value="${item.qty}" oninput="updateItem(${idx}, 'qty', this.value)"></div>
                        <div class="col-span-2 lg:col-span-1"><label class="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Rate (₹)</label><input type="number" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-green-700 outline-none focus:border-[#053763] focus:bg-white transition" value="${item.rate}" oninput="updateItem(${idx}, 'rate', this.value)"></div>
                        <div class="col-span-4 lg:col-span-2"><label class="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Unit</label><input type="text" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-[#053763] focus:bg-white transition" value="${item.unit}" oninput="updateItem(${idx}, 'unit', this.value)"></div>
                        <div class="col-span-4"><label class="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Remark</label><input type="text" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-[#053763] focus:bg-white transition" value="${item.rem}" oninput="updateItem(${idx}, 'rem', this.value)"></div>
                    </div>
                </div>
            </div>
        `;
    });
    
    if (itemsData.length === 0) {
        itemsHtml = `<div class="text-center p-8 bg-slate-50 border-2 border-slate-200 border-dashed rounded-2xl text-slate-400 text-sm font-bold mb-4 flex flex-col items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-slate-300"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a 2 2 0 0 0 -1 -1.73l-7-4a 2 2 0 0 0 -2 0l-7 4A 2 2 0 0 0 3 8v8a 2 2 0 0 0 1 1.73l7 4a 2 2 0 0 0 2 0l7-4A 2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
            <span>No items added in this document yet.</span>
        </div>`;
    }
    
    itemsHtml += `
        <button onclick="addRow()" class="w-full mt-3 border-2 border-dashed border-[#053763]/40 bg-slate-50 hover:bg-[#053763]/5 text-[#053763] font-black rounded-2xl py-3.5 flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-sm hover:shadow">
            <div class="w-6 h-6 rounded-lg bg-[#053763] text-white flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            </div>
            ${itemsData.length === 0 ? 'Add Your First Item' : 'Add Another Item'}
        </button>
    `;
    
    itemsEl.innerHTML = itemsHtml;
}

function createInputGroup(label, key, value, type='text', placeholder='') {
    let autofillHooks = `oninput="updateSession('${key}', this.value); renderDocument();"`;
    if (type === 'text' && ['recipientName', 'clientName', 'campCode'].includes(key)) {
        autofillHooks = `oninput="updateSession('${key}', this.value); triggerAutocomplete('${key}', this); renderDocument();" onfocus="triggerAutocomplete('${key}', this);" autocomplete="off"`;
    }
    return `
        <div class="relative">
            <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">${label}</label>
            <input type="${type}" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-[#053763] focus:bg-white focus:ring-4 focus:ring-indigo-50 transition" value="${value || ''}" placeholder="${placeholder || ''}" ${autofillHooks}>
        </div>
    `;
}

function createTextareaGroup(label, key, value) {
    return `
        <div>
            <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">${label}</label>
            <textarea rows="3" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-[#053763] focus:bg-white focus:ring-4 focus:ring-indigo-50 transition resize-none" oninput="updateSession('${key}', this.value); renderDocument();">${value || ''}</textarea>
        </div>
    `;
}

function updateSession(key, value) {
    sessionData[key] = value;
    if (key === 'recipientAddress') {
        extractAddressDetails(value);
    }
    saveDraft();
}

function extractAddressDetails(address) {
    // 1. Pincode Extraction (6 digits)
    const pinMatch = address.match(/\b\d{6}\b/);
    if (pinMatch) {
        sessionData.pincode = pinMatch[0];
        const pinInput = document.querySelector('input[oninput*="pincode"]');
        if(pinInput) pinInput.value = sessionData.pincode;
    }
    
    // 2. City & State Extraction (Common Indian Cities & States Fallback)
    const cityStateMap = {
        "Noida": "Uttar Pradesh", "Ghaziabad": "Uttar Pradesh", "Lucknow": "Uttar Pradesh",
        "Delhi": "Delhi", "New Delhi": "Delhi",
        "Gurugram": "Haryana", "Gurgaon": "Haryana", "Faridabad": "Haryana", "Chandigarh": "Chandigarh",
        "Mumbai": "Maharashtra", "Pune": "Maharashtra",
        "Bangalore": "Karnataka", "Bengaluru": "Karnataka",
        "Chennai": "Tamil Nadu", "Kolkata": "West Bengal", "Hyderabad": "Telangana",
        "Ahmedabad": "Gujarat", "Jaipur": "Rajasthan", "Dehradun": "Uttarakhand",
        "Indore": "Madhya Pradesh", "Bhopal": "Madhya Pradesh", "Patna": "Bihar"
    };
    
    const commonStates = ["Uttar Pradesh", "UP", "Delhi", "Haryana", "Maharashtra", "Karnataka", "Tamil Nadu", "West Bengal", "Telangana", "Gujarat", "Rajasthan", "Uttarakhand", "Madhya Pradesh", "MP", "Bihar", "Punjab"];
    const upperAddress = address.toUpperCase();
    
    for (let [city, state] of Object.entries(cityStateMap)) {
        if (upperAddress.includes(city.toUpperCase())) {
            sessionData.city = city;
            const cityInput = document.querySelector('input[oninput*="city"]');
            if(cityInput) cityInput.value = sessionData.city;
            
            if (!sessionData.state) {
                sessionData.state = state;
                const stateInput = document.querySelector('input[oninput*="state"]');
                if(stateInput) stateInput.value = sessionData.state;
            }
            break;
        }
    }
    
    // Check if state explicitly mentioned in address
    if (!sessionData.state) {
        for (let st of commonStates) {
            if (upperAddress.includes(` ${st.toUpperCase()} ` || `, ${st.toUpperCase()}`)) {
                sessionData.state = (st === "UP") ? "Uttar Pradesh" : (st === "MP") ? "Madhya Pradesh" : st;
                const stateInput = document.querySelector('input[oninput*="state"]');
                if(stateInput) stateInput.value = sessionData.state;
                break;
            }
        }
    }
}

function updateItem(index, field, value) {
    itemsData[index][field] = value;
    saveDraft();
    renderDocument(); 
}

function addRow() {
    itemsData.push({ desc: "", hsn: "", unit: "Nos", qty: "1", rate: "", rem: "" });
    renderLeftForm();
    renderDocument();
    
    // GSAP Spring feedback on the document preview
    const docPreview = document.getElementById('challan-wrapper');
    if (window.gsap) {
        gsap.fromTo(docPreview, 
            { scale: 0.98 }, 
            { scale: 1, duration: 0.5, ease: "elastic.out(1, 0.5)" }
        );
    }
}

function removeRow(index) {
    itemsData.splice(index, 1);
    renderLeftForm();
    renderDocument();
}

function clearForm() {
    showModal("Are you sure you want to clear all details and items?", "confirm", () => {
        sessionData = {
            contextType: sessionData.contextType,
            recipientName: "", recipientAddress: "", recipientPhone: "",
            clientName: "", city: "", state: "", pincode: "", requestedBy: localStorage.getItem('rcl_user_name') || "",
            spocName: "", spocContact: "", campCode: "", campDate: "", approxCampReturn: "", transportNo: "NA",
            purpose: "", approxReturn: "", actualReturn: "",
            isReturnable: false, isNonReturnable: false,
            docIds: { DC: "", GP: "" }
        };
        itemsData = [];
        const bulkContainer = document.getElementById('csv-bulk-container');
        if (bulkContainer) bulkContainer.classList.add('hidden');
        uploadedCsvRecords = [];
        renderLeftForm();
        renderDocument();
        showToast("Form cleared successfully", "info");
    });
}


// =====================================================================
// FILE UPLOAD (EXCEL/CSV via SheetJS) & CONFIRMATION
// =====================================================================
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, {type: 'array'});
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const json = XLSX.utils.sheet_to_json(worksheet, { defval: "", raw: false });
            
            if (json.length === 0) {
                showModal("The uploaded file is empty or invalid.", "alert");
                return;
            }

            uploadedCsvRecords = json.map(row => {
                let cleanRow = {};
                for (let key in row) {
                    cleanRow[key.trim().toLowerCase()] = String(row[key] || '').trim();
                }
                return cleanRow;
            });

            showModal(`Successfully parsed ${uploadedCsvRecords.length} record(s). Do you want to load this data into the form? This will overwrite current entries.`, "confirm", () => {
                const container = document.getElementById('csv-bulk-container');
                const selector = document.getElementById('csv-row-selector');
                if (uploadedCsvRecords.length > 1) {
                    if (container) container.classList.remove('hidden');
                    if (selector) selector.innerHTML = uploadedCsvRecords.map((r, i) => {
                        const firstColVal = Object.values(r)[0] || '';
                        const labelName = r['clinic name'] || r['client name'] || r['camp code'] || r['consignee'] || firstColVal || 'Unknown';
                        return `<option value="${i}">Row ${i + 1}: ${labelName}</option>`;
                    }).join('');
                } else {
                    if (container) container.classList.add('hidden');
                }
                loadCsvRecord(0); 
            });

        } catch (err) {
            showModal("Error parsing file. Please ensure it is a valid CSV or Excel file.", "alert");
        }
    };
    reader.readAsArrayBuffer(file);
    event.target.value = ''; 
}

function normalizeDate(val, fallback) {
    if (!val) return fallback;
    val = String(val).trim();
    if (/^\d+$/.test(val)) {
        const excelEpoch = new Date(1899, 11, 30);
        const jsDate = new Date(excelEpoch.getTime() + parseInt(val) * 86400000);
        const y = jsDate.getFullYear();
        const m = String(jsDate.getMonth() + 1).padStart(2, '0');
        const day = String(jsDate.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }
    let m = val.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
    m = val.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
    if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
        const y = d.getFullYear();
        const mon = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${mon}-${day}`;
    }
    return fallback;
}

function loadCsvRecord(index) {
    const r = uploadedCsvRecords[index];
    if (!r) return;
    
    sessionData.docIds = { DC: "", GP: "" };

    sessionData.recipientName = r['consignee name / clinic name'] || r['clinic name'] || r['consignee name'] || r['consignee'] || sessionData.recipientName || "";
    let addr = r['address / location'] || r['address'] || r['recipient address'] || sessionData.recipientAddress || "";
    let st = r['state'] || "";
    sessionData.recipientAddress = st && !addr.includes(st) ? `${addr}, ${st}` : addr;
    sessionData.state = st;
    sessionData.city = r['city'] || sessionData.city;
    sessionData.pincode = r['pincode'] || sessionData.pincode;
    
    sessionData.spocName = r['spoc name'] || r['spoc'] || sessionData.spocName;
    sessionData.spocContact = r['spoc contact'] || r['contact'] || sessionData.spocContact;
    sessionData.campCode = r['camp code / clinic name / gstin / partner code'] || r['partner name'] || r['partner code'] || r['camp code/clinic name/gst'] || r['camp code'] || r['lab name'] || sessionData.campCode;
    sessionData.clientName = r['client / partner name / lab name'] || r['client/partner name'] || r['client name'] || r['client'] || sessionData.clientName;
    
    sessionData.campDate = normalizeDate(r['camp date / delivery date / expected date'] || r['camp date/delivery date'] || r['camp date'] || r['date'], sessionData.campDate);
    sessionData.approxCampReturn = normalizeDate(r['approx return date'] || r['approx return'], sessionData.approxCampReturn);
    
    sessionData.transportNo = r['transport no / rider'] || r['transport no'] || r['transport'] || sessionData.transportNo || "NA";
    sessionData.purpose = r['purpose'] || sessionData.purpose || "";
    sessionData.clientMailSubject = r['client mail subject'] || r['mail subject'] || r['subject'] || sessionData.clientMailSubject || "";
    sessionData.clientMailDate = r['client mail date'] || r['mail date'] || sessionData.clientMailDate || "";

    let purposeLower = sessionData.purpose.toLowerCase();
    if (purposeLower.includes('clinic') || r['clinic name']) sessionData.contextType = 'clinic';
    else if (purposeLower.includes('lab') || r['lab name']) sessionData.contextType = 'lab';
    else if (purposeLower.includes('courier')) sessionData.contextType = 'courier';
    else sessionData.contextType = 'camp';
    
    itemsData = [];
    inventoryItems.forEach(invItem => {
        const altHeaderKey = invItem.name.replace(/,/g, ' ').trim().toLowerCase();
        const headerKey = invItem.name.trim().toLowerCase();
        
        const qty = r[altHeaderKey] || r[headerKey];
        if (qty && parseInt(qty) > 0) {
            const rem = (invItem.category === 'Equipment' || invItem.name.includes('Box') || invItem.name.includes('Machine') || invItem.name.includes('Pack')) ? 'Returnable' : 'Consumable';
            itemsData.push({ desc: invItem.name, hsn: "", unit: invItem.uom, qty: qty, rate: invItem.price, rem: rem });
        }
    });

    if (itemsData.length === 0) {
        itemsData.push({ desc: "", hsn: "", unit: "Nos", qty: "1", rate: "", rem: "" });
    }

    // Retain requestedBy logic since it is auto-filled and we don't want it erased
    // sessionData.requestedBy remains untouched

    updateThemeUI();
    saveDraft();
    renderLeftForm();
    renderDocument();
}

function downloadSampleCSV() {
    const baseHeaders = ["Consignee Name / Clinic Name","Address / Location","City","State","Pincode","SPOC Name","SPOC Contact","Camp Code / Clinic Name / GSTIN / Partner Code","Client / Partner Name / Lab Name","Camp Date / Delivery Date / Expected Date","Approx Return Date","Transport No / Rider","Purpose"];
    const itemHeaders = inventoryItems.map(i => i.name.replace(/,/g, ' '));
    const headers = baseHeaders.concat(itemHeaders).join(',') + "\n";
    
    const baseData1 = ["\"Moon Beverages\"","\"2B/1 Ecotech-III\"","Greater Noida","UP","201306","Amit Kumar","9876543210","CAMP-101","Moon Beverages","25-10-2023","28-10-2023","TR-990","Camp Setup"];
    const itemsData1 = new Array(inventoryItems.length).fill('');
    itemsData1[0] = "500"; 
    itemsData1[3] = "10";
    
    const baseData2 = ["\"Huda City Center\"","\"Sector 29\"","Gurugram","HR","122002","Rohan Das","9876543211","CLINIC-XYZ","HealthFirst","26-10-2023","30-10-2023","TR-991","Clinic Supply"];
    const itemsData2 = new Array(inventoryItems.length).fill('');
    itemsData2[1] = "200"; 
    itemsData2[14] = "50"; 

    const sampleData = baseData1.concat(itemsData1).join(',') + "\n";
    const sampleData2 = baseData2.concat(itemsData2).join(',') + "\n";
    
    const blob = new Blob(["\ufeff", headers, sampleData, sampleData2], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "RCL_Dispatch_Template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}


// =====================================================================
// A4 PREVIEW RENDERER (renderDocument)
// =====================================================================
async function fetchNextDocId(type) {
    if (sessionData.isFetchingId) return;
    
    // If backend failed previously, skip fetch and instantly fallback
    if (sessionData.backendFailed) {
        fallbackRandomId(type);
        renderDocument();
        return;
    }

    sessionData.isFetchingId = true;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    
    try {
        const res = await fetch(`${BACKUP_SHEET_URL}?action=getNextId&type=${type}`, { 
            redirect: "follow",
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        const data = await res.json();
        if (data && data.status === "success" && data.id) {
            sessionData.docIds[type] = data.id;
            saveDraft();
        } else {
            sessionData.backendFailed = true; // Mark as failed
            fallbackRandomId(type);
        }
    } catch (e) {
        clearTimeout(timeoutId);
        sessionData.backendFailed = true; // Mark as failed on timeout/error
        fallbackRandomId(type);
    } finally {
        sessionData.isFetchingId = false;
        renderDocument();
    }
}

function fallbackRandomId(type) {
    const year = new Date().getFullYear();
    const randomID = Math.floor(1000 + Math.random() * 9000);
    sessionData.docIds[type] = `RCL/${type}/${year}/${randomID}`;
}

function renderDocument() {
    const wrapper = document.getElementById('challan-wrapper');
    if (!wrapper) return;
    wrapper.innerHTML = '';
    const type = currentDocType;
    const maxNormal = type === 'DC' ? 11 : 9;
    const maxLast = type === 'DC' ? 8 : 6;

    let pageChunks = [];
    let remainingItems = [...itemsData];

    if (remainingItems.length === 0) {
        pageChunks.push({ items: [], isLast: true, padTo: maxLast });
    } else {
        while (remainingItems.length > 0) {
            if (remainingItems.length <= maxLast) {
                pageChunks.push({ items: remainingItems.splice(0, remainingItems.length), isLast: true, padTo: maxLast });
            } else if (remainingItems.length <= maxNormal) {
                // Split so the last page receives at least 3 items (or half if fewer) instead of 0 items
                const splitCount = remainingItems.length - Math.min(3, Math.floor(remainingItems.length / 2));
                pageChunks.push({ items: remainingItems.splice(0, splitCount), isLast: false, padTo: maxNormal });
            } else {
                pageChunks.push({ items: remainingItems.splice(0, maxNormal), isLast: false, padTo: maxNormal });
            }
        }
    }

    if (pageChunks.length > 0 && !pageChunks[pageChunks.length - 1].isLast) {
        pageChunks[pageChunks.length - 1].isLast = true;
    }

    const totalPages = pageChunks.length;

    if (!sessionData.docIds[type] || sessionData.docIds[type] === 'Fetching ID...') {
        if (!sessionData.isFetchingId) {
            sessionData.docIds[type] = 'Fetching ID...';
            fetchNextDocId(type);
        } else if (!sessionData.docIds[type]) {
            sessionData.docIds[type] = 'Fetching ID...';
        }
    }

    let absoluteIdx = 0;
    const reqPhone = localStorage.getItem('rcl_user_phone') || 'N/A';
    const reqEmail = localStorage.getItem('rcl_user_email') || 'N/A';

    for (let p = 0; p < totalPages; p++) {
        const chunk = pageChunks[p];
        const isLastPage = chunk.isLast;
        const isEmptyPage = chunk.items.length === 0;

        const pageDiv = document.createElement('div');
        pageDiv.className = 'challan-container text-black mb-8 print:mb-0 shadow-lg';

        // 1. HEADER
        const headerHtml = `
            <div id="header-section">
                <div class="flex justify-between items-start mb-4 text-black">
                    <div class="w-2/3">
                        <div class="flex items-center gap-4 mb-3">
                            <img src="logo_doc.png" alt="Redcliffe Logo" class="h-12 w-auto object-contain">
                            <div class="h-10 w-px bg-black opacity-20"></div>
                            <h2 class="text-2xl font-black text-black tracking-tighter leading-none uppercase">Redcliffe Lifetech<br>Private Limited</h2>
                        </div>
                        <p class="text-[10px] font-bold text-black uppercase tracking-widest mb-2 opacity-80">${type === 'DC' ? 'Inventory Division' : 'Redcliffe Lifetech Pvt Ltd'}</p>
                        <div class="border border-black rounded-lg p-2 bg-slate-50/50 mt-1 inline-block w-full max-w-md">
                            <label class="block text-[9px] font-black text-black uppercase mb-0.5 opacity-80">Consignor Address:</label>
                            <div class="text-[10px] leading-tight text-black font-semibold space-y-0.5">
                                <p><strong>CIN:</strong> U74999DL2017PTC323648 | <strong>GSTIN:</strong> 09AAKCR7631M1ZP</p>
                                <p>H 55, Electronic City, H Block, Sector 63, Noida, UP - 201301 | Mobile : +91 9410400414</p>
                            </div>
                        </div>
                    </div>
                    <div class="text-right flex flex-col items-center w-36">
                        <div class="qr-code-container mb-1 text-black bg-white p-2.5 rounded-sm border border-slate-200" data-qr-text="Doc ID: ${sessionData.docIds[type] || 'DRAFT'}\nClient: ${sessionData.clientName || sessionData.recipientName || 'N/A'}\nReq By: ${sessionData.requestedBy || 'N/A'}\nPhone: ${reqPhone}\nEmail: ${reqEmail}"></div>
                        <div class="bg-black text-white px-1.5 py-0.5 text-[7px] font-black uppercase tracking-widest mb-1.5 text-center w-full rounded-sm leading-tight">${type === 'DC' ? 'Returnable Delivery Challan' : 'Material Gate Pass'}</div>
                        <div class="electronic-stamp w-full text-center">Digitally Verified</div>
                    </div>
                </div>
            </div>
        `;

        // 2. META FIELDS
        let metaHtml = '';
        if (type === 'DC') {
            let lblCampCode = "Camp Code";
            let lblClientName = "Client / Partner Name";
            let lblCampDate = "Camp Date";
            let valCampCode = sessionData.campCode || '-';
            let valClientName = sessionData.clientName || '-';

            if (sessionData.contextType === 'clinic') { 
                lblCampCode = "Clinic Name"; 
                valCampCode = sessionData.recipientName || '-';
                valClientName = sessionData.campCode || '-';
            }
            else if (sessionData.contextType === 'lab') { 
                lblCampCode = "Lab GST Number"; 
                lblClientName = "Lab / Client Name"; 
                lblCampDate = "Expected Delivery Date"; 
            }
            else if (sessionData.contextType === 'courier') { 
                lblCampCode = "GSTIN"; 
            }

            metaHtml = `
                <div id="address-section" class="grid grid-cols-12 gap-0 border border-black rounded-lg overflow-hidden mb-4">
                    <div class="col-span-12 border-b border-black p-3 bg-slate-50/50">
                        <label class="block text-[9px] font-black text-black uppercase mb-1">Consignee Address:</label>
                        <div class="text-[11px] font-black text-black mb-1 break-words leading-snug w-full whitespace-pre-wrap">${sessionData.recipientAddress || '-'}</div>
                    </div>
                    <div class="col-span-8 border-r border-black p-3 bg-slate-50/30 flex flex-col justify-center">
                        <div class="grid grid-cols-3 gap-x-4 gap-y-3">
                            <div><label class="block text-[8px] font-black text-black uppercase mb-0.5">${lblCampCode}</label><div class="text-[10px] font-black text-black border-b border-black/40 pb-0.5 min-h-[16px] break-words leading-tight">${valCampCode}</div></div>
                            <div><label class="block text-[8px] font-black text-black uppercase mb-0.5">${lblClientName}</label><div class="text-[10px] font-black text-black border-b border-black/40 pb-0.5 min-h-[16px] break-words leading-tight">${valClientName}</div></div>
                            <div><label class="block text-[8px] font-black text-black uppercase mb-0.5">Requested By</label><div class="text-[10px] font-black text-black border-b border-black/40 pb-0.5 min-h-[16px] break-words leading-tight">${sessionData.requestedBy || '-'}</div></div>
                            <div><label class="block text-[8px] font-black text-black uppercase mb-0.5">City</label><div class="text-[10px] font-black text-black border-b border-black/40 pb-0.5 min-h-[16px] break-words leading-tight">${sessionData.city || '-'}</div></div>
                            <div><label class="block text-[8px] font-black text-black uppercase mb-0.5">State</label><div class="text-[10px] font-black text-black border-b border-black/40 pb-0.5 min-h-[16px] break-words leading-tight">${sessionData.state || '-'}</div></div>
                            <div><label class="block text-[8px] font-black text-black uppercase mb-0.5">Pincode</label><div class="text-[10px] font-black text-black border-b border-black/40 pb-0.5 min-h-[16px] break-words leading-tight">${sessionData.pincode || '-'}</div></div>
                            <div><label class="block text-[8px] font-black text-black uppercase mb-0.5">${lblCampDate}</label><div class="text-[10px] font-black text-black border-b border-black/40 pb-0.5 min-h-[16px] break-words leading-tight">${sessionData.campDate || '-'}</div></div>
                            <div><label class="block text-[8px] font-black text-black uppercase mb-0.5">Approx Return</label><div class="text-[10px] font-black text-black border-b border-black/40 pb-0.5 min-h-[16px] break-words leading-tight">${sessionData.approxCampReturn || '-'}</div></div>
                            <div><label class="block text-[8px] font-black text-black uppercase mb-0.5">SPOC Name / No</label><div class="text-[10px] font-black text-black border-b border-black/40 pb-0.5 min-h-[16px] break-words leading-tight">${[sessionData.spocName, sessionData.spocContact].filter(Boolean).join(' - ') || '-'}</div></div>
                        </div>
                    </div>
                    <div class="col-span-4 p-0 divide-y divide-black bg-slate-50/10 flex flex-col justify-center">
                        <div class="flex flex-col p-3"><span class="text-[8px] font-black text-black uppercase mb-0.5">Document ID</span><div class="text-xs font-black text-[#053763] uppercase break-words">${sessionData.docIds[type]}</div></div>
                        <div class="flex flex-col p-3"><span class="text-[8px] font-black text-black uppercase mb-0.5">Date of Issue</span><div class="text-xs font-black text-black break-words">${new Date().toLocaleDateString('en-GB')}</div></div>
                        <div class="flex flex-col p-3"><span class="text-[8px] font-black text-black uppercase mb-0.5">Transport No</span><div class="text-xs font-black text-black uppercase border-b border-black/40 pb-0.5 min-h-[16px] break-words">${sessionData.transportNo || '-'}</div></div>
                    </div>
                </div>
            `;
        } else {
            metaHtml = `
                <div id="gp-meta-fields" class="mb-4 grid grid-cols-12 gap-2 text-[10px] font-bold border-y border-black py-2">
                    <div class="col-span-4 flex gap-4">
                        <div class="checkbox-container uppercase">RETURNABLE <div class="custom-checkbox">${sessionData.isReturnable ? '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" class="mx-auto text-[#053763]"><polyline points="20 6 9 17 4 12"/></svg>' : ''}</div></div>
                        <div class="checkbox-container uppercase">NON-RETURNABLE <div class="custom-checkbox">${sessionData.isNonReturnable ? '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" class="mx-auto text-[#053763]"><polyline points="20 6 9 17 4 12"/></svg>' : ''}</div></div>
                    </div>
                    <div class="col-span-8 grid grid-cols-2 gap-4">
                        <div class="flex flex-col">Approx date to return: <input type="text" class="border-b border-black text-[10px]" value="${sessionData.approxReturn}" readonly></div>
                        <div class="flex flex-col">Actual date of Return: <input type="text" class="border-b border-black text-[10px]" value="${sessionData.actualReturn}" readonly></div>
                    </div>
                </div>
                <div id="address-section" class="grid grid-cols-12 gap-0 border border-black rounded-lg overflow-hidden mb-4">
                    <div class="col-span-6 border-r border-black p-3 bg-slate-50/10">
                        <p class="font-black text-[10px] border-b border-black mb-2 uppercase tracking-widest">TO (Consignee)</p>
                        <div class="space-y-2">
                            <div class="flex items-end"><span class="w-20 font-black text-[9px] opacity-70">NAME</span><div class="flex-grow text-[10px] font-bold border-b border-black/20 px-1 pb-0.5 break-words min-h-[16px]">${sessionData.recipientName || '-'}</div></div>
                            <div class="flex items-start"><span class="w-20 font-black text-[9px] opacity-70 pt-1">ADDRESS</span><textarea rows="2" class="flex-grow text-[10px] font-bold border-b border-black/20 bg-transparent px-1" readonly>${sessionData.recipientAddress || '-'}</textarea></div>
                            <div class="flex items-end"><span class="w-20 font-black text-[9px] opacity-70">CITY / STATE / PIN</span><div class="flex-grow text-[10px] font-bold border-b border-black/20 px-1 pb-0.5 break-words min-h-[16px]">${[sessionData.city, sessionData.state, sessionData.pincode].filter(Boolean).join(', ') || '-'}</div></div>
                            <div class="flex items-end"><span class="w-20 font-black text-[9px] opacity-70">PH NO</span><div class="flex-grow text-[10px] font-bold border-b border-black/20 px-1 pb-0.5 break-words min-h-[16px]">${sessionData.recipientPhone || '-'}</div></div>
                        </div>
                    </div>
                    <div class="col-span-6 p-3 bg-slate-50/10 flex flex-col justify-between">
                        <div>
                            <p class="font-black text-[10px] border-b border-black mb-2 uppercase tracking-widest">FROM (Consignor)</p>
                            <div class="space-y-2 text-black">
                                <div class="flex items-end"><span class="w-20 font-black text-[9px] opacity-70">NAME</span><div class="flex-grow text-[10px] font-bold border-b border-black/20 px-1 pb-0.5 break-words min-h-[16px]">REDCLIFFE LIFETECH PVT LTD</div></div>
                                <div class="flex items-start"><span class="w-20 font-black text-[9px] opacity-70 pt-1">ADDRESS</span><textarea rows="2" class="flex-grow text-[10px] font-bold border-b border-black/20 bg-transparent px-1" readonly>H 55, Electronic City, Noida, UP - 201301</textarea></div>
                                <div class="flex items-end"><span class="w-20 font-black text-[9px] opacity-70">PH NO</span><div class="flex-grow text-[10px] font-bold border-b border-black/20 px-1 pb-0.5 break-words min-h-[16px]">+91 80773 78829</div></div>
                            </div>
                        </div>
                        <div class="mt-3 pt-2 border-t border-black/10 flex items-center gap-2">
                            <span class="text-[9px] font-black uppercase opacity-70">Doc ID:</span>
                            <div class="text-[10px] font-black text-[#053763] uppercase flex-grow break-words">${sessionData.docIds[type] || '-'}</div>
                            <span class="text-[9px] font-black uppercase opacity-70 ml-2">Date:</span>
                            <div class="text-[10px] font-bold w-20 text-right break-words">${new Date().toLocaleDateString('en-GB')}</div>
                        </div>
                    </div>
                </div>
                <div id="purpose-section" class="mb-4 flex items-center gap-2 border-b border-black pb-1">
                    <span class="text-[10px] font-black uppercase whitespace-nowrap">PURPOSE :</span>
                    <div class="text-[11px] font-bold break-words flex-grow">${sessionData.purpose || '-'}</div>
                </div>
            `;
        }

        // 3. TABLE
        let tbodyHtml = '';
        const isCourier = (type === 'DC' && sessionData.contextType === 'courier');
        let totalValForPage = 0;
        let totalQtyForPage = 0;

        let tableHeadHtml = `
            <th class="border-r border-black p-2 w-8 text-center text-[9px] font-black uppercase">S.No</th>
            <th class="border-r border-black p-2 text-left text-[9px] font-black uppercase tracking-tight">${type === 'DC' ? 'Item Description / Technical Specifications' : 'DETAILS OF ITEMS'}</th>
            ${isCourier ? '<th class="border-r border-black p-2 w-16 text-center text-[9px] font-black uppercase">HSN Code</th>' : ''}
            <th class="border-r border-black p-2 w-12 text-center text-[9px] font-black uppercase">UOM</th>
            <th class="border-r border-black p-2 w-16 text-center text-[9px] font-black uppercase">Qty</th>
            <th class="price-col border-r border-black p-2 w-16 text-center text-[9px] font-black uppercase">Rate</th>
            <th class="price-col border-r border-black p-2 w-20 text-right text-[9px] font-black uppercase">Value</th>
            <th class="p-2 w-24 text-right text-[9px] font-black uppercase">Remark</th>
        `;

        if (!isEmptyPage) {
            for (let i = 0; i < chunk.padTo; i++) {
                if (i < chunk.items.length) {
                    const item = chunk.items[i];
                    const idx = absoluteIdx++;
                    const q = parseFloat(item.qty) || 0;
                    const r = parseFloat(item.rate) || 0;
                    const val = q * r;
                    totalQtyForPage += q;
                    totalValForPage += val;
                    
                    tbodyHtml += `
                        <tr class="border-b border-black h-10">
                            <td class="border-r border-black p-1 text-center text-[10px] font-black">${idx + 1}</td>
                            <td class="border-r border-black p-1 text-[10px] font-bold">${item.desc}</td>
                            ${isCourier ? `<td class="border-r border-black p-1 text-center text-[10px] font-bold">${item.hsn || ''}</td>` : ''}
                            <td class="border-r border-black p-1 text-center text-[10px] font-bold">${item.unit}</td>
                            <td class="border-r border-black p-1 text-center text-[10px] font-black text-blue-700">${item.qty}</td>
                            <td class="price-col border-r border-black p-1 text-center text-[10px] font-bold text-green-700">${item.rate}</td>
                            <td class="price-col border-r border-black p-1 text-right text-[10px] font-bold">${val > 0 ? val.toLocaleString('en-IN') : ''}</td>
                            <td class="p-1 text-right text-[10px] font-bold">${item.rem}</td>
                        </tr>
                    `;
                } else {
                    tbodyHtml += `<tr class="border-b border-black h-10"><td class="border-r border-black"></td><td class="border-r border-black"></td>${isCourier ? '<td class="border-r border-black"></td>' : ''}<td class="border-r border-black"></td><td class="border-r border-black"></td><td class="price-col border-r border-black"></td><td class="price-col border-r border-black"></td><td></td></tr>`;
                }
            }
        }

        let overallQty = 0;
        let overallVal = 0;
        itemsData.forEach(it => {
            const q = parseFloat(it.qty) || 0;
            const r = parseFloat(it.rate) || 0;
            overallQty += q;
            overallVal += q * r;
        });

        // 4. FOOTER
        let tfootHtml = '';
        if (isLastPage) {
            tfootHtml = `
                <tr class="bg-slate-50 font-black ${isEmptyPage ? 'border border-black' : 'border-t border-black'}">
                    <td colspan="${isCourier ? '4' : '3'}" class="border-r border-black p-2 text-right text-[10px] uppercase tracking-widest">Grand Total</td>
                    <td class="border-r border-black p-2 text-center text-[11px] text-blue-800">${overallQty}</td>
                    <td class="price-col border-r border-black p-1 text-center text-[9px] font-bold text-slate-400">Rate</td>
                    <td class="price-col border-r border-black p-2 text-right text-[11px] text-green-800 font-black">${overallVal > 0 ? '₹' + overallVal.toLocaleString('en-IN') : '-'}</td>
                    <td class="p-2"></td>
                </tr>
            `;
        } else {
            tfootHtml = `
                <tr class="bg-slate-50 border-t border-black font-black">
                    <td colspan="${isCourier ? '8' : '7'}" class="p-2 text-center text-[10px] uppercase text-slate-600 font-bold italic tracking-wider">Continued on next page...</td>
                </tr>
            `;
        }

        let signsHtml = '';
        if (isLastPage) {
            if (type === 'DC') {
                signsHtml = `
                    <div class="grid grid-cols-12 gap-6 items-end border-t-2 border-black pt-4 pb-2">
                        <div class="col-span-7">
                            <div class="border-l-4 border-black pl-3 py-1 bg-slate-50/50 rounded-r">
                                <h4 class="text-[10px] font-black uppercase mb-1">Statutory Declarations:</h4>
                                <ul class="text-[9px] space-y-0.5 font-semibold italic leading-tight">
                                    <li>1. This document is strictly Returnable to origin hub.</li>
                                    <li>2. Goods are transported for internal use / camp purpose only.</li>
                                    <li>3. Receiver acknowledges receipt of goods in good condition.</li>
                                </ul>
                            </div>
                        </div>
                        <div class="col-span-5 flex flex-col justify-between">
                            <div class="text-center mb-8"><div class="w-32 h-0.5 bg-black mx-auto mb-1"></div><p class="text-[9px] font-black uppercase tracking-widest">Receiver Seal & Sign</p></div>
                            <div class="text-center bg-slate-50 p-2 rounded-lg border border-black border-dashed group relative">
                                <div class="absolute -top-3 -right-3 bg-indigo-100 text-indigo-700 text-[8px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition pointer-events-none">Editable</div>
                                <p class="font-black text-xs uppercase text-black" contenteditable="true" spellcheck="false" style="outline:none; cursor:text;" onblur="sessionStorage.setItem('signatoryName', this.innerText)">${sessionStorage.getItem('signatoryName') || 'Mr. Rizwan Ahmad'}</p>
                                <p class="text-[9px] font-bold text-black uppercase leading-none" contenteditable="true" spellcheck="false" style="outline:none; cursor:text;" onblur="sessionStorage.setItem('signatoryRole', this.innerText)">${sessionStorage.getItem('signatoryRole') || 'Inventory Manager'}</p>
                                <p class="text-[8px] mt-1 font-black text-[#053763] uppercase" contenteditable="true" spellcheck="false" style="outline:none; cursor:text;" onblur="sessionStorage.setItem('signatoryCompany', this.innerText)">${sessionStorage.getItem('signatoryCompany') || 'Redcliffe Lifetech Pvt Ltd'}</p>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                signsHtml = `
                    <div class="grid grid-cols-2 gap-x-8 gap-y-6 text-[9px] font-bold border-t-2 border-black pt-4 pb-2">
                        <div class="space-y-1"><p class="font-black uppercase border-b border-black pb-1">Requested By :</p>
                            <p class="flex items-center gap-2">Name : <span class="border-b border-black flex-grow h-4 inline-block"></span></p>
                            <p class="flex items-center gap-2">Signature : <span class="border-b border-black flex-grow h-4 inline-block"></span></p>
                            <p class="flex items-center gap-2">Date : <span class="border-b border-black flex-grow h-4 inline-block"></span></p>
                        </div>
                        <div class="space-y-1"><p class="font-black uppercase border-b border-black pb-1">Authorized By :</p>
                            <p class="flex items-center gap-2">Name : <span class="font-black" contenteditable="true" spellcheck="false" style="outline:none; cursor:text; min-width:100px; display:inline-block; border-bottom:1px dashed #cbd5e1;" onblur="sessionStorage.setItem('signatoryName', this.innerText)" title="Click to edit">${sessionStorage.getItem('signatoryName') || 'Mr. Rizwan Ahmad'}</span></p>
                            <p class="flex items-center gap-2">Signature : <span class="border-b border-black flex-grow h-4 inline-block"></span></p>
                            <p class="flex items-center gap-2">Date : <span class="font-black">${new Date().toLocaleDateString('en-GB')}</span></p>
                        </div>
                        <div class="space-y-1"><p class="font-black uppercase border-b border-black pb-1">Material Taken By :</p>
                            <p class="flex items-center gap-2">Name : <span class="border-b border-black flex-grow h-4 inline-block"></span></p>
                            <p class="flex items-center gap-2">Signature : <span class="border-b border-black flex-grow h-4 inline-block"></span></p>
                            <p class="flex items-center gap-2">Date : <span class="border-b border-black flex-grow h-4 inline-block"></span></p>
                        </div>
                        <div class="text-center pt-1 border border-black border-dashed flex flex-col justify-center items-center rounded bg-slate-50/30"><p class="font-black uppercase tracking-widest text-[8px]">Security Seal & Sign</p></div>
                    </div>
                `;
            }
        }

        // ASSEMBLE PAGE
        pageDiv.innerHTML = `
            ${headerHtml}
            ${metaHtml}
            <div class="table-wrapper" style="${isEmptyPage ? 'border: none; flex-grow: 0;' : ''}">
                <table class="w-full ${isEmptyPage ? '' : 'h-full'} border-collapse text-black">
                    ${isEmptyPage ? '' : `<thead><tr class="bg-slate-100 border-b border-black">${tableHeadHtml}</tr></thead>`}
                    <tbody>${tbodyHtml}</tbody>
                    <tfoot>${tfootHtml}</tfoot>
                </table>
            </div>
            <div class="${isEmptyPage ? 'mt-8' : 'mt-auto'} text-black">${signsHtml}</div>
            <div class="${isEmptyPage ? 'mt-auto' : 'mt-2'} border-t border-black/10 pt-2 flex justify-between items-center text-[8px] font-black text-black uppercase tracking-widest opacity-60">
                <p>System Ref: RCL-D026-X882</p>
                <p>Page ${p + 1} of ${totalPages}</p>
                <p class="footer-ts"></p>
            </div>
        `;

        wrapper.appendChild(pageDiv);
    }

    const tsHash = "V-HASH: " + Math.random().toString(36).substring(7).toUpperCase();
    document.querySelectorAll('.footer-ts').forEach(el => el.innerText = tsHash);
    
    // Generate QR Codes after DOM insertion
    if (typeof QRCode !== 'undefined') {
        document.querySelectorAll('.qr-code-container').forEach(container => {
            container.innerHTML = ''; // clear previous
            const qrText = container.getAttribute('data-qr-text') || '';
            new QRCode(container, {
                text: qrText,
                width: 110,
                height: 110,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
            // center it nicely and ensure crisp rendering
            const img = container.querySelector('img');
            const canvas = container.querySelector('canvas');
            if(img) { img.style.margin = "0 auto"; img.style.imageRendering = "pixelated"; }
            if(canvas) { canvas.style.margin = "0 auto"; canvas.style.imageRendering = "pixelated"; }
        });
    }
}

// =====================================================================
// PDF DOWNLOAD & GOOGLE SHEET SYNC
// =====================================================================
async function executeWithoutLosingState(asyncCallback) {
    const backupSession = JSON.parse(JSON.stringify(sessionData));
    const backupItems = JSON.parse(JSON.stringify(itemsData));
    const backupDocType = currentDocType;

    await asyncCallback();

    Object.assign(sessionData, backupSession);
    itemsData.length = 0;
    backupItems.forEach(i => itemsData.push(i));
    currentDocType = backupDocType;

    setDocType(currentDocType);
}

function confirmAndExecutePDFDownload() {
    closeModal('download-confirm-modal');
    const hidePrice = window._pendingDownloadHidePrice || false;
    const saveCheckbox = document.getElementById('save-to-backend-checkbox');
    const skipBackend = saveCheckbox ? !saveCheckbox.checked : false;
    downloadChallan(hidePrice, true, skipBackend);
}

async function downloadChallan(hidePrice = false, noConfirm = false, skipBackend = false, isBulk = false, returnBlob = false) {
    if (sessionData.docIds[currentDocType] === 'Fetching ID...' || sessionData.isFetchingId) {
        if (!isBulk) showModal("Please wait, generating Document ID...", "alert");
        return;
    }
    
    const wrapper = document.getElementById('challan-wrapper');
    const docType = currentDocType;
    const docId = sessionData.docIds[docType] || "DOC-" + Date.now();

    if (!skipBackend && sessionData.contextType === 'clinic' && (!sessionData.clientMailSubject || !sessionData.clientMailSubject.trim())) {
        showToast("Client Mail Subject Line is compulsory for Clinic challans!", "error");
        return;
    }

    if (!noConfirm) {
        const consignee = sessionData.recipientName || sessionData.recipientAddress.split(',')[0] || "-";
        const client = sessionData.clientName || sessionData.campCode || "-";
        const totalItemsCount = itemsData.length;
        
        document.getElementById('confirm-doc-id').textContent = docId;
        document.getElementById('confirm-consignee').textContent = consignee;
        document.getElementById('confirm-client').textContent = client;
        document.getElementById('confirm-items-count').textContent = `${totalItemsCount} item${totalItemsCount !== 1 ? 's' : ''}`;
        
        window._pendingDownloadHidePrice = hidePrice;
        openModal('download-confirm-modal');
        return;
    }

    let elementsToHide = Array.from(document.querySelectorAll('.no-print'));
    if (hidePrice) {
        elementsToHide = elementsToHide.concat(Array.from(document.querySelectorAll('.price-col')));
    }

    const originalDisplayStates = new Map();
    elementsToHide.forEach(el => {
        originalDisplayStates.set(el, el.style.display);
        el.style.display = 'none';
    });

    const containers = wrapper.querySelectorAll('.challan-container');
    const targetEl = containers.length > 0 ? containers[0] : wrapper;
    const origStyles = [];
    containers.forEach(c => {
        origStyles.push({
            margin: c.style.margin,
            boxShadow: c.style.boxShadow,
            maxHeight: c.style.maxHeight,
            overflow: c.style.overflow,
            width: c.style.width,
            height: c.style.height
        });
        c.style.margin = '0';
        c.style.boxShadow = 'none';
        c.style.width = '794px';
        c.style.height = '1120px';
        c.style.maxHeight = '1120px';
        c.style.overflow = 'hidden';
        c.style.boxSizing = 'border-box';
    });
    
    const safeClinicName = (sessionData.recipientName || sessionData.clientName || sessionData.campCode || 'Challan').replace(/[^a-zA-Z0-9_\-]/g, '_').substring(0, 40);
    const docTypeLabel = docType === 'DC' ? 'Challan' : 'Gate_Pass';
    const opt = {
        margin: 0,
        filename: `${safeClinicName}_${docTypeLabel}.pdf`,
        image: { type: 'jpeg', quality: 0.92 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true, imageTimeout: 0 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    let pdfOutput = null;

    if (!isBulk) {
        document.body.style.cursor = 'wait';
        showLoadingOverlay("Generating High-Resolution PDF...");
    }

    try {
        // Helper: extract all visible text elements from a container with their positions
        function extractTextNodes(containerEl) {
            const texts = [];
            const walker = document.createTreeWalker(containerEl, NodeFilter.SHOW_TEXT, null, false);
            let node;
            while (node = walker.nextNode()) {
                const text = node.textContent.trim();
                if (!text) continue;
                const range = document.createRange();
                range.selectNodeContents(node);
                const rects = range.getClientRects();
                if (rects.length === 0) continue;
                const containerRect = containerEl.getBoundingClientRect();
                for (const rect of rects) {
                    const parent = node.parentElement;
                    const style = window.getComputedStyle(parent);
                    if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) === 0) continue;
                    texts.push({
                        text: text,
                        x: rect.left - containerRect.left,
                        y: rect.top - containerRect.top + rect.height * 0.75,
                        fontSize: parseFloat(style.fontSize) || 10,
                        width: rect.width,
                        height: rect.height
                    });
                }
            }
            return texts;
        }

        // Helper: overlay invisible text onto a jsPDF page for a given container
        function overlayTextLayer(pdf, containerEl, pageW, pageH) {
            const textNodes = extractTextNodes(containerEl);
            const contRect = containerEl.getBoundingClientRect();
            const scaleX = pageW / contRect.width;
            const scaleY = pageH / contRect.height;
            pdf.setTextColor(255, 255, 255);

            textNodes.forEach(t => {
                const pdfX = t.x * scaleX;
                const pdfY = t.y * scaleY;
                const pdfFontSize = t.fontSize * scaleY * 0.75;
                if (pdfFontSize < 1) return;
                pdf.setFontSize(pdfFontSize);
                pdf.textWithLink ? pdf.text(t.text, pdfX, pdfY, { renderingMode: 'invisible' }) : pdf.text(t.text, pdfX, pdfY);
            });
        }

        if (containers.length > 1) {
            let worker = html2pdf().set(opt).from(containers[0]).toPdf();
            for (let i = 1; i < containers.length; i++) {
                worker = worker.get('pdf').then(pdf => {
                    pdf.addPage();
                }).from(containers[i]).toContainer().toCanvas().toPdf();
            }
            if (returnBlob) {
                pdfOutput = await worker.get('pdf').then(pdf => {
                    const pageW = pdf.internal.pageSize.getWidth();
                    const pageH = pdf.internal.pageSize.getHeight();
                    containers.forEach((c, idx) => {
                        pdf.setPage(idx + 1);
                        overlayTextLayer(pdf, c, pageW, pageH);
                    });
                    return pdf;
                }).output('blob');
            } else {
                await worker.get('pdf').then(pdf => {
                    const pageW = pdf.internal.pageSize.getWidth();
                    const pageH = pdf.internal.pageSize.getHeight();
                    containers.forEach((c, idx) => {
                        pdf.setPage(idx + 1);
                        overlayTextLayer(pdf, c, pageW, pageH);
                    });
                }).save();
            }
        } else {
            if (returnBlob) {
                pdfOutput = await html2pdf().set(opt).from(targetEl).toPdf().get('pdf').then(pdf => {
                    const pageW = pdf.internal.pageSize.getWidth();
                    const pageH = pdf.internal.pageSize.getHeight();
                    overlayTextLayer(pdf, targetEl, pageW, pageH);
                    return pdf;
                }).output('blob');
            } else {
                await html2pdf().set(opt).from(targetEl).toPdf().get('pdf').then(pdf => {
                    const pageW = pdf.internal.pageSize.getWidth();
                    const pageH = pdf.internal.pageSize.getHeight();
                    overlayTextLayer(pdf, targetEl, pageW, pageH);
                }).save();
            }
        }


        const totalVal = itemsData.reduce((s, it) => {
            const q = parseFloat(it.qty), r = parseFloat(it.rate);
            return s + ((!isNaN(q) && !isNaN(r)) ? q * r : 0);
        }, 0);
        const totalQtyNum = itemsData.reduce((s, it) => s + (parseFloat(it.qty) || 0), 0);

        if (!skipBackend) {
            const historyEntry = {
                id: docId,
                type: docType,
                clientName: sessionData.clientName || "N/A",
                consignee: sessionData.recipientName || sessionData.recipientAddress.split(',')[0] || "N/A",
                campCode: sessionData.campCode || "N/A",
                campDate: sessionData.campDate ? formatDateForBackend(sessionData.campDate) : "N/A",
                approxCampReturn: sessionData.approxCampReturn ? formatDateForBackend(sessionData.approxCampReturn) : "N/A",
                totalQty: totalQtyNum,
                totalVal: totalVal > 0 ? '\u20B9' + totalVal.toLocaleString('en-IN') : "N/A",
                items: itemsData.length,
                date: new Date().toLocaleString(),
                clientMailSubject: sessionData.clientMailSubject || "N/A",
                clientMailDate: sessionData.clientMailDate ? formatDateForBackend(sessionData.clientMailDate) : "N/A",
                ourMailSubject: sessionData.ourMailSubject || "N/A",
                ourMailDate: sessionData.ourMailDate ? formatDateForBackend(sessionData.ourMailDate) : "N/A",
                status: "Pending",
                remarks: "",
                fullSession: JSON.parse(JSON.stringify(sessionData)),
                fullItems: JSON.parse(JSON.stringify(itemsData))
            };

            const existingIndex = historyLog.findIndex(h => h.id === docId);
            if (existingIndex !== -1) {
                historyLog[existingIndex] = historyEntry;
            } else {
                historyLog.unshift(historyEntry);
            }
            
            localStorage.setItem('rcl_dispatch_history', JSON.stringify(historyLog));

            syncToGoogleSheet({
                docId, docType,
                context: sessionData.contextType,
                recipientName: sessionData.recipientName || "N/A",
                recipientAddress: sessionData.recipientAddress || "N/A",
                clientName: sessionData.clientName || "N/A",
                city: sessionData.city || "N/A",
                state: sessionData.state || "N/A",
                pincode: sessionData.pincode || "N/A",
                campCode: sessionData.campCode || "N/A",
                transportNo: sessionData.transportNo || "N/A",
                campDate: sessionData.campDate ? formatDateForBackend(sessionData.campDate) : "N/A",
                approxCampReturn: sessionData.approxCampReturn ? formatDateForBackend(sessionData.approxCampReturn) : "N/A",
                spocName: sessionData.spocName || "N/A",
                spocContact: sessionData.spocContact || "N/A",
                recipientPhone: sessionData.recipientPhone || "N/A",
                purpose: sessionData.purpose || "N/A",
                requestedBy: sessionData.requestedBy || "N/A",
                totalQty: totalQtyNum,
                totalVal: totalVal > 0 ? totalVal : 0,
                clientMailSubject: sessionData.clientMailSubject || "N/A",
                clientMailDate: sessionData.clientMailDate ? formatDateForBackend(sessionData.clientMailDate) : "N/A",
                ourMailSubject: sessionData.ourMailSubject || "N/A",
                ourMailDate: sessionData.ourMailDate ? formatDateForBackend(sessionData.ourMailDate) : "N/A",
                status: "Pending",
                remarks: "",
                items: itemsData.map(it => ({
                    desc: it.desc, hsn: it.hsn || "N/A", unit: it.unit || "Pcs",
                    qty: it.qty, rate: it.rate, rem: it.rem || "N/A"
                })),
                timestamp: formatDateForBackend(new Date().toISOString())
            });
            if (!isBulk) {
                openModal('post-download-modal');
                showToast("PDF downloaded and saved to history & sheet!", "success");
            }
        } else {
            if (!isBulk) showToast("PDF generated successfully!", "success");
        }

    } catch (err) {
        if (!isBulk) showToast("PDF generation failed. Please try again.", "error");
        throw err;
    } finally {
        containers.forEach((c, i) => {
            if (origStyles[i]) {
                c.style.margin = origStyles[i].margin;
                c.style.boxShadow = origStyles[i].boxShadow;
                c.style.maxHeight = origStyles[i].maxHeight;
                c.style.overflow = origStyles[i].overflow;
                c.style.width = origStyles[i].width;
                c.style.height = origStyles[i].height;
            }
        });
        elementsToHide.forEach(el => { el.style.display = originalDisplayStates.get(el); });
        
        if (!isBulk) {
            document.body.style.cursor = 'default';
            hideLoadingOverlay();
        }
    }
    
    if (returnBlob) {
        return { blob: pdfOutput, filename: opt.filename };
    }
}

function syncToGoogleSheet(payload) {
    fetch(BACKUP_SHEET_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    }).catch(err => {
        // Silently swallow sync errors (no console logging)
    });
}

// =====================================================================
// =====================================================================
// HISTORY (Skeleton Screen, Google Sheet Sync & Local Caching)
// =====================================================================
function toggleHistory(forceState = null) {
    const el = document.getElementById('history-view');
    if (!el) return;
    
    const isHidden = el.classList.contains('hidden');
    const shouldOpen = typeof forceState === 'boolean' ? forceState : isHidden;
    
    if (shouldOpen) {
        el.classList.remove('hidden');
        setHistoryFilter(sessionData.contextType || 'all');
        renderHistoryTable();
        fetchHistoryFromSheet(false);
    } else {
        el.classList.add('hidden');
    }
}

let historyContextFilter = 'all';
let isFetchingHistory = false;

function showHistorySkeleton() {
    const tbody = document.getElementById('history-body');
    if (!tbody) return;
    tbody.innerHTML = Array(6).fill(0).map(() => `
        <tr class="border-b border-slate-100 animate-pulse">
            <td class="p-3.5 space-y-2">
                <div class="h-3.5 bg-slate-200 rounded w-28"></div>
                <div class="h-2.5 bg-slate-100 rounded w-16"></div>
            </td>
            <td class="p-3.5">
                <div class="h-5 bg-slate-200 rounded-full w-16"></div>
            </td>
            <td class="p-3.5">
                <div class="h-3.5 bg-slate-200 rounded w-32"></div>
            </td>
            <td class="p-3.5">
                <div class="h-3.5 bg-slate-200 rounded w-8"></div>
            </td>
            <td class="p-3.5 text-right">
                <div class="h-6 bg-slate-200 rounded-lg w-12 ml-auto"></div>
            </td>
        </tr>
    `).join('');
}

function fetchHistoryFromSheet(forceSync = false) {
    if (isFetchingHistory) return;
    
    const syncBtn = document.getElementById('history-sync-btn');
    const syncSvg = syncBtn ? syncBtn.querySelector('svg') : null;
    if (syncSvg) syncSvg.classList.add('animate-spin');

    const cacheBuster = `&_t=${Date.now()}`;
    const fetchUrl = `${BACKUP_SHEET_URL}?action=getLogs${cacheBuster}`;

    if (historyLog && historyLog.length > 0 && !forceSync) {
        renderHistoryTable();
        // Background sync from Google Sheet to ensure no records are missing when using cache
        fetch(fetchUrl, { redirect: "follow", cache: "no-store" })
            .then(res => res.json())
            .then(data => {
                if (data && data.status === "success" && Array.isArray(data.logs)) {
                    historyLog = normalizeHistoryLog(data.logs);
                    localStorage.setItem('rcl_dispatch_history', JSON.stringify(historyLog));
                    renderHistoryTable();
                }
            })
            .catch(() => {})
            .finally(() => {
                if (syncSvg) syncSvg.classList.remove('animate-spin');
            });
        return;
    }
    
    isFetchingHistory = true;
    showHistorySkeleton();
    
    fetch(fetchUrl, { redirect: "follow", cache: "no-store" })
        .then(res => res.json())
        .then(data => {
            if (data && data.status === "success" && Array.isArray(data.logs)) {
                historyLog = normalizeHistoryLog(data.logs);
                localStorage.setItem('rcl_dispatch_history', JSON.stringify(historyLog));
                if (forceSync) showToast(`Synced ${historyLog.length} records from Google Sheet!`, "success");
            } else if (forceSync) {
                showToast("No new records found from server.", "info");
            }
        })
        .catch(err => {
            if (forceSync) showToast("Could not sync from Google Sheet. Using locally cached data.", "error");
        })
        .finally(() => {
            isFetchingHistory = false;
            if (syncSvg) syncSvg.classList.remove('animate-spin');
            renderHistoryTable();
        });
}

function setHistoryFilter(ctx) {
    historyContextFilter = String(ctx || 'all').toLowerCase();
    // Update filter button active states
    document.querySelectorAll('.hist-filter-btn').forEach(btn => {
        const btnCtx = String(btn.dataset.ctx || '').toLowerCase();
        if (btnCtx === historyContextFilter) {
            btn.classList.add('bg-[#053763]', 'text-white', 'shadow-md');
            btn.classList.remove('bg-slate-100', 'text-slate-600');
        } else {
            btn.classList.remove('bg-[#053763]', 'text-white', 'shadow-md');
            btn.classList.add('bg-slate-100', 'text-slate-600');
        }
    });
    renderHistoryTable();
}

function renderHistoryTable() {
    const tbody = document.getElementById('history-body');
    if (!tbody) return;
    const search = (document.getElementById('history-search')?.value || '').toLowerCase();
    const statusFilter = document.getElementById('history-status-filter')?.value || 'all';
    
    let filtered = historyLog;
    
    // Filter by Context (Camp/Clinic/Lab/Courier)
    if (historyContextFilter !== 'all') {
        filtered = filtered.filter(i => {
            const ctx = String(i.context || (i.fullSession && i.fullSession.contextType) || 'camp').toLowerCase();
            return ctx === historyContextFilter;
        });
    }
    
    // Filter by Status
    if (statusFilter !== 'all') {
        filtered = filtered.filter(i => {
            const currentStatus = i.status || 'Pending';
            return currentStatus === statusFilter;
        });
    }
    
    // Filter by Search Query
    if (search) {
        filtered = filtered.filter(i => {
            const s = i.fullSession || {};
            const searchStr = [
                i.id, i.clientName, i.consignee, i.campCode, i.date, i.requestedBy,
                i.clientMailSubject, i.ourMailSubject, s.recipientName, s.clientName,
                s.campCode, s.city, s.state, s.pincode, s.requestedBy,
                s.recipientAddress, s.spocName, s.spocContact, s.transportNo
            ].filter(Boolean).join(' ').toLowerCase();
            return searchStr.includes(search);
        });
    }
    
    const countEl = document.getElementById('history-count');
    if (countEl) countEl.textContent = `${filtered.length} record${filtered.length !== 1 ? 's' : ''}`;
    
    if (filtered.length === 0) {
        tbody.innerHTML = `<div class="py-16 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="mx-auto text-slate-300 mb-2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <div class="text-slate-400 text-xs font-bold">No records found</div>
        </div>`;
        return;
    }
    
    const statusOpts = ['Pending','In-Process','In-Transit','Delivered'];
    const statusColors = {
        'Delivered': 'bg-emerald-100 text-emerald-700 border-emerald-200',
        'Pending': 'bg-amber-100 text-amber-700 border-amber-200',
        'In-Transit': 'bg-orange-100 text-orange-700 border-orange-200',
        'In-Process': 'bg-violet-100 text-violet-700 border-violet-200'
    };
    
    let html = `<div class="overflow-x-auto w-full px-1 pb-10"><table class="w-full text-[10px] sm:text-[11px] border-separate border-spacing-y-2.5 table-auto">
        <thead class="sticky top-0 z-20">
            <tr class="text-[9px] font-black uppercase tracking-wider text-left bg-[#053763] text-white shadow-md">
                <th class="py-3 px-4 whitespace-nowrap rounded-l-xl">Request Date</th>
                <th class="py-3 px-3 whitespace-nowrap">Raised By</th>
                <th class="py-3 px-3 whitespace-nowrap">Due Date</th>
                <th class="py-3 px-3 whitespace-nowrap">Approval Date</th>
                <th class="py-3 px-3 whitespace-nowrap">Delivery Date</th>
                <th class="py-3 px-3 whitespace-nowrap text-center">Status</th>
                <th class="py-3 px-3 whitespace-nowrap min-w-[150px]">Clinic Name</th>
                <th class="py-3 px-3 whitespace-nowrap">City</th>
                <th class="py-3 px-3 whitespace-nowrap">Issued By</th>
                <th class="py-3 px-3 whitespace-nowrap min-w-[120px]">Remarks</th>
                <th class="w-6 py-3 px-3 rounded-r-xl"></th>
            </tr>
        </thead>
        <tbody class="">`;
    
    filtered.forEach((row, idx) => {
        const hIdx = historyLog.indexOf(row);
        const s = row.fullSession || {};
        const currentStatus = row.status || 'Pending';
        const clinicName = (s.recipientName || row.consignee || '').trim();
        const clientName = (s.clientName || row.clientName || '').trim();
        const displayName = clinicName && clinicName !== '-' ? clinicName : (clientName || row.id);
        const city = s.city || '';
        const requestDate = formatCleanDate(row.date);
        const raisedBy = row.requestedBy || s.requestedBy || '';
        const getValidDate = (...dates) => dates.find(d => d && d !== 'N/A' && d.trim() !== '');
        const dueDateRaw = getValidDate(s.campDate, row.campDate, s.approxCampReturn, row.approxCampReturn, s.expectedDelivery, row.expectedDelivery) || '';
        const dueDate = formatCleanDate(dueDateRaw);
        const approvalDate = row.approvalDate || s.approvalDate || '';
        const deliveryDate = row.deliveryDate || s.deliveryDate || '';
        const issuedBy = row.issuedBy || s.issuedBy || '';
        const remarks = row.remarks || '';
        
        const dueDateObj = parseAnyDate(dueDateRaw);
        const _now = new Date();
        const _today = new Date(_now.getFullYear(), _now.getMonth(), _now.getDate());
        const isOverdue = dueDateObj && dueDateObj < _today && currentStatus !== 'Delivered' && currentStatus !== 'Returned' && currentStatus !== 'Cancelled';
        const dueDateClass = isOverdue ? 'text-red-600 font-black' : 'text-slate-600 font-bold';

        const approvalDateISO = toISODate(approvalDate);
        const deliveryDateISO = toISODate(deliveryDate);
        const sClass = statusColors[currentStatus] || statusColors['Pending'];
        
        const statusSelectHtml = statusOpts.map(st => 
            `<option value="${st}" ${st === currentStatus ? 'selected' : ''}>${st}</option>`
        ).join('');
        
        const itemsList = row.fullItems || [];
        const address = [s.recipientAddress || '', s.city || '', s.state || '', s.pincode || ''].filter(Boolean).join(', ');
        
        const clientMailSubject = row.clientMailSubject || s.clientMailSubject || '';
        const ourMailSubject = row.ourMailSubject || s.ourMailSubject || '';
        
        let itemsTableHtml = '';
        if (itemsList.length > 0) {
            itemsTableHtml = `<table class="w-full text-[11px] border border-slate-200 rounded-lg overflow-hidden bg-white mt-2">
                <thead><tr class="bg-slate-100 text-[9px] text-slate-500 font-black uppercase tracking-wider">
                    <th class="text-left py-1.5 px-3">Item Description</th>
                    <th class="text-center py-1.5 px-3 w-16">QTY</th>
                    <th class="text-right py-1.5 px-3 w-20">Rate</th>
                    <th class="text-right py-1.5 px-3 w-24">Value</th>
                </tr></thead>
                <tbody>${itemsList.map(it => {
                    const q = parseFloat(it.qty) || 0;
                    const r = parseFloat(it.rate) || 0;
                    return `<tr class="border-b border-slate-100 hover:bg-slate-50">
                        <td class="py-1.5 px-3 font-bold text-slate-700">${it.desc || '-'}</td>
                        <td class="py-1.5 px-3 text-center font-bold text-slate-600">${q}</td>
                        <td class="py-1.5 px-3 text-right font-bold text-slate-500">\u20b9${r}</td>
                        <td class="py-1.5 px-3 text-right font-black text-slate-800">\u20b9${(q * r).toLocaleString('en-IN')}</td>
                    </tr>`;
                }).join('')}</tbody>
            </table>`;
        }
        
        html += `
        <!-- Main Row (Card Style) -->
        <tr class="tracker-row bg-white shadow-sm relative" data-idx="${hIdx}">
            <td class="py-3 px-4 align-middle border-y border-l border-slate-200 rounded-l-xl border-l-[4px] border-l-[#053763]">
                <div class="font-bold text-slate-600 whitespace-nowrap">${requestDate}</div>
                <div class="text-[9px] font-mono text-slate-400 mt-0.5">${row.id}</div>
            </td>
            <td class="py-3 px-3 align-middle border-y border-slate-200 font-bold text-slate-700 whitespace-nowrap">${raisedBy || '-'}</td>
            <td class="py-3 px-3 align-middle border-y border-slate-200 whitespace-nowrap ${dueDateClass}">${dueDate}</td>
            <td class="py-3 px-3 align-middle border-y border-slate-200" onclick="event.stopPropagation()">
                <input type="date" value="${approvalDateISO}" class="w-full min-w-[110px] bg-transparent border border-slate-200 rounded-md px-1.5 py-1 text-[10px] font-bold text-slate-700 outline-none focus:border-[#053763] focus:bg-white hover:border-slate-300 transition cursor-text" onchange="inlineUpdateField(${hIdx}, 'approvalDate', this.value)">
            </td>
            <td class="py-3 px-3 align-middle border-y border-slate-200" onclick="event.stopPropagation()">
                ${currentStatus === 'Delivered' ? 
                    `<input type="date" value="${deliveryDateISO}" class="w-full min-w-[110px] bg-emerald-50 border border-emerald-200 rounded-md px-1.5 py-1 text-[10px] font-black text-emerald-800 outline-none focus:border-emerald-500 focus:bg-white hover:border-emerald-300 transition cursor-text" onchange="inlineUpdateField(${hIdx}, 'deliveryDate', this.value)">` : 
                    `<div class="text-slate-400 text-[10px] italic font-medium min-w-[110px] text-center">Mark Delivered to set</div>`
                }
            </td>
            <td class="py-3 px-3 align-middle text-center border-y border-slate-200" onclick="event.stopPropagation()">
                <select class="w-full min-w-[100px] border rounded-md px-1 py-1 text-[10px] font-black outline-none cursor-pointer transition shadow-sm ${sClass}" onchange="handleStatusChange(${hIdx}, this.value)">
                    ${statusSelectHtml}
                </select>
            </td>
            <td class="py-3 px-3 align-middle border-y border-slate-200 font-black text-slate-800">
                <div class="truncate" title="${displayName}">${displayName}</div>
                ${clientName && clientName !== displayName && clientName !== '-' ? `<div class="text-[9px] font-bold text-slate-400 truncate mt-0.5">${clientName}</div>` : ''}
            </td>
            <td class="py-3 px-3 align-middle border-y border-slate-200 font-bold text-slate-600 whitespace-nowrap">${city || '-'}</td>
            <td class="py-3 px-3 align-middle border-y border-slate-200" onclick="event.stopPropagation()">
                <input type="text" value="${issuedBy}" title="${issuedBy}" placeholder="-" class="w-full min-w-[90px] bg-transparent border border-slate-200 rounded-md px-1.5 py-1 text-[10px] font-bold text-slate-700 outline-none focus:border-[#053763] focus:bg-white hover:border-slate-300 transition placeholder:text-slate-300" onchange="inlineUpdateField(${hIdx}, 'issuedBy', this.value)">
            </td>
            <td class="py-3 px-3 align-middle border-y border-slate-200" onclick="event.stopPropagation()">
                <input type="text" value="${remarks}" title="${remarks}" placeholder="-" class="w-full min-w-[110px] bg-transparent border border-slate-200 rounded-md px-1.5 py-1 text-[10px] font-bold text-slate-700 outline-none focus:border-[#053763] focus:bg-white hover:border-slate-300 transition placeholder:text-slate-300" onchange="inlineUpdateField(${hIdx}, 'remarks', this.value)">
            </td>
            <td class="py-3 px-3 align-middle text-center border-y border-r border-slate-200 rounded-r-xl cursor-pointer hover:bg-slate-50 transition" onclick="toggleTrackerRow(this.closest('tr'))">
                <svg class="tracker-chevron w-4 h-4 text-slate-400 transition-transform inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </td>
        </tr>
        <!-- Detail Row -->
        <tr class="tracker-row-detail hidden" data-detail-for="${hIdx}">
            <td colspan="11" class="p-0 border-0">
                <div class="bg-[#f4f7fb] mx-2 px-6 py-5 space-y-4 shadow-inner rounded-b-xl border border-[#053763]/20 border-t-0 -mt-2.5 relative z-0">
                    <!-- Address & Mail Info -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        ${address ? `<div class="flex flex-col gap-1 text-[11px]">
                            <span class="font-black text-slate-400 uppercase tracking-wider text-[9px]">Address</span>
                            <span class="font-bold text-slate-700 leading-tight">${address}</span>
                        </div>` : ''}
                        
                        ${(clientMailSubject || ourMailSubject) ? `<div class="flex flex-col gap-1 text-[11px] bg-white p-2 rounded border border-slate-200/60 shadow-sm">
                            <span class="font-black text-slate-400 uppercase tracking-wider text-[9px] mb-1">Mail Subjects</span>
                            ${clientMailSubject ? `<div class="flex items-start gap-1.5"><span class="bg-indigo-100 text-indigo-700 px-1 py-0.5 rounded text-[8px] font-bold">Client</span> <span class="font-semibold text-slate-600">${clientMailSubject}</span></div>` : ''}
                            ${ourMailSubject ? `<div class="flex items-start gap-1.5 mt-1"><span class="bg-emerald-100 text-emerald-700 px-1 py-0.5 rounded text-[8px] font-bold">Reply</span> <span class="font-semibold text-slate-600">${ourMailSubject}</span></div>` : ''}
                        </div>` : ''}
                    </div>

                    <div>${itemsTableHtml}</div>
                    
                    <div class="flex items-center gap-2 pt-1">
                        <button onclick="event.stopPropagation(); loadFromHistory(${hIdx}, true)" class="px-4 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-[10px] font-black rounded-lg transition border border-slate-200 flex items-center gap-1.5 shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                            Load to Editor
                        </button>
                    </div>
                </div>
            </td>
        </tr>`;
    });
    
    html += `</tbody></table></div>`;
    tbody.innerHTML = html;
}

function handleStatusChange(hIdx, newStatus) {
    const item = historyLog[hIdx];
    if (!item) return;

    // If status is changed to delivered and no delivery date exists, auto-fill today
    if (newStatus === 'Delivered') {
        const d = new Date();
        const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (!item.deliveryDate) {
            item.deliveryDate = today;
            if (item.fullSession) item.fullSession.deliveryDate = today;
        }
    }

    // Call inlineUpdateField for status
    inlineUpdateField(hIdx, 'status', newStatus);

    // Re-render to show/hide the delivery date field correctly based on new status
    renderHistoryTable();
}

// Toggle accordion row expand/collapse
// Toggle accordion row expand/collapse
function toggleTrackerRow(tr) {
    const idx = tr.dataset.idx;
    const detailRow = document.querySelector(`tr.tracker-row-detail[data-detail-for="${idx}"]`);
    const chevron = tr.querySelector('.tracker-chevron');
    if (!detailRow) return;
    
    const isOpen = !detailRow.classList.contains('hidden');
    
    // Close all other open rows
    document.querySelectorAll('tr.tracker-row-detail:not(.hidden)').forEach(open => {
        if (open !== detailRow) {
            open.classList.add('hidden');
            const otherTr = document.querySelector(`tr.tracker-row[data-idx="${open.dataset.detailFor}"]`);
            if (otherTr) {
                const ch = otherTr.querySelector('.tracker-chevron');
                if (ch) ch.style.transform = '';
                otherTr.classList.remove('bg-blue-50/20', 'shadow-md');
            }
        }
    });
    
    if (isOpen) {
        detailRow.classList.add('hidden');
        chevron.style.transform = '';
        tr.classList.remove('bg-blue-50/20', 'shadow-md');
    } else {
        detailRow.classList.remove('hidden');
        chevron.style.transform = 'rotate(180deg)';
        tr.classList.add('bg-blue-50/20', 'shadow-md');
    }
}

// Inline update a field and sync to backend
function inlineUpdateField(hIdx, field, value) {
    const item = historyLog[hIdx];
    if (!item) return;
    
    item[field] = value;
    if (item.fullSession) item.fullSession[field] = value;
    
    localStorage.setItem('rcl_dispatch_history', JSON.stringify(historyLog));
    
    // Sync to backend
    fetch(BACKUP_SHEET_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            action: "updateStatus",
            docId: item.id,
            status: item.status || 'Pending',
            remarks: item.remarks || '',
            approvalDate: item.approvalDate || '',
            deliveryDate: item.deliveryDate || '',
            issuedBy: item.issuedBy || '',
            timestamp: new Date().toLocaleString()
        })
    }).catch(() => {});
    
    showToast(`${field.replace(/([A-Z])/g, ' $1').trim()} updated`, 'success');
}

// Get Tailwind status color class
function getStatusClass(status) {
    const m = {
        'Delivered': 'bg-emerald-100 text-emerald-700 border-emerald-200',
        'Pending': 'bg-amber-100 text-amber-700 border-amber-200',
        'In-Transit': 'bg-orange-100 text-orange-700 border-orange-200',
        'In-Process': 'bg-violet-100 text-violet-700 border-violet-200'
    };
    return m[status] || m['Pending'];
}

// Universal robust date parser for all backend and input date formats
function parseAnyDate(val) {
    if (!val || val === 'N/A' || val === '-') return null;
    if (typeof val !== 'string') {
        const d = new Date(val);
        return isNaN(d.getTime()) ? null : d;
    }
    val = val.trim();
    if (!val) return null;

    // 1. If it is an ISO timestamp with time component (e.g. 2026-08-13T18:30:00.000Z)
    if (val.includes('T') || val.includes('Z')) {
        const d = new Date(val);
        if (!isNaN(d.getTime())) {
            const ist = new Date(d.getTime() + (5.5 * 60 * 60 * 1000));
            return new Date(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate());
        }
    }

    // 2. YYYY-MM-DD
    const isoMatch = val.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
    if (isoMatch) {
        return new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3]));
    }

    // 3. DD-MM-YYYY or DD/MM/YYYY
    const dmyMatch = val.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (dmyMatch) {
        return new Date(parseInt(dmyMatch[3]), parseInt(dmyMatch[2]) - 1, parseInt(dmyMatch[1]));
    }

    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
}

// Convert any date string to ISO format for date input (YYYY-MM-DD)
function toISODate(val) {
    if (!val) return '';
    if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val.trim())) {
        return val.trim();
    }
    const d = parseAnyDate(val);
    if (!d) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

// Format date for display (e.g. 01 Sep 2026)
function formatCleanDate(val) {
    if (!val) return '-';
    const d = parseAnyDate(val);
    if (!d) return String(val);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function loadFromHistory(index, skipConfirm = false, silent = false) {
    const item = historyLog[index];
    if (!item) return;
    
    const doLoad = () => {
        if (item.fullSession) {
            sessionData = JSON.parse(JSON.stringify(item.fullSession));
            if (sessionData.contextType) sessionData.contextType = String(sessionData.contextType).toLowerCase();
            
            if (sessionData.clientMailSubject === 'N/A') sessionData.clientMailSubject = '';
            if (sessionData.clientMailDate === 'N/A') sessionData.clientMailDate = '';
            if (sessionData.ourMailSubject === 'N/A') sessionData.ourMailSubject = '';
            if (sessionData.ourMailDate === 'N/A') sessionData.ourMailDate = '';
        } else {
            sessionData.docIds[item.type === 'Challan' ? 'DC' : 'GP'] = item.id;
            sessionData.recipientName = item.consignee || "";
            sessionData.clientName = item.clientName || "";
            sessionData.campCode = item.campCode || "";
            sessionData.campDate = item.campDate || "";
            sessionData.approxCampReturn = item.approxCampReturn || "";
            sessionData.contextType = String(item.context || 'camp').toLowerCase();
        }

        if (Array.isArray(item.fullItems)) {
            itemsData = JSON.parse(JSON.stringify(item.fullItems));
        } else if (Array.isArray(item.items)) {
            itemsData = JSON.parse(JSON.stringify(item.items));
        } else {
            itemsData = [];
        }

        currentDocType = item.type === 'Challan' ? 'DC' : 'GP';
        
        saveDraft();
        updateThemeUI();
        renderLeftForm();
        renderDocument();
        if (!silent) {
            toggleHistory();
            showToast(`Loaded document ${item.id} into editor!`, "success");
        }
    };

    if (skipConfirm) {
        doLoad();
    } else {
        showModal(`Load document ${item.id}? Current unsaved form will be replaced.`, 'confirm', doLoad);
    }
}

function clearAllHistory() {
    if (historyLog.length === 0) return;
    showModal("Are you sure you want to delete all dispatch history?", "confirm", () => {
        historyLog = [];
        localStorage.removeItem('rcl_dispatch_history');
        renderHistoryTable();
        showToast("History cleared", "info");
    });
}

function exportHistoryCSV() {
    if (historyLog.length === 0) return showModal("No history to export");
    const headers = [
        "Doc ID", "Doc Type", "Context", "Clinic / Consignee", "Client Name",
        "Partner / Camp Code", "Address", "City", "State", "Pincode",
        "Total Qty", "Total Value", "Requested By", "Created Date & Time",
        "Client Mail Subject", "Client Mail Date", "Our Reply Subject", "Our Reply Date",
        "Status", "Remarks"
    ];
    
    const csvRows = [headers.map(h => `"${h}"`).join(",")];
    
    historyLog.forEach(i => {
        const s = i.fullSession || {};
        const row = [
            i.id || '',
            i.type || '',
            i.context || s.contextType || '',
            s.recipientName || i.consignee || '',
            s.clientName || i.clientName || '',
            s.campCode || i.campCode || '',
            (s.recipientAddress || '').replace(/"/g, '""').replace(/\n/g, ' '),
            s.city || '',
            s.state || '',
            s.pincode || '',
            i.totalQty || '0',
            String(i.totalVal || '').replace('₹', '').replace(/,/g, ''),
            s.requestedBy || i.requestedBy || '',
            i.date || '',
            s.clientMailSubject || i.clientMailSubject || '',
            s.clientMailDate || i.clientMailDate || '',
            s.ourMailSubject || i.ourMailSubject || '',
            s.ourMailDate || i.ourMailDate || '',
            i.status || '',
            (i.remarks || '').replace(/"/g, '""').replace(/\n/g, ' ')
        ];
        csvRows.push(row.map(cell => `"${cell}"`).join(","));
    });
    
    const link = document.createElement("a");
    link.href = encodeURI("data:text/csv;charset=utf-8," + csvRows.join("\n"));
    link.download = `Dispatch_History_Detailed_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

// =====================================================================
// STATUS LOG MODAL FUNCTIONS
// =====================================================================
function openStatusModal(index) {
    const item = historyLog[index];
    if (!item) return;
    
    document.getElementById('status-modal-subtitle').textContent = `${item.id} — ${item.clientName || item.consignee || 'Record'}`;
    const statusSelect = document.getElementById('modal-status-select');
    if (statusSelect) statusSelect.value = item.status || 'Pending';
    
    const remarksInput = document.getElementById('modal-status-remarks');
    if (remarksInput) remarksInput.value = item.remarks || '';
    
    const approvalInput = document.getElementById('modal-approval-date');
    if (approvalInput) approvalInput.value = item.approvalDate || (item.fullSession && item.fullSession.approvalDate) || '';
    
    const saveBtn = document.getElementById('modal-save-status-btn');
    if (saveBtn) saveBtn.onclick = () => saveStatusModal(index);
    
    openModal('status-modal');
}

function saveStatusModal(index) {
    const item = historyLog[index];
    if (!item) return;
    
    const statusVal = document.getElementById('modal-status-select')?.value || 'Pending';
    const remarksVal = document.getElementById('modal-status-remarks')?.value || '';
    const approvalDateVal = document.getElementById('modal-approval-date')?.value || '';
    
    item.status = statusVal;
    item.remarks = remarksVal;
    item.approvalDate = approvalDateVal;
    if (item.fullSession) item.fullSession.approvalDate = approvalDateVal;
    
    localStorage.setItem('rcl_dispatch_history', JSON.stringify(historyLog));
    renderHistoryTable();
    
    // Sync to backend
    fetch(BACKUP_SHEET_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            action: "updateStatus",
            docId: item.id,
            status: statusVal,
            remarks: remarksVal,
            approvalDate: approvalDateVal,
            timestamp: new Date().toLocaleString()
        })
    }).catch(() => {});
    
    closeModal('status-modal');
    showToast("Status saved and synced!", "success");
}

// =====================================================================
// CLINIC MAIL LOG MODAL FUNCTIONS
// =====================================================================
function openModal(modalId) {
    const el = document.getElementById(modalId);
    if (!el) return;

    // Cancel any pending close timeout
    if (el._closeTimer) { clearTimeout(el._closeTimer); el._closeTimer = null; }

    // Reset inline styles that a previous close animation may have left
    el.style.opacity = '';
    el.style.pointerEvents = '';
    const card = el.firstElementChild;
    if (card) { card.style.opacity = ''; card.style.transform = ''; }

    // Show
    el.classList.remove('hidden');
    el.classList.add('flex');

    // Animate backdrop fade-in (Web Animations API — fire-and-forget, no stuck state)
    el.animate(
        [{ opacity: 0 }, { opacity: 1 }],
        { duration: 200, easing: 'ease-out', fill: 'none' }
    );

    // Animate card pop-in
    if (card) {
        card.animate(
            [
                { opacity: 0, transform: 'scale(0.92) translateY(12px)' },
                { opacity: 1, transform: 'scale(1) translateY(0)' }
            ],
            { duration: 280, easing: 'cubic-bezier(0.175,0.885,0.32,1.275)', fill: 'none' }
        );
    }
}

function closeModal(modalId) {
    const el = document.getElementById(modalId);
    if (!el || el.classList.contains('hidden')) return;

    const card = el.firstElementChild;

    // Animate backdrop fade-out
    const backdropAnim = el.animate(
        [{ opacity: 1 }, { opacity: 0 }],
        { duration: 150, easing: 'ease-in', fill: 'forwards' }
    );

    // Animate card pop-out
    if (card) {
        card.animate(
            [
                { opacity: 1, transform: 'scale(1) translateY(0)' },
                { opacity: 0, transform: 'scale(0.95) translateY(-8px)' }
            ],
            { duration: 150, easing: 'ease-in', fill: 'forwards' }
        );
    }

    // After animation finishes, actually hide the element and clean up
    el._closeTimer = setTimeout(() => {
        el.classList.add('hidden');
        el.classList.remove('flex');
        // Reset inline styles so next open starts clean
        el.style.opacity = '';
        el.style.pointerEvents = '';
        if (card) { card.style.opacity = ''; card.style.transform = ''; }
        // Cancel any lingering Web Animation fill
        el.getAnimations().forEach(a => a.cancel());
        if (card) card.getAnimations().forEach(a => a.cancel());
        el._closeTimer = null;
    }, 160);
}

function openMailLogModal(index) {
    const item = historyLog[index];
    if (!item) return;
    
    const modal = document.getElementById('mail-log-modal');
    if (!modal) return;
    
    document.getElementById('mail-modal-subtitle').textContent = `${item.id} — ${item.clientName || item.consignee || 'Clinic Record'}`;
    const clientSubjInput = document.getElementById('modal-client-mail-subject');
    if (clientSubjInput) clientSubjInput.value = (item.clientMailSubject || (item.fullSession && item.fullSession.clientMailSubject) || '').replace(/^N\/A$/i, '');
    
    const clientDateInput = document.getElementById('modal-client-mail-date');
    if (clientDateInput) clientDateInput.value = (item.clientMailDate || (item.fullSession && item.fullSession.clientMailDate) || '').replace(/^N\/A$/i, '');
    
    const ourSubjInput = document.getElementById('modal-our-mail-subject');
    if (ourSubjInput) ourSubjInput.value = (item.ourMailSubject || (item.fullSession && item.fullSession.ourMailSubject) || '').replace(/^N\/A$/i, '');
    
    const ourDateInput = document.getElementById('modal-our-mail-date');
    if (ourDateInput) ourDateInput.value = (item.ourMailDate || (item.fullSession && item.fullSession.ourMailDate) || '').replace(/^N\/A$/i, '');
    
    const saveBtn = document.getElementById('modal-save-mail-btn');
    if (saveBtn) saveBtn.onclick = () => saveMailLogModal(index);
    
    openModal('mail-log-modal');
    
    if (ourSubjInput && !ourSubjInput.value.trim()) {
        setTimeout(() => ourSubjInput.focus(), 150);
    }
}

function saveMailLogModal(index) {
    const item = historyLog[index];
    if (!item) return;
    
    const clientMailSubject = (document.getElementById('modal-client-mail-subject')?.value || '').trim();
    const clientMailDate = (document.getElementById('modal-client-mail-date')?.value || '').trim();
    const ourMailSubject = (document.getElementById('modal-our-mail-subject')?.value || '').trim();
    const ourMailDate = (document.getElementById('modal-our-mail-date')?.value || '').trim();
    
    if (!clientMailSubject) {
        showToast("Client Mail Subject Line is required!", "error");
        document.getElementById('modal-client-mail-subject')?.focus();
        return;
    }
    
    item.clientMailSubject = clientMailSubject;
    item.clientMailDate = clientMailDate;
    item.ourMailSubject = ourMailSubject;
    item.ourMailDate = ourMailDate;
    if (item.fullSession) {
        item.fullSession.clientMailSubject = clientMailSubject;
        item.fullSession.clientMailDate = clientMailDate;
        item.fullSession.ourMailSubject = ourMailSubject;
        item.fullSession.ourMailDate = ourMailDate;
    }
    
    localStorage.setItem('rcl_dispatch_history', JSON.stringify(historyLog));
    renderHistoryTable();
    
    fetch(BACKUP_SHEET_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            action: "updateMailLog",
            docId: item.id,
            clientName: item.clientName || item.campCode || item.consignee || '',
            clientMailSubject, clientMailDate,
            ourMailSubject, ourMailDate,
            timestamp: new Date().toLocaleString()
        })
    }).catch(() => {});
    
    closeModal('mail-log-modal');
    showToast("Mail info saved and synced!", "success");
}

function viewHistoryDetail(index) {
    const item = historyLog[index];
    if (!item) return;
    
    const modal = document.getElementById('history-detail-modal');
    if (!modal) return;
    
    const s = item.fullSession || {};
    const items = item.fullItems || [];
    const ctx = item.context || s.contextType || 'camp';
    
    document.getElementById('detail-modal-title').textContent = item.id || 'Document';
    document.getElementById('detail-modal-subtitle').textContent = `${item.type} • ${item.date} • ${ctx.toUpperCase()}`;
    
    let body = '';
    
    // Status Update Header
    body += `
    <div class="flex items-center justify-between mb-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
        <div class="font-black text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-2">
            Delivery Status: <span class="px-2 py-1 rounded-lg bg-indigo-100 text-indigo-800 border border-indigo-200">${item.status || 'Pending'}</span>
        </div>
        <button onclick="closeModal('history-detail-modal'); openStatusModal(${index})" class="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-[10px] font-black rounded-lg transition shadow-sm flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg> Update Status
        </button>
    </div>`;

    // Details Grid
    body += `<div class="grid grid-cols-2 gap-x-4 gap-y-2 text-xs border-b border-slate-100 pb-3 mb-3">`;
    const fields = [
        ['Client / Partner', s.clientName || item.clientName || '-'],
        ['Clinic / Consignee', s.recipientName || item.consignee || '-'],
        ['Camp/Clinic Code', s.campCode || item.campCode || '-'],
        ['Consignee Address', s.recipientAddress || item.address || '-'],
        ['City', s.city || '-'],
        ['State', s.state || '-'],
        ['Pincode', s.pincode || '-'],
        ['Transport No', s.transportNo || '-'],
        ['Requested By', s.requestedBy || item.requestedBy || '-'],
        ['SPOC', [s.spocName, s.spocContact].filter(Boolean).join(' • ') || '-'],
        ['Camp Date', s.campDate || '-'],
    ];
    fields.forEach(([label, val]) => {
        body += `<div><span class="text-[10px] font-black text-slate-400 uppercase block">${label}</span><span class="font-bold text-slate-800">${val}</span></div>`;
    });
    body += `</div>`;
    
    // Clinic Mail Tracking info
    if (ctx === 'clinic') {
        const cms = item.clientMailSubject || s.clientMailSubject || '';
        const cmd = item.clientMailDate || s.clientMailDate || '';
        const oms = item.ourMailSubject || s.ourMailSubject || '';
        const omd = item.ourMailDate || s.ourMailDate || '';
        body += `<div class="p-3 bg-indigo-50/70 rounded-2xl border border-indigo-100 space-y-1.5 text-xs mb-3">
            <div class="font-black text-indigo-950 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a 1.94 1.94 0 0 1 -2.06 0L2 7"/></svg>
                Clinic Mail & Dispatch Tracking
            </div>
            <div class="grid grid-cols-2 gap-2 text-[11px]">
                <div><span class="text-[9px] font-bold text-slate-400 block">Client Subject:</span><span class="font-bold text-slate-800">${cms || '-'}</span></div>
                <div><span class="text-[9px] font-bold text-slate-400 block">Client Mail Date:</span><span class="font-bold text-slate-800">${cmd ? new Date(cmd).toLocaleString('en-IN') : '-'}</span></div>
                <div><span class="text-[9px] font-bold text-slate-400 block">Our Reply Subject:</span><span class="font-bold ${oms ? 'text-emerald-700' : 'text-amber-600'}">${oms || '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="inline-block text-amber-500 mr-0.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Pending'}</span></div>
                <div><span class="text-[9px] font-bold text-slate-400 block">Our Mail Date:</span><span class="font-bold text-slate-800">${omd ? new Date(omd).toLocaleString('en-IN') : '-'}</span></div>
            </div>
        </div>`;
    }
    
    // Items Table
    if (items && items.length > 0) {
        body += `<div class="border border-slate-200 rounded-2xl overflow-hidden">
            <table class="w-full text-xs">
                <thead><tr class="bg-slate-50 text-[10px] font-black text-slate-500 uppercase border-b border-slate-100">
                    <th class="p-2.5 text-left">#</th>
                    <th class="p-2.5 text-left">Item Description</th>
                    <th class="p-2.5 text-right">Qty</th>
                    <th class="p-2.5 text-right">Rate</th>
                    <th class="p-2.5 text-right">Total</th>
                </tr></thead>
                <tbody class="divide-y divide-slate-100">`;
        let grandTotal = 0;
        items.forEach((it, idx) => {
            const q = parseFloat(it.qty) || 0;
            const r = parseFloat(it.rate) || 0;
            const v = q * r;
            grandTotal += v;
            body += `<tr>
                <td class="p-2.5 text-slate-400 font-bold">${idx + 1}</td>
                <td class="p-2.5 font-bold text-slate-800">${it.desc || '-'}</td>
                <td class="p-2.5 text-right font-black text-blue-700">${q}</td>
                <td class="p-2.5 text-right font-bold text-slate-600">₹${r}</td>
                <td class="p-2.5 text-right font-black text-emerald-700">₹${v.toLocaleString('en-IN')}</td>
            </tr>`;
        });
        body += `</tbody>
            <tfoot><tr class="bg-slate-50 font-black border-t border-slate-200">
                <td colspan="2" class="p-2.5 text-slate-800">Grand Total</td>
                <td class="p-2.5 text-right text-blue-800">${item.totalQty || '-'}</td>
                <td class="p-2.5"></td>
                <td class="p-2.5 text-right text-emerald-800 text-sm">${grandTotal > 0 ? '₹' + grandTotal.toLocaleString('en-IN') : '-'}</td>
            </tr></tfoot>
        </table></div>`;
    }
    
    document.getElementById('detail-modal-body').innerHTML = body;
    
    document.getElementById('detail-load-btn').onclick = () => {
        closeModal('history-detail-modal');
        loadFromHistory(index, true);
    };
    document.getElementById('detail-download-btn').onclick = async () => {
        closeModal('history-detail-modal');
        await executeWithoutLosingState(async () => {
            loadFromHistory(index, true);
            await new Promise(r => setTimeout(r, 400));
            await downloadChallan(false, true, true);
        });
    };
    
    openModal('history-detail-modal');
}

// =====================================================================
// GSAP ENTRANCE ANIMATIONS
// =====================================================================
window.addEventListener('DOMContentLoaded', () => {
    if (window.gsap) {
        // Stagger in the left panel form sections
        gsap.fromTo(".form-section", 
            { opacity: 0, y: 15 }, 
            { opacity: 1, y: 0, duration: 0.45, stagger: 0.08, ease: "power2.out", delay: 0.1 }
        );
        
        // Slide down the top toolbar
        gsap.fromTo(".app-toolbar",
            { y: -40, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.5, ease: "back.out(1.2)" }
        );

        // Fade in the document preview
        gsap.fromTo("#challan-wrapper",
            { opacity: 0, scale: 0.96 },
            { opacity: 1, scale: 1, duration: 0.6, ease: "power3.out", delay: 0.2 }
        );
    }
});

// =====================================================================
// CLEAN DATE TIME FORMATTER
// =====================================================================
function formatCleanDateTime(dateStr) {
    if (!dateStr) return 'N/A';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr.split('GMT')[0].trim();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const day = String(d.getDate()).padStart(2, '0');
        const month = months[d.getMonth()];
        const year = d.getFullYear();
        let hours = d.getHours();
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        const strTime = String(hours).padStart(2, '0') + ':' + minutes + ' ' + ampm;
        return `${day} ${month} ${year} • ${strTime}`;
    } catch (e) {
        return dateStr;
    }
}

function formatDateForBackend(dateStr) {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    if (dateStr.includes('T') || dateStr.includes(' ')) {
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}`;
    }
    return `${year}-${month}-${day}`;
}

// =====================================================================
// HISTORY EXPORT TO EXCEL CSV (FILTERED SEARCH RESULTS)
// =====================================================================
function downloadHistoryCSV() {
    const search = (document.getElementById('history-search')?.value || '').toLowerCase();
    
    let list = historyLog;
    if (historyContextFilter !== 'all') {
        list = list.filter(i => {
            const ctx = String(i.context || (i.fullSession && i.fullSession.contextType) || 'camp').toLowerCase();
            return ctx === historyContextFilter;
        });
    }
    
    if (search) {
        list = list.filter(i => {
            const s = i.fullSession || {};
            const searchStr = [
                i.id, i.clientName, i.consignee, i.campCode, i.date, i.requestedBy,
                i.clientMailSubject, i.ourMailSubject, s.recipientName, s.clientName,
                s.campCode, s.city, s.state, s.pincode, s.requestedBy, s.recipientAddress
            ].filter(Boolean).join(' ').toLowerCase();
            return searchStr.includes(search);
        });
    }
    
    if (list.length === 0) {
        showToast("No history records to export!", "error");
        return;
    }
    
    const headers = [
        "Doc ID", "Doc Type", "Context", "Clinic / Consignee", "Client Name",
        "Partner / Camp Code", "Address", "City", "State", "Pincode",
        "Total Qty", "Total Value", "Requested By", "Created Date & Time",
        "Client Mail Subject", "Client Mail Date", "Our Reply Subject", "Our Reply Date"
    ];
    
    const csvRows = [headers.map(h => `"${h}"`).join(",")];
    
    list.forEach(i => {
        const s = i.fullSession || {};
        const row = [
            i.id || '',
            i.type || '',
            i.context || s.contextType || '',
            s.recipientName || i.consignee || '',
            s.clientName || i.clientName || '',
            s.campCode || i.campCode || '',
            (s.recipientAddress || '').replace(/"/g, '""').replace(/\n/g, ' '),
            s.city || '',
            s.state || '',
            s.pincode || '',
            i.totalQty || '',
            i.totalVal || '',
            s.requestedBy || i.requestedBy || '',
            formatCleanDateTime(i.date),
            (i.clientMailSubject || s.clientMailSubject || '').replace(/"/g, '""'),
            i.clientMailDate || s.clientMailDate || '',
            (i.ourMailSubject || s.ourMailSubject || '').replace(/"/g, '""'),
            i.ourMailDate || s.ourMailDate || ''
        ];
        csvRows.push(row.map(val => `"${val}"`).join(","));
    });
    
    const csvContent = "\uFEFF" + csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const d = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `Dispatch_History_${search ? 'Search_' : ''}${d}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showToast(`Exported ${list.length} search records to Excel file!`, "success");
}

// =====================================================================
// CANVAS ZOOM & DRAG / PAN LOGIC FOR A4 CHALLAN PREVIEW
// =====================================================================
let currentScale = 1;
let isPanning = false;
let startX = 0, startY = 0, translateX = 0, translateY = 0;

function zoomChallan(delta) {
    currentScale = Math.max(0.4, Math.min(1.6, currentScale + delta));
    updateChallanTransform();
}

function resetZoomAndPan() {
    currentScale = 1;
    translateX = 0;
    translateY = 0;
    updateChallanTransform();
}

function updateChallanTransform() {
    const container = document.getElementById('challan-zoom-container');
    const txt = document.getElementById('zoom-level-text');
    if (container) {
        container.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentScale})`;
    }
    if (txt) {
        txt.textContent = `${Math.round(currentScale * 100)}%`;
    }
}

function initChallanPan() {
    const container = document.getElementById('challan-zoom-container');
    const area = document.getElementById('preview-area');
    if (!container || !area) return;

    area.addEventListener('mousedown', (e) => {
        if (e.target.closest('#challan-zoom-container') && !e.target.closest('input, select, textarea, button')) {
            isPanning = true;
            startX = e.clientX - translateX;
            startY = e.clientY - translateY;
            container.style.cursor = 'grabbing';
        }
    });

    window.addEventListener('mousemove', (e) => {
        if (!isPanning) return;
        translateX = e.clientX - startX;
        translateY = e.clientY - startY;
        updateChallanTransform();
    });

    window.addEventListener('mouseup', () => {
        if (isPanning) {
            isPanning = false;
            if (container) container.style.cursor = 'grab';
        }
    });
}

// =====================================================================
// RESIZABLE SIDEBAR PANELS (LEFT & RIGHT DRAG HANDLES)
// =====================================================================
function initResizablePanels() {
    const leftPanel = document.getElementById('left-panel');
    const leftResizer = document.getElementById('left-resizer');
    const rightPanel = document.getElementById('history-view');
    const rightResizer = document.getElementById('right-resizer');

    let isResizingLeft = false;
    let isResizingRight = false;

    if (leftResizer && leftPanel) {
        leftResizer.addEventListener('mousedown', (e) => {
            isResizingLeft = true;
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        });
    }

    if (rightResizer && rightPanel) {
        rightResizer.addEventListener('mousedown', (e) => {
            isResizingRight = true;
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        });
    }

    window.addEventListener('mousemove', (e) => {
        if (isResizingLeft && leftPanel) {
            const newWidth = Math.max(300, Math.min(e.clientX, 680));
            leftPanel.style.width = `${newWidth}px`;
        }
        if (isResizingRight && rightPanel) {
            const newWidth = Math.max(380, Math.min(window.innerWidth - e.clientX, 850));
            rightPanel.style.width = `${newWidth}px`;
        }
    });

    window.addEventListener('mouseup', () => {
        if (isResizingLeft || isResizingRight) {
            isResizingLeft = false;
            isResizingRight = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }
    });
}

// =====================================================================
// BULK CHALLAN HUB (BATCH REVIEW, QUICK EDITOR & BULK DOWNLOADER)
// =====================================================================
window._bulkCurrentIndex = 0;

function openBulkChallanHub(index = 0) {
    if (!historyLog || historyLog.length === 0) {
        showToast("No challans available in history or bulk queue yet!", "error");
        return;
    }
    window._bulkCurrentIndex = Math.min(Math.max(0, index), historyLog.length - 1);
    
    const jumpSelect = document.getElementById('bulk-jump-select');
    if (jumpSelect) {
        jumpSelect.innerHTML = historyLog.map((item, i) => {
            const label = `${i + 1}. ${item.id} — ${item.consignee || item.clientName || 'Challan'}`;
            return `<option value="${i}" ${i === window._bulkCurrentIndex ? 'selected' : ''}>${label}</option>`;
        }).join('');
    }
    
    const totalBtnCount = document.getElementById('bulk-total-btn-count');
    if (totalBtnCount) totalBtnCount.textContent = historyLog.length;

    renderBulkChallanCurrent();
    openModal('bulk-challan-modal');
}

function renderBulkChallanCurrent() {
    const idx = window._bulkCurrentIndex;
    const item = historyLog[idx];
    if (!item) return;

    loadFromHistory(idx, true, true);

    const stepCounter = document.getElementById('bulk-step-counter');
    if (stepCounter) stepCounter.textContent = `${idx + 1} / ${historyLog.length}`;
    
    const subtitle = document.getElementById('bulk-hub-subtitle');
    if (subtitle) subtitle.textContent = `Reviewing Challan ${idx + 1} of ${historyLog.length} — ${item.consignee || 'Consignee'}`;

    const docTypeEl = document.getElementById('bulk-edit-doc-type');
    if (docTypeEl) docTypeEl.textContent = item.type === 'Challan' ? 'DC' : 'GP';

    const idEl = document.getElementById('bulk-edit-id');
    if (idEl) idEl.value = item.id || '';

    const ctxEl = document.getElementById('bulk-edit-context');
    if (ctxEl) ctxEl.value = item.context || sessionData.contextType || 'camp';

    const consEl = document.getElementById('bulk-edit-consignee');
    if (consEl) consEl.value = sessionData.recipientName || item.consignee || '';

    const clientEl = document.getElementById('bulk-edit-client');
    if (clientEl) clientEl.value = sessionData.clientName || item.clientName || '';

    const codeEl = document.getElementById('bulk-edit-code');
    if (codeEl) codeEl.value = sessionData.campCode || item.campCode || '';

    const retEl = document.getElementById('bulk-edit-retdate');
    if (retEl) retEl.value = sessionData.approxCampReturn || item.approxCampReturn || '';

    const tbody = document.getElementById('bulk-edit-items-tbody');
    const totalQtySpan = document.getElementById('bulk-edit-total-qty');
    let totalQty = 0;
    if (tbody) {
        tbody.innerHTML = itemsData.map((it, itemIdx) => {
            const q = parseFloat(it.qty) || 0;
            totalQty += q;
            return `
                <tr class="hover:bg-slate-50/80 transition">
                    <td class="p-2.5">
                        <input type="text" value="${it.desc || ''}" class="w-full bg-transparent border-b border-slate-200 focus:border-[#053763] outline-none text-xs font-bold" oninput="updateBulkItemField(${itemIdx}, 'desc', this.value)">
                    </td>
                    <td class="p-2.5 text-center">
                        <input type="number" value="${it.qty || ''}" class="w-16 bg-transparent border-b border-slate-200 focus:border-[#053763] outline-none text-xs font-black text-center" oninput="updateBulkItemField(${itemIdx}, 'qty', this.value)">
                    </td>
                    <td class="p-2.5 text-right">
                        <input type="number" value="${it.rate || ''}" class="w-20 bg-transparent border-b border-slate-200 focus:border-[#053763] outline-none text-xs font-bold text-right" oninput="updateBulkItemField(${itemIdx}, 'rate', this.value)">
                    </td>
                </tr>
            `;
        }).join('');
    }
    if (totalQtySpan) totalQtySpan.textContent = `Total Qty: ${totalQty}`;

    const jumpSelect = document.getElementById('bulk-jump-select');
    if (jumpSelect) jumpSelect.value = idx;

    const mainWrapper = document.getElementById('challan-wrapper');
    const previewContainer = document.getElementById('bulk-preview-container');
    if (mainWrapper && previewContainer) {
        previewContainer.innerHTML = mainWrapper.innerHTML;
    }

    const prevBtn = document.getElementById('bulk-prev-btn');
    const nextBtn = document.getElementById('bulk-next-btn');
    if (prevBtn) prevBtn.disabled = idx === 0;
    if (nextBtn) nextBtn.disabled = idx === historyLog.length - 1;
}

function navigateBulkChallan(step) {
    if (!historyLog || historyLog.length === 0) return;
    const newIdx = window._bulkCurrentIndex + step;
    if (newIdx >= 0 && newIdx < historyLog.length) {
        window._bulkCurrentIndex = newIdx;
        renderBulkChallanCurrent();
    }
}

function jumpToBulkChallan(idxStr) {
    const idx = parseInt(idxStr, 10);
    if (!isNaN(idx) && idx >= 0 && idx < historyLog.length) {
        window._bulkCurrentIndex = idx;
        renderBulkChallanCurrent();
    }
}

function updateBulkCurrentField(field, value) {
    const idx = window._bulkCurrentIndex;
    const item = historyLog[idx];
    if (!item) return;

    if (field === 'id') {
        item.id = value;
        sessionData.docIds[currentDocType] = value;
    } else if (field === 'context') {
        item.context = value;
        sessionData.contextType = value;
    } else if (field === 'consignee') {
        item.consignee = value;
        sessionData.recipientName = value;
    } else if (field === 'clientName') {
        item.clientName = value;
        sessionData.clientName = value;
    } else if (field === 'campCode') {
        item.campCode = value;
        sessionData.campCode = value;
    } else if (field === 'approxCampReturn') {
        item.approxCampReturn = value;
        sessionData.approxCampReturn = value;
    }

    item.fullSession = JSON.parse(JSON.stringify(sessionData));
    localStorage.setItem('rcl_dispatch_history', JSON.stringify(historyLog));

    renderDocument();
    const mainWrapper = document.getElementById('challan-wrapper');
    const previewContainer = document.getElementById('bulk-preview-container');
    if (mainWrapper && previewContainer) {
        previewContainer.innerHTML = mainWrapper.innerHTML;
    }
}

function updateBulkItemField(itemIdx, field, value) {
    if (!itemsData[itemIdx]) return;
    itemsData[itemIdx][field] = value;

    const idx = window._bulkCurrentIndex;
    const item = historyLog[idx];
    if (item) {
        item.fullItems = JSON.parse(JSON.stringify(itemsData));
        item.items = itemsData.length;
        const totalQtyNum = itemsData.reduce((s, it) => s + (parseFloat(it.qty) || 0), 0);
        item.totalQty = totalQtyNum;
        localStorage.setItem('rcl_dispatch_history', JSON.stringify(historyLog));
    }

    const totalQtySpan = document.getElementById('bulk-edit-total-qty');
    const totalQtyNum = itemsData.reduce((s, it) => s + (parseFloat(it.qty) || 0), 0);
    if (totalQtySpan) totalQtySpan.textContent = `Total Qty: ${totalQtyNum}`;

    renderDocument();
    const mainWrapper = document.getElementById('challan-wrapper');
    const previewContainer = document.getElementById('bulk-preview-container');
    if (mainWrapper && previewContainer) {
        previewContainer.innerHTML = mainWrapper.innerHTML;
    }
}

function saveBulkCurrentToHistory() {
    const idx = window._bulkCurrentIndex;
    const item = historyLog[idx];
    if (!item) return;

    item.fullSession = JSON.parse(JSON.stringify(sessionData));
    item.fullItems = JSON.parse(JSON.stringify(itemsData));
    localStorage.setItem('rcl_dispatch_history', JSON.stringify(historyLog));

    syncToGoogleSheet({
        docId: item.id,
        docType: currentDocType,
        context: sessionData.contextType,
        recipientName: sessionData.recipientName,
        recipientAddress: sessionData.recipientAddress,
        clientName: sessionData.clientName,
        city: sessionData.city,
        state: sessionData.state || "",
        pincode: sessionData.pincode,
        campCode: sessionData.campCode,
        transportNo: sessionData.transportNo,
        campDate: sessionData.campDate,
        approxCampReturn: sessionData.approxCampReturn,
        spocName: sessionData.spocName,
        spocContact: sessionData.spocContact,
        recipientPhone: sessionData.recipientPhone,
        purpose: sessionData.purpose,
        requestedBy: sessionData.requestedBy,
        totalQty: item.totalQty || 0,
        totalVal: 0,
        items: itemsData.map(it => ({
            desc: it.desc, hsn: it.hsn || "", unit: it.unit || "Pcs",
            qty: it.qty, rate: it.rate, rem: it.rem || ""
        })),
        timestamp: new Date().toLocaleString()
    });

    renderHistoryTable();
    showToast(`Saved changes for ${item.id} & synced with sheet!`, "success");
}

async function downloadSingleBulkCurrent() {
    const idx = window._bulkCurrentIndex;
    closeModal('bulk-challan-modal');
    await executeWithoutLosingState(async () => {
        loadFromHistory(idx, true, false);
        await new Promise(r => setTimeout(r, 300));
        await downloadChallan(false, true, true);
    });
}

function downloadAllBulkChallans() {
    showBulkSettingsModal('history');
}

// ==========================================
// UI & ANIMATIONS INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Initialize AutoAnimate on dynamic containers for smooth transitions
    if (typeof autoAnimate !== 'undefined') {
        const formFields = document.getElementById('left-form-fields');
        if (formFields) autoAnimate(formFields, { duration: 250, easing: 'ease-out' });
        
        const historyList = document.getElementById('history-tbody');
        if (historyList) autoAnimate(historyList, { duration: 250, easing: 'ease-out' });

        const historyCards = document.getElementById('history-cards-container');
        if (historyCards) autoAnimate(historyCards, { duration: 250, easing: 'ease-out' });
        
        const theTable = document.getElementById('item-table-body');
        if (theTable) autoAnimate(theTable, { duration: 200, easing: 'ease-in-out' });
    }
});



