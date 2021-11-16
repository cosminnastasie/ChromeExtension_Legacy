const client_id = 'chromeplugin'
const client_secret = 'raspberry'
const CLIENTAPI = 'https://cervera.priceedge.eu/papi/'
const ITEMURL = 'https://cervera.priceedge.eu/v2/item/'
var expirationTime = 8 * 60 * 60 * 1000; /* 8 hours ms */

var obj = [
    { 
        'domain':'www.cervera.se',
        'type':'id',
        'competitor':'cervera',
        'productPageUrlRegex': '/produkt/',
        'isListPageDynamic': true,
        'timeout': 1000,
        'selector':{ 
           'popupSelector':[ 
                { 
                    'sel':'.product__shop .product_id',
                    'attr':'text',
                    'replace':''
                }
            ], 
           'productPageSelector': [
            {
                'target': 'productImage',
                'sel': '.lazy-load-image-background img',
                'attr': 'src',
                'replace': 'https://cervera.cdn.storm.io//',
                'splitKey': 0,
                'parentBoxSelector': '.product-item-wrapper > a',
                'layoutSelectors':{},
                'highlightElement': '.product-item-wrapper > a',
                'dinamicPage': true

            },
            {
                'target': 'productImage',
                'sel': '.product-item-wrapper .list-product__image img',
                'attr': 'src',
                'replace': 'https://cervera.cdn.storm.io//',
                'splitKey': 0,
                'parentBoxSelector': '.list-product__item',
                'layoutSelectors':{},
                'highlightElement': '.product__wrapper',
                'dinamicPage': true

            },
            {
                'target': 'productImage',
                'sel': '.products-inspiration-items__wrapper .list-product__image img',
                'attr': 'src',
                'replace': 'https://cervera.cdn.storm.io//',
                'splitKey': 0,
                'parentBoxSelector': '.list-product__item',
                'layoutSelectors':{},
                'highlightElement': '.product__wrapper',
                'dinamicPage': true

            }
           ]
        }
    },
]

var columnDefs = [
    {   
        headerName: "COMPETITOR", field: "CompetitorName", resizable: true,
        cellRenderer: function(params) {
            if (typeof params.data.Url !== 'undefined'){                                                                        
                var value = params.value.charAt(0).toUpperCase() + params.value.substring(1);
                var competitorName = value
                var info = ''
                if (competitorName.includes('(')){
                    var competitorName = value.split('(')[0]
                    if (competitorName.includes('_')){
                        competitorName = competitorName.replace('_', ' ')
                    }
                    var info = '(' + value.split('(')[1]
                }
                return '<span><a target="_blank" href="' + params.data.Url + '" tooltip="'+ value + '"' + '>' + competitorName + '</a><span class="default-color">' + info + '</span></span>';
            }else{
                return '<span class="default-color">' + params.value + '</span>';
            }
        },
        width:160, suppressSizeToFit: true, headerTooltip: 'Competitor', tooltipValueGetter: (params) => params.value
    },
    {
        headerName: "PRICE", field: "Price", 
        valueFormatter: function(params) {
            return params.value.toFixed(2);
        }, 
        headerTooltip: 'Price', width: 80, suppressSizeToFit: true, tooltipValueGetter: (params) => params.value
    },
    {headerName: "DIFF", field: "Diff", 
        cellStyle: function(params) {
            if (params.value < 0) {
                return {color: '#0091ae !important'};
            } else {
                return {color: '#e7556a !important'};
            }
        },
        valueFormatter: function(params) {
            let sign = ''
            if (params.value > 0 ){sign = '+' }
            return sign + params.value.toFixed(2) + '%';
        }, 
        headerTooltip: 'Diff', width: 73, suppressSizeToFit: true, tooltipValueGetter: (params) => params.value.toFixed(2) + '%'
    },
    {
        headerName: "Shipping Cost", field: "Shipping",
        valueFormatter: function(params) {
            return (typeof params.value !== 'undefined') ? params.value.toFixed(2)  : null;
            
        }, 
        headerTooltip: 'Shipping Cost', width: 75, suppressSizeToFit: true, tooltipValueGetter: (params) => params.value
    },
    {
        headerName: "TOTAL", field: "Total", 
        valueFormatter: function(params) {
            return params.value.toFixed(2);
        }, 
        headerTooltip: 'Total', width: 80, suppressSizeToFit: true, tooltipValueGetter: (params) => params.value
    },
    {
        headerName: "DIFF TOTAL", field: "DiffTotal", 
        cellStyle: function(params) {
            if (params.value < 0) {
                return {color: '#0091ae !important'};
            } else {
                return {color: '#e7556a !important'};
            }
        },
        valueFormatter: function(params) {
            let sign = ''
            if (params.value > 0 ){sign = '+' }
            return sign + params.value.toFixed(2) + '%';
        }, 
        headerTooltip: 'Diff Total', width: 80, suppressSizeToFit: true, tooltipValueGetter: (params) => params.value.toFixed(2) + '%'
    },
    {
        headerName: "Availability", field: "Available",
        cellRenderer: function(params){
            if (params.value == 1){
                return '<span class="icon-oks">&#10003;</span>'
            }else if(params.value == 0){
                return '<span class="icon-cross">&#xd7;</span>'
            }else{
                return '<span></span>'
            }
        }, 
        headerTooltip: 'Availability', width: 50, suppressSizeToFit: true, tooltipValueGetter: (params) => params.value
    }
];

// Product popup

