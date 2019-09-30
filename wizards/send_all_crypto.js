//
// Вывод всех денег с кошелька на внешний
//

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

buyStepHandler.action("yes", ctx => {
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
    `*УСКОРЕННАЯ отправка или СТАНДАРТНАЯ?*\n\nУскоренная доходит за ~10-60мин, Стандартная - от 1ч.`,
    Markup.inlineKeyboard([
      [
        Markup.callbackButton(
          `🚀 УСКОРЕННАЯ (${utils.fullUSD(fee_high_usd)})`,
          "fast"
        )
      ],
      [
        Markup.callbackButton(
          `🚗 СТАНДАРТНАЯ (${utils.fullUSD(fee_low_usd)})`,
          "regular"
        )
      ]
    ]).extra()
  );
  return ctx.wizard.next();
});

buyStepHandler.action("regular", ctx => {
  ctx.wizard.state.fee_type = "regular";
  ctx.wizard.state.fee_sat = ctx.wizard.state.fees.low;
  ctx.wizard.state.fee_usd = ctx.wizard.state.fees.fee_low_usd;

  // вычитаем комиссию за перевод из общей суммы
  ctx.wizard.state.qty_btc -= ctx.wizard.state.fee_sat / 100000000;
  ctx.replyWithMarkdown(`На какой адрес отправить BTC?`);
  return ctx.wizard.next();
});

buyStepHandler.action("fast", ctx => {
  ctx.wizard.state.fee_type = "fast";
  ctx.wizard.state.fee_sat = ctx.wizard.state.fees.high;
  ctx.wizard.state.fee_usd = ctx.wizard.state.fees.fee_high_usd;

  // вычитаем комиссию за перевод из общей суммы
  ctx.wizard.state.qty_btc -= ctx.wizard.state.fee_sat / 100000000;
  ctx.replyWithMarkdown(`На какой адрес отправить BTC?`);
  return ctx.wizard.next();
});

buyStepHandler.action("no", ctx => {
  ctx.reply("Хоп...", utils.main_menu_keyboard());
  return ctx.scene.leave();
});

buyStepHandler.use(ctx => {
  ctx.reply(
    "простите, не понял. Давайте попробуем еще раз...",
    utils.main_menu_keyboard()
  );
  return ctx.scene.leave();
});

exports.send_all_crypto = new WizardScene(
  "send_all_crypto",
  ctx => {
    console.log("send_all_crypto start...");
    rates.updateRates();
    rates.updateUZSRate();

    bcoin.checkWallet(ctx.from.id, account => {
      bcoin.getBalance(ctx.from.id, balance => {
        ctx.wizard.state.qty_btc = balance;
        const balance_sat = balance * 100000000;
        const balance_usd = (ctx.wizard.state.qty_usd =
          balance * rates.crypto().BTC);
        const balance_sum = (ctx.wizard.state.qty_sum =
          balance * rates.crypto().BTC * rates.sum_buy_price());
        if (balance_sat <= 0) {
          ctx.replyWithMarkdown(
            `У Вас пока нет БИТКОИНОВ в кошельке. Можете купить их в нашем дукане или отправить на адрес:`
          );
          setTimeout(() => {
            ctx.replyWithMarkdown(account.receiveAddress);
          }, 1000);
          return ctx.scene.leave();
        } else {
          ctx.reply(
            `БИТКОИН 👛 КОШЕЛЕК 😎@${username}\n\n${utils.shortSAT(
              balance_sat
            )} (${balance}btc) | ${utils.shortSUM(
              balance_sum
            )} | ${utils.shortUSD(balance_usd)}\n🔒 ${
              account.receiveAddress
            }\n\nХотите снять все БИТКОИНЫ с кошелька?`,
            Markup.inlineKeyboard([
              Markup.callbackButton("👌 Да", "yes"),
              Markup.callbackButton("👎 Нет", "no")
            ]).extra()
          );
        }
      });
    });
  },
  buyStepHandler,
  buyStepHandler,
  ctx => {
    if (!ctx.message) {
      ctx.reply(`Хоп...`, utils.main_menu_keyboard());
      return ctx.scene.leave();
    }

    if (ctx.message && ctx.message.text) {
      var valid = WAValidator.validate(ctx.message.text, "BTC");
      if (valid) {
        ctx.wizard.state.address = ctx.message.text;

        ctx.reply(
          `Выводим ${ctx.wizard.state.qty_btc}btc на адрес ${ctx.wizard.state.address} fee: ${ctx.wizard.state.fee_sat}`
        );

        // Выводим из кошелька
        bcoin.send(
          ctx.from.id,
          ctx.wizard.state.qty_btc,
          ctx.wizard.state.address,
          ctx.wizard.state.fee_sat,
          (result, arg) => {
            console.log("bcoin sent: ", result, arg);
            if (result) {
              ctx.replyWithMarkdown(
                `${utils.shortSAT(
                  contract.buy_amount * 100000000
                )} (${utils.fullBTC(
                  contract.buy_amount
                )}) отправлены, результат можно посмотреть здесь: https://www.blockchain.com/btc/tx/${arg}`
              );
            } else {
              ctx.reply(`Произошла ошибка при проведении транзакции: ${arg}`);
              ctx.replyWithSticker("CAADAgAD1QADhEATAAHlqbT_Fg_mEBYE"); // Yaxshi mas
            }
            setTimeout(() => {
              ctx.reply(`Готово...`, utils.main_menu_keyboard());
            }, 3000);
          }
        );

        return ctx.scene.leave();
      } else {
        ctx.reply(`❌ Некорректный адрес BTC. Попробуйте еще раз`);
        return ctx.scene.leave();
      }
    } else {
      ctx.reply(`❌ Некорректный адрес BTC. Попробуйте еще раз`);
      return ctx.scene.leave();
    }
  },
  ctx => {
    return ctx.scene.leave();
  }
);
