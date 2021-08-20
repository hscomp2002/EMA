"use strict"

require("dotenv").config();
const ema = require("keltnerchannel").ema;
const Binance = require("node-binance-api");
const binance = new Binance().options({
  APIKEY: process.env.APIKEY,
  APISECRET: process.env.APISECRET
});


function EMACalc(mArray,Days) {
  var k = 5/(Days + 1);
  mArray = mArray.reverse();
  console.log("k=",k);
  // first item is just the same as the first item in the input
  let emaArray=[];
  emaArray[0] = mArray[0];
  // for the rest of the items, they are computed with the previous one
  for (var i = 1; i < mArray.length; i++) {
    console.log(mArray[i],"*",k,"+",emaArray[i - 1],"*",1-k,mArray[i] * k + emaArray[i - 1] * (1 - k));
    emaArray.push(mArray[i] * k + emaArray[i - 1] * (1 - k));
  }
  let currentEma = [...emaArray].pop();
  //return emaArray;
  return +currentEma;
}

function getSymbolEmaANDLastClose(symbol) {
  return new Promise((resolve, reject) => {
    try {
      binance.candlesticks(symbol, process.env.TIMEFRAME, (error, ticks, symbol) => {
        let closePriceArray = [];
        for (let i in ticks) {
          if (i != ticks.length - 1) {
            closePriceArray.push(Number(ticks[i][4]));
          }
        }
        let OUT = {};
        let tmp = closePriceArray.slice(90, 100);
        console.log("last50" ,tmp);
        OUT["ema10"] = EMACalc(tmp,10);
        OUT["ema20"] = ema(closePriceArray.slice(80, 100),20);
        OUT["ema50"] = ema(closePriceArray.slice(50, 100),50);
        OUT["ema100"] = ema(closePriceArray, 100);
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
    const d20_50 = (symbolInfo.ema20 - symbolInfo.ema50) / ((symbolInfo.ema20 + symbolInfo.ema50) / 2);
    if ((d20_50) < process.env.EMA_MINIMUM_DIF_PERCENT) {
      return false;
    }
    const d50_100 = (symbolInfo.ema50 - symbolInfo.ema100) / ((symbolInfo.ema50 + symbolInfo.ema100) / 2);
    if ((d50_100) < process.env.EMA_MINIMUM_DIF_PERCENT) {
      return false;
    }
    symbolInfo.marketStatus = "bullish";
    return symbolInfo;
  }

  if (symbolInfo.ema100 > symbolInfo.ema50 && symbolInfo.ema50 > symbolInfo.ema20) {
    const d20_50 = (symbolInfo.ema50 - symbolInfo.ema20) / ((symbolInfo.ema20 + symbolInfo.ema50) / 2);
    if ((d20_50) < process.env.EMA_MINIMUM_DIF_PERCENT) {
      return false;
    }
    const d50_100 = (symbolInfo.ema100 - symbolInfo.ema50) / ((symbolInfo.ema100 + symbolInfo.ema50) / 2);
    if ((d50_100) < process.env.EMA_MINIMUM_DIF_PERCENT) {
      return false;
    }
    symbolInfo.marketStatus = "bearish";
    return symbolInfo;
  }

  return false;
}

async function getSymbolesInfo() {
  const CURRENCY_LIST = JSON.parse(process.env.CURRENCY_LIST);
  let symbolsData = [];
  for (let symbole in CURRENCY_LIST) {
    let index = symbole;
    symbole = symbole.replace("/", "");
    let symbolInfo = await getSymbolEmaANDLastClose(symbole);
    console.log("symbole:",symbole,symbolInfo);
    let checkData = calculateSymbolsInfo(symbolInfo);
    // if (!checkData) {
    //   continue;
    // }

    symbolsData.push({
      symbol: symbole,
      symbolInfo: checkData,
      botsData: CURRENCY_LIST[index]
    });
  }
  return symbolsData;
}

function getEntryPosissionSymbols(symbolesInfo) {
  let signals = [];
  for (let i in symbolesInfo) {

    let lastClosePrice = symbolesInfo[i].symbolInfo.lastClose;
    let ema20 = symbolesInfo[i].symbolInfo.ema20;
    let ema50 = symbolesInfo[i].symbolInfo.ema50;
    let ema100 = symbolesInfo[i].symbolInfo.ema100;
    let lastCandleColor = symbolesInfo[i].symbolInfo.lastCandleColor;
    let marketStatus = symbolesInfo[i].symbolInfo.marketStatus;

    if (isEqual(ema20, lastClosePrice)) {
      if (marketStatus == "bullish" && lastCandleColor == "red") {
        // LONG POSITION
        let tmpSignal = {
          ema20,
          ema50,
          ema100,
          lastClosePrice,
          ema:20,
          symbol: symbolesInfo[i].symbol,
          threeCommasBotId: symbolesInfo[i].botsData.long,
          sl: ema50,
          tp: lastClosePrice + (ema20-ema50)  * 1.5
        }
        signals.push(tmpSignal);
      }
      else if (marketStatus == "bearish" && lastCandleColor == "green") {
        // SHORT POSITION
        let tmpSignal = {
          ema20,
          ema50,
          ema100,
          lastClosePrice,
          ema:20,
          symbol: symbolesInfo[i].symbol,
          threeCommasBotId: symbolesInfo[i].botsData.short,
          sl: ema50,
          tp: lastClosePrice - (ema50-ema20)  * 1.5
        }
        signals.push(tmpSignal);
      }
    }


    if (isEqual(ema50, lastClosePrice)) {
      if (marketStatus == "bullish" && lastCandleColor == "red") {
        // LONG POSITION
        let tmpSignal = {
          ema20,
          ema50,
          ema100,
          lastClosePrice,
          ema:50,
          symbol: symbolesInfo[i].symbol,
          threeCommasBotId: symbolesInfo[i].botsData.long,
          sl: ema100,
          tp: lastClosePrice + (ema50-ema100)  * 1.5
        }
        signals.push(tmpSignal);
      }
      else if (marketStatus == "bearish" && lastCandleColor == "green") {
        // SHORT POSITION
        let tmpSignal = {
          ema20,
          ema50,
          ema100,
          lastClosePrice,
          ema:50,
          symbol: symbolesInfo[i].symbol,
          threeCommasBotId: symbolesInfo[i].botsData.short,
          sl: ema100,
          tp: lastClosePrice - (ema100-ema50)  * 1.5
        }
        signals.push(tmpSignal);
      }
    }

    if (isEqual(ema100, lastClosePrice)) {
      if (marketStatus == "bullish" && lastCandleColor == "red") {
        // LONG POSITION
        let tmpSignal = {
          ema20,
          ema50,
          ema100,
          lastClosePrice,
          ema:100,
          symbol: symbolesInfo[i].symbol,
          threeCommasBotId: symbolesInfo[i].botsData.long,
          sl: lastClosePrice - (ema50-ema100) ,
          tp: lastClosePrice + (ema50-ema100)  * 1.5
        }
        signals.push(tmpSignal);
      }
      else if (marketStatus == "bearish" && lastCandleColor == "green") {
        // SHORT POSITION
        let tmpSignal = {
          ema20,
          ema50,
          ema100,
          lastClosePrice,
          ema:100,
          symbol: symbolesInfo[i].symbol,
          threeCommasBotId: symbolesInfo[i].botsData.short,
          sl: lastClosePrice + (ema100-ema50),
          tp: lastClosePrice - (ema100-ema50)  * 1.5
        }
        signals.push(tmpSignal);
      }
    }
  }
  console.log(symbolesInfo);
  console.log({signals});
  return signals;
}

function isEqual(ema, price) {
  const upSide = ema + ema * process.env.PRICE_AREA;
  const downSide = ema - ema * process.env.PRICE_AREA;
  return (price <= upSide && price >= downSide);
}

async function main() {
  //const priceList = await binance.prices();
  const symbolesInfo = await getSymbolesInfo();
  //getEntryPosissionSymbols(symbolesInfo);
}

main();