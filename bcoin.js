global.fetch = require("node-fetch");

const {NodeClient, WalletClient} = require('bclient')
const {Network} = require('bcoin')
const network = Network.get('main')
const data = require('./data')

const bestFee = require('bitcoin-best-fee')

const clientOptions = {
  network: network.type,
  port: network.rpcPort,
  apiKey: '88d5ba16657ef8d18009f641ad745e2bd9b4dba3253d6e7d202c4a2db44a3eb6'
}

const walletOptions = {
    network: network.type,
    port: network.walletPort,
    apiKey: '88d5ba16657ef8d18009f641ad745e2bd9b4dba3253d6e7d202c4a2db44a3eb6'
}

const options = {
    passphrase: "",
    witness: false,
    watchOnly: false
};
  
const walletClient = new WalletClient(walletOptions)
const client = new NodeClient(clientOptions)

token='17715756779e4a5f7c9b26c48d90a09d276752625430b41b5fcf33cf41aa7615'
const wallet = walletClient.wallet("primary", token);
let reserve_account;
let reserve_name = data.BTCReserveAccountName;
let fees = {high: 20, low: 20, mean: 20}

function getReserveAccount() {
    (async() => {
        let account = await wallet.getAccount(reserve_name)
        if (account) {
            console.log("reserve account: ", account)
        } else {
            account = await wallet.createAccount(reserve_name)
            console.log("created reserve account")
        }
        reserve_account = account
    })();       
}
getReserveAccount()

function getFees() {
    bestFee.fetchHigh().then(fee_high => {fees.high = fee_high; console.log("high fee: ", fee_high)})
    bestFee.fetchLow().then(fee_low => {fees.low = fee_low; console.log("low fee: ", fee_low)})
    bestFee.fetchMean().then(fee_mean => {fees.mean = fee_mean; console.log("mean fee: ", fee_mean)})    
}
getFees()

exports.getFees = function() {
    return fees
}

exports.addBTCWallet = async function (username, callback) {
    const account = await wallet.createAccount(username)
    const message = `Открыл новый BTC кошелек с адресом для пополнения:\n${account.receiveAddress}`
    console.log("created account:", account)
    callback(message)
}

exports.checkWallet = function (username, callback) {
    (async() => {
        const account = await wallet.getAccount(username);
        if (account) {
            // console.log("account for ", username, account)
        } else {
            const account = await wallet.createAccount(username)
            // console.log("created account:", account)
        }    
        callback(account)
    })();       
}

exports.getBalance = async function (account, callback) {
    const resultBalance = await wallet.getBalance(account)
    // console.log("balance for ", account, resultBalance)
    callback(Number(resultBalance.confirmed) / 100000000)
}

// sendBTC(0.0001, "3EeC8riKMp7xAEZh3GAmnAfGQp4pxnBZwD", 4000);

exports.sendBTC = function (account, amount_btc, to, fee_rate) {
    let passphrase = ""
    let rate  = fee_rate
    value_sat = Math.trunc(amount_btc * 100000000)
    console.log("sending " + value_sat + "SAT to " + to + " fee rate: " + rate)

    const txOptions = {
        account: account,
        passphrase: passphrase,
        rate: rate,
        outputs: [{ value: value_sat, address: to }]
    };

    (async () => {
        const result = await wallet.send(txOptions);
        console.log("tx result:", result);
    })();
}

exports.getFromReserve = function (username, amount_btc, callback) {
    bestFee.fetchMean().then((fee) => {
        getAccount(username, (account)=>{
            getBalance(data.BTCReserveAccountName, (balance)=> {
                // console.log("Reserve BTC balance: ", balance)
                if (amount_btc > balance) {
                    const message = `Недостаточно средств для перевода ${amount_btc} с резервного счета`
                    console.log(message)
                    callback(false, message)
                }
                ctx.reply(`Переводим ${amount_btc} BTC | на счет ${account.receiveAddress}`)
                value_sat = Math.trunc(amount_btc * 100000000)
                const to = account.receiveAddress
                const rate = Math.round(fee * 375)
                ctx.reply(`Комиссия за перевод: ${rate}sat`)
                // console.log("sending " + value_sat + "SAT to " + to + " fee rate: " + fee)
                sendTransaction(data.BTCReserveAccountName, value_sat, to, rate, callback)    
            })
        }) 
    })
}

