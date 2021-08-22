require("dotenv").config();
const threeCommasAPI = require('3commas-api-node');
const TelegramController = require('./telegram.controller');
const api = new threeCommasAPI({
    apiKey: process.env.COMMAS_APIKEY,
    apiSecret: process.env.COMMAS_SECRETS,
    url: "https://api.3commas.io",
});

class ThreeCommas {
    async openDeal(dealData) {
        return new Promise((resolve, reject) => {
            console.log("openDeal");
            TelegramController.sendMsg(`EMA symbol:${dealData.symbol} -- TimeFrame:${process.env.TIMEFRAME} sl:${dealData.sl} tp:${dealData.tp} -- ema:${dealData.ema}`);
        })
    }
}

module.exports = ThreeCommas

