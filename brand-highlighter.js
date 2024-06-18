const scannedClass = 'ext-brand-highlighter-scanned';
const flaggedClass = 'ext-brand-highlighter-flagged';
const safeClass = 'ext-brand-highlighter-safe';

const titleSelectors = {
    'walmart': '.main-content section a[link-identifier] span:not(.' + scannedClass + ')',
    'amazon': '#productTitle, .s-result-item h2 > a > span:not(.' + scannedClass + ')'
}

let currentStore = false;
let titleSelector = false;
Object.keys(titleSelectors).forEach(store => {
    if (window.location.hostname.includes(store)) {
        currentStore = store;
        titleSelector = titleSelectors[store];
        return;
    }
});

function flagItem(storeItem, brand = '') {
    storeItem.classList.add(scannedClass);
    storeItem.classList.add(flaggedClass);
    storeItem.parentNode.parentNode.classList.add(flaggedClass);
    if (!itemTitles_flag.includes(storeItem.innerText)) {
        itemTitles_flag.push(storeItem.innerText);
        console.log("added event listener")
        let WalmartCartBtn = storeItem.parentNode.parentNode.querySelector("button[data-automation-id='add-to-cart']")
        let AmazonCartBtn = document.getElementById("add-to-cart-button")
        if (WalmartCartBtn) {
            WalmartCartBtn.addEventListener('click', e => {
                let warnEl = document.createElement("div");
                let boldEl = document.createElement("strong");
                let textEl = document.createElement("span");
                boldEl.innerText = 'Warning';
                textEl.innerText = 'Product added to cart matches a flagged brand name';
                if (brand !== '') {
                    textEl.innerText += ': "' + brand + '"';
                }
                warnEl.classList.add('ext-brand-highlighter-warning')
                warnEl.appendChild(boldEl);
                warnEl.appendChild(textEl);
                document.body.appendChild(warnEl);
                setTimeout(() => {
                    warnEl.parentNode.removeChild(warnEl);
                }, 6000);
            });
        }else if (AmazonCartBtn) {
            let warnEl = document.createElement("div");
            let boldEl = document.createElement("strong");
            let textEl = document.createElement("span");
            boldEl.innerText = 'Warning';
            textEl.innerText = 'Product matches a flagged brand name';
            if (brand !== '') {
                textEl.innerText += ': "' + brand + '"';
            }
            warnEl.classList.add('ext-brand-highlighter-warning')
            warnEl.appendChild(boldEl);
            warnEl.appendChild(textEl);
            document.body.appendChild(warnEl);
            setTimeout(() => {
                debugger;
            }, 6000);
        }
    }
}


function reScan(brands) {
    const unscannedItems = document.querySelectorAll(titleSelector);
    if (unscannedItems.length === 0) {
        return;
    }
    console.log("BRAND HIGHLIGHTER: Scanning " + unscannedItems.length + " items")
    unscannedItems.forEach(storeItem => {
        if (itemTitles_flag.includes(storeItem)) {
            // item is already in flag list
            flagItem(storeItem);
            return;
        }
        if (itemTitles_safe.includes(storeItem)) {
            // item is already safe
            return;
        }
        if (storeItem.innerText.trim() === '') {
            // item is still loading
            return;
        }
        let itemFlagged = false;
        brands.forEach(brand => {
            if (storeItem.innerText.toLowerCase().includes(brand.toLowerCase()) && !storeItem.innerText.toLowerCase().includes("compatible")) {
                console.log("BRAND HIGHLIGHTER: Flagged (matches '" + brand + "'): ", storeItem.innerText);
                flagItem(storeItem, brand);
                itemFlagged = true;
                return;
            }
        });
        if (!itemFlagged) {
            storeItem.classList.add(scannedClass);
            storeItem.classList.add(safeClass);
            itemTitles_safe.push(storeItem);
        }
    });
    console.log("BRAND HIGHLIGHTER: Done scanning.")
}

console.log("Brand Highlighter loaded");

let brandsList = [];
let itemTitles_safe = [];
let itemTitles_flag = [];
const brandsListURL = chrome.runtime.getURL("brands.json");
fetch(brandsListURL)
    .then(resp => resp.json())
    .then(data => {
        brandsList = data;
        reScan(brandsList);
        setInterval(() => {
            reScan(brandsList);
        }, 4000);
    });

window.navigation.addEventListener("navigate", () => {
    reScan(brandsList);
});
