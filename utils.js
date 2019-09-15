
data = require('./data.js')
const dotenv = require('dotenv')
dotenv.config()

const Markup = require("telegraf/markup")

exports.ID = function () {
    return Math.random().toString(36).substr(2, 9).toUpperCase()
}

exports.getCommission = function (qty_usd) {
    let comm = 1.0777
    // if (qty_usd>100) comm = 1.03
    // if (qty_usd>1000) comm = 1.03
    return comm
}

exports.convert = function (quantity, rate) {
    let exc_comm = 7.77
    if (quantity < 1000) exc_comm = 3
    if (quantity < 500) exc_comm = 5
    
    let exch_qty_usdt = (quantity / ((100+exc_comm) / 100)).toFixed(2)
    let btc_quantity = Math.round(exch_qty_usdt / rate * 1000000) / 1000000
    return btc_quantity
}
  
exports.convertUSD = function (quantity_btc, rate) {
    let qty_usd = Math.round(quantity_btc * rate * 100) / 100
    return qty_usd
} 

exports.convertCommision = function(comm) {
    return (Math.round(((comm - 1) * 100) * 100) / 100)
}

exports.shortBTC = function (qty_btc) {
    return Number(qty_btc).toFixed(4) + "btc"
}

exports.fullBTC = function (qty_btc) {
    return Number(qty_btc).toFixed(8) + "btc"
}

exports.mBTC = function (qty_btc) {
    return Number(qty_btc*1000).toFixed(4) + "mBTC"
}

exports.shortUSD = function (qty_usd) {
    return '$' + Math.round(Number(qty_usd))
}

exports.fullUSD = function (qty_usd) {
    return '$' + Number(qty_usd).toFixed(2)
}

exports.longUSD = function (qty_usd) {
    return '$' + Number(qty_usd).toFixed(4)
}

exports.fullSUM = function (num) {
    return Math.trunc(num).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1 ') + 'sum'
}

exports.shortSUM = function (num) {
    let result
    if (num > 10000000) {
        result = Math.trunc(num/1000000).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1 ') + 'mln sum'
    } else {
        if (num > 10000) {
            result = Math.round(num/1000).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1 ') + 'k sum'
        } else {
            result = Math.trunc(num).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1 ') + 'sum'
        }
    }
    return result 
    // return (Math.round(num/1000)).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1 ') + 'k sum'
}

exports.shortSAT = function (num) {
    console.log("shortsat: ", num)
    let result
    if (num > 10000000) {
        result = Math.trunc(num/1000000).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1 ') + 'mln sat'
    } else {
        if (num > 100000) {
            result = Math.round(num/1000).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1 ') + 'k sat'
        } else {
            result = Math.trunc(num).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1 ') + 'sat'
        }
    }
    return result 
    // return (Math.round(num/1000)).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1 ') + 'k sat'
    // return (Math.round(num/1000)).toString() + 'k sat'
}


exports.createInvoice = function(qty_sum, qty_btc, contract_id) {
    // let token = process.env.mode == "PRODUCTION" ? data.provider_token : data.provider_token_dev
    return {
        provider_token: data.provider_token_live,
        start_parameter: contract_id,
        title: 'Биткоин (BTC)',
        description: `${this.shortSAT(qty_btc * 100000000)} (${this.fullBTC(qty_btc)})`,
        currency: 'UZS',
        is_flexible: false,
        // need_shipping_address: false,
        prices: [{label: 'Биткоин (BTC)', amount: Math.trunc(qty_sum * 100) }],
        payload: contract_id,
        photo_url: "https://cdn.paycom.uz/merchants/8b46bb4b52e4e8e7f396ad673165f66ca85ad5e2.png",
        provider_data: contract_id,
        need_phone_number: false,
        need_email: false,
        need_shipping_address: false,
        send_phone_number_to_provider: false,
        send_email_to_provider: false,
        disable_notification: false,
        photo_width: 320,
        photo_height: 320
    }
}

exports.main_menu_keyboard = function () {
    return Markup.keyboard(["₿🚀👍🔥 Купить БИТКОИН", "💵🏎️✈️👨‍👧‍👧🌴 Продать БИТКОИН", "👛🏆🔒😎 ОТКРЫТЬ БИТКОИН КОШЕЛЕК", "🆘🤗🍵 Помощь"]).oneTime().resize().extra();
}

exports.qty_btc_min = 0.0001
exports.qty_btc_max = 0.1
exports.qty_sum_min = 10000
exports.qty_sum_max = 10000000
exports.qty_usd_min = 1
exports.qty_usd_max = 1000