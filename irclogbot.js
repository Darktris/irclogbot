#!/usr/bin/env node
var libparse = require('argparse');
var libirc = require('irc')
var moment = require('moment');
var fs = require('fs')

var ret
var admins = new Set()
var parser = new libparse.ArgumentParser({
  version: '0.0.1',
  addHelp: true,
  description: 'IRCLogBot.js'
})

parser.addArgument(
  ['-p', '--port'], {
    help: 'Port of the IRC server',
    defaultValue: 6667
  }
)

parser.addArgument(
  ['-s', '--server'], {
    help: 'IP or hostname of the IRC server',
    required: true
  }
)

parser.addArgument(
  ['-n', '--nick'], {
    help: 'Nickname of the bot',
    defaultValue: "LogBot"
  }
)

parser.addArgument(
  ['-pw', '--pass'], {
    help: 'Password for the IRC server',
  }
)

parser.addArgument(
  ['-c', '--cpassw'], {
    help: 'Password for the client access console',
  }
)

parser.addArgument(
  ['-a', '--admin'], {
    help: 'Nickname of the admin',
  }
)

parser.addArgument(
  ['-o', '--output'], {
    help: 'Output directory',
     defaultValue: '.',
  }
)

parser.addArgument(
  ['-nc', '--noconsole'], {
    help: 'Deactivates the CLI interface',
    action: 'storeTrue'
  }
)

var args = parser.parseArgs()
admins.add(args.admin)
console.log("Connecting to: "+args.server+"...")

var bot = new libirc.Client(args.server, args.nick, {
  port: args.port,
  autoRejoin: false,
  channels: []
});

bot.addListener('pm', function(from, message) {
  if (message.startsWith(args.cpassw)) {
    try {
      eval(message.substring(args.cpassw.length, message.length))
    }
    catch (err) {
      console.log(err)
    }
  }
  else if (admins.has(from)) {
    if (message.startsWith("!"))
      try {
        var ret = eval(message.substring(1, message.length))
        if (ret !== undefined) bot.say(from, ret)
      }
    catch (err) {
      console.log(err.toString())
      bot.say(from, err.toString())
    }
  }
});

bot.addListener('message', function (from, to, message) {
    if (!message.startsWith("!") && !message.startsWith(args.cpassw)) 
      fs.appendFile(args.output + '/' + moment().format("YYYYMMDD.[log]"), from + " => " + to + ": " + message + "\n", (err) => {
        console.log("Error while writing data")
        console.log(err)
      })
});

process.stdin.setEncoding('utf8');

if (!args.noconsole)
  process.stdin.on('readable', () => {
    var chunk = process.stdin.read();
    if (chunk !== null) {
      try {
        ret = eval(chunk)
        if (ret !== undefined) console.log(ret)
      }
      catch (err) {
        console.warn(err)
      }
    }
  });