exports.sendToReserve = function (account, amount_btc, callback) {
    bestFee.fetchMean().then((fee) => {
        console.log("mean fee: ", fee)
        value_sat = Math.trunc(amount_btc * 100000000)
        const to = reserve_account.receiveAddress
        const rate = Math.round(fee * 375)
        console.log("sending " + value_sat + "SAT to " + to + " fee rate: " + rate)
        sendTransaction(account, value_sat, to, rate, callback)
    })
}

exports.send = function (account, amount_btc, to, rate, callback) {
    let value_sat = Math.trunc(amount_btc * 100000000)
    console.log("sending " + value_sat + "SAT to " + to + " fee rate: " + rate)
    sendTransaction(account, value_sat, to, rate, callback)
}

function sendTransaction(account, value_sat, to, rate, callback) {
    const txOptions = {
        account: account,
        rate: rate,
        outputs: [{ value: value_sat, address: to }]
    };
    
    (async () => {
        const result = await wallet.send(txOptions);
        console.log("tx result:", result);
        callback(true, result.hash)
    })().catch((err) => {
        console.log(err);
        callback(false, err.stack )
    });
}

// (async() => {
//     // new account

//     // console.log("new account: ", jdAccount)

//     // const result = await wallet.getInfo();
//     // console.log("balance: coin: ", result.balance.coin, " confirmed: ", result.balance.confirmed, " unconfirmed: ", result.balance.unconfirmed)

//     // const result2 = await wallet.getMaster();
//     // console.log("xpriv: ", result2.key.xprivkey)
//     // console.log("mnenomic: ", result2.mnemonic.phrase)

//     // // new address
//     // const result4 = await wallet.createAddress();
//     // const input_address = result4.address
//     // console.log("address: ", input_address);

//     // (async () => {
//     //     await walletClient.open();
//     //     await walletClient.join('*', token);
//     // })();
      
//     // Listen for new transactions
//     // walletClient.bind('tx', (walletID, details) => {
//     //     // console.log('Wallet -- TX Event, Wallet ID:\n', walletID);
//     //     console.log('Wallet -- TX Event, TX Details:\n', details);
//     //     for(let out of details.outputs ) {
//     //         if (out.address == input_address) {
//     //             console.log("входящий платеж на ", (out.value / 100000000), "BTC отправлен")
                
//     //             getBalance((result) => {
//     //                 console.log("balance: ", result);  
//     //             })                
//     //         }
//     //     }
//     // });
    
//     // walletClient.bind('confirmed', (walletID, details) => {
//     //     // console.log('Wallet -- TX Event, Wallet ID:\n', walletID);
//     //     console.log('Confirmed -- TX Event, TX Details:\n', details);
//     //     for(let out of details.outputs ) {
//     //         if (out.address == input_address) {
//     //             console.log("платеж на ", (out.value / 100000000), "BTC подтвержден")
//     //             getBalance((result) => {
//     //                 console.log("balance: ", result);  
//     //             })                
//     //         }
//     //     }
//     // });
      
//     // Leave all wallets
//     // walletClient.leave('<wallet id>');
// })();   



// (async () => {
//   const clientinfo = await client.getInfo();
//   console.log(clientinfo);
// })().catch((err) => {
//     console.error(err.stack);
// });

// const mainToken = '3123228a83d0ebebff23067d54c3ac4c8ac69c97d98c2ab58a6aa511c5ad31c9'
// const mainWalletOptions = {
//     passphrase: "влесуродиласьелочка1112223342",
//     witness: false,
//     watchOnly: false,
//     mnemonic: "orphan usual client business online latin say attack culture pupil flag actual"
// };

// const mainWallet = walletClient.wallet("main", token);
// const result = await walletClient.createWallet("main", mainWalletOptions);
// console.log(result);

// const result3 = await wallet.getKey(address);
// console.log("key: ", result3.address);