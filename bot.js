// Telegram bot
console.log("bot.js")

const data = require('./data')
const db = require('./db.js')

const Telegraf = require('telegraf')
const Markup = require("telegraf/markup")
const Stage = require("telegraf/stage")
const session = require("telegraf/session")
const extra = require('telegraf/extra')
const markup = extra.markdown()

const { enter, leave } = Stage

const minter = require('./minter.js')
const bcoin = require('./bcoin.js')
const eth = require('./eth.js')
const cmc = require('./cmc.js')
const utils = require('./utils.js')
const rates = require('./rates.js')

const mode = data.MODE
const BOT_TOKEN = mode === "PRODUCTION" ? (data.BOT_TOKEN || "") : data.BOT_DEV_TOKEN 
const PORT = 443
const bot = new Telegraf(BOT_TOKEN)
const URL = data.URL
const admins_id = data.admins_id

// Настраиваем ТелеБота
var Express = require('express')
var router = Express.Router()
var app = Express()

// var bodyParser = require('body-parser');
// app.use(bodyParser.json());

// app.post('/' + BOT_TOKEN, function (req, res) {
//   bot.processUpdate(req.body);
//   res.sendStatus(200);
// });

app.use("/test", function(req, res) {
	res.setHeader("Content-Type", "text/html; charset=utf-8")
	res.end("Hello, World!\n\n💚 🔒.js")
})

function rawBody(req, res, next) {
	req.setEncoding('utf8')
	var data = ''
	req.on('data', function (chunk) {
		data += chunk
	})

	req.on('end', function () {
		req.rawBody = data
		next()
	})
}
// app.use(rawBody)
app.use(router)

exports.startBot = function () {
    console.log(`startbot, bot token webhook: ${URL}/bot${BOT_TOKEN}`)
    if (mode==="PRODUCTION") {
        console.log("Стартуем в режиме сервера...")
        app.use(bot.webhookCallback(`/bot${BOT_TOKEN}`))
        bot.telegram.setWebhook(`${URL}/bot${BOT_TOKEN}`);

        require('greenlock-express').create({
          // Let's Encrypt v2 is ACME draft 11
          version: 'draft-11', 
          server: 'https://acme-v02.api.letsencrypt.org/directory', 
          email: 'shakhruz@gmail.com', 
          approveDomains: [ 'mbit.uz', 'www.mbit.uz' ], 
          agreeTos: true, 
          configDir: "~/acme/", 
          app: app, 
          communityMember: true,
          telemetry: true,
          store: require('greenlock-store-fs') 
        }).listen(80, 443)
    } else {
        console.log("Стартуем в режиме разработки...")
        bot.telegram.setWebhook("")
        bot.launch() 
        // console.log("started telegram bot...")
        // app.listen(3000, function () {
        //   console.log('Вебхук для coinbase commerce запущен на порту 3000')
        // })
    }      
}
this.startBot()

// Start Bot
bot.start(ctx => {
    console.log("бот стартанул...")

    if (ctx.from.is_bot) {
        console.log("Тут какой-то бот пытается нас поюзать....")
        return
    }

    ctx.replyWithSticker("CAADAgAD_wADhEATAAHJvutfmC0F5BYE")  // salom sticker
   
    setTimeout(()=>{
        welcomeUser(ctx)  
        let keyboard_buttons = Markup.keyboard(["₿🚀👍🔥 Купить БИТКОИН", "💵🏎️✈️👨‍👧‍👧🌴 Продать БИТКОИН", "👛🏆🔒😎 ОТКРЫТЬ БИТКОИН КОШЕЛЕК", "🆘🤗🍵 Помощь"]).oneTime().resize().extra();
        ctx.replyWithMarkdown("Приветствуем Вас в нашем Крипто-Дукане!", keyboard_buttons)                    
    }, 2000)
})