let load_table = (request) => {
    if(request.data.length > 0){
        $('#popupContent').empty().append('<div id="pricesGrid" style="width:600px" class="ag-theme-balham"></div> ' + waitImage);
        let productData = request.data[0];
        //Load header
        load_header_name(productData);

        //Load subheader
        load_subheader(productData);

        //Load ag-grid table
        load_ag_table(productData);

        //Load footer
        load_footer(productData);

        $('#loadingData').remove();
    }else{
        $('#loadingData').remove();
        $('#popupContent').empty().append('<div class="popup-center-message"><div class="vertical-content flex-center"><img src="' + chrome.extension.getURL('images/icecream-error.png') + '" class="error-img"><span class="centered-text">Something went wrong! Try to reload the page or pick another product!</span></div></div>')
    }  
}

load_subheader = (productData) => {
    console.log(productData);          
    var salePrice = ''
    let priceClass = (productData.Sale_Price && productData.Sale_Price != productData.Item_Price) ? 'line-through': ''
    var price = '<span><span class="item-label">PRICE</span><span class="item-value '+priceClass+'">'+parseFloat(productData.Item_Price).toFixed(2)+'</span></span>'
    var salePrice = '<span><span class="item-label">SALE PRICE</span><span class="item-value">'+parseFloat(productData.Sale_Price).toFixed(2)+'</span></span>'

    var shipping = ''
    var totalPrice = ''
    if(productData.Item_ShippingPrice != null){
        shipping = '<span><span class="item-label"> SHIPPING PRICE</span><span class="item-value">'+parseFloat(productData.Item_ShippingPrice).toFixed(2)+'</span></span>'
        totalPrice = '<span><span class="item-label">TOTAL PRICE</span><span class="item-value">'+ (parseFloat(productData.Sale_Price) + parseFloat(productData.Item_ShippingPrice) ).toFixed(2)+'</span></span>'
    }
    let subHeader = '<span class="item-prices-info">' + price + salePrice + shipping + totalPrice + '</span>'   
    
    $('#pricesGrid').before(subHeader);
}

load_ag_table = (productData) => {

    if(productData.competitorsPrices == '' || !productData.competitorsPrices){
        $('#pricesGrid').before('<span class="centered-block">No match for this item!</span>');
    }else{
        let tableData = JSON.parse(productData.competitorsPrices);
        const priceAvg = tableData.reduce((a, {Price}) => a + Price, 0) / tableData.length;
        const diffAvg = tableData.reduce((a, {Diff}) => a + Diff, 0) / tableData.length;
        const shippingAvg = tableData.filter(i =>typeof i.Shipping !== 'undefined').map(i => i.Shipping).reduce(function (avg, value, _, { length }) {
            return avg + value / length;
        }, 0);
        const totalAvg = tableData.reduce((a, {Total}) => a + Total, 0) / tableData.length;
        const diffTotalAvg = tableData.reduce((a, {DiffTotal}) => a + DiffTotal, 0) / tableData.length;

        //Load the table
        

        var gridOptions = {
            defaultColDef: {
                sortable: true
            },
            columnDefs: columnDefs,
            rowData: tableData,
            domLayout:'autoHeight',
            onFirstDataRendered: function(params) {
                params.api.sizeColumnsToFit();
            },
            pinnedBottomRowData: [
                {
                    CompetitorName: "Avg. Price",
                    Price: priceAvg,
                    Diff: diffAvg,
                    Shipping: shippingAvg,
                    Total: totalAvg,
                    DiffTotal: diffTotalAvg,
                    Available: 2,
                    Url: "",}
            ],
            rowHeight: 34,
            animateRows: true
        };
        var gridDiv = document.querySelector('#pricesGrid');
        if(gridDiv){
            new agGrid.Grid(gridDiv, gridOptions);
        }
    }
}

custom_getSelectors = (newIdsStr) => {
    // Cervera
   $(productsListSelector).each(function(){
       var imgSrc = $(this).attr(attrStr)
       var id = imgSrc.split('?')[0].split('/').slice(-1).pop()
       $(this).addClass(id).addClass('ce_selector')
       newIdsStr +=  id + ',';
   })
   return newIdsStr;
}

// Deviation pages

var highlight_product_boxes = (message) => {

    for (var i of message.data){
        //Use selector value as a class set on custom_getSelectors
        let selector = '.' + i.Number;
        var deviation = (parseFloat(i['Deviation'])*100).toFixed(2);
        statusClass = '';
        if (deviation < ranges.min){
            statusClass = 'success-info';
        }else if(deviation > ranges.max){
            statusClass = 'alert-info';
        }else{
            statusClass = 'primary-info';
        }

        $(selector).addClass('item-checked').closest('a').addClass('item-parent-box ' + statusClass).append('<span class="item-info-text"><span class="' + statusClass + '">' + deviation.toString() + ' %</span></span>');
    }
}

//##################### Fixed popup elemnts ##########################

load_footer = (productData) => {
    let footer = '<div class="footer-row"><span class="flex-block columns-row m-bottom-3"><span><span class="item-label">INTERNAL ID:</span><span class="item-value">'+productData.Item_InternalId+'</span></span><span><span class="item-label">MFGR ID:</span><span class="item-value">'+productData.Item_Mpn+'</span></span></span><span class="logo-box"><img src="' + chrome.extension.getURL('images/logo-priceedge.png') + '" class="logo"></span><a href="' + ITEMURL +productData.itemNumber + '" id="goToTimeline" target="blank"><span id="showGraph" class="private-red-button ">SHOW GRAPH</span></a></div>';

    $('#pricesGrid').after(footer);
}

load_header_name = (productData) => {
    let header = '<span class="item-name"><span>' + productData.Item_Name + '</span></span>';
    $('#pricesGrid').before(header);
}


let ranges = {
    min: -2,
    max: 2
}