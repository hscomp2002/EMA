"use strict"

require("dotenv").config();
const ema = require("keltnerchannel").ema;
const Binance = require("node-binance-api");
const binance = new Binance().options({
  APIKEY: process.env.APIKEY,
  APISECRET: process.env.APISECRET
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
        OUT["ema20"] = ema(closePriceArray.slice(80, 100), 20)[0];
        OUT["ema50"] = ema(closePriceArray.slice(50, 100), 50)[0];
        OUT["ema100"] = ema(closePriceArray, 100)[0];
        OUT["lastClose"] = closePriceArray[99];
        OUT["lastCandleColor"] = closePriceArray[99] < closePriceArray[98] ? "red" : "green";
        resolve(OUT);
      }, { limit: 101, endTime: +new Date() });
    } catch (error) {
      reject(error);
    }

  });
}

function calculateSymbolsInfo(symbolInfo) {
  if (symbolInfo.ema20 > symbolInfo.ema50 && symbolInfo.ema50 > symbolInfo.ema100) {
    const d20_50 = (symbolInfo.ema20 - symbolInfo.ema50) / ((symbolInfo.ema20 + symbolInfo.ema50)/2);
    if((d20_50*100) < process.env.EMA_MINIMUM_DIF_PERCENT){
      return false;
    }
    const d50_100 = (symbolInfo.ema50 - symbolInfo.ema100) / ((symbolInfo.ema50 + symbolInfo.ema100)/2);
    if((d50_100 * 100) < process.env.EMA_MINIMUM_DIF_PERCENT){
      return false;
    }
    symbolInfo.marketStatus = "bullish";
    return symbolInfo;
  }

  if (symbolInfo.ema100 > symbolInfo.ema50 && symbolInfo.ema50 > symbolInfo.ema20) {
    const d20_50 = (symbolInfo.ema50 - symbolInfo.ema20) / ((symbolInfo.ema20 + symbolInfo.ema50)/2);
    if((d20_50*100) < process.env.EMA_MINIMUM_DIF_PERCENT){
      return false;
    }
    const d50_100 = (symbolInfo.ema100 - symbolInfo.ema50) / ((symbolInfo.ema100 + symbolInfo.ema50)/2);
    if((d50_100 * 100) < process.env.EMA_MINIMUM_DIF_PERCENT){
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

function getEntryPosissionSymbols(symbolesInfo,priceList){
  for(let i in symbolesInfo){
    let price = priceList[symbolesInfo[i].symbol];
    console.log("symbol:",symbolesInfo[i].symbol,":",price);
  }
}

async function main() {
  const priceList = await binance.prices();
  const symbolesInfo = await getSymbolesInfo();
  getEntryPosissionSymbols(symbolesInfo,priceList);
}

main();