function welcomeUser(ctx) {
    let balance_result
    db.getUser(ctx.from.id, (user)=> {
        if (user!=null) {
            // Проверяем наличие и создаем при необходимости кошельки, не показываем балансы
            showAllBalances(ctx, false)
        } else {
            console.log("новый пользователь... будет открывать кошельки")
            ctx.replyWithMarkdown(`Похоже что Вы в первый раз у нас 👋.\n\nДля того, чтобы использовать бота, откроем Вам кошельки 👛 для хранения денег и расчетов...`)
            db.addUser(ctx.from.id, ctx.from.id, ctx.from.first_name, ctx.from.last_name, ctx.from.language_code, (result)=>{
                if (result) {
                    // Добавляем кошельки
                    bcoin.addBTCWallet(ctx.from.id, (message)=> {
                        ctx.replyWithMarkdown(message)
                        eth.addETHWallet(ctx.from.id, (message)=> {
                            ctx.replyWithMarkdown(message)
                            minter.addBIPWallet(ctx.from.id, (message)=> {
                                ctx.replyWithMarkdown(message)
                                ctx.replyWithSticker("CAADAgAD-QADhEATAAHVoDcGEm_E2RYE") // party time
                            })
                        })
                    })                    
                }
            })
        }
    })
}

// Проверяем наличие кошельков, отерываем недостающие, показываем сообщения об открытии кошельков
function showAllBalances(ctx, show = false) {
    bcoin.checkWallet(ctx.from.id, (btcWallet)=>{
        eth.checkWallet(ctx.from.id, (ethWallet)=>{
            minter.checkWallet(ctx.from.id, (bipWallet)=>{
                console.log("все кошельки открыты")
                if (show) showBalances(ctx, btcWallet, ethWallet, bipWallet)
            })
        })
    })
}

function showBalances(ctx, btcWallet, ethwallet, bipwallet ) {
    // console.log("show balances for: ", btcWallet, ethwallet, bipwallet)
    let message = "";
    // ctx.replyWithMarkdown("🏧 *Баланс:*\n\n")
    let total = 0
    getBTCBalance(ctx.from.id, ctx.from.username, (m1, b1)=> {
        message += m1
        total += b1
        ctx.reply(message)
        // ctx.replyWithMarkdown(message,
        //     Markup.inlineKeyboard([
        //       Markup.callbackButton("₿ Купить Биткоин", "buy_crypto")
        //     ]).extra()
        // )                    
        // getETHBalance(ethwallet.address, (m2, b2) => {
        //     message += m2
        //     total +=  b2
        //     // ctx.replyWithMarkdown(m2)
        //     getBIPBalance(bipwallet.address, (m3, b3) => {
        //         message += m3
        //         total += b3
        //         message += `Всего: ${utils.fullUSD(total)} (${utils.shortSUM(total * rates.sum().cb_price)})`
        //         // ctx.replyWithMarkdown(m3)
        //         // ctx.replyWithMarkdown(message,
        //         //     Markup.inlineKeyboard([
        //         //       Markup.callbackButton("₿ Купить Биткоин", "buy_crypto")
        //         //     //   Markup.callbackButton("💵 Продать Биткоин", "receive_crypto")
        //         //     ]).extra()
        //         //   )                    
        //     }) 
        // })
    })
}

function getBTCBalance(user_id, username, callback) {
    console.log("BTC balance for ", user_id);
    bcoin.checkWallet(user_id, (account) => {
        bcoin.getBalance(user_id, (balance) => {
            console.log("BTC balance: ", balance)
            const balance_sat = balance*100000000;
            const balance_usd = balance*rates.crypto().BTC
            const balance_sum = balance*rates.crypto().BTC * rates.sum_buy_price();
            callback(`БИТКОИН 👛 КОШЕЛЕК 😎@${username}\n\n${utils.shortSAT(balance_sat)} (${balance}btc) | ${utils.shortSUM(balance_sum)} | ${utils.shortUSD(balance_usd)}\n🔒 ${account.receiveAddress}`,
            balance*rates.crypto().BTC);
        })
    }) 
}

