# discord-music-wrapper


[![NPM](https://nodei.co/npm/discord-music-core.svg)](https://nodei.co/npm/discord-music-core/)

_**This package is currently under heavy development.**_
If you encountered any bugs or have some feature requests/questions, please open a new issue and describe it briefly.  
As an alternative, you can join my discord server for further enquiries.

This package can help you with playing music in a discord.js bot.

## musicClientOptions

| Option |Default|Description|
|---|---|---|
|`earProtections`|`true`|Using `false` will by pass the limit on the volume command, accepting volumes higher than `100`.|
|`loop`|`false`|Using `true` will set the loop setting enabled upon queue creation.|
|`songChooseTimeout`|`10`|The song choose timeout after searching for a song, in terms of seconds. Default is `10` seconds.|
|`volume`|`30`|Volume based on `100`, such that the default setting will be `30/100` and thus make the volume safe for turning the music bot volume in discord to 100%. Tuning up the volume higher than `50` is not recommended.|

## Links

Github issues : <https://github.com/Absolute-Development/discord-music-core/issues>  
Github pull requesets : <https://github.com/Absolute-Development/discord-music-core/pulls>  
npm package page : <https://www.npmjs.com/package/discord-music-core>  
