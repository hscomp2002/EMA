'use strict'

const Binance = require('node-binance-api');
const binance = new Binance().options({
  APIKEY: 'ZWTtDTaeoqfbhEnXrkn2S4oixDl6KwBXSWgJioCy8hlbFda1K7fNHqt0SHZ0PJ3z',
  APISECRET: 'O4Hwxfn3ByDfU1xUfXsp7daMc1MCHfkige2eRdfResTiD9dbs7LajKGRCtlAMLig'
});

function EMACalc(mArray, mRange) {
  var k = 2 / (mRange + 1);
  // first item is just the same as the first item in the input
  let emaArray = [mArray[0]];
  // for the rest of the items, they are computed with the previous one
  for (var i = 1; i < mArray.length; i++) {
    emaArray.push(mArray[i] * k + emaArray[i - 1] * (1 - k));
  }
  return emaArray;
}

// Intervals: 1m,3m,5m,15m,30m,1h,2h,4h,6h,8h,12h,1d,3d,1w,1M
binance.candlesticks("BNBUSDT", "15m", (error, ticks, symbol) => {
  //console.info("candlesticks()", ticks);
  let closePriceArray = [];
  for (let i in ticks) {
    if (i != ticks.length - 1) {
    closePriceArray.push(ticks[i][4]);
    }
  }
  //console.info(closePriceArray);
  const EMA10 = EMACalc(closePriceArray, 10);
  console.log(EMA10);
}, { limit: 11, endTime: +new Date() });
