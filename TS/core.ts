import { Message, RichEmbed, VoiceChannel } from "discord.js"
import * as ytdl from "ytdl-core"
var YouTube = require("simple-youtube-api")
export interface musicClient {
    google_api_key: string
    youtube: any
    queueList: any
    settings: ClientOptions
}

export type ClientOptions = {
    earProtections?: boolean
    loop?: boolean
    songChooseTimeout?: number
    volume?: number
}

export class musicClient {
    /** 
     * Options for the music client
     * @typedef {object} ClientOptions
     * @property {boolean} [earProtections=true] Whether to protect ears from high volume of music.
     * @property {boolean} [loop=false] Whether to loop the queue by default. 
     * @property {number} [songChooseTimeout=10] The default timeout for song choosing, in terms of seconds.
     * @property {number} [volume=30] The default client volume to be used.
     */

    /**
     * @param {string} YouTubeApiKey The YouTube Data Api Key v3 to use.
     * @param {ClientOptions} [options] The music client options avalible to configure.
     */
    public constructor(YouTubeApiKey: string, options: ClientOptions = { 
        earProtections: true,
        loop: false,
        songChooseTimeout: 10,
        volume: 30
    }) {
        if (typeof YouTubeApiKey !== "string") throw new Error("The YouTube Api Key provided is not a string.")
        this.google_api_key = YouTubeApiKey
        this.youtube = new YouTube(this.google_api_key)
        this.queueList = new Map()
        this.settings = {}
        if (options.songChooseTimeout) this.settings.songChooseTimeout = options.songChooseTimeout * 1000
        else this.settings.songChooseTimeout = 10000
        if (options.volume) this.settings.volume = options.volume
        else this.settings.volume = 30
        if (options.earProtections !== true) {
            console.log("Caution : The volume limit cap has been removed.\nPlease be sure not to unintentionally input a volume higher than 100, or it may damage your device and/or ears.")
            this.settings.earProtections = options.earProtections
        }
        else this.settings.earProtections = true
        if (options.loop) this.settings.loop = options.loop
        else this.settings.loop = false
    }
    /**
     * Play the music requested in a voice channel with the command user.
     * 
     * If there is a queue for playing, the searched video will be queued instead.
     * @param msg The message object that triggers the command.
     * @param {string} searchQuery Search string for the video/YouTube video URL/YouTube playlist URL
     */
    public async play(msg: Message, searchQuery: string) {
        if (typeof searchQuery !== "string") return console.log("The query provided is not a string.")
        const youtube = this.youtube
        const url = searchQuery ? searchQuery.replace(/<(.+)>/g, '$1') : '';
        const voiceChannel = msg.member.voiceChannel;
        if (!voiceChannel) return msg.channel.send('I\'m sorry but you need to be in a voice channel to play music!').then((m: Message) => {
            return m.delete(10000).catch((reason) => {
                console.log(`Attempting to delete a deleted message (Which is impossible)`)
            })
        })
        const permissions = voiceChannel.permissionsFor(msg.client.user);
        if (!permissions.has('CONNECT'))
            return msg.channel.send('I cannot connect to your voice channel, make sure I have the proper permissions!').then((m: Message) => {
                return m.delete(10000).catch((reason) => {
                    console.log(`Attempting to delete a deleted message (Which is impossible)`)
                })
            })
        if (!permissions.has('SPEAK'))
            return msg.channel.send('I cannot speak in this voice channel, make sure I have the proper permissions!').then((m: Message) => {
                return m.delete(10000).catch((reason) => {
                    console.log(`Attempting to delete a deleted message (Which is impossible)`)
                })
            })
        if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
            const playlist = await youtube.getPlaylist(url);
            const videos = await playlist.getVideos();
            let video: any
            for (video of Object.values(videos)) {
                const video2 = await youtube.getVideoByID(video.id)
                await musicFunctions.handleVideo(this.queueList, video2, msg, voiceChannel, this.settings.volume, this.settings.loop, false, true);
            }
            return msg.channel.send(`✅ Playlist: **${playlist.title}** has been added to the queue!`).then((m: Message) => {
                return m.delete(10000).catch((reason) => {
                    console.log(`Attempting to delete a deleted message (Which is impossible)`)
                })
            })
        } else {
            try {
                var video = await youtube.getVideo(url);
            } catch (error) {
                try {
                    var videos = await youtube.searchVideos(searchQuery, 10);
                    let index = 0;
                    msg.channel.send(`
__**Song selection:**__

${videos.map((video2) => { return `**${++index} -** ${video2.title}` }).join('\n')}

Please provide a value to select one of the search results ranging from 1-10.
					`).then((m: Message) => {
                        return m.delete(10000).catch((reason) => {
                            console.log(`Attempting to delete a deleted message (Which is impossible)`)
                        })
                    })
                    try {
                        var response = await msg.channel.awaitMessages((msg2) => { return msg2.content > 0 && msg2.content < 11 }, {
                            errors: ['time'],
                            maxMatches: 1,
                            time: this.settings.songChooseTimeout
                        });
                    } catch (err) {
                        console.error(err);
                        return msg.channel.send('No or invalid value entered, cancelling video selection.').then((m: Message) => {
                            return m.delete(10000).catch((reason) => {
                                console.log(`Attempting to delete a deleted message (Which is impossible)`)
                            })
                        })
                    }
                    const videoIndex = parseInt(response.first().content);
                    var video = await youtube.getVideoByID(videos[videoIndex - 1].id);
                } catch (err) {
                    console.error(err);
                    return msg.channel.send('🆘 I could not obtain any search results.').then((m: Message) => {
                        return m.delete(10000).catch((reason) => {
                            console.log(`Attempting to delete a deleted message (Which is impossible)`)
                        })
                    })
                }
            }
            return musicFunctions.handleVideo(this.queueList, video, msg, voiceChannel, this.settings.volume, this.settings.loop)
        }
    }
    /**
     * Play the music requested in a voice channel with the command user.
     * 
     * If there is a queue for playing, the searched video will be queued on top of others instead.
     * 
     * The bot will return the command if a playlist URL is used.
     * @param msg The message object that triggers the command.
     * @param {string} searchQuery Search string for the video/YouTube video URL
     */
    public async playTop(msg: Message, searchQuery: string) {
        var youtube = this.youtube
        const url = searchQuery ? searchQuery.replace(/<(.+)>/g, '$1') : '';
        const voiceChannel = msg.member.voiceChannel;
        if (!voiceChannel)
            return msg.channel.send('I\'m sorry but you need to be in a voice channel to play music!').then((m: Message) => {
                return m.delete(10000).catch((reason) => {
                    console.log(`Attempting to delete a deleted message (Which is impossible)`)
                })
            })
        const permissions = voiceChannel.permissionsFor(msg.client.user);
        if (!permissions.has('CONNECT'))
            return msg.channel.send('I cannot connect to your voice channel, make sure I have the proper permissions!').then((m: Message) => {
                return m.delete(10000).catch((reason) => {
                    console.log(`Attempting to delete a deleted message (Which is impossible)`)
                })
            })
        if (!permissions.has('SPEAK'))
            return msg.channel.send('I cannot speak in this voice channel, make sure I have the proper permissions!').then((m: Message) => {
                return m.delete(10000).catch((reason) => {
                    console.log(`Attempting to delete a deleted message (Which is impossible)`)
                })
            })
        if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/))
            return msg.channel.send("You cannot use the playTop command with a playlist.").then((m: Message) => {
                return m.delete(10000).catch((reason) => {
                    console.log(`Attempting to delete a deleted message (Which is impossible)`)
                })
            })
        else {
            try {
                var video = await youtube.getVideo(url);
            } catch (error) {
                try {
                    var videos = await youtube.searchVideos(searchQuery, 10);
                    let index = 0;
                    msg.channel.send(`
__**Song selection:**__

${videos.map((video2) => { return `**${++index} -** ${video2.title}` }).join('\n')}

Please provide a value to select one of the search results ranging from 1-10.
					`).then((m: Message) => {
                        return m.delete(10000).catch((reason) => {
                            console.log(`Attempting to delete a deleted message (Which is impossible)`)
                        })
                    })
                    try {
                        var response = await msg.channel.awaitMessages((msg2) => { return msg2.content > 0 && msg2.content < 11 }, {
                            errors: ['time'],
                            maxMatches: 1,
                            time: this.settings.songChooseTimeout
                        });
                    } catch (err) {
                        console.error(err);
                        return msg.channel.send('No or invalid value entered, cancelling video selection.').then((m: Message) => {
                            return m.delete(10000).catch((reason) => {
                                console.log(`Attempting to delete a deleted message (Which is impossible)`)
                            })
                        })
                    }
                    const videoIndex = parseInt(response.first().content);
                    var video = await youtube.getVideoByID(videos[videoIndex - 1].id);
                } catch (err) {
                    console.error(err);
                    return msg.channel.send('🆘 I could not obtain any search results.').then((m: Message) => {
                        return m.delete(10000).catch((reason) => {
                            console.log(`Attempting to delete a deleted message (Which is impossible)`)
                        })
                    })
                }
            }
            return musicFunctions.handleVideo(this.queueList, video, msg, voiceChannel, this.settings.volume, this.settings.loop, true)
        }
    }
    /**
     * Stops music and remove the music queue.
     * 
     * This will also cause the bot to leave the voice channel.
     * @param msg The message object that triggers the command. 
     */
    public stop(msg: Message) {
        const queue = this.queueList
        const serverQueue = queue.get(msg.guild.id);
        if (!msg.member.voiceChannel) return msg.channel.send('You are not in a voice channel!').then((m: Message) => {
            return m.delete(10000).catch((reason) => {
                console.log(`Attempting to delete a deleted message (Which is impossible)`)
            })
        })
        if (!serverQueue) return msg.channel.send('There is nothing playing that I could stop for you.').then((m: Message) => {
            return m.delete(10000).catch((reason) => {
                console.log(`Attempting to delete a deleted message (Which is impossible)`)
            })
        })
        serverQueue.songs = [];
        serverQueue.connection.dispatcher.end("Bot got stopped.")
    }
    /**
     * Skips the music which the bot is now playing.
     * 
     * If this is the last song in the queue,
     * this will also cause the bot to leave the voice channel.
     * @param msg The message object that triggers the command. 
     */
    public skip(msg: Message) {
        const queue = this.queueList
        const serverQueue = queue.get(msg.guild.id);
        if (!msg.member.voiceChannel) return msg.channel.send('You are not in a voice channel!').then((m: Message) => {
            return m.delete(10000).catch((reason) => {
                console.log(`Attempting to delete a deleted message (Which is impossible)`)
            })
        })
        if (!serverQueue) return msg.channel.send('There is nothing playing that I could skip for you.').then((m: Message) => {
            return m.delete(10000).catch((reason) => {
                console.log(`Attempting to delete a deleted message (Which is impossible)`)
            })
        })
        serverQueue.connection.dispatcher.end("Song got skipped.")
    }
    /**
     * Displays the music queue.
     * @param msg The message object that triggers the command. 
     */
    public showQueue(msg: Message) {
        const queue = this.queueList
        const serverQueue = queue.get(msg.guild.id);
        if (!serverQueue) return msg.channel.send('There is nothing playing.').then((m: Message) => {
            return m.delete(10000).catch((reason) => {
                console.log(`Attempting to delete a deleted message (Which is impossible)`)
            })
        })
        var index = 0
        var songArray = serverQueue.songs.map((song) => { return `**${++index}-** [${song.title}](${song.url})` })
        musicFunctions.addMusicQueueField(msg, songArray, queue).then(async (results) => {
            for (let i = 0; i < results.length; i++) {
                await new Promise((r) => { return setTimeout(r, 500) })
                const element = results[i];
                msg.channel.send(element).then((m: Message) => {
                    return m.delete(30000).catch((reason) => {
                        console.log(`Attempting to delete a deleted message (Which is impossible)`)
                    })
                })
            }
        })
    }
    /**
     * Displays the music now playing.
     * @param msg The message object that triggers the command. 
     */
    public nowPlaying(msg: Message) {
        const queue = this.queueList
        const serverQueue = queue.get(msg.guild.id);
        if (!serverQueue) return msg.channel.send('There is nothing playing.').then((m: Message) => {
            return m.delete(10000).catch((reason) => {
                console.log(`Attempting to delete a deleted message (Which is impossible)`)
            })
        })
        var embed = new RichEmbed()
            .setColor(Math.floor(Math.random() * 16777214) + 1)
            .setTimestamp()
            .setThumbnail(serverQueue.songs[0].icon)
            .addField(`Now playing in ${msg.guild.name}:`, `[**${serverQueue.songs[0].title}**](${serverQueue.songs[0].url})`)
            .setFooter(`Requested by ${msg.author.username}`, msg.author.avatarURL)
        return msg.channel.send(embed).then((m: Message) => {
            return m.delete(10000).catch((reason) => {
                console.log(`Attempting to delete a deleted message (Which is impossible)`)
            })
        })
    }
    /** 
     * Removes a certain song in the music queue.
     * 
     * You cannot remove the first song in the queue with this method.
     * @param msg The message object that triggers the command.
     * @param {number} queueIndex The index for the song in the queue.
     * @example
     * // Song queue :
     * // 1. National Anthem of USSR,
     * // 2. Do you hear the people sing?
     * 
     * // I wanted to remove the song "Do you hear the people sing?".
     * musicClient.remove(2)
     * // New song queue :
     * // 1. National Anthem of USSR
     */
    public remove(msg: Message, queueIndex: number) {
        if (typeof queueIndex !== "number") return console.log("The query provided is not a number.")
        const queue = this.queueList
        const serverQueue = queue.get(msg.guild.id);
        if (!serverQueue) return msg.channel.send('There is nothing playing.').then((m: Message) => {
            return m.delete(10000).catch((reason) => {
                console.log(`Attempting to delete a deleted message (Which is impossible)`)
            })
        })
        var deleteIndex = queueIndex - 1
        if (deleteIndex === 0) return msg.channel.send(`You cannot remove the song that is now playing. To remove it, use skip command instead.`).then((m: Message) => {
            return m.delete(10000).catch((reason) => {
                console.log(`Attempting to delete a deleted message (Which is impossible)`)
            })
        })
        var removed = serverQueue.songs.splice(deleteIndex, 1)
        msg.channel.send(`**${removed[0].title}** has been removed from the queue.`).then((m: Message) => {
            return m.delete(10000).catch((reason) => {
                console.log(`Attempting to delete a deleted message (Which is impossible)`)
            })
        })
        var index = 0
        var songArray = serverQueue.songs.map((song) => { return `**${++index}-** [${song.title}](${song.url})` })
        musicFunctions.addMusicQueueField(msg, songArray, queue).then(async (results) => {
            for (let i = 0; i < results.length; i++) {
                await new Promise((r) => { return setTimeout(r, 500) })
                const element = results[i];
                msg.channel.send(element).then((m: Message) => {
                    return m.delete(30000).catch((reason) => {
                        console.log(`Attempting to delete a deleted message (Which is impossible)`)
                    })
                })
            }
        })
    }
    /**
     * Repeats the first song in queue.
     * 
     * Looping the song queue will be disabled upon usage of this command.
     * @param msg The message object that triggers the command. 
     */
    public repeat(msg) {
        const serverQueue = this.queueList.get(msg.guild.id);
        if (!serverQueue) return msg.channel.send('There is nothing playing.').then((m) => {
            return m.delete(10000).catch((reason) => {
                console.log(`Attempting to delete a deleted message (Which is impossible)`)
            })
        })
        if (serverQueue.repeat === false) {
            serverQueue.repeat = true
            msg.channel.send("The first song in the queue is now being repeated.").then((m) => {
                return m.delete(10000).catch((reason) => {
                    console.log(`Attempting to delete a deleted message (Which is impossible)`)
                })
            })
            if (serverQueue.loop === true) {
                serverQueue.loop = false
                msg.channel.send("Looping has been disabled to avoid confusion.").then((m) => {
                    return m.delete(10000).catch((reason) => {
                        console.log(`Attempting to delete a deleted message (Which is impossible)`)
                    })
                })
            }
        } else {
            serverQueue.repeat = false
            msg.channel.send("The first song in the queue is no longer being repeated.").then((m) => {
                return m.delete(10000).catch((reason) => {
                    console.log(`Attempting to delete a deleted message (Which is impossible)`)
                })
            })
        }
    }
    /**
     * Loops the whole song queue.
     * 
     * Repeat a single song will be disabled upon usage of this command.
     * @param msg The message object that triggers the command. 
     */
    public loop(msg: Message) {
        const queue = this.queueList
        const serverQueue = queue.get(msg.guild.id);
        if (!serverQueue) return msg.channel.send('There is nothing playing.').then((m: Message) => {
            return m.delete(10000).catch((reason) => {
                console.log(`Attempting to delete a deleted message (Which is impossible)`)
            })
        })
        if (serverQueue.loop === false) {
            serverQueue.loop = true
            msg.channel.send("The song queue is now being looped.").then((m: Message) => {
                return m.delete(10000).catch((reason) => {
                    console.log(`Attempting to delete a deleted message (Which is impossible)`)
                })
            })
            if (serverQueue.repeat === true) {
                serverQueue.repeat = false
                msg.channel.send("Repeating the first song has been disabled to avoid confusion.").then((m: Message) => {
                    return m.delete(10000).catch((reason) => {
                        console.log(`Attempting to delete a deleted message (Which is impossible)`)
                    })
                })
            }
        } else {
            serverQueue.loop = false
            msg.channel.send("The song queue is no longer being looped.").then((m: Message) => {
                return m.delete(10000).catch((reason) => {
                    console.log(`Attempting to delete a deleted message (Which is impossible)`)
                })
            })
        }
    }
    /**
     * Shuffles the whole music queue.
     * @param msg The message object that triggers the command.
     */
    public shuffle(msg) {
        const queue = this.queueList
        const serverQueue = queue.get(msg.guild.id);
        if (!serverQueue) return msg.channel.send('There is nothing playing.').then((m) => {
            return m.delete(10000).catch((reason) => {
                console.log(`Attempting to delete a deleted message (Which is impossible)`)
            })
        })
        musicFunctions.shuffleArray(serverQueue.songs)
        var index = 0
        var songArray = serverQueue.songs.map((song) => { return `**${++index}-** [${song.title}](${song.url})` })
        musicFunctions.addMusicQueueField(msg, songArray, queue).then(async (results) => {
            for (let i = 0; i < results.length; i++) {
                await new Promise((r) => { return setTimeout(r, 500) })
                const element = results[i];
                msg.channel.send(element).then((m) => {
                    return m.delete(30000).catch((reason) => {
                        console.log(`Attempting to delete a deleted message (Which is impossible)`)
                    })
                })
            }
        })
        msg.channel.send("Song queue has been shuffled.").then((m) => {
            return m.delete(30000).catch((reason) => {
                console.log(`Attempting to delete a deleted message (Which is impossible)`)
            })
        })
    }
    /**
     * Changes the volume of the music.
     * 
     * The default volume is 20/100, which is safe to turn the music bot volume in discord to 100%.
     * Tuning up the volume higher than 50 is not recommended.
     * 
     * Any negative numbers in the volume will only cause the bot to display current volume.
     * 
     * This will NOT cause any performance issues as stated from some music bot developers.
     * @param msg The message object that triggers the command.
     * @param {number} volume A number to change the volume based on 100.
     */
    public volume(msg: Message, volume: number = -1) {
        if (typeof volume !== "number") return msg.channel.send("The volume provided is not a number").then((m: Message) => {
            return m.delete(10000).catch((reason) => {
                console.log(`Attempting to delete a deleted message (Which is impossible)`)
            })
        })
        const queue = this.queueList
        const serverQueue = queue.get(msg.guild.id);
        if (!msg.member.voiceChannel) return msg.channel.send('You are not in a voice channel!').then((m: Message) => {
            return m.delete(10000).catch((reason) => {
                console.log(`Attempting to delete a deleted message (Which is impossible)`)
            })
        })
        if (!serverQueue) return msg.channel.send('There is nothing playing.').then((m: Message) => {
            return m.delete(10000).catch((reason) => {
                console.log(`Attempting to delete a deleted message (Which is impossible)`)
            })
        })
        if (volume > 100 && this.settings.earProtections === true) return msg.channel.send(`I think you still need your ears for listening to more beautiful music.\nThe volume limit was capped on 100. The volume has not been modified. The current volume is ${serverQueue.volume}.`)
        if (volume > 100) msg.channel.send("WARNING : THE MUSIC WILL PLAY IN AN EXTREMELY LOUD VOLUME.").then((m: Message) => {
            return m.delete(15000).catch((reason) => {
                console.log(`Attempting to delete a deleted message (Which is impossible)`)
            })
        })
        if (volume < 0) return msg.channel.send(`The current volume is ${serverQueue.volume}.`).then((m: Message) => {
            return m.delete(10000).catch((reason) => {
                console.log(`Attempting to delete a deleted message (Which is impossible)`)
            })
        })
        serverQueue.volume = volume;
        serverQueue.connection.dispatcher.setVolumeLogarithmic(volume / 100);
        return msg.channel.send(`I set the volume to: **${volume}**`).then((m: Message) => {
            return m.delete(10000).catch((reason) => {
                console.log(`Attempting to delete a deleted message (Which is impossible)`)
            })
        })
    }
    /**
     * Pause the music playback.
     * @param msg The message object that triggers the command.
     */
    public pause(msg: Message) {
        const queue = this.queueList
        const serverQueue = queue.get(msg.guild.id);
        if (serverQueue.paused === false) {
            serverQueue.paused = true
            return msg.channel.send("The song playback has been stopped.")
        } else {
            return msg.channel.send("The song playback is already stopped.")
        }
    }
    /**
     * Resumes the music playback.
     * @param msg The message object that triggers the command.
     */
    public resume(msg: Message) {
        const queue = this.queueList
        const serverQueue = queue.get(msg.guild.id);
        if (serverQueue.paused === true) {
            serverQueue.paused = false
            return msg.channel.send("The song playback has been resumed.")
        } else {
            return msg.channel.send("The song playback is not stopped.")
        }
    }
}

