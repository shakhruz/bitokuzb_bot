const Web3 = require('web3');
const data = require('./data')
const db = require('./db.js')

const EthereumTx = require('ethereumjs-tx').Transaction
const log = require('ololog').configure({ time: true })
const ansi = require('ansicolor').nice

const apiKey = '556d9e89ad8243d8b9547209537f5cef';
const web3 = new Web3(new Web3.providers.HttpProvider(
  `https://ethereum.api.nodesmith.io/v1/mainnet/jsonrpc?apiKey=${apiKey}`
));

const web3_ws = new Web3(new Web3.providers.WebsocketProvider(
    `wss://ethereum.api.nodesmith.io/v1/mainnet/jsonrpc/ws?apiKey=${apiKey}`
));

// log(`ETH:`.cyan)

exports.checkWallet = function (user_id, callback) {
    db.getWallet(user_id, "ETH", (result)=>{
        if (result!=null) {
            console.log("ETH wallet found: ", result)
            callback(result)
        } else {
            const eth_wallet = web3_ws.eth.accounts.create();
            console.log("ETH wallet: ", eth_wallet)
            db.addWallet("ETH", user_id, eth_wallet.address, eth_wallet.address, eth_wallet.privateKey, '', (result)=> {
                if (result) {
                    const message = `Открыл новый ETH кошелек с адресом для пополнения:\n${eth_wallet.address}`
                    console.log(message)
                    callback(result)
                } else {
                    const message = "Произошла ошибка при открытии ETH кошелька"
                    console.log(message)
                    callback(null)
                }
            })    
        }
    })
}

exports.addETHWallet = function (user_id, callback) {
    const eth_wallet = web3_ws.eth.accounts.create();
    console.log("ETH wallet: ", eth_wallet)
    db.addWallet("ETH", user_id, eth_wallet.address, eth_wallet.address, eth_wallet.privateKey, '', (result)=> {
        if (result) {
            const message = `Открыл новый ETH кошелек с адресом: ${eth_wallet.address}`
            console.log(message)
            callback(message)
        } else {
            const message = "Произошла ошибка при открытии ETH кошелька"
            console.log(message)
            callback(message)
        }
    })    
}

exports.generateWallet = function() {
    const account = web3_ws.eth.accounts.create();
    return account
}

exports.getBalance = function (address, callback) {
    web3_ws.eth.getBalance(address).then((result)=>{
        const balance = web3_ws.utils.fromWei(result, 'ether')
        // console.log("eth balance: " + balance + " ETH")
        callback(balance)
    });
}

exports.sendToReserve = function(user_id, amount_eth, callback) {
    db.getWallet(user_id, "ETH", (wallet)=>{
        if (wallet!=null) {
            const value_wei = web3_ws.utils.toWei(amount_eth, 'ether')
            console.log(`sending ${value_wei} from ${wallet.address} to ${data.ethAddress}`)
            sendTransaction(data.ethAddress, value_wei, wallet.privateKey, callback)
        }
    });
}

exports.getFromReserve = function(user_id, amount_eth, callback) {
    db.getWallet(user_id, "ETH", (wallet)=>{
        if (wallet!=null) {
            const value_wei = web3_ws.utils.toWei(amount_eth, 'ether')
            console.log(`sending ${value_wei} from ${data.ethAddress} to ${wallet.address}`);
            const to = wallet.address
            sendTransaction(to, value_wei, data.ethWalletPrivKey, callback)
        }
    });
}

