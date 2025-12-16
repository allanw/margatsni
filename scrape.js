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
  let url = `https://www.instagram.com/${username}`
  
  request(url, {},
          (err, res, body) => {
      foo = JSON.parse(body.split("window._sharedData = ")[1].split(";</script>")[0]).entry_data.ProfilePage[0].graphql;
      userId = foo.user.id
      console.log(userId);
      //console.log(foo);
  
  //let url = 'https://instagram.com/graphql/query/?query_id=17888483320059182&id={username}&first=12&access_token=${access_token}'
  let url2 = `https://www.instagram.com/graphql/query/?query_hash=472f257a40c653c64c666ce877d59d2b`

  if (maxId)
    url = url2 + `&variables={"id":"${userId}","first":12,"after":"${maxId}"}`

    foo.user.edge_owner_to_timeline_media.edges
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