const musicFunctions = {
    async addMusicQueueField(msg, content, queue) {
        const serverQueue = queue.get(msg.guild.id);
        var toSendEmbed = []
        var color = Math.floor(Math.random() * 16777214) + 1
        let i = 0
        while (i < content.length) {
            var embed = new RichEmbed()
            let index = 0
            while (i < content.length && index < 25) {
                var list = []
                const element0 = content[i];
                index++
                i++
                const element1 = content[i];
                index++
                i++
                const element2 = content[i];
                index++
                i++
                const element3 = content[i];
                index++
                i++
                const element4 = content[i];
                index++
                i++
                list.push(element0)
                element1 ? list.push(element1) : console.log("Empty element")
                element1 ? list.push(element2) : console.log("Empty element")
                element1 ? list.push(element3) : console.log("Empty element")
                element1 ? list.push(element4) : console.log("Empty element")
                if (i < 25) {
                    embed.setTitle(`Song queue for ${msg.guild.name}`)
                    embed.setDescription(`There are ${serverQueue.songs.length} songs in total.`)
                    embed.setAuthor(msg.author.username, msg.author.avatarURL)
                }
                embed.setTimestamp()
                embed.setFooter(`Now playing : ${serverQueue.songs[0].title}`)
                embed.addField("** **", list.join("\n"))
                embed.setColor(color)
            }
            toSendEmbed.push(embed)
        }
        return toSendEmbed
    },
    async handleVideo(queueList, video: any, msg: Message, voiceChannel: VoiceChannel, musicVolume = 20, loopQueue = false, top = false, playlist = false) {
        const serverQueue = queueList.get(msg.guild.id);
        const song = {
            guild: msg.guild.name,
            icon: video.thumbnails.default.url,
            id: video.id,
            length: {
                hrs: video.duration.hours,
                mins: video.duration.minutes,
                secs: video.duration.seconds
            },
            title: video.title,
            url: `https://www.youtube.com/watch?v=${video.id}`
        };
        if (!serverQueue) {
            var queueConstruct = {
                connection: null,
                loop: loopQueue,
                paused: true,
                repeat: false,
                songs: [],
                textChannel: msg.channel,
                voiceChannel,
                volume: musicVolume
            };
            queueList.set(msg.guild.id, queueConstruct);
            queueConstruct.songs.push(song);
            console.log("Song added to queue.")
            try {
                var connection = await voiceChannel.join();
                queueConstruct.connection = connection;
                musicFunctions.playMusic(msg.guild, queueConstruct.songs[0], queueList);
            } catch (error) {
                console.error(`I could not join the voice channel: ${error}`);
                queueList.delete(msg.guild.id);
                return msg.channel.send(`I could not join the voice channel: ${error}`).then((m: Message) => {
                    return m.delete(10000).catch((reason) => {
                        console.log(`Attempting to delete a deleted message (Which is impossible)`)
                    })
                })
            }
        } else
            if (top) {
                serverQueue.songs.splice(1, 0, song)
                if (playlist) return undefined;
                else return msg.channel.send(`✅ **${song.title}** has been added to the queue!`).then((m: Message) => {
                    return m.delete(10000).catch((reason) => {
                        console.log(`Attempting to delete a deleted message (Which is impossible)`)
                    })
                })
            } else {
                serverQueue.songs.push(song);
                if (playlist) return undefined;
                else return msg.channel.send(`✅ **${song.title}** has been added to the queue!`).then((m: Message) => {
                    return m.delete(10000).catch((reason) => {
                        console.log(`Attempting to delete a deleted message (Which is impossible)`)
                    })
                })
            }
        return undefined;
    },
    playMusic(guild, song, queueList) {
        const serverQueue = queueList.get(guild.id);
        try {
            if (!song) {
                serverQueue.voiceChannel.leave();
                queueList.delete(guild.id);
                return;
            }
        } catch (error) {
            console.log(error)
        }
        const dispatcher = serverQueue.connection.playStream(ytdl(song.url, {
            filter: "audioonly",
            highWaterMark: 1024 * 512,
            quality: "highestaudio"
        })).on('end', (reason) => {
            if (serverQueue.loop === true) {
                console.log("Song ended, but looped")
                var toPush = serverQueue.songs[0]
                serverQueue.songs.push(toPush)
                serverQueue.songs.shift();
                musicFunctions.playMusic(guild, serverQueue.songs[0], queueList);
            } else if (serverQueue.repeat === true) {
                console.log("Song ended, but repeated")
                musicFunctions.playMusic(guild, serverQueue.songs[0], queueList);
            } else {
                if (reason === 'Stream is not generating quickly enough.') console.log('Song ended.')
                else console.log(`${reason}`)
                serverQueue.songs.shift();
                musicFunctions.playMusic(guild, serverQueue.songs[0], queueList);
            }
        }).on('error', (error) => { return console.error(error) });
        dispatcher.setVolumeLogarithmic(serverQueue.volume / 100);
        serverQueue.textChannel.send(`🎶 Start playing: **${song.title}**`).then((m: Message) => {
            return m.delete(10000).catch((reason) => {
                console.log(`Attempting to delete a deleted message (Which is impossible)`)
            })
        })
    },
    shuffleArray(array) {
        let temp = array[0]
        array.splice(0, 1)
        var i; var j; var x;
        for (i = array.length - 1; i > 0; i--) {
            j = Math.floor(Math.random() * (i + 1));
            x = array[i];
            array[i] = array[j];
            array[j] = x;
        }
        array.unshift(temp)
        temp = []
        return array;
    }

}

module.exports = musicClient