function sendTransaction(to, value_wei, privateKey, callback) {
    (async() => {
        web3.eth.getTransactionCount(data.ethAddress).then((nonce)=> {
            console.log(`The outgoing transaction count for your wallet address is: ${nonce}`);

            getCurrentGasPrices().then((gasPrices)=>{
                console.log("gas prices: ", gasPrices)
                let details = {
                    "to": to,
                    "value": web3.utils.toHex(value_wei), //web3.toHex( web3.toWei(amountToSend, 'ether') ),
                    // "gas": 21000,
                    // "gasPrice": gasPrices.high * 1000000000, // converts the gwei price to wei
                    "nonce": nonce,
                    gasPrice: 20000000000,
                    gasLimit: 21000,
                    "chainId": 1 // EIP 155 chainId - mainnet: 1, rinkeby: 4
                  }
  
                  const transaction = new EthereumTx(details)
                  transaction.sign( Buffer.from(privateKey, 'hex') )
                  const serializedTransaction = transaction.serialize()

                //   const feeCost = transaction.getUpfrontCost()
                //   console.log('Total Amount of wei needed:' + feeCost.toString())
                                          
                  web3.eth.sendSignedTransaction('0x' + serializedTransaction.toString('hex'))
                  .on('transactionHash', function(hash){
                    console.log("tx hash: ", hash)
                    callback(true, `Транзакция отправлена: ${hash}`)
                  })
                  .on('receipt', function(receipt){
                    console.log("tx receipt: ", receipt)
                    callback(true, `Транзакция принята: ${receipt}`)
                  })
                  .on('confirmation', function(confirmationNumber, receipt) {
                    console.log("tx confirmation: ", confirmationNumber, receipt)
                    callback(true, `Транзакция подтверждена, номер подтверждения: ${confirmationNumber}`)
                  })
                  .on('error', (error) => {
                    console.log("ETH sending error:", error)
                    callback(false, `Ошибка при проведении транзакции: ${error}`)
                  });   
            });
        })
    })();
}

const axios = require('axios')

const getCurrentGasPrices = async () => {
    let response = await axios.get('https://ethgasstation.info/json/ethgasAPI.json')
    let prices = {
      low: response.data.safeLow / 10,
      medium: response.data.average / 10,
      high: response.data.fast / 10
    }
   
    // console.log (`Current ETH Gas Prices (in GWEI):`)
    // console.log(`Low: ${prices.low} (transaction completes in < 30 minutes)`)
    // console.log(`Standard: ${prices.medium} (transaction completes in < 5 minutes)`)
    // console.log(`Fast: ${prices.high} (transaction completes in < 2 minutes)`)
   
    return prices
}

console.log("gas prices: ", getCurrentGasPrices());

// web3_ws.eth.getBlock('latest', false).then((block) => {
//     console.log(`The latest block number was ${block.number}. It contained ${block.transactions.length} transactions.`);
// });

// web3_ws.eth.getGasPrice().then((result) => {console.log("gas price: ", result)});

// const account = web3_ws.eth.accounts.privateKeyToAccount(data.ethWalletPrivKey);
// const account = web3.eth.accounts.create();

// console.log("account: ", account)

// web3_ws.eth.getBalance(data.ethAddress).then((result)=>{console.log("eth balance: ",  web3_ws.utils.fromWei(result, 'ether'), "ETH")});

// const wallet = web3_ws.eth.accounts.wallet;
// web3_ws.eth.accounts.wallet.add(account);
// console.log("eth wallet: ", wallet);

// web3.eth.sendTransaction({from: '0x123...', data: '0x432...'})
// .once('transactionHash', function(hash){ ... })
// .once('receipt', function(receipt){ ... })
// .on('confirmation', function(confNumber, receipt){ ... })
// .on('error', function(error){ ... })
// .then(function(receipt){
//     // will be fired once the receipt is mined
// });

// const socket = new WebSocket('wss://ethereum.api.nodesmith.io/v1/mainnet/jsonrpc/ws?apiKey=697d2ee1a65443f1b0c04002548740f7');
// socket.onopen = () => {
//   console.log('Websocket connection opened')
//   socket.send('{"jsonrpc": "2.0", "id": "42", "method": "eth_subscribe", "params": ["newHeads"]}')
// }

// socket.onmessage = (msg) => { console.log('New Message Received'); console.log(JSON.parse(msg.data)); }

// var subscription = web3_ws.eth.subscribe('logs', {
//     address: data.ethAddress
//     // topics: [data.ethAddress]
// }, function(error, result) {
//     if (error) console.error("subs error", error)
//     else console.log("subs result: ", result);
// })
// .on("data", function(log){
//     console.log("eth data: ", log);
// })
// .on("changed", function(log){
//     console.log("changed: ", log)
// });

// unsubscribes the subscription
// subscription.unsubscribe(function(error, success){
//     if(success)
//         console.log('Successfully unsubscribed!');
// });

