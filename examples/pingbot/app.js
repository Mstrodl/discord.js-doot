let Discord = require("../../index.js")
let bot = new Discord.Client({
  commandPath: `${__dirname}/ext`,
  prefix: "gay",
  admins: ["196769986071625728"]
})

bot.login(process.env.TOKEN)
process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at:', p, 'reason:', reason);
  // application specific logging, throwing an error, or other logic here
});

