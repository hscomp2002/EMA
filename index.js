"use strict"

require("dotenv").config();
const ema = require("keltnerchannel").ema;
const Binance = require("node-binance-api");
const binance = new Binance().options({
  APIKEY: "ZWTtDTaeoqfbhEnXrkn2S4oixDl6KwBXSWgJioCy8hlbFda1K7fNHqt0SHZ0PJ3z",
  APISECRET: "O4Hwxfn3ByDfU1xUfXsp7daMc1MCHfkige2eRdfResTiD9dbs7LajKGRCtlAMLig"
});

function getSymbolEmaANDLastClose(symbol) {
  return new Promise((resolve, reject) => {
    try {
      binance.candlesticks(symbol,process.env.TIMEFRAME, (error, ticks, symbol) => {
        let closePriceArray = [];
        for (let i in ticks) {
          if (i != ticks.length - 1) {
            closePriceArray.push(Number(ticks[i][4]));
          }
        }
        let OUT = {};
        OUT["ema50"] = ema(closePriceArray.slice(150, 200), 50)[0];
        OUT["ema100"] = ema(closePriceArray.slice(100, 200), 100)[0];
        OUT["ema200"] = ema(closePriceArray, 200)[0];
        OUT["lastClose"] = closePriceArray[199];
        OUT["lastCandleColor"] = closePriceArray[199] < closePriceArray[198] ? "red" : "green";
        resolve(OUT);
      }, { limit: 201, endTime: +new Date() });
    } catch (error) {
      reject(error);
    }

  });
}

function calculateSymbolsInfo(symbolInfo) {
  if (symbolInfo.ema50 > symbolInfo.ema100 && symbolInfo.ema100 > symbolInfo.ema200) {
    const d50_100 = (symbolInfo.ema50 - symbolInfo.ema100) / ((symbolInfo.ema50 + symbolInfo.ema100)/2);
    if((d50_100*100) < process.env.EMA_MINIMUM_DIF_PERCENT){
      return false;
    }
    const d100_200 = (symbolInfo.ema100 - symbolInfo.ema200) / ((symbolInfo.ema100 + symbolInfo.ema200)/2);
    if((d100_200 * 100) < process.env.EMA_MINIMUM_DIF_PERCENT){
      return false;
    }
    symbolInfo.marketStatus = "bullish";
    return symbolInfo;
  }

  if (symbolInfo.ema200 > symbolInfo.ema100 && symbolInfo.ema100 > symbolInfo.ema50) {
    const d50_100 = (symbolInfo.ema100 - symbolInfo.ema50) / ((symbolInfo.ema50 + symbolInfo.ema100)/2);
    if((d50_100*100) < process.env.EMA_MINIMUM_DIF_PERCENT){
      return false;
    }
    const d100_200 = (symbolInfo.ema200 - symbolInfo.ema200) / ((symbolInfo.ema100 + symbolInfo.ema200)/2);
    if((d100_200 * 100) < process.env.EMA_MINIMUM_DIF_PERCENT){
      return false;
    }
    symbolInfo.marketStatus = "bearish";
    return symbolInfo;
  }

  return false;
}

async function getSymbolesInfo(){
  const CURRENCY_LIST = JSON.parse(process.env.CURRENCY_LIST);
  let symbolsData = [];
  for (let symbole in CURRENCY_LIST) {
    let index = symbole;
    symbole = symbole.replace("/","");
    let symbolInfo = await getSymbolEmaANDLastClose(symbole);
    let checkData = calculateSymbolsInfo(symbolInfo);
    if(!checkData){
      continue;
    }
    symbolsData.push({
      symbol: symbole,
      symbolInfo: checkData,
      botsData: CURRENCY_LIST[index]
    });
  }
  return symbolsData;
}

async function main() {
  const symbolesInfo = await getSymbolesInfo();
  console.log(symbolesInfo);
}

main();