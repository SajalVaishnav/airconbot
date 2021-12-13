require('dotenv').config();
const { Telegraf } = require('telegraf')
const axios = require('axios');
const cheerio =  require('cheerio');

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.start((ctx) => ctx.reply('Welcome! Enter your meterid followed by password in the following format: /check 10000XXX 2210XXXX'))
bot.help((ctx) => ctx.reply('Enter your meterid followed by password in the following format: /check 10000XXX 2210XXXX'))

bot.hears('Jihne Mera Dil Luteya', (ctx) => ctx.reply('Oho'))

bot.use(async (ctx, next) => {
    const start = new Date()
    await next()
    const ms = new Date() - start
    console.log('Response time: %sms', ms)
})

var creditConfig;
var authConfig;

const setCreditConfig = (cookie) => {
    creditConfig = {
        url: 'https://nus-utown.evs.com.sg/EVSEntApp-war/viewMeterCreditServlet',
        method: 'get',
        headers: {
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Content-Type': 'application/x-www-form-urlencoded',
          Connection: 'keep-alive',
          Cookie: cookie
        }
    } 
}

const setAuthConfig = (meterId, password) => {
    authConfig = {
        url: 'https://nus-utown.evs.com.sg/EVSEntApp-war/loginServlet',
        method: 'post',
        data: `txtLoginId=${meterId}&txtPassword=${password}&btnLogin=Login`,
        headers: {
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Content-Type': 'application/x-www-form-urlencoded',
          Connection: 'keep-alive'
        }
    }
}

bot.command('/check', async (ctx) => {
    var meterId = ctx.message.text.slice(7, 15);
    var password = ctx.message.text.slice(16);
    //console.log(meterId + ' ' + password)
    await setAuthConfig(meterId, password)
    axios(authConfig)
    .then(async (authRes) => {
        const cookie = authRes.headers['set-cookie'];
        var checkAuthUrl = authRes.request.res.responseUrl.toString();
        var authStatus = !checkAuthUrl.includes('Invalid');
        //console.log(checkAuthUrl + ' ' + authStatus);
        if(authStatus) {
            await setCreditConfig(cookie);
            axios(creditConfig)
            .then((creditRes) => {
                //console.log(creditRes)
                const $ = cheerio.load(creditRes.data);
                var resultString = 'Last Recorded Credit: ';
                $('.mainContent_normalText').each((i, el) => {
                    const item = $(el).text()
                    if(i == 3) {
                        resultString = resultString.concat(item) + '\n\Last Recorded Timestamp: ' 
                    } else if(i == 4) {
                        resultString = resultString.concat(item) 
                    }
                })
                ctx.reply(resultString)
            });
        } else {
            ctx.reply('Invalid meterId or password!')
        }
    })
    .catch((error) => {
        console.log(error);
        ctx.reply("Yay! We found another one :)\n\The path to success is paved with errors.")
    }) 
})


bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))