function getBIPBalance(address, callback) {
    console.log("BIP balance for ", address)
    minter.getBIPBalance(address, (BIPBalance) => {
        callback(`*MINTER NETWORK (BIP)*\n📝 *${BIPBalance}*BIP | ${utils.shortUSD(BIPBalance * rates.minter().bipPriceUsd)} | ${utils.shortSUM(BIPBalance * rates.minter().bipPriceUsd*rates.sum_buy_price())} \n🏠 ${address}\n\n`,
        BIPBalance * rates.minter().bipPriceUsd);
    })
}

function getETHBalance(address, callback) {
    console.log("ETH balance for ", address)
    eth.getBalance(address, (ETHBalance) => {
        console.log("got ETH balance: ", ETHBalance)
        callback(`*ETHEREUM (ETH)*\n📝 *${ETHBalance}*ETH | ${utils.shortUSD(ETHBalance*rates.crypto().ETH)} | ${utils.shortSUM(ETHBalance*rates.crypto().ETH*rates.sum_buy_price())} \n🏠 ${address}\n\n`,
        ETHBalance*rates.crypto().ETH);
    })
}

exports.showReserves = function(ctx, callback) {
    let balance_reply = `*🏦 В НАЛИЧИИ НА ПРОДАЖУ: 🏦*\n\n`
    bcoin.getBalance(data.BTCReserveAccountName, (balance)=> {
        const balance_usd = balance * rates.crypto().BTC
        const balance_sat = balance * 100000000
        const balance_sum = balance_usd * rates.sum_cb_price()
        balance_reply += `*${utils.shortSAT(balance_sat)}* (${balance}btc) | ${utils.shortSUM(balance_sum)} | ${utils.shortUSD(balance_usd)}`
        minter.getBIPBalance(data.BIPReserveAddress, (BIPBalance) => {
            // balance_reply += `\n*${BIPBalance}* BIP  | ${utils.shortUSD(BIPBalance*rates.minter().bipPriceUsd)}`
            eth.getBalance(data.ethAddress, (ETHBalance) => {
                // balance_reply += `\n*${ETHBalance}* ETH | ${utils.shortUSD(ETHBalance*rates.crypto().ETH)}`
                // console.log("reserves balance: ", balance_reply)
                ctx.replyWithMarkdown(balance_reply).then(()=>{callback()}) 
            })            
        })        
    })
}

function showRates(ctx) {
    minter.getMinterMarketData((market) => {
        cmc.getRates((rates)=>{
            // console.log("minter market data: ", market)
            ctx.replyWithMarkdown(`📈 *Текущие курсы:*\nBIP: *${utils.longUSD(market.bipPriceUsd)}*\nBTC: *${utils.shortUSD(rates.BTC)}*\nETH: *${utils.fullUSD(rates.ETH)}*`)
        })
    })    
}


// minter.waitForPayment(address, pub_key, gotPayment, ctx.from.id)
// function gotPayment(trx, userId) {
//     console.log("got payment: ", trx, "for user ", userId)
//     sendMessage(userId, `Ваш платеж на ${trx.data.value} ${trx.data.coin} получен с адреса ${trx.from}`)
//     minter.sendBIP(data.BIPReserveAddress, trx.data.value, priv_key)
// }

// Визарды
const buy_crypto_wizard = require('./wizards/buy_crypto_wizard.js')
const stage = new Stage([buy_crypto_wizard.buy_crypto], {ttl: 300});
bot.use(session())
bot.use(stage.middleware())

bot.action("buy_crypto",  enter("buy_crypto"))
bot.command("buy",  enter("buy_crypto"))
bot.command("sell",  (ctx)=>{
    sell_crypto(ctx)
})
bot.command("balance",  (ctx)=>{
    showAllBalances(ctx, true)
})
bot.command("help",  (ctx)=>{
    help(ctx)
})
bot.hears("₿🚀👍🔥 Купить БИТКОИН",  enter("buy_crypto"))
bot.hears("👛🏆🔒😎 ОТКРЫТЬ БИТКОИН КОШЕЛЕК",  (ctx)=> {
    console.log("Балансы счетов");
    showAllBalances(ctx,true)
})

