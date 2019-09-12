const fetch = require('node-fetch')
// const api_url = 'https://explorer-api.testnet.minter.network/api/'
const api_url = 'https://explorer-api.apps.minter.network/api/'
const db = require('./db.js')
const data = require('./data')

minterWallet = require('minterjs-wallet') 
const minterLib = require('minter-js-sdk')

const wallet_reserve = minterWallet.walletFromMnemonic(data.BIPReserveMnemonic)
// const wallet_reserve = minterWallet.walletFromPrivateKey(Buffer.from('..', 'hex'))
// console.log("priv key: ", wallet_reserve.getPrivateKeyString())

exports.checkWallet = function (user_id, callback) {
    db.getWallet(user_id, "BIP", (wallet)=>{
        if (wallet!=null) {
            callback(wallet)
        } else {
            this.addBIPWallet(user_id, (message, wallet)=> {
                callback(wallet)
            })
        }
    })    
}

exports.addBIPWallet = function (user_id, callback) {
    console.log("генерируем кошелек BIP:")
    const wallet = minterWallet.generateWallet()
    let address = wallet.getAddressString()
    let pub_key = wallet.getPublicKeyString()
    let priv_key = wallet.getPrivateKeyString()
    let mnemonic = wallet.getMnemonic()
    db.addWallet("BIP", user_id, pub_key, address, priv_key, mnemonic, (result)=> {
        if (result) {
            console.log(`Открыл новый BIP кошелек с адресом:\n${address}`)
            callback(`Открыл новый BIP кошелек с адресом для пополнения:\n${address}`, result)
        } else {
            console.log("Произошла ошибка при открытии BIP кошелька")
            callback(`Произошла ошибка при открытии BIP кошелька`, result)
        }
    })    
}

exports.waitForPayment = function (address, pub_key, callback, userId) {
    console.log("waiting for a payment on address " + address + " pub_key " + pub_key + " userId: " + userId)
    
    let tries = 60 * 60
    let interval = setInterval(()=> {
        
        console.log("checking trxs on address " + address + " pub_key " + pub_key)
        fetch(`${api_url}v1/addresses/${address}/transactions`)
        .then(res => res.json())
        .then(json => {
            data = json.data
            if (data.length >0 ) {
                console.log("есть транзакции: ", data.length)
                for(let trx of data) {
                    console.log(`совпало: ${trx.data.value} ${trx.data.coin} fee: ${trx.fee} from: ${trx.from}  to ${trx.data.to}`)
                    clearInterval(interval)
                    callback(trx, userId)
                }
            }
        })
    
        tries -= 1
        if (tries < 1) cancelInterval(interval)
    }, 1000)
}

exports.getBalances = function (address, callback) {
    console.log("get balance for address " + address)  
    fetch(`${api_url}v1/addresses/${address}`)
    .then(res => res.json())
    .then(json => {
        if (json.data && json.data.balances) {
            callback(json.data.balances)    
        }
    })    
}

exports.getBIPBalance = function(address, callback) {
    console.log("get BIP balance for " + address)
    this.getBalances(address, (balances) => {
        let bipBalance = 0
        if (balances.length > 0) {
            for(let b of balances) {
                if (b.coin == "BIP") bipBalance = Number(b.amount)
            }
            callback(bipBalance)    
        }
    })
}

exports.getMinterMarketData = function (callback) {
    // console.log("get minter market data")  
    fetch(`${api_url}v1/status`)
    .then(res => res.json())
    .then(json => {
        console.log("market data: ", json)
        if (json.data) {
            let market = {bipPriceBtc: json.data.bipPriceBtc, 
                          bipPriceUsd: json.data.bipPriceUsd, 
                          bipPriceChange: json.data.bipPriceChange, 
                          marketCap: json.data.marketCap} 
            callback(market)    
        }
    })      
}

exports.sendBIP = function (to, value, privateKey) {
    let amount = Number(value)
    console.log("send " + amount + "BIP " +" to " + to)
    // const minterSDK = new Minter({apiType: 'node', baseURL: 'https://minter-node-1.testnet.minter.network'});
    const minterSDK = new minterLib.Minter({apiType: 'gate', baseURL: 'https://gate-api.minter.network'});
    const txParams = new minterLib.SendTxParams({
        privateKey: privateKey,
        nonce: 1,
        chainId: 1,
        address: to,
        amount: amount,
        coinSymbol: 'BIP',
        feeCoinSymbol: 'BIP',
        gasPrice: 1,
        message: 'send to reserves'
    })

    // console.log("tx params: ", txParams)
    
    minterSDK.postTx(txParams)
        .then((txHash) => {
            console.log(`Completed sending ${amount} to ${to}. Tx hash: ${txHash}`);
        }).catch((error) => {
            // const errorMessage = error.response.data.error.log;
            // console.log(errorMessage);
            console.log("error: ", error.response.data.error)
        })    
}

exports.sendToReserve = function (user_id, to, value, callback) {
    db.getWallet(user_id, "BIP", (wallet)=>{
        if (wallet!=null) {
            sendBIP(wallet.private_key, to, value, callback)
        } else {
            console.log("wallet not found...")
        }
    })
}

function sendBIP(privateKey, to, value, callback) {
    let amount = Number(value)
    console.log("send " + amount + "BIP " +" to " + to)
    // const minterSDK = new Minter({apiType: 'node', baseURL: 'https://minter-node-1.testnet.minter.network'});
    const minterSDK = new minterLib.Minter({apiType: 'gate', baseURL: 'https://gate-api.minter.network'});
    const txParams = new minterLib.SendTxParams({
        privateKey: privateKey,
        chainId: 1,
        address: to,
        amount: amount,
        coinSymbol: 'BIP',
        feeCoinSymbol: 'BIP',
        gasPrice: 1
    })
    
    minterSDK.postTx(txParams)
        .then((txHash) => {
            const message = `Завершил отправку ${amount} BIP на ${to}. Транзакция: ${txHash}`
            console.log(message)
            callback(true, message)
        }).catch((error) => {
            const errMessage = `Ошибка при отправке BIP: ${error.response.data.error}`;
            console.log(errMessage)
            callback(false, errMessage)
        })
}

exports.getFromReserve = function (user_id, value, callback) {
    db.getWallet(user_id, "BIP", (wallet)=>{
        if (wallet!=null) {
            sendBIP(wallet_reserve.getPrivateKeyString(), wallet.address, value, callback)
        } else {
            console.log("wallet not found...")
        }
    })
}