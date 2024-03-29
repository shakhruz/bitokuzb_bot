//
// Покупка крипты пользователем
//

// 199FX9tQJBbf7Nfsr3T6xx28cnrrwuzUZB

const Markup = require("telegraf/markup");
const Composer = require("telegraf/composer");
const WizardScene = require("telegraf/scenes/wizard");

var WAValidator = require("wallet-address-validator");
const utils = require("../utils.js");
const bot = require("../bot.js");
const data = require("../data");
const db = require("../db.js");
const rates = require("../rates.js");
const bcoin = require("../bcoin.js");

const buyStepHandler = new Composer();
buyStepHandler.action("fromBTC", ctx => {
  ctx.wizard.state.base = "BTC";
  ctx.replyWithMarkdown(
    "₿🚀👍🔥 ПОКУПКА БИТКОИНА 2/4\n\n*Укажите сумму биткоинов BTC для покупки:*\n0.001 - 1"
  );
  return ctx.wizard.next();
});
buyStepHandler.action("fromUSD", ctx => {
  ctx.wizard.state.base = "USD";
  ctx.replyWithMarkdown(
    "₿🚀👍🔥 ПОКУПКА БИТКОИНА 2/4\n\n*На какую сумму в Долларах хотите купить BTC?*\n\n1-1000"
  );
  return ctx.wizard.next();
});
buyStepHandler.action("fromSUM", ctx => {
  ctx.wizard.state.base = "SUM";
  ctx.replyWithMarkdown(
    "₿🚀👍🔥 ПОКУПКА БИТКОИНА 2/4\n\n*На какую сумму в Cумах хотите купить BTC?*\n\n10000-10000000"
  );
  return ctx.wizard.next();
});

buyStepHandler.action("yes1", ctx => {
  ctx.replyWithSticker("CAADAgADuAADhEATAAFmUCWGxK4RqhYE");

  setTimeout(() => {
    const fees_high = bcoin.getFees().high * 400;
    const fees_low = bcoin.getFees().low * 400;
    const fee_high_usd = (fees_high * rates.crypto().BTC) / 100000000;
    const fee_low_usd = (fees_low * rates.crypto().BTC) / 100000000;
    ctx.wizard.state.fees = {
      high: fees_high,
      low: fees_low,
      fee_high_usd: fee_high_usd,
      fee_low_usd: fee_low_usd
    };
    console.log("fees: ", ctx.wizard.state.fees);
    ctx.replyWithMarkdown(
      `₿🚀👍🔥 ПОКУПКА БИТКОИНА 3/4\n\n*Желаете УСКОРЕННУЮ отправку или СТАНДАРТНУЮ?*\n\nУскоренная доходит за ~10-60мин, Стандартная - от 1ч.`,
      Markup.inlineKeyboard([
        [
          Markup.callbackButton(
            `🚀 УСКОРЕННУЮ (${utils.longUSD(fee_high_usd)})`,
            "fast"
          )
        ],
        [
          Markup.callbackButton(
            `🚗 СТАНДАРТНУЮ (${utils.longUSD(fee_low_usd)})`,
            "regular"
          )
        ]
      ]).extra()
    );
    return ctx.wizard.next();
  }, 2000);
});

