// ############################# Main functions ########################
// ######################################################################
let error_content = '<div class="popup-center-message"><div class="vertical-content flex-center"><img src="' + chrome.extension.getURL('images/icecream-error.png') + '" class="error-img"><div class="text-centered">Something went wrong! We don\'t have informations about this product. Try to reload the page or pick a different product.</div></div></div>'
let info_content = '<div class="popup-center-message"><div class="vertical-content flex-center"><img src="' + chrome.extension.getURL('images/report-icon-4.png') + '" class="error-img"><div class="text-centered width-80">The extension popup is tracking product pages. When you open a product page, you will see the competitor prices here.</div></div></div>'

let isProductPage = () => {
    for(var i of obj){
        if (i['domain'] == window.location.host || window.location.host.indexOf(i['domain']) > 0 ){
            let regexp = new RegExp(i.productPageUrlRegex);
            if (typeof i.productPageUrlRegex !== 'undefined'){
                return (regexp.test(window.location.href) ? true : false)
            }else{
                return undefined;
            }
        }
    }
}

let refreshPopupContent = (isProductPage) =>{
    if(typeof isProductPage === 'undefined' || isProductPage === true){
        for(var i of obj){
            if (i['domain'] == window.location.host || window.location.host.indexOf(i['domain']) > 0 ){
                var selector = '';
                var replace = '';
                
                1// A. Match by Url
                
                for (var z of i['selector']['popupSelector']){
                    if ($(z['sel']).length > 0){
                        selector = z['sel'];
                        var attr = z['attr'];
                        replace = z['replace']
                        if ($(selector).attr(attr) != null){
                            if ($(selector).attr(attr).replace(replace, '') != ''){
                                break;
                            }
                        }              
                    }   
                }
                if ($(selector).length > 0){
                    if(attr == 'text'){
                        productId = $(selector).text()
                    }else{
                        productId = $(selector).attr(attr);
                    }
                    
                    if (replace != ''){
                        productId = productId.replace(replace, '').trim();
                    }         
        
                    type = i['type'];
                    competitor = i['competitor'].split(',')[0]
                    
                    if (typeof productId !== 'undefined'){
                        productId = encodeURIComponent(productId)
                        let obj = {
                            productId: productId,
                            type: type,
                            competitor: competitor
    
                        }
                        chrome.runtime.sendMessage(
                            {message: 'get_product_data', obj: obj}
                        )
                        console.log('Product id', productId);
                    }else{
                        $('#loadingData').remove();
                        $('#popupContent').empty().append(error_content)           
                    }  
                }else{
                    $('#loadingData').remove();
                    $('#popupContent').empty().append(error_content);       
                }
            }
        }
    }else{
        $('#loadingData').remove();
        $('#popupContent').empty().append(info_content); 
    }
    
}


// A. Set selectors from obj: 
        // - selector used for id extraction - productsListSelector + attribute to extract + replaceStr (if needed)
        // - selector of highlight element - highlightElement (different for grid or list layout)
                        
        var productsListSelector = '';
        var attrStr = '';
        var replaceStr = '';
        var parentBoxSelector = '';
        var highlightElement = '';
        var splitKey = 0;   
        var target = '';     
        var listWrapper = '';
        var idsStr = '';

var collect_ids = function(i){
    // A.2 Function that will:
            // a - get all selectors
            // b - check if id selector is on the page
            // c - get all ids into idsStr
            // d - send message to background with ids list 

    // A.2.a - get all selectors
    var newIdsStr = ''
    for (var t of i['selector']['productPageSelector']){
        if ($(t['sel']).length > 0){
            productsListSelector = t['sel'] + ':not(.item-checked)';
            attrStr = t['attr'];
            replaceStr = t['replace'];
            parentBoxSelector = t['parentBoxSelector']
            splitKey = t['splitKey'];
            target = t['target']
            listWrapper = t['listWrapper'];
            dinamicPage = t['dinamicPage']       

            if(t['highlightElement'] == ''){
                if ($(t['layoutSelectors']['gridLayoutParent']).length){
                    highlightElement = t['layoutSelectors']['gridHighlightEl'];
                }else if ($(t['layoutSelectors']['listLayoutParent']).length){
                    highlightElement = t['layoutSelectors']['listHighlightEl'];
                }
            }else{
                highlightElement = t['highlightElement']
            }

            break;
        }
    }

    // A.2.b.
    // Check productsListSelector array to see if location is on a product list page
    // If selector exists on page => location on product lists pages
    
    if ($(productsListSelector).length ){
        // A.2.c - get all ids into idsStr    
        if (target != 'productImage'){
            $(productsListSelector).each(function(){
                if(attrStr != 'text'){
                    if($(this).attr(attrStr) != null){
                        newIdsStr += $(this).attr(attrStr).replace(replaceStr, '') + ',';
                        // idsStr += $(this).attr(attrStr).replace(replaceStr, '') + ',';
                        
                    }
                }else if(attrStr == 'text'){
                    newIdsStr += $(this).text().replace(replaceStr, '') + ',';
                }
            });
        }else{
            
        // Check if custom function is defined
        if (typeof custom_getSelectors === "function")
            newIdsStr = custom_getSelectors(newIdsStr);
        }
    
        // A.2.d 
        // ############ Messaging to background
        
        if (newIdsStr !== '' && newIdsStr !== idsStr){
            console.log('DOM has changed. Send message with newIdsStr:', newIdsStr);
            let obj = {
                type: typeStr,
                competitor: competitorName,
                productIdsList: newIdsStr
            }
            chrome.runtime.sendMessage(
                {message: 'get_products_deviation_data', obj: obj}
            )
            idsStr = newIdsStr;
        }
    }
}

