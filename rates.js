const minterSDK = require('./minter.js')
const cmc = require('./cmc.js')
const utils = require('./utils.js')

// RATES
let rates, minterMarket;
let uzs_rate;
let sum_usd_rate;

function updateUZSRate() {
    fetch(`https://nbu.uz/exchange-rates/json/`)
    .then(res => res.json())
    .then(json => {
        // console.log("uzs rates: ", json)
        uzs_rate = json
        for(let i=0; i < uzs_rate.length; i++) {
            if (uzs_rate[i].code == "USD") {
                console.log("USD: ", uzs_rate[i])
                sum_usd_rate = uzs_rate[i]
                break;
            }
        }
        // console.log("sum/usd rate: ", sum_usd_rate)
        console.log("курс сума продажа: ", sum_usd_rate.nbu_cell_price)
        console.log("курс сума покупка: ", sum_usd_rate.nbu_buy_price)
        console.log("курс цб: ", sum_usd_rate.cb_price)        
    })
}

updateUZSRate()

// Обновляем курсы валют
function updateRates() {
    minterSDK.getMinterMarketData((newMarket) => {
        minterMarket = newMarket;
        cmc.getRates((newRates)=>{
            rates = newRates;
            // console.log("minter market data: ", newMarket)
            console.log(`\n*Текущие курсы:*\nBIP: *${utils.longUSD(minterMarket.bipPriceUsd)}*\nBTC: *${utils.shortUSD(rates.BTC)}*\nETH: *${utils.fullUSD(rates.ETH)}*`)
        })
    })        
}

updateRates()

function crypto() {
    return rates
}

function minter() {
    return minterMarket
}

function sum() {
    return sum_usd_rate
}

function sum_buy_price() {
    return sum_usd_rate.nbu_cell_price
}

// setInterval(()=>{
//     updateUZSRate()
//     updateRates()
// }, 60*24*1000)

module.exports = {
    sum, crypto, minter, updateRates, updateUZSRate, sum_buy_price
}