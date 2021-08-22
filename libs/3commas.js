require("dotenv").config();
const api = new threeCommasAPI({
    apiKey: process.env.COMMAS_APIKEY,
    apiSecret: process.env.COMMAS_SECRETS,
    url: "https://api.3commas.io",
});

class ThreeCommas{
    openDeal(dealData){
        console.log("openDeal");
    }
}

module.exports = ThreeCommas