bot.hears("💵🏎️✈️👨‍👧‍👧🌴 Продать БИТКОИН",  (ctx)=> {
    sell_crypto(ctx)
})

function sell_crypto(ctx) {
    console.log("Продать биткоин");
    ctx.replyWithSticker("CAADAgADxQADhEATAAE_gjZb-SdSCxYE")

    setTimeout(()=> {
        ctx.replyWithMarkdown(`☎️ Обращайтесь по вопросам продажи крипто активов к @BitcoinTAS.\n\n🏠 Адрес для отправки BTC: 🏠`).then(()=>{
            ctx.replyWithMarkdown(`199FX9tQ JBbf7Nfsr3T6xx28cnrrwuzUZB`, utils.main_menu_keyboard())
        })
    }, 1000)    
}

bot.hears("🆘🤗🍵 Помощь",  (ctx)=> {
    help(ctx)
})

function help(ctx) {
    ctx.replyWithSticker("CAADAgADwgADhEATAAHsXKC5jxDehhYE").then(()=>{
        ctx.replyWithMarkdown(`📟 По всем вопросам обращайтесь к @BitcoinTAS `, utils.main_menu_keyboard())
    })
}

bot.on('sticker', (ctx) => {
    ctx.reply(`Код стикера - ${ctx.message.sticker.file_id}`)
});

//
// Прием входящего платежа в сумах
//

// Запрос от платежа на проверку заказа, нужно сравнить заказ с записью в базе и если все ок, то подтвердить его
bot.on('pre_checkout_query', (ctx) => {
    console.log("preCheckoutQuery: ", ctx.update) 
    console.log("precheckout from:", ctx.update.pre_checkout_query.from)
    const currency = ctx.update.pre_checkout_query.currency
    const checkout_id = ctx.update.pre_checkout_query.id
    const checkout_amount = ctx.update.pre_checkout_query.total_amount / 100
    const contract_id = Number(ctx.update.pre_checkout_query.invoice_payload)
    console.log("contract_id for this checkout: ", contract_id)

    db.getContract(contract_id, (contract)=>{
        if (!contract || contract == null || contract.sell_amount != checkout_amount || contract.status != "new" || currency != "UZS") {
            ctx.reply(`Пришел ошибочный запрос на платеж: #${checkout_id}. Оплата отклонена.`)
            ctx.replyWithSticker("CAADAgAD1QADhEATAAHlqbT_Fg_mEBYE") // Yaxshi mas
            ctx.answerPreCheckoutQuery(false)
        } else {
            db.updateContract(contract_id, "checkout")
            console.log("pre checkout approved")
            ctx.answerPreCheckoutQuery(true)
        }
    })
})

// Пришел платеж от пользователя, нужно найти контракт, исполнить его и изменить статус
bot.on('successful_payment', (ctx) => {
    console.log("successful payment: ", ctx.message.successful_payment)
    console.log(`${ctx.from.username} just paid ${ctx.message.successful_payment.total_amount / 100 } UZS`)
    const amount_paid = Math.trunc(ctx.message.successful_payment.total_amount / 100)

    const contract_id = Number(ctx.message.successful_payment.invoice_payload)
    const payment_charge_id = ctx.message.successful_payment.provider_payment_charge_id
    console.log("payment for contract: ", contract_id, " charge_id: ", payment_charge_id)

    db.getContract(contract_id, (contract) => {
        console.log("контракт по которому пришел платеж: ", contract)
        if (!contract || contract == null || contract.sell_amount != amount_paid || contract.status != "checkout") {
            console.log("wrong payment!!!")
            ctx.reply(`Пришел ошибочный платеж #${ctx.message.successful_payment}. \n\n` +
                        `Непонятно что делать с этой оплатой, пожалуйста перешлите это сообщение администратору @BitcoinTAS.`)
            ctx.replyWithSticker("CAADAgAD1QADhEATAAHlqbT_Fg_mEBYE") // Yaxshi mas
        } else {
            console.log("payment received")
            completeContract(ctx, contract)
        }
    })
})

