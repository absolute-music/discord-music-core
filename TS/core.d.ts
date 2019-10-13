import { Message } from "discord.js";
export interface musicClient {
    google_api_key: string;
    youtube: any;
    queueList: any;
    settings: ClientOptions;
}
export declare type ClientOptions = {
    earProtections?: boolean;
    loop?: boolean;
    songChooseTimeout?: number;
    volume?: number;
};
export declare class musicClient {
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
    constructor(YouTubeApiKey: string, options?: ClientOptions);
    /**
     * Play the music requested in a voice channel with the command user.
     *
     * If there is a queue for playing, the searched video will be queued instead.
     * @param msg The message object that triggers the command.
     * @param {string} searchQuery Search string for the video/YouTube video URL/YouTube playlist URL
     */
    play(msg: Message, searchQuery: string): Promise<void | Message>;
    /**
     * Play the music requested in a voice channel with the command user.
     *
     * If there is a queue for playing, the searched video will be queued on top of others instead.
     *
     * The bot will return the command if a playlist URL is used.
     * @param msg The message object that triggers the command.
     * @param {string} searchQuery Search string for the video/YouTube video URL
     */
    playTop(msg: Message, searchQuery: string): Promise<void | Message>;
    /**
     * Stops music and remove the music queue.
     *
     * This will also cause the bot to leave the voice channel.
     * @param msg The message object that triggers the command.
     */
    stop(msg: Message): Promise<void | Message>;
    /**
     * Skips the music which the bot is now playing.
     *
     * If this is the last song in the queue,
     * this will also cause the bot to leave the voice channel.
     * @param msg The message object that triggers the command.
     */
    skip(msg: Message): Promise<void | Message>;
    /**
     * Displays the music queue.
     * @param msg The message object that triggers the command.
     */
    showQueue(msg: Message): Promise<void | Message>;
    /**
     * Displays the music now playing.
     * @param msg The message object that triggers the command.
     */
    nowPlaying(msg: Message): Promise<void | Message>;
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
    remove(msg: Message, queueIndex: number): void | Promise<void | Message>;
    /**
     * Repeats the first song in queue.
     *
     * Looping the song queue will be disabled upon usage of this command.
     * @param msg The message object that triggers the command.
     */
    repeat(msg: any): any;
    /**
     * Loops the whole song queue.
     *
     * Repeat a single song will be disabled upon usage of this command.
     * @param msg The message object that triggers the command.
     */
    loop(msg: Message): Promise<void | Message>;
    /**
     * Shuffles the whole music queue.
     * @param msg The message object that triggers the command.
     */
    shuffle(msg: any): any;
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
    volume(msg: Message, volume?: number): Promise<Message | Message[]> | Promise<void | Message>;
    /**
     * Pause the music playback.
     * @param msg The message object that triggers the command.
     */
    pause(msg: Message): Promise<Message | Message[]>;
    /**
     * Resumes the music playback.
     * @param msg The message object that triggers the command.
     */
    resume(msg: Message): Promise<Message | Message[]>;
}
