const CoinMarketCap = require('coinmarketcap-api')
const data = require('./data')

const client = new CoinMarketCap(data.cmcKey)

exports.getRates = function (callback) {
    client.getQuotes({symbol: ['BTC', 'ETH']}).then((quote) => {
        console.log("BTC price: ", quote.data.BTC.quote.USD.price)
        console.log("ETH price: ", quote.data.ETH.quote.USD.price)
        const result = {
            BTC: quote.data.BTC.quote.USD.price,
            ETH: quote.data.ETH.quote.USD.price
        }
        callback(result)
    }).catch(console.error)    
}
