const token = "DISOCRD TOKEN";
const cookie = `UR ACCOUNT COOKIE`

const {Client, GatewayIntentBits, Partials, EmbedBuilder, AttachmentBuilder} = require("discord.js");
const {TwitterDL} = require("twitter-downloader");

// noinspection JSUnresolvedReference
const client = new Client({
    intents: [
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildBans,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Channel],
});

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on("messageCreate", (message) => {
    const content = message.content;
    
    for (const word of content.split(" ")) {
        analyseWord(message, word);
    }
});

function analyseWord(message, word) {
    const regex = /(x\.com|twitter\.com)/;
    const result = regex.test(word);

    if (result) {
        console.log(transformUrl(word));

        TwitterDL(transformUrl(word), {
            cookie: cookie,
        }).then((result) => {
            message.suppressEmbeds(true);
            sendResult(result.result, message, transformUrl(word));
        }).catch(result => console.log(result));
    }
}

function sendResult(result, message, xLink) {
    const embeds = [];
    const attachments = [];

    console.log(result);

    if (result.possiblySensitive && !message.channel.nsfw) {
        result.media = [];
        result.description = "Sensitive Tweet (Need nsfw channel)";
    }

    embeds.push(new EmbedBuilder()
        .setColor(0x000)
        .setDescription(result.description)
        .setAuthor({
            name: `${result.author.username} (${result.author.username})`,
            iconURL: result.author.profileImageUrl,
            url: result.author.url
        })
        .addFields(
            {name: "Retweets", value: result.statistics.retweetCount.toString(), inline: true},
            {name: "Likes", value: result.statistics.favoriteCount.toString(), inline: true},
        )
        .setFooter({
            text: "QuickX", iconURL: client.user.avatarURL()
        })
        .setTimestamp(new Date(result.createdAt))
    );

    let first = true;

    for (const media of result.media || []) {
        if (media.type === "photo") {
            if (first) {
                first = false;

                embeds[0] = embeds[0].setImage(media.image).setURL(media.expandedUrl);
            } else {
                embeds.push(new EmbedBuilder()
                    .setImage(media.image)
                    .setURL(media.expandedUrl)
                )
            }
        } else if (media.type === "video") {
            const url = media.videos.reduce((highest, current) => {
                return current.bitrate > highest.bitrate ? current : highest;
            }).url;

            attachments.push(new AttachmentBuilder(
                url,
                {name: url.split("/").pop().split("?")[0]}
            ));
        }
    }

    try {
        message.reply({
            content: "[Tweet](<" + xLink + ">)",
            files: attachments,
            embeds: embeds
        });
    } catch (e) {
        console.log(e);
    }
}

function transformUrl(url) {
    let endIndex = url.indexOf('?');
    return (endIndex !== -1 ? url.substring(0, endIndex) : url).replace("x.com", "twitter.com").trim();
}

client.login(token);

