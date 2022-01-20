npm initconst { Client , Intents , Collection}  = require('discord.js')
const client = new Client({intents:32767})
const fs = require('fs')
module.exports = client
const {prefix , token , mongo_url } = require('./config.json')
const mongoose = require("mongoose")
const Levels = require("discord-xp")
Levels.setURL(mongo_url)
mongoose.connect(mongo_url, {
useNewUrlParser: true ,  useUnifiedTopology: true 
}).then(console.log("데이터베이스 연결 완료"))

client.slashcommands = new Collection()
let commands = []
const commandsFile1 = fs.readdirSync('./slashcommands').filter(file => file.endsWith('.js'))
for (const file of commandsFile1) {
    const command = require(`./slashcommands/${file}`)
    client.slashcommands.set(command.name, command)
    commands.push({ name : command.name, description: command.description , options: command.options})
}

client.on("interactionCreate", async interaction =>{
    if(!interaction.isCommand()) return;
    const command = client.slashcommands.get(interaction.commandName)
    if (!command) return
    try{
        await command.execute(interaction)
    } catch (err) {
        console.error(err)
        await interaction.reply({ content: "오류가 발생했습니다", ephemeral: true })
    }
})

process.on("unhandledRejection", err=>{
    if(err == "DiscordAPIError: Missing Access") return console.log("봇에게 슬래쉬 커맨드를 서버에 푸쉬 할 권한이 없어서 서버에 슬래쉬 커맨드를 푸쉬하지 못했습니다")
})


client.once('ready',()=>{
    let number = 0
    setInterval(() => {
        const list = ["봇 가동중" , "/도움말" , `${client.guilds.cache.size}개 서버에서 활동중!`]
        if(number == list.length) number = 0
        client.user.setActivity(list[number],{
            type:"PLAYING"
        })
        number++
    }, 10000) //몇초마다 상태메세지를 바꿀지 정해주세요 (1000 = 1초)
    console.log("봇이 준비되었습니다")
})


client.commands = new Collection()

const commandsFile = fs.readdirSync('./commands').filter(file => file.endsWith('.js'))

for(const file of commandsFile){
    const command = require(`./commands/${file}`)
    client.commands.set(command.name , command)
}

client.on('messageCreate' , message=>{
    if(!message.content.startsWith(prefix)) return
    const args = message.content.slice(prefix.length).trim().split(/ +/)
    const commandName = args.shift()
    const command = client.commands.get(commandName)
    if (!command) return
    try{
        command.execute(message,args)
    } catch (error) {
        console.error(error)
    }
})

client.on("messageCreate", async message => {
    if (message.channel.type == "DM") return
    const Schema = require("./models/금지어")
    const args = message.content.slice(prefix.length).trim().split(/ +/)
    if (args[1] == "추가" || args[1] == "삭제") return
    await Schema.find({ serverid: message.guild.id }).exec((err, res) => {
        for (let i = 0; i < res.length; i++) {
            if (message.content.includes(res[i].금지어)) {
                if (res[i].온오프 == "on") {
                    message.delete()
                    const embed = new (require("discord.js")).MessageEmbed()
                    .setTitle("금지어가 감지되었습니다!")
                    .setDescription(`${message.content}에서 금지어 감지됨`)
                    .addField("감지된 금지어", `${res[i].금지어}`)
                    .setColor("RED")
                    .setTimestamp()
                message.channel.send({ embeds: [embed] }).then(msg => {
                    setTimeout(() => {
                        msg.delete()
                    }, 10000)
                })
                }
            }
        }
    })
})

client.login("OTMzNjYwOTM2MTI3MDEyOTE0.YekxgQ.8N3WiC_XNft42ObLrPKLaJ70pmE")