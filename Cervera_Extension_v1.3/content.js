//Messages listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('MESSAGE RECEIVEDdddd', request);

    // Create/Show popup
    if (request.message === 'toggle_popup') {
        create_popup();
    }

    // Login status
    if (request.message === 'login_status') {
        if (request.isLogin === false) {
            create_popup();
            show_login_form(true);

        } else if (request.isLogin === 'failed') {
            show_login_form('failed');

        } else if (request.isLogin === true) {
            // Price deviation
            refreshProductListPagesContent();

            //Product page
            if (request.showPopup === true) {
                if ($('#pricesGrid').length === 0) {
                    $('#popupContent').empty().append(waitImage);
                    refreshPopupContent(isProductPage());
                }
            }else{
                $('#pricePopup').hide();
            }
        };
    }

    //Product data
    if (request.message === 'productData' && request.page_type === 'product_page') {
        load_table(request);
    }

    //Products deviation
    if (request.message === 'productData' && request.page_type === 'list_page') {
        highlight_product_boxes(request);
        $('#pricePopup').remove();
    }
})

//Check login
$('document').ready(function() {
    if(typeof isProductPage() === 'undefined' || isProductPage() === false){
        chrome.runtime.sendMessage({ message: "check_login" });
    }
});

//Click on login
$(document.body).on('click', '#login', function() {

    let user_name = $('#user_name').val();
    let user_password = $('#user_password').val();

    if (user_name.length === 0) { $('#user_name').addClass('input-error'); } else { $('#user_name').removeClass('input-error'); }

    if (user_password.length === 0) { $('#user_password').addClass('input-error'); } else { $('#user_password').removeClass('input-error'); }

    if (user_name.length !== 0 && user_password.length !== 0) {
        show_login_form('wait');
        chrome.runtime.sendMessage({ message: 'login', credentials: { username: user_name, password: user_password } })
    }
})

$(document.body).on('click', '#closePopup', function() {
    $('#pricePopup').hide();
});

// Logout
$(document.body).on('click', '#logoutIcon', function() {
    chrome.runtime.sendMessage({ message: 'logout'})
});

$(document).click(function(event) {
    $target = $(event.target);
    if (!$target.closest('#pricePopup').length) {
        $('#pricePopup').hide();
    }
});