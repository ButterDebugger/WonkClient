import "./attachments.js";
import "./navbar.js";
import {
    getAllChannelWrappers,
    joinRoom,
    joinedRoomHandler,
    updateChatLock
} from "./chat.js";
import { makeRequest, parseData, registerEvent, init as initComms } from "./comms.js";
import showAlert from "./alert.js";
import { userDisplay } from "./components.js";
import * as binForage from "https://debutter.dev/x/js/binforage.js";
import { getAllMemberWrappers } from "./members.js";

export let userCache = new Map();
export let debugMode = false;
export let client = {
    currentRoom: null,
    rooms: new Map(),
    attachments: [],
    keyPair: await binForage.get("keyPair"),
    homeserver: await binForage.get("homeserver")
};

if (client.keyPair == null || client.homeserver == null) {
    setTimeout(() => {
        location.href = "/login";
    }, 500);
}

initComms();

registerEvent("open", async () => {
    await syncClient();

    if (!client.rooms.has("wonk")) joinRoom("wonk");

    await syncMemory();

    updateChatLock();
});

registerEvent("close", () => {
    updateChatLock();
});

async function syncClient() {
    let syncRes = await makeRequest({
        method: "get",
        url: `${client.homeserver.baseUrl}/sync/client`
    });

    if (syncRes.status !== 200) return showAlert("Failed to sync client", 2500);

    if (debugMode) console.log("sync client", syncRes.data);

    client.username = syncRes.data.you.username;
    client.rooms.clear();

    for (let room of syncRes.data.rooms) {
        client.rooms.set(room.name, room);
        joinedRoomHandler(room);
    }
}

async function syncMemory() {
    let syncRes = await makeRequest({
        method: "get",
        url: `${client.homeserver.baseUrl}/sync/memory`
    });

    if (syncRes.status !== 200) return showAlert("Failed to sync memory", 2500);

    if (debugMode) console.log("sync memory");
}

registerEvent("updateUser", ({ data }) => {
    data = parseData(data);
    if (typeof data == "undefined") return;

    let cacheTime = userCache.get(data.username)?.cacheTime ?? 0;

    if (data.timestamp > cacheTime) {
        userCache.set(data.username, Object.assign(data.data, {
            cacheTime: data.timestamp
        }));
        
        // Dynamically update all elements
        updateUserDynamically(data.data.username, data.data.color, data.data.offline);
    }
});

function updateUserDynamically(username, color, offline) {
    [document, getAllChannelWrappers(), getAllMemberWrappers()].flat().forEach(ele => {
        ele.querySelectorAll(`.username[data-username="${username}"]`).forEach((ele) => {
            ele.replaceWith(userDisplay(username, color, offline));
        });
    });
}

export async function getUsers(...usernames) {
    let users = [];
    let unknowns = [];

    usernames.forEach(username => {
        if (userCache.has(username)) {
            users.push(userCache.get(username));
        } else {
            unknowns.push(username);
        }
    });

    if (unknowns.length > 0) {
        let usersRes = await makeRequest({
            method: "get",
            url: `${client.homeserver.baseUrl}/users/?subscribe=yes&usernames=${unknowns.join(",")}`
        });

        if (usersRes.status == 200) {
            usersRes.data.users.forEach(user => {
                users.push(user);
                userCache.set(user.username, Object.assign(user, {
                    cacheTime: Date.now()
                }));
                updateUserDynamically(user.username, user.color, user.offline);
            });
        }
    }

    return users;
}
