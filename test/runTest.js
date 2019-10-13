const musicClient = require("../index")
function getAllMethodNames(obj) {
    let methods = new Set();
    while (obj = Reflect.getPrototypeOf(obj)) {
        let keys = Reflect.ownKeys(obj)
        keys.forEach((k) => methods.add(k));
    }
    return methods;
}
const music = new musicClient("Some-API-keys-here", {
    awaitSongChoose: 15,
    earProtections: false,
    loop: true,
    volume: 40
})
console.log(music)
console.log(getAllMethodNames(music))
console.log("Test completed !")
