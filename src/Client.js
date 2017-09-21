let Discord = require("discord.js")
let fs = require("fs-extra")
let path = require("path")

class CommandClient extends Discord.Client {
  constructor(options) {
    options = options || {}
    super(options)
    this.admins = options.admins
    this.prefix = options.prefix || ""
    this.commandPath = `${(options.commandPath || "ext")}`
    this.commands = {}
    this.loadCommands()
    this.on("message", this.parseMessage.bind(this))
  }
  async parseMessage(msg) {
    let args = msg.content.split(" ")
    let cmdName = args.shift()
    if(!cmdName.startsWith(this.prefix)) return false
    cmdName = cmdName.substring(this.prefix.length)
    if(!this.commands[cmdName]) return false
    let cmd = this.commands[cmdName]
    if((cmd.permissions || cmd.guildOnly) && !msg.guild) {
      return await msg.channel.send("You can't run this in a DM!")
    }
    if(cmd.permissions && !msg.member.hasPermission(cmd.permissions)) {
      return await msg.channel.send(`You need the following permissions to run this command: \`${msg.permissions.join(", ")}\``)
    }
    if(cmd.adminOnly && !this.admins.includes(msg.author.id)) {
      return await msg.channel.send("Only admins are allowed to use this command!")
    }
    this.invoke(cmd, this.generateContext(msg, cmd), ...args)
  }
  generateContext(msg, cmd, ...args) {
    let ctx = {
      send: msg.channel.send.bind(msg.channel),
      args: args,
      bot: this,
      author: msg.author,
      channel: msg.channel,
      message: msg,
      prefix: this.prefix, // prefixUsed,
      command: cmd, 
      invoked_with: cmd.name,
      // history: msg.channel.messages.fetch.bind(msg.channel.messages)
    }
    ctx.invoke = (newCmd, ...args) => this.invoke(ctx, newCmd, ...args)
    ctx.reinvoke = (...args) => this.invoke(ctx, cmd, ...args)
    return ctx
  }
  async invoke(cmd, ctx, ...args) {
    try {
      await cmd.exec(ctx, ...args)
    } catch(e) {
      console.log(e)
      ctx.send("An error occured while processing your command!")
    }
  }
  async loadCommands() {
    let cogs = await fs.readdir(this.commandPath)
    this.commands = {}
    this.cogs = {}
    for(let cogName of cogs) {
      delete require.cache[path.resolve(`${this.commandPath}/${cogName}`)]
      let requiredCog = require(`${this.commandPath}/${cogName}`)
      let cog = new requiredCog(this)
      this.cogs[cogName] = cog
      let cogCmds = Object.getOwnPropertyNames(requiredCog.prototype)
      for(let methodName of cogCmds) {
        if(methodName == "constructor") continue
        let cmd = requiredCog.prototype[methodName]
        let cmdObj = parseDocstring(cmd)
        cmdObj.exec = cmd.bind(cog)
        cmdObj.cog = requiredCog
        let cmdName = cmdObj.name || cmd.name
        cmdObj.name = cmdObj.name || cmd.name
        if(!cmdObj.help) cmdObj.help = "No help provided"
        this.commands[cmdName] = cmdObj
      }
    }
  }
}


function parseDocstring(func) {
  let comment = func.toString()
  let doc = ""
  let match = comment.match(/\/\*[!*]([\s\S]*?)\*\//)
  if(match) {
    doc = match[1]
  }
  let data = {}
  let ops = doc.split("\n").map(op => op.replace(/\\n/g, "\n")).filter(op => !!op.replace(/\s/g, ""))
  for(let itm in ops) {
    let op = ops[itm].replace(/.*@/, "@")
    if(!op.startsWith("@")) throw new SyntaxError(`Expected @ at beginning of docstring line ${itm + 1}`)
    let token = op.split(" ")[0].substring(1)
    data[token] = op.split(" ").slice(1).join(" ") || true
  }
  if(data.permissions) {
    data.permissions = data.permissions.split(" | ").map(perm => isNan(Number(perm)) ? perm : Number(perm))
  }
  return data
}

module.exports = CommandClient