buyStepHandler.action("regular", ctx => {
  ctx.wizard.state.fee_type = "regular";
  ctx.wizard.state.fee_sat = ctx.wizard.state.fees.low;
  ctx.wizard.state.fee_usd = ctx.wizard.state.fees.fee_low_usd;

  if (ctx.wizard.state.base == "BTC") {
    ctx.wizard.state.qty_sum = Math.trunc(
      Number(ctx.wizard.state.qty_sum) +
        ctx.wizard.state.fees.fee_low_usd * rates.sum_buy_price()
    );
    ctx.wizard.state.qty_usd = ctx.wizard.state.qty_sum / rates.sum_buy_price();
  } else if (
    ctx.wizard.state.base == "UZCARD" ||
    ctx.wizard.state.base == "USD"
  ) {
    ctx.wizard.state.qty_btc =
      ctx.wizard.state.qty_btc - ctx.wizard.state.fee_sat / 100000000;
  }

  ctx.replyWithMarkdown(
    `₿🚀👍🔥 ПОКУПКА БИТКОИНА 4/4\n\n На какой адрес отправить купленные BTC?`
  );
  return ctx.wizard.next();

  // bcoin.checkWallet(ctx.from.id, (account) => {
  //   ctx.wizard.state.address = account.receiveAddress
  //   console.log("found internal btc addr: ", account.receiveAddress)
  //   let keyboard_buttons = Markup.keyboard([account.receiveAddress]).oneTime().resize().extra();
  //   ctx.replyWithMarkdown(`*4. Шаг 4/4. На какой адрес отправить купленные BTC?*\n\nВведите адрес в поле или выберите адрес вашего счета в bitok.uz ниже 👇`,
  //                       keyboard_buttons)
  //   return ctx.wizard.next()
  // })
});
buyStepHandler.action("fast", ctx => {
  ctx.wizard.state.fee_type = "fast";
  ctx.wizard.state.fee_sat = ctx.wizard.state.fees.high;
  ctx.wizard.state.fee_usd = ctx.wizard.state.fees.fee_high_usd;
  if (ctx.wizard.state.base == "BTC") {
    ctx.wizard.state.qty_sum = Math.trunc(
      Number(ctx.wizard.state.qty_sum) +
        ctx.wizard.state.fee_usd * rates.sum_buy_price()
    );
    ctx.wizard.state.qty_usd = ctx.wizard.state.qty_sum / rates.sum_buy_price();
  } else if (
    ctx.wizard.state.base == "UZCARD" ||
    ctx.wizard.state.base == "USD"
  ) {
    console.log(
      "qty_btc: ",
      ctx.wizard.state.qty_btc,
      " fee_high: ",
      ctx.wizard.state.fee_sat
    );
    ctx.wizard.state.qty_btc =
      ctx.wizard.state.qty_btc - ctx.wizard.state.fee_sat / 100000000;
  }

  ctx.reply(
    `₿🚀👍🔥 ПОКУПКА БИТКОИНА 4/4\n\n*На какой адрес отправить купленные BTC?*\n\nВведите адрес 👇`
  );
  return ctx.wizard.next();

  // bcoin.checkWallet(ctx.from.id, (account) => {
  //     ctx.wizard.state.address = account.receiveAddress
  //     console.log("found internal btc addr: ", account.receiveAddress)
  //     let keyboard_buttons = Markup.keyboard([account.receiveAddress]).oneTime().resize().extra();
  //     ctx.replyWithMarkdown(`*4. Шаг 4/4. На какой адрес отправить купленные BTC?*\n\nВведите адрес в поле или выберите адрес вашего счета в bitok.uz ниже 👇`,
  //                         keyboard_buttons)
  //     return ctx.wizard.next()
  // })
});

function replyAddressQuestion(ctx) {
  bcoin.checkWallet(ctx.from.id, account => {
    ctx.wizard.state.address = account.receiveAddress;
    console.log("found internal btc addr: ", account.receiveAddress);
    let keyboard_buttons = Markup.keyboard([account.receiveAddress])
      .oneTime()
      .resize()
      .extra();
    ctx.replyWithMarkdown(
      "₿🚀👍🔥 ПОКУПКА БИТКОИНА 4/4\n\n*На какой адрес отправить купленные BTC?*\n\nВведите адрес 👇",
      keyboard_buttons
    );
  });
}

buyStepHandler.action("yes2", ctx => {
  console.log("Отправляем заявку на покупку ", ctx.wizard.state);
  // сохраняем контракт в базе данных
  let contract = {
    user_id: ctx.from.id,
    sell_coin: "UZCARD",
    sell_amount: ctx.wizard.state.qty_sum,
    sell_amount_usd: ctx.wizard.state.qty_usd,
    buy_coin: "BTC",
    buy_amount: ctx.wizard.state.qty_btc,
    to_address: ctx.wizard.state.address,
    fee: {
      fee_sat: Math.trunc(ctx.wizard.state.fee_sat),
      fee_usd: ctx.wizard.state.fee_usd
    },
    rate: {
      market: ctx.wizard.state.real_rate,
      real: ctx.wizard.state.rate_usd
    },
    comm: {
      rate: ctx.wizard.state.comm,
      usd: ctx.wizard.state.profit_usd,
      sum: ctx.wizard.state.profit_usd * ctx.wizard.state.USDrate,
      btc: ctx.wizard.state.profit_usd / ctx.wizard.state.real_rate
    },
    datetime: new Date(),
    from_address: "payme",
    status: "new"
  };
  console.log("contract: ", contract);
  const contract_id = db.addContract(contract).then(contract_result => {
    console.log("new contract: ", contract_result);
    const invoice = utils.createInvoice(
      ctx.wizard.state.qty_sum,
      ctx.wizard.state.qty_btc,
      contract_result.id
    );
    console.log("invoice: ", invoice);
    ctx.replyWithInvoice(invoice).then(invoice_result => {
      console.log("invoice result: ", invoice_result);
    });
    return ctx.scene.leave();
  });
});