// var subscription2 = web3_ws.eth.subscribe('pendingTransactions', function(error, result){
//     if (error) console.error(error)
//     console.log("pending: ", result);
// })
// .on("data", function(transaction){
//     console.log("pending data: ", transaction);
// })

// using the event emitter
// web3.eth.sendTransaction({
//     from: data.ethAddress,
//     to: '0x59881B66757B0C6c3dB46e06e97Fe77602da3Ea5',
//     value: '1000000000000000'
// })
// .on('transactionHash', function(hash){
//     console.log("tx hash: ", hash)
// })
// .on('receipt', function(receipt){
//     console.log("tx receipt: ", receipt)
// })
// .on('confirmation', function(confirmationNumber, receipt) {
//     console.log("tx confirmation: ", confirmationNumber, receipt)
// })
// .on('error', console.error); 

// var BN = web3_ws.utils.BN;
// var number = new BN('1234').add(new BN('1')).toString();
// web3_ws.utils.isBN(number);
// web3_ws.utils.isAddress('0xc1912fee45d61c87cc5ea59dae31190fffff232d');
// web3_ws.utils.toBN(1234).toString();
// web3_ws.utils.toBN('1234').add(web3_ws.utils.toBN('1')).toString();
// web3_ws.utils.toWei('1', 'ether');
// web3_ws.utils.fromWei('1', 'ether');

// var lightwallet = require('eth-lighwallet')
// var txutils = lightwallet.txutils
// var signing = lightwallet.signing
// var encryption = lightwallet.encryption

// var seed = 'unhappy nerve cancel reject october fix vital pulse cash behind curious bicycle'
// var nonce = 2

// lightwallet.keystore.deriveKeyFromPassword('mypassword', function(err, pwDerivedKey) {

//     var keystore = new lightwallet.keystore(seed, pwDerivedKey)
//     keystore.generateNewAddress(pwDerivedKey)
    
//     var sendingAddr = keystore.getAddresses()[0]

//     console.log("HD address: ", sendingAddr)
    
//     // The transaction data follows the format of ethereumjs-tx
//     txOptions = {
//         gasPrice: 10000000000000,
//         gasLimit: 3000000,
//         value: 10000000,
//         nonce: nonce,
//         data: undefined
//     }
    
//     // sendingAddr is needed to compute the contract address
//     // var contractData = txutils.createContractTx(sendingAddr, txOptions)
//     // var signedTx = signing.signTx(keystore, pwDerivedKey, contractData.tx, sendingAddr)
    
//     // console.log('Signed Contract creation TX: ' + signedTx)
//     // console.log('')
//     // console.log('Contract Address: ' + contractData.addr)
//     // console.log('')
    
//     // // TX to register the key 123
//     // txOptions.to = contractData.addr
//     // txOptions.nonce += 1
//     // var registerTx = txutils.functionTx(abi, 'register', [123], txOptions)
//     // var signedRegisterTx = signing.signTx(keystore, pwDerivedKey, registerTx, sendingAddr)
    
//     // // inject signedRegisterTx into the network...
//     // console.log('Signed register key TX: ' + signedRegisterTx)
//     // console.log('')
    
//     // // TX to set the value corresponding to key 123 to 456
//     // txOptions.nonce += 1
//     // var setValueTx = txutils.functionTx(abi, 'setValue', [123, 456], txOptions)
//     // var signedSetValueTx = signing.signTx(keystore, pwDerivedKey, setValueTx, sendingAddr)
    
//     // // inject signedSetValueTx into the network...
//     // console.log('Signed setValueTx: ' + signedSetValueTx)
//     // console.log('')
    
//     // // Send a value transaction
//     // txOptions.nonce += 1
//     // txOptions.value = 1500000000000000000
//     // txOptions.data = undefined
//     // txOptions.to = 'eba8cdda5058cd20acbe5d1af35a71cfc442450e'
//     // var valueTx = txutils.valueTx(txOptions)
    
//     // var signedValueTx = signing.signTx(keystore, pwDerivedKey, valueTx, sendingAddr)
//     // console.log('Signed value TX: ' + signedValueTx)
//     // console.log('')
    
// })
