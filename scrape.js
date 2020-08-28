const fs = require(`fs`)
const request = require(`request`)
const mkdirp = require(`mkdirp`)
const ProgressBar = require(`progress`)
const { get } = require(`lodash`)
const download = require(`./utils/download-file`)

const username = process.argv[2]
const access_token = process.argv[3]

if (!username) {
  console.log(
    `
You didn't supply an Instagram username!
Run this command like:

node scrape.js INSTAGRAM_USERNAME
    `
  )
  process.exit()
}

// Convert timestamp to ISO 8601.
const toISO8601 = timestamp => new Date(timestamp * 1000).toJSON()

// Create the progress bar
const bar = new ProgressBar(
  `Downloading instagram posts [:bar] :current/:total :elapsed secs :percent`,
  {
    total: 0,
    width: 30,
  }
)

// Create the images directory
mkdirp.sync(`./data/images`)

let posts = []
let userId

// Write json
const saveJSON = _ =>
  fs.writeFileSync(`./data/posts.json`, JSON.stringify(posts, ``, 2))

const getPosts = maxId => {
  let url = `https://www.instagram.com/${username}/?__a=1`
  let url2 = `https://www.instagram.com/graphql/query/?query_hash=472f257a40c653c64c666ce877d59d2b`

  if (maxId)
    url = url2 + `&variables={"id":"${userId}","first":12,"after":"${maxId}"}`

  request(url, { encoding: `utf8`,
            'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
            'accept-encoding': 'gzip, deflate, br',
            'accept-language': 'en-US,en;q=0.9,fr;q=0.8,ro;q=0.7,ru;q=0.6,la;q=0.5,pt;q=0.4,de;q=0.3',
            'cache-control': 'max-age=0',
            'upgrade-insecure-requests': '1',
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36'
        }, (err, res, body) => {
    if (err) console.log(`error: ${err}`)
    if (maxId) {
      body = JSON.parse(body).data
    } else {
      //This is the first request, lets get the userId
      body = JSON.parse(body).graphql
      userId = body.user.id
    }
    body.user.edge_owner_to_timeline_media.edges
      .filter(({ node: item }) => item[`__typename`] === `GraphImage`)
      .map(({ node: item }) => {
        // Parse item to a simple object
        return {
          id: get(item, `id`),
          code: get(item, `shortcode`),
          time: toISO8601(get(item, `taken_at_timestamp`)),
          type: get(item, `__typename`),
          likes: get(item, `edge_liked_by.count`),
          comment: get(item, `edge_media_to_comment.count`),
          text: get(item, `edge_media_to_caption.edges[0].node.text`),
          media: get(item, `display_url`),
          image: `images/${item.shortcode}.jpg`,
          username: get(body, `user.username`),
          avatar: get(body, `user.profile_pic_url`),
        }
      })
      .forEach(item => {
        if (posts.length >= 100) return

        // Download image locally and update progress bar
        bar.total++
        download(item.media, `./data/images/${item.code}.jpg`, _ => bar.tick())

        // Add item to posts
        posts.push(item)
      })

    const lastId = get(
      body,
      `user.edge_owner_to_timeline_media.page_info.end_cursor`
    )
    if (posts.length < 100 && lastId) getPosts(lastId)
    else saveJSON()
  })
}

getPosts()