buyStepHandler.action("no", ctx => {
  ctx.reply(`Спасибо за Покупку!`, utils.main_menu_keyboard());
  return ctx.scene.leave();
});

buyStepHandler.use(ctx => {
  ctx.reply(
    "простите, не понял. Давайте попробуем еще раз...",
    utils.main_menu_keyboard()
  );
  return ctx.scene.leave();
});

exports.buy_crypto = new WizardScene(
  "buy_crypto",
  ctx => {
    console.log("buy crypto start...");
    rates.updateRates();
    rates.updateUZSRate();
    bot.showReserves(ctx, () => {
      ctx.replyWithMarkdown(
        `₿🚀👍🔥 ПОКУПКА БИТКОИНА 1/4\n\n*В какой валюте рассчитать покупку?*`,
        Markup.inlineKeyboard([
          Markup.callbackButton("₿ BTC", "fromBTC"),
          Markup.callbackButton("💵 USD", "fromUSD"),
          Markup.callbackButton("💴 SUM", "fromSUM")
        ]).extra()
      );
      return ctx.wizard.next();
    });
  },
  buyStepHandler,
  ctx => {
    if (!ctx.message) {
      ctx.reply(`Ок...`, utils.main_menu_keyboard());
      return ctx.scene.leave();
    }
    ctx.wizard.state.amount = Number(ctx.message.text.replace(",", "."));
    let rate_usd = rates.crypto().BTC;
    if (ctx.wizard.state.amount <= 0) {
      ctx.reply(`Некорректная сумма для расчета: ${ctx.wizard.state.amount})`);
      return ctx.scene.leave();
    } else {
      if (ctx.wizard.state.base === "BTC") {
        let rate_usd = rates.crypto().BTC;
        qty_btc = ctx.wizard.state.qty_btc = Number(
          Number(ctx.wizard.state.amount).toFixed(8)
        );
        console.log("Считаем в BTC: ", qty_btc);

        qty_usd = ctx.wizard.state.qty_usd = utils.convertUSD(
          qty_btc,
          rate_usd
        );
        comm = ctx.wizard.state.comm = utils.getCommission(qty_usd);

        let profit_usd = (ctx.wizard.state.profit_usd = Number(
          (qty_usd * (comm - 1)).toFixed(2)
        ));
        let real_rate = (ctx.wizard.state.real_rate = rate_usd);
        rate_usd = ctx.wizard.state.rate_usd = Number(
          (rate_usd * comm).toFixed(2)
        );
        qty_usd = ctx.wizard.state.qty_usd = Number(
          (qty_usd * comm).toFixed(2)
        );

        let sum_rate = (ctx.wizard.state.USDrate = rates.sum_buy_price());
        qty_sum = ctx.wizard.state.qty_sum = Math.round(qty_usd * sum_rate);
        console.log("комиссия расчета ", comm);

        if (qty_btc < utils.qty_btc_min) {
          ctx.reply(
            `Число должно быть больше ${utils.qty_btc_min}. Попробуйте пожалуйста еще раз.`
          );
          return ctx.wizard.back();
        } else if (qty_btc > utils.qty_btc_max) {
          ctx.reply(
            `Число должно быть меньше ${utils.qty_btc_max}. Попробуйте пожалуйста еще раз.`
          );
          return ctx.wizard.back();
        }

        approveDealMessage(
          ctx,
          qty_usd,
          qty_sum,
          profit_usd,
          real_rate,
          rate_usd,
          sum_rate
        );
        return ctx.wizard.next();
      } else {
        if (ctx.wizard.state.base === "USD") {
          qty_usd = ctx.wizard.state.qty_usd = Number(
            Number(ctx.wizard.state.amount).toFixed(2)
          );
          comm = ctx.wizard.state.comm = utils.getCommission(qty_usd);
          let profit_usd = (ctx.wizard.state.profit_usd = Number(
            (qty_usd - qty_usd / comm).toFixed(2)
          ));
          console.log("Считаем в USD", qty_usd);

          let real_rate = (ctx.wizard.state.real_rate = rate_usd);
          rate_usd = ctx.wizard.state.rate_usd = Number(
            (rate_usd * comm).toFixed(2)
          );
          qty_btc = ctx.wizard.state.qty_btc = utils.convert(qty_usd, rate_usd);

          let sum_rate = (ctx.wizard.state.USDrate = rates.sum_buy_price());
          qty_sum = ctx.wizard.state.qty_sum = Math.round(qty_usd * sum_rate);
          console.log("комиссия расчета ", comm);

          if (qty_usd < utils.qty_usd_min) {
            ctx.reply(
              `Число должно быть больше ${utils.qty_usd_min}. Попробуйте пожалуйста еще раз.`
            );
            return ctx.wizard.back();
          } else if (qty_usd > utils.qty_usd_max) {
            ctx.reply(
              `Число должно быть меньше ${utils.qty_usd_max}. Попробуйте пожалуйста еще раз.`
            );
            return ctx.wizard.back();
          }

          approveDealMessage(
            ctx,
            qty_usd,
            qty_sum,
            profit_usd,
            real_rate,
            rate_usd,
            sum_rate
          );
          return ctx.wizard.next();
        } else {
          if (
            ctx.wizard.state.base === "SUM" ||
            ctx.wizard.state.base === "UZCARD"
          ) {
            qty_sum = ctx.wizard.state.qty_sum = Math.round(
              Number(ctx.wizard.state.amount)
            );
            console.log("Считаем в SUM", qty_sum);

            let sum_rate = (ctx.wizard.state.USDrate = rates.sum_buy_price());
            console.log("Курс доллара сегодня: ", sum_rate);
            let sendUZS = Math.round(Number(ctx.wizard.state.amount));
            let qty_usd = (ctx.wizard.state.qty_usd =
              Math.round((sendUZS / sum_rate) * 100) / 100);

            // ctx.reply(` ${ sendUZS } SUM =  ${ utils.fullUSD(qty_usd) } по курсу ${utils.fullSUM(sum_rate)} сум за 1 доллар`)
            console.log("Считаем в USD", qty_usd);
            comm = ctx.wizard.state.comm = utils.getCommission(
              qty_usd,
              ctx.wizard.state.base === "UZCARD"
            );
            let profit_usd = (ctx.wizard.state.profit_usd = Number(
              (qty_usd - qty_usd / comm).toFixed(2)
            ));
            let real_rate = (ctx.wizard.state.real_rate = rate_usd);

            rate_usd = ctx.wizard.state.rate_usd = Number(
              (rate_usd * comm).toFixed(2)
            );
            qty_btc = ctx.wizard.state.qty_btc = utils.convert(
              qty_usd,
              rate_usd
            );
            console.log("комиссия расчета ", comm);

            if (qty_sum < utils.qty_sum_min) {
              ctx.reply(
                `Число должно быть больше ${utils.qty_sum_min}. Попробуйте пожалуйста еще раз.`
              );
              return ctx.wizard.back();
            } else if (qty_sum > utils.qty_sum_max) {
              ctx.reply(
                `Число должно быть меньше ${utils.qty_sum_max}. Попробуйте пожалуйста еще раз.`
              );
              return ctx.wizard.back();
            }

            approveDealMessage(
              ctx,
              qty_usd,
              qty_sum,
              profit_usd,
              real_rate,
              rate_usd,
              sum_rate
            );

            return ctx.wizard.next();
          }
        }
      }
    }
  },
  buyStepHandler,
  buyStepHandler,
  ctx => {
    if (ctx.wizard.state.address != null) {
      ctx.message = { text: ctx.wizard.state.address };
    }
    console.log("полученный текст: ", ctx.message);
    if (ctx.message && ctx.message.text) {
      var valid = WAValidator.validate(ctx.message.text, "BTC");
      let sum_rate = rates.sum_buy_price();
      if (valid) {
        ctx.wizard.state.address = ctx.message.text;
        ctx.replyWithMarkdown(
          `📝 *ПОДТВЕРДИТЕ ЗАЯВКУ НА ПОКУПКУ BTC*: 📝\n\n` +
            `💵 К оплате: *${utils.fullSUM(
              ctx.wizard.state.qty_sum
            )}* | ${utils.shortUSD(ctx.wizard.state.qty_usd)}\n` +
            `  ₿   Вы получите: ${utils.shortSAT(
              ctx.wizard.state.qty_btc * 100000000
            )} (${utils.fullBTC(ctx.wizard.state.qty_btc)})\n` +
            `\n🙏 Комиссия (${utils.convertCommision(
              ctx.wizard.state.comm
            )}%): ${utils.shortSAT(
              (ctx.wizard.state.profit_usd / ctx.wizard.state.real_rate) *
                100000000
            )} | ${utils.shortSUM(
              ctx.wizard.state.profit_usd * sum_rate
            )} | ${utils.fullUSD(ctx.wizard.state.profit_usd)}\n` +
            `\n📈 Курс BTC: ${utils.shortUSD(
              ctx.wizard.state.real_rate
            )} (~${utils.shortSUM(ctx.wizard.state.real_rate * sum_rate)})\n` +
            `💱 Курс BTC с учетом комиссии: ${utils.shortUSD(
              ctx.wizard.state.rate_usd
            )} (~${utils.shortSUM(ctx.wizard.state.rate_usd * sum_rate)})\n` +
            `💲  Курс доллара: ${utils.fullSUM(sum_rate)}\n` +
            `\n🏠 Адрес отправки BTC: ${ctx.wizard.state.address}\n` +
            `🐎 Комиссия за перевод: ${Math.trunc(
              ctx.wizard.state.fee_sat
            )}sat | ${utils.fullSUM(
              ctx.wizard.state.fee_usd * sum_rate
            )} | ${utils.longUSD(ctx.wizard.state.fee_usd)}`,
          Markup.inlineKeyboard([
            Markup.callbackButton("✔ Да", "yes2"),
            Markup.callbackButton("❌ Нет", "no")
          ]).extra()
        );
        return ctx.wizard.next();
      } else {
        ctx.reply(`❌ Некорректный адрес BTC. Попробуйте еще раз`);
        return ctx.scene.leave();
      }
    } else {
      ctx.reply(`❌ Некорректный адрес BTC. Попробуйте еще раз`);
      return ctx.scene.leave();
    }
  },
  buyStepHandler,
  ctx => {
    return ctx.scene.leave();
  }
);

