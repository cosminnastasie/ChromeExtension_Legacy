console.log('Background has loaded!');

// Check login each time popup is open
chrome.browserAction.onClicked.addListener(function(tab) {

    //Send message that popup icon has been clicked
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
        if (tabs.length){
            chrome.tabs.sendMessage(tabs[0].id,{message: 'toggle_popup' });
            check_login(true);
        }
    })  
})

//Messages listener

chrome.runtime.onMessage.addListener((request,sender, sendResponse) => {
    console.log('REQUEST: ', request);
    let senderTabId = sender.tab.id;

    // Check login
    if(request.message === 'check_login'){
        check_login(false);
    }

    // Login
    if(request.message === 'login'){
        do_login(request, senderTabId);
    }

    // Get product data 
    if(request.message === 'get_product_data'){
        do_get_product_data(request, senderTabId, get_product_data_settings, 'getProductData');
    }

    // Get product deviation
    if(request.message === 'get_products_deviation_data'){
        do_get_product_data(request, senderTabId, get_product_data_settings, 'getProductsDeviationData');
    }

    // Logout
    if(request.message === 'logout'){
        chrome.storage.local.remove(['expirationTime','access_token', 'refresh_token' ], function(result) {
            check_login(true);
        })    
    }
})