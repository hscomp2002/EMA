
require("dotenv").config();
const axios = require('axios');
const httpBuildQuery = require('http-build-query');
class TelegramController {
    static async sendMsg(msg){
        const chat_id = process.env.TLG_CHAT_ID;
        const token = process.env.TLG_TOKEN;
        let url = `https://api.telegram.org/bot${token}/sendMessage?`;
        var obj = {
            text:msg,
            chat_id:chat_id,
            reply_to_message_id:null,
            disable_notification: true,
            disable_web_page_preview:null,
            parse_mode:null
          };
          url += httpBuildQuery(obj);
          axios.get(url)
          .then(function (response) {
            //console.log(response);
          })
          .catch(function (error) {
            console.log(error);
          });
    }
}

module.exports = TelegramController;