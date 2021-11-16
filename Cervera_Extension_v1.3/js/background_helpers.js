sendMessageToActiveTab = (tabs, message, isLogin, showPopup) => {
    if (tabs.length){
        chrome.tabs.sendMessage(tabs[0].id,{message: message, isLogin: isLogin, showPopup: showPopup });  
    }else{
        for (var i=0; i<tabs.length; ++i) {
            chrome.tabs.sendMessage(tabs[0].id,{message: message, isLogin: isLogin, showPopup: showPopup });
        }
    }
}

check_login = (showPopup) => {
     //Check if session expired
    chrome.storage.local.get(['expirationTime'], function(result) {
        let isLogin = false;
        if (typeof result['expirationTime'] !== 'undefined'){
            if(Date.now() - result['expirationTime'] > expirationTime ){
                isLogin = false;
            }else{
                isLogin = true
            }
        }else{
            isLogin = false;
        }
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
            sendMessageToActiveTab(tabs, 'login_status', isLogin, showPopup);
        }) 
       
    })
}

var login_settings = {
    "url": CLIENTAPI + 'token',
    "method": "POST",
    "timeout": 0,
    "headers": {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    "data": {
      "grant_type": "password",
      "client_id": client_id,
      "client_secret": client_secret,
      "username": "",
      "password": ""
    }
};

var refresh_token_settings = {
    "url": CLIENTAPI + "token",
    "method": "POST",
    "timeout": 0,
    "headers": {
        "Content-Type": "application/x-www-form-urlencoded"
    },
    "data": {
        "grant_type": "refresh_token",
        "client_id": client_id,
        "client_secret": client_secret,
        "refresh_token": ""
    }
};

var get_product_data_settings = {
    "url": "",
    "method": "POST",
    "timeout": 0,
    "headers": {},
    "data": {}
};

do_login = (request, senderTabId) => {
    let newSettings = JSON.parse(JSON.stringify(login_settings))
    newSettings.data.username = request.credentials.username;
    newSettings.data.password = request.credentials.password;
    
    $.ajax(newSettings)
        .done(function (response) {
            let isLogin = true;
            save_tokens(response, ()=>{
                chrome.tabs.sendMessage(senderTabId,{message: 'login_status', isLogin: isLogin, showPopup: false }); 
            });   
        })
        .fail(function (xhr, error, errorThrown) {
            let status = xhr.status;
            chrome.tabs.sendMessage(senderTabId,{message: 'login_status', isLogin: 'failed' });
        }); 
}

//Save token on chrome.storage.local
save_tokens = (response, callback) => {
    var {refresh_token,access_token} = response
    chrome.storage.local.set({'access_token': access_token}, function() {
        chrome.storage.local.set({'refresh_token': refresh_token}, function() {
            chrome.storage.local.set({'expirationTime': Date.now()}, function() {
                callback();
            })
        });
    });
}

do_refresh_token = (senderTabId, callback) => {
    chrome.storage.local.get(['refresh_token'], function(result) {
        let refresh_token =  result['refresh_token'];
        let newSettings = JSON.parse(JSON.stringify(refresh_token_settings))
        newSettings.data.refresh_token = refresh_token;

        $.ajax(newSettings)
            .done(function (response) {
                save_tokens(response, ()=>{callback()});
            })
            .fail(function (xhr, error, errorThrown) {
                let status = xhr.status;
                chrome.tabs.sendMessage(senderTabId,{message: 'login_status', isLogin: false });
            });
    });  
}

// Get access token from local.storage and  set ajax call settings
setGetDataHeaders = (get_settings, result, data, action) => {
    let new_get_product_data_settings = JSON.parse(JSON.stringify(get_settings))
    new_get_product_data_settings.headers = {"Authorization": "Bearer " + result['access_token'], "Content-Type": "application/x-www-form-urlencoded"};
    new_get_product_data_settings.data = data;
    new_get_product_data_settings.url = CLIENTAPI + 'api/plugin/' + action
    return new_get_product_data_settings;
}

// GEt product data request. If fail will refresh token and retry request.
do_get_product_data = (request, senderTabId, get_settings, action) => {
    chrome.storage.local.get(['access_token'], function(result) {
        result['access_token'];

        $.ajax(setGetDataHeaders(get_settings, result, request.obj, action))
            .done(function (response) {
                let page_type = action === 'getProductData'? 'product_page': 'list_page'
                chrome.tabs.sendMessage(senderTabId,{message: 'productData', 'data': response.Data, page_type: page_type });
            })
            .fail(function (xhr, error, errorThrown) {
                do_refresh_token(senderTabId, ()=>{
                    chrome.storage.local.get(['access_token'], function(result) {
                        $.ajax(setGetDataHeaders(get_settings, result, request.obj, action))
                            .done(function (response) {
                                chrome.tabs.sendMessage(senderTabId,{message: 'productData', 'data': response.Data });
                            })
                            .fail(function (xhr, error, errorThrown) {
                                chrome.tabs.sendMessage(senderTabId,{message: 'login_status', isLogin: false });
                            })
                    })
                });
            })
    })
}