const MusicClient = require("./index")
const Discord = require("discord.js")
const musicPlayer = new MusicClient("Some api strings")
const client = new Discord.Client()
client.on("message", (message) => {
    // Some trigger events such as some commands being used
    var searchArray = "Some searches (Or you can put a video url/playlist url in)"
    var volume = 30
    musicPlayer.play(message, searchArray) // Searches for and add the searched results to the queue.
    musicPlayer.playTop(message, searchArray) // Searches for and add the searched results to the top of the queue.
    musicPlayer.stop(message) // Stop the music, which includes clearing the queue.
    musicPlayer.nowPlaying(message) // Display the music title for now playing.
    musicPlayer.showQueue(message) // Displays the whole music queue.
    musicPlayer.skip(message) // Skip the song that is now playing.
    musicPlayer.remove(message) // Removes certain position of song in the song queue.
    musicPlayer.pause(message) // Pauses the music queue.
    musicPlayer.repeat(message) // Repeats the current song.
    musicPlayer.loop(message) // Loops the whole queue.
    musicPlayer.shuffle(message) // Shuffles the whole queue.
    musicPlayer.volume(message, volume) // Sets the volume to the certain amount. Using negative values will show the volume that is using now instead.
})
client.login("Some tokens")
