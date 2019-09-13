
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
    return Number(qty_btc).toFixed(4) + "BTC"
}

exports.fullBTC = function (qty_btc) {
    return Number(qty_btc).toFixed(8) + "BTC"
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
    return Math.trunc(num).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1 ') + ' SUM'
}

exports.shortSUM = function (num) {
    return (Math.round(num/1000)).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1 ') + 'k SUM'
}


exports.createInvoice = function(qty_sum, contract_id) {
    // let token = process.env.mode == "PRODUCTION" ? data.provider_token : data.provider_token_dev
    return {
        provider_token: data.provider_token_live,
        start_parameter: contract_id,
        title: 'Биткоин (BTC)',
        description: 'Первая и самая популярная крипто валюта (крипто актив)',
        currency: 'UZS',
        is_flexible: false,
        // need_shipping_address: false,
        prices: [{label: 'Биткоин (BTC)', amount: Math.trunc(qty_sum * 100) }],
        payload: {contract_id},
        photo_url: "https://cdn.paycom.uz/merchants/8b46bb4b52e4e8e7f396ad673165f66ca85ad5e2.png",
        provider_data: {},
        need_phone_number: true,
        need_email: true,
        need_shipping_address: true,
        send_phone_number_to_provider: true,
        send_email_to_provider: true,
        disable_notification: false,
        photo_width: 640,
        photo_height: 640
    }
}

exports.main_menu_keyboard = function () {
    return Markup.keyboard(["👍 Купить ₿ Биткоин (BTC)", "📒 Балансы счетов"]).oneTime().resize().extra();
}