let refreshProductListPagesContent = () => {
    for(var i of obj){
        if (i['domain'] == window.location.host || window.location.host.indexOf(i['domain']) > 0 ){
        
            timeout = i['timeout']
            dinamicPage = i['isListPageDynamic'];
            competitorName = i['competitor']
            typeStr = i['type'];
        
            // A.1 If needed, set timeout (for the pages that loads scripts like yeppon, onlinestore)
            setTimeout(function(){
                 collect_ids(i);
        
                        // B. - Get back the message from collect_ids
                                // - if data
                                //     - Hightlight elements that have data
                                // - else
                                //     - add popup for login
                
                        
                        // C. Listen page change for the pages that have dinamicPage = true
                        if (dinamicPage){
                            setInterval(function(){
                                collect_ids(i);
                            }, 1000);
                        }
                        
            }, timeout);
                     
            break
        }
    }
    
}

// ############################ Helpers ################################
// ######################################################################


let loadingStr = '<div id="loading" class="uiLoading uiLoading-grow "><div class="uiLoadingDot dot-1 loading-blue"></div><div class="uiLoadingDot dot-2 loading-blue"></div><div class="uiLoadingDot dot-3 loading-blue"></div></div>';

let errorStr = ' <div class="login-error"><div>This doesn\'t look right!</div><div>Check your credentials.</div></div>'

let waitImage = '<div class="popup-center-message vertical-content" id="loadingData">'+loadingStr+'</div>'

let logoutImg = '<span id="logoutIcon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M 11 3 C 6.038 3 2 7.038 2 12 C 2 16.962 6.038 21 11 21 C 14.111 21 16.85375 19.407 18.46875 17 L 15.875 17 C 14.614 18.231 12.897 19 11 19 C 7.14 19 4 15.86 4 12 C 4 8.14 7.14 5 11 5 C 12.897 5 14.614 5.769 15.875 7 L 18.46875 7 C 16.85375 4.593 14.111 3 11 3 z M 17 8 L 17 11 L 9 11 L 9 13 L 17 13 L 17 16 L 22 12 L 17 8 z"/></svg></span>'

let login_form = '<div id="privateLoginForm" class="login-form"><div class="login-form-box"><div id="loginForm" class="popup-center-message vertical-content"><div class="login-rowm-bottom-4"><img src="http://priceedge.eu/static/img/logo-priceedge.png" class="mb-3" alt="PriceEdgelogo" /></div><div class="login-row m-bottom-4">Login to your<span class="bold-text">PriceEdge™</span>Chrome Extension</div><div class="login-row flex-column"><div class="input-label">Username</div><input name="user_name" id="user_name" type="text"/></div><div class="login-row flex-column"><div class="input-label">Password</div><input autocomplete="new-password" name="user_password" id="user_password" type="password"/></div>' + loadingStr + '<div class="login-row flex-column"><button id="login" class="private-red-button full-width-button m-top-6">LOGIN</button>' + errorStr + '</div></div></div></div>'

let show_login_form = (par)=>{
    
    if($('#privateLoginForm').length === 0){
        $('#popupContent').empty().append(login_form)
    }

    if(par === 'wait'){
        $('#login').hide();
        $('.uiLoading').addClass('flex');//.show();
        $('.login-error').hide().removeClass('flex-column');
    }else if(par === 'failed'){
        consle.log('FAILED');
        $('#login').show();
        $('.uiLoading').removeClass('flex');//.show();
        $('.login-error').addClass('flex-column');//.show()
    }

    $('#pricePopup').show();
}

let create_popup = () =>{
    if ($('#pricePopup').length === 0){
        $('body').append('<div id="pricePopup" class="private-popup"><div class="private-actions-row private-actions-row">'+logoutImg+'<span id="closePopup" class="close-popup"></span></div><div id="popupContent"></div></div>');
        $(function(){
            $( "#pricePopup").draggable({
                containment: "html",
                handle: '.private-actions-row'
            });
        })
    }else{
        $('#pricePopup').toggle();
    }
            
}






  
