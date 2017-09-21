class Utilities {
  constructor(bot) {
    // Could be useful :D
    this.bot = bot
  }
  async ping(ctx) {
    /**
     * @guildOnly
     * @help Responds with pong!
     * @usage Dab on all the haters with this cool new ping command!\n*Dabs furiously*
     */
    await ctx.send("Pong!")
  }
  async eval(ctx, ...args) {
    /**
     * @adminOnly
     * @help Evaluates code
     */
    await ctx.send(eval(args.join(" ")))
  }
  async help(ctx, command) {
    /**
     * @help Shows this!
     */
    if(command) {
      let cmd = this.bot.commands[command]
      if(!cmd) return await ctx.send("Command not found!")
      return await ctx.send(`${command} - ${cmd.help}
${cmd.usage|| ""}`, {code: true})
    }
    let helpString = Object.values(this.bot.commands).map(function(cmd) {
      return `${cmd.name} - ${cmd.help}`
    })
    return await ctx.send(helpString)
  }
}

module.exports = Utilities