// Исполнить контракт, отправить крипту
function completeContract(ctx, contract) {
    // Исполняем контракт
    bcoin.send(data.BTCReserveAccountName, contract.buy_amount-contract.fee_sat/100000000, contract.to_address, contract.fee_sat, (result, arg)=>{
        console.log("bcoin sent: ", result, arg)
        if (result) {
            ctx.replyWithMarkdown(`${utils.shortSAT(contract.buy_amount*100000000)} (${utils.fullBTC(contract.buy_amount)}) отправлены, результат можно посмотреть здесь: https://www.blockchain.com/btc/tx/${arg}`)
            ctx.replyWithSticker("CAADAgADBwEAAoRAEwAB-36a_n_Uk5QWBA")
            db.updateContract(contract.id, "completed")                
        } else {
            ctx.reply(`Произошла ошибка при проведении транзакции: ${arg}`)
            ctx.replyWithSticker("CAADAgAD1QADhEATAAHlqbT_Fg_mEBYE") // Yaxshi mas
            db.updateContract(contract.id, "error")                
        }
        setTimeout(()=>{
            ctx.reply(`Спасибо за Покупку!`, utils.main_menu_keyboard())
        }, 3000)
    })
}


// Тесты

// bot.command("sendbip", (ctx)=> {
//     console.log("sendbip")
//     minter.sendToReserve(ctx.from.id, data.BIPReserveAddress, 0.01, (result, message) => {
//         ctx.reply(message)
//     })
// })

// bot.command("getbip", (ctx)=> {
//     console.log("getbip")
//     minter.getFromReserve(ctx.from.id, 1, (result, message) => {
//         ctx.reply(message)
//     })
// })

// bot.command("sendbtc", (ctx)=> {
//     console.log("sendbtc")
//     bcoin.sendToReserve(ctx.from.id, 0.0001, (result, message) => {
//         ctx.reply(message)
//     })
// })

// bot.command("getbtc", (ctx)=> {
//     console.log("getbtc")
//     bcoin.getFromReserve(ctx.from.username, 0.0001, (result, message) => {
//         ctx.reply(message)
//     })
// })

// bot.command("sendeth", (ctx)=> {
//     console.log("sendeth")
//     eth.sendToReserve(ctx.from.id, "0.001", (result, message) => {
//         ctx.reply(message)
//     })
// })

// bot.command("geteth", (ctx)=> {
//     console.log("geteth")
//     eth.getFromReserve(ctx.from.id, "0.001", (result, message) => {
//         ctx.reply(message)
//     })
// })

function sendToAdmins (message, markdown = false) {
    admins_id.forEach(function(id) {
      if (markdown) bot.telegram.sendMessage(id, message, markup)
      else bot.telegram.sendMessage(id, message)
    })
}

function sendMessage (userId, message, markdown = false) {
    if (markdown) bot.telegram.sendMessage(userId, message, markup)  
    else bot.telegram.sendMessage(userId, message)  
}
  
function sendError (err, ctx) {
    console.log("Error: ", err.toString())
    if (ctx && ctx.from) {
        if (err.toString().includes('message is not modified')) {
            return
        }
        bot.telegram.sendMessage(data.dev, `❌Ошибка у [${ctx.from.first_name}](tg://user?id=${ctx.from.id}) \n\nОшибка: ${err}`)  
    }
}  
  
function isAdmin (username) {
    return admins.indexOf(username)>=0
}
  
module.exports = {
    sendToAdmins,
    sendMessage,
    sendError,
    isAdmin
}

//
//start - Главное МЕНЮ
// buy - Купить БИТКОИН
// sell - Продать БИТКОИН
// balance - ОТКРЫТЬ БИТКОИН КОШЕЛЕК
// help - Помощь