function approveDealMessage(
  ctx,
  qty_usd,
  qty_sum,
  profit_usd,
  rate_btc,
  rate_effective_btc,
  rate_sum
) {
  bcoin.getBalance(data.BTCReserveAccountName, balance => {
    const balance_usd = balance * rates.crypto().BTC;
    const balance_sat = balance * 100000000;
    const balance_sum = balance_usd * rates.sum_cb_price();
    if (qty_usd > balance_usd) {
      ctx.replyWithMarkdown(
        `К сожалению столько нет в резерве обменника. \n\nПожалуйста попробуйте сумму менее ${utils.shortSAT(
          balance_sat
        )} (${utils.shortBTC(balance)}) | ${utils.shortSUM(
          balance_sum
        )} | ${utils.shortUSD(balance_usd)}`
      );
    } else {
      ctx.replyWithMarkdown(
        `📄 РАСЧЕТ ЗАЯВКИ НА ПОКУПКУ 📄\n\n` +
          `💵 К оплате: *${utils.fullSUM(qty_sum)}* | ${utils.shortUSD(
            qty_usd
          )}\n` +
          `  ₿   Вы получите: *${utils.shortSAT(
            qty_btc * 100000000
          )}* (${utils.fullBTC(qty_btc)})\n` +
          `\n🙏 Комиссия (${utils.convertCommision(comm)}%): ${utils.shortSAT(
            (profit_usd / rate_btc) * 100000000
          )} | ${utils.shortSUM(profit_usd * rate_sum)} | ${utils.fullUSD(
            profit_usd
          )}\n` +
          `\n📈 Курс BTC: ${utils.shortUSD(rate_btc)} (~${utils.shortSUM(
            rate_btc * rate_sum
          )})\n` +
          `💱 Курс BTC с учетом комиссии: ${utils.shortUSD(
            rate_effective_btc
          )} (~${utils.shortSUM(rate_effective_btc * rate_sum)})\n` +
          `💲 Курс доллара: ${utils.fullSUM(rate_sum)}\n`,
        Markup.inlineKeyboard([
          Markup.callbackButton("👌 Устраивает", "yes1"),
          Markup.callbackButton("👎 Отменить", "no")
        ]).extra()
      );
    }
  });
}
