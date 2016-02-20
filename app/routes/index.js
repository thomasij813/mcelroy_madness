var express = require('express');
var rp = require('request-promise');
var parseString = require('xml2js').parseString;
var Promise = require('promise');

var googleApiKey = 'AIzaSyA12J9ITYBJmtdbs68gwWRWWEm0owoUliY';

var router = express.Router();

router.get('/', function(req, res) {
  var feeds = [
    createPodcastFeedPromise('http://mbmbam.libsyn.com/rss', {program_name: 'My Brother, My Brother and Me', authors: ['Griffin McElroy', 'Justin McElroy', 'Travis McElroy']}),
    createPodcastFeedPromise('http://sawbones.libsyn.com/rss', {program_name: 'Sawbones: A Marital Tour of Misguided Medicine', authors: ['Justin McElroy', 'Sydnee McElroy']}),
    createPodcastFeedPromise('http://shmanners.libsyn.com/rss', {program_name: 'Shmanners', authors: ['Teresa McElroy', 'Travis McElroy']}),
    createPodcastFeedPromise('http://adventurezone.libsyn.com/rss', {program_name: 'The Adventure Zone', authors: ['Clint McElroy', 'Griffin McElroy', 'Justin McElroy', 'Travis McElroy']}),
    createPodcastFeedPromise('http://bunkerbuddies.libsyn.com/rss', {program_name: 'Bunker Buddies', authors: ['Andie Bolt', 'Travis McElroy']}),
    createPodcastFeedPromise('http://cipyd.libsyn.com/rss', {program_name: 'Can I Pet Your Dog?', authors: ['Renee Colvert', 'Travis McElroy', 'Allegra Ringo']}),
    createPodcastFeedPromise('http://stillbuffering.libsyn.com/rss', {program_name: 'Still Buffering', authors: ['Sydnee McElroy', 'Rileigh Smirl']}),
    createPodcastFeedPromise('http://trendslikethese.libsyn.com/rss', {program_name: 'Trends Like These', authors: ['Brent Black', 'Travis McElroy']}),
    createPodcastFeedPromise('http://rosebuddies.libsyn.com/rss', {program_name: 'Rose Buddies', authors: ['Griffin McElroy', 'Rachel McElroy']}),
    createPodcastFeedPromise('http://blart.libsyn.com/rss', {program_name: 'Til Death Do Us Blart', authors: ['Tim Batt', 'Griffin McElroy', 'Justin McElroy', 'Travis McElroy', 'Guy Montgomery']}),
    createPodcastFeedPromise('http://interrobangcast.libsyn.com/rss', {program_name: 'Interrobang with Travis and Tybee', authors: ['Travis McElroy', 'Tybee Diskin']}),
    createPodcastFeedPromise('http://feeds.feedburner.com/polygonqualitycontrol?format=xml', {program_name: 'Polygon\'s Quality Control', authors: ['Polygon', 'Justin McElroy']}),
    createPodcastFeedPromise('http://feeds.feedburner.com/CoolGamesInc?format=xml', {program_name: 'CoolGames Inc', authors: ['Griffin McElroy', 'Polygon', 'Nick Robinson']}),
    createYoutubeFeedPromise('PLfH4HJ9AAqVSstrhnbCECKmnyWps6w58E', {program_name: 'Things I Bought At Sheetz', authors: ['Justin McElroy', 'Dwight Slappe']}), //
    createYoutubeFeedPromise('PLaDrN74SfdT6duuVl_8qxJ5eaaPHRX_ij', {program_name: 'Monster Factory', authors: ['Griffin McElroy', 'Justin McElroy', 'Polygon']}),
    createYoutubeFeedPromise('UU6k_GngLDtxbkUlZOq6_h5g', {program_name: 'MBMBam YouTube', authors: ['Griffin McElroy', 'Justin McElroy', 'Travis McElroy']}),
    createYoutubeFeedPromise('PLaDrN74SfdT5huM_hsSXESlFzdzY2oXzY', {program_name: 'Griffin\'s amiibo Corner', authors: ['Griffin McElroy', 'Polygon']})
  ];

  Promise.all(feeds).then(function(dataArray) {
    console.log('all promises returned');
    var output = dataArray.map(function(program) {
      if (program.feed_type === 'audio/podcast')
        return program.episodes.map(function(episode) {
          var pubDate = new Date(episode.pubDate[0]);
          var month = pubDate.toLocaleString('en-us', { month: "long" });
          return {
            program_name: program.program_name,
            authors: program.authors,
            feed_type: program.feed_type,
            title: episode.title[0],
            disp_date: month + ' ' + pubDate.getDate() + ', ' + pubDate.getFullYear(),
            pub_date: pubDate,
            source_link: episode.link[0],
            audio_download: episode.enclosure[0].$.url,
            description: episode.description[0],
            image_url: program.image_url
          };
        });
      else
        return program.episodes.map(function(episode) {
          var pubDate = new Date(episode.snippet.publishedAt);
          var month = pubDate.toLocaleString('en-us', { month: "long" });
          return {
            program_name: program.program_name,
            authors: program.authors,
            feed_type: program.feed_type,
            title: episode.snippet.title,
            disp_date: month + ' ' + pubDate.getDate() + ', ' + pubDate.getFullYear(),
            pub_date: pubDate,
            description: episode.snippet.description,
            video_link: 'https://www.youtube.com/v/' + episode.snippet.resourceId.videoId,
            playlist_link: 'https://www.youtube.com/playlist?list=' + episode.snippet.playlistId,
            image_url: episode.snippet.thumbnails.high.url
          };
        });
    }).reduce(function(a, b) {
      return a.concat(b);
    }).sort(function(a, b) {
      if (a.pub_date < b.pub_date) return 1;
      if (a.pub_date > b.pub_date) return -1;
      return 0;
    });
    res.locals.data = output;
    res.render('index');
    //res.json(output);
  });
  // res.locals.data = test_data;
  // res.render('index');
});

function createPodcastFeedPromise (url, feedData) {
  return new Promise(function(resolve, reject) {
    rp(url, function(err, response, body) {
      if (!err && response.statusCode === 200)
        parseString(body, function(err, result) {
          if (err) reject(err);
          else {
            var data = result.rss.channel[0];
            var today = new Date();
            var compDate = new Date(today.getFullYear() - 1, today.getMonth());
            feedData.feed_type = 'audio/podcast';
            feedData.image_url = data.image[0].url[0];
            feedData.episodes = data.item.filter(function(episode) {
              var pubDate = new Date(episode.pubDate[0]);
              return pubDate > compDate;
            }).slice(0, 1);
            console.log('Received data from ' + url);
            resolve(feedData);
          }
        });
    });
  });
}

function createYoutubeFeedPromise (playlistId, feedData) {
  var url = 'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet%2CcontentDetails&maxResults=50&playlistId=' + playlistId + '&key=' + googleApiKey;
  return new Promise(function(resolve, reject) {
    rp(url, function(err, response, body) {
      if (!err && response.statusCode === 200) {
        var today = new Date();
        var compDate = new Date(today.getFullYear() - 1, today.getMonth());
        var data = JSON.parse(body);
        feedData.feed_type = 'video/YouTube';
        feedData.episodes = data.items.filter(function(episode) {
          var pubDate = new Date(episode.snippet.publishedAt);
          return pubDate > compDate;
        }).sort(function(a, b) {
          var aPubDate = new Date(a.snippet.publishedAt);
          var bPubDate = new Date(b.snippet.publishedAt);
          if (aPubDate > bPubDate) return -1;
          if (bPubDate > aPubDate) return 1;
          return 0;
        }).slice(0,1);
        console.log(feedData.episodes);
        console.log('Received data from ' + feedData.program_name);
        resolve(feedData);
      }
    });
  });
}

module.exports = router;

var test_data = [
{
program_name: "Bunker Buddies",
authors: [
"Andie Bolt",
"Travis McElroy"
],
feed_type: "audio/podcast",
title: "Parenthood in the Apocalypse w/ Heather Brooker!",
pub_date: "2016-02-17T08:00:00.000Z",
source_link: "http://bunkerbuddies.libsyn.com/parenthood-in-the-apocalypse-w-heather-brooker",
autio_download: "http://traffic.libsyn.com/bunkerbuddies/BBParenthood.mp3",
description: "<p>Hello Buddies! Listen, we all know parenting can be tough! There's so much to deal with when they're infants, unable to even begin to care for themselves! Then, they become toddlers, running face first around the house and terrifying the shit out of you. By the the time they reach childhood and head out in to the world, it's almost too much to bear! Add in to that Zombies, Earthquakes and the Rapture and you might as well throw in the towel! We're joined this week by Heather Brooker (Motherhood in Hollywood) to discuss parenting through the world's end! Join us!</p>",
image_url: "http://static.libsyn.com/p/assets/1/7/a/7/17a7ff750d23880b/BunkerBuddiesDoorLarge.jpg"
},
{
program_name: "My Brother, My Brother and Me",
authors: [
"Griffin McElroy",
"Justin McElroy",
"Travis McElroy"
],
feed_type: "audio/podcast",
title: "MBMBaM 290: Kung Fu Panda 3 Watch",
pub_date: "2016-02-16T18:40:07.000Z",
source_link: "http://mbmbam.libsyn.com/mbmbam-290-kung-fu-panda-3-watch",
autio_download: "http://traffic.libsyn.com/mbmbam/MyBrotherMyBrotherandMe290.mp3",
description: "<p>Everybody said it would never happen -- that America hadn't done anything good enough to deserve a third installment in the Kung Fu Panda saga. And they're all right: We don' t deserve Kung Fu Panda 3, but we got it anyway. And because of this gift, we have something to talk about for the first ten minutes of our podcast.</p> <p>Suggested talking points: Kung Fu Panda 3 Excitement, Ticket to Paradise, A Calm Response to Travis' Museum Nights Memories, Weightlifting Music, Three Dougs, Popeye's Eulogy, Three Serious Messages</p>",
image_url: "http://static.libsyn.com/p/assets/6/d/7/d/6d7d36d6929db515/MBMBAM_Update.jpg"
},
{
program_name: "Rose Buddies",
authors: [
"Griffin McElroy",
"Rachel McElroy"
],
feed_type: "audio/podcast",
title: "Episode 7: Ghost Ride the Boat",
pub_date: "2016-02-16T14:48:05.000Z",
source_link: "http://rosebuddies.libsyn.com/episode-7-ghost-ride-the-boat",
autio_download: "http://traffic.libsyn.com/rosebuddies/RoseBuddies7.mp3",
description: "<p>This week's Bachelor was a fairly tame lead-up to the absolute FIRE that is Hometowns, but there were still plenty of noteworthy occurrences. Like that time that Ben piloted a boat into a crowd of women, or when Ben made a woman eat a french fry out of his mouth like a mama bird.</p>",
image_url: "http://static.libsyn.com/p/assets/2/1/e/3/21e3e5eeb4b9aa29/rosebuddies.jpg"
},
{
program_name: "Can I Pet Your Dog?",
authors: [
"Renee Colvert",
"Travis McElroy",
"Allegra Ringo"
],
feed_type: "audio/podcast",
title: "CIPYD 30: Cora Wittekind and Fetch",
pub_date: "2016-02-16T08:00:00.000Z",
source_link: "http://cipyd.libsyn.com/cipyd-30-cora-wittekind-and-fetch",
autio_download: "http://traffic.libsyn.com/cipyd/CIPYD30.mp3",
description: "<p>Well, let's start off by saying: THIS IS RENEE'S FAVORITE VALENTINE'S EVER! Listen and find out why. When you listen, you'll find out about Renee's new friend Tyson in Dogs We Met This Week. Also, find out all about Afghan Hounds in this week's Mutt Minute. We're so excited to talk to our guest, the amazing dog trainer Cora Wittekind. Want to learn about Pistachio's DNA test? You will! Finally, learn about the new hit app Fetch in Cool Dog Tech! There sure is a lot of learnin' in in this episode!</p>",
image_url: "http://static.libsyn.com/p/assets/5/0/b/2/50b284d1f4ec9df8/cipydbig.png"
},
{
program_name: "Still Buffering",
authors: [
"Sydnee McElroy",
"Rileigh Smirl"
],
feed_type: "audio/podcast",
title: "Still Buffering: How to Memory",
pub_date: "2016-02-16T03:23:48.000Z",
source_link: "http://stillbuffering.libsyn.com/still-buffering-how-to-memory",
autio_download: "http://traffic.libsyn.com/stillbuffering/StillBuffPhotos.mp3",
description: "test",
image_url: "http://static.libsyn.com/p/assets/2/4/8/2/2482984c3147a8b6/StillBuffSquare.jpg"
},
{
program_name: "CoolGames Inc",
authors: [
"Griffin McElroy",
"Polygon",
"Nick Robinson"
],
feed_type: "audio/podcast",
title: "Episode 3: Surgery Date",
pub_date: "2016-02-12T17:26:52.000Z",
source_link: "http://feedproxy.google.com/~r/CoolGamesInc/~3/2zcUoeQO6yg/episode-3-surgery-date",
autio_download: "http://feeds.soundcloud.com/stream/246719311-coolgamesinc-episode-3-surgery-date.mp3",
description: "test",
image_url: "http://i1.sndcdn.com/avatars-000201647023-oe7cfg-original.jpg"
},
{
program_name: "Shmanners",
authors: [
"Teresa McElroy",
"Travis McElroy"
],
feed_type: "audio/podcast",
title: "House Guests",
pub_date: "2016-02-12T08:00:00.000Z",
source_link: "http://shmanners.libsyn.com/house-guests",
autio_download: "http://traffic.libsyn.com/shmanners/ShmanHouse.mp3",
description: "<p>Come in, come in! We're so glad you could come visit the podcast! Here's a towel and feel free to eat anything in the fridge! Are you unsure how to behave as a house guest? Do you know how to properly host a house guest? Can you use the stuff in their shower? Do you have to stay in bed til everyone is awake? What do you do if you have to go to work while some one is visiting? What if you get sick of each other? What if they won't leave?! What's the deal with pineapples?!?! Well, don't worry friend, we've got you covered!</p>",
image_url: "http://static.libsyn.com/p/assets/c/d/8/b/cd8bfc0c019b3b01/Shmanners_AlbumArt_02.jpg"
},
{
program_name: "Monster Factory",
authors: [
"Griffin McElroy",
"Justin McElroy",
"Polygon"
],
feed_type: "video/YouTube",
title: "Monster Factory: Horrors of all shapes and sizes in Blade & Soul",
pub_date: "2016-02-11T19:14:45.000Z",
description: "Griffin and Justin make a couple of Monster Factory children in the new MMO Blade & Soul, but end up getting completely shut down by Big Analog. Subscribe: http://goo.gl/qw3Ac7 Check out our full video catalog: http://goo.gl/Cqt2cn Visit our playlists: http://goo.gl/pM7TNe Like Polygon on Facebook: https://goo.gl/GmkOs4 Follow Polygon on Twitter: http://goo.gl/cQfqrq Read more at: http://www.polygon.com",
video_link: "https://www.youtube.com/v/kT2Y6ftxilM",
playlist_link: "https://www.youtube.com/playlist?list=PLaDrN74SfdT6duuVl_8qxJ5eaaPHRX_ij"
},
{
program_name: "The Adventure Zone",
authors: [
"Clint McElroy",
"Griffin McElroy",
"Justin McElroy",
"Travis McElroy"
],
feed_type: "audio/podcast",
title: "Ep. 33. The Crystal Kingdom - Chapter Five",
pub_date: "2016-02-11T16:38:31.000Z",
source_link: "http://adventurezone.libsyn.com/ep-33-the-crystal-kingdom-chapter-five",
autio_download: "http://traffic.libsyn.com/adventurezone/TheAdventureZone033.mp3",
description: "<p>Our heroes face a series of challenges while exploring Lucas' lab that are, admittedly, all pretty adorable. But still super deadly! Just, like, huggably deadly. Merle performs a random act of kindness. Taako remembers an acrobatic nursery rhyme. Magnus experiences the magic of flight.</p>",
image_url: "http://static.libsyn.com/p/assets/7/4/f/d/74fdaa8be1b5684f/The_Adventure_Zone_Flat.jpg"
},
{
program_name: "Shmanners",
authors: [
"Teresa McElroy",
"Travis McElroy"
],
feed_type: "audio/podcast",
title: "Holiday Special: Valentine's Day",
pub_date: "2016-02-11T08:00:00.000Z",
source_link: "http://shmanners.libsyn.com/holiday-special-valentines-day",
autio_download: "http://traffic.libsyn.com/shmanners/ShmanVal.mp3",
description: "<p>Hello Internet! Welcome to the first (hopefully first of many) of our holiday specials! Learn all about the history and traditions surrounding Valentine's Day!</p>",
image_url: "http://static.libsyn.com/p/assets/c/d/8/b/cd8bfc0c019b3b01/Shmanners_AlbumArt_02.jpg"
},
{
program_name: "Trends Like These",
authors: [
"Brent Black",
"Travis McElroy"
],
feed_type: "audio/podcast",
title: "New Hampshire, That'swhatshesaid, Follow Ups, Super Bowl",
pub_date: "2016-02-11T08:00:00.000Z",
source_link: "http://trendslikethese.libsyn.com/new-hampshire-thatswhatshesaid-follow-ups-super-bowl",
autio_download: "http://traffic.libsyn.com/trendslikethese/TLT21116.mp3",
description: "<p>Hey cool kids! How the heck are you?! It feels like it's been 168 hours since we last talked. What have you been doing? Oh yeah? Well, we've been busy too. Busy doing what you ask? Well, this this episode for example! We talk about the results of the New Hampshire primary! Then, we talk about the theatre project That'swhatshesaid and the cease and desist letters they've been receiving. We've got follow ups on the Return of Kings story, the Fine Brothers and the Michigan sodomy laws! Finally, we've got all the wrap up you need regarding the Super Bowl! ...except, like, anything about the actual game. All that, plus the Wi-Five of the Week! So like I said, busy week for us!</p>",
image_url: "http://static.libsyn.com/p/assets/9/5/6/1/9561e41021119714/TrendsLikeThese_Red_iTunes_2000x2000.jpg"
},
{
program_name: "Sawbones: A Marital Tour of Misguided Medicine",
authors: [
"Justin McElroy",
"Sydnee McElroy"
],
feed_type: "audio/podcast",
title: "Sawbones: Crystal Healing",
pub_date: "2016-02-11T03:26:14.000Z",
source_link: "http://sawbones.libsyn.com/sawbones-crystal-healing",
autio_download: "http://traffic.libsyn.com/sawbones/Sawbones123Crystals.mp3",
description: "test",
image_url: "http://static.libsyn.com/p/assets/9/7/e/b/97ebad626b4d937f/Sawbones-logo-final.png"
},
{
program_name: "Bunker Buddies",
authors: [
"Andie Bolt",
"Travis McElroy"
],
feed_type: "audio/podcast",
title: "Solar Flares!",
pub_date: "2016-02-10T08:00:00.000Z",
source_link: "http://bunkerbuddies.libsyn.com/solar-flares",
autio_download: "http://traffic.libsyn.com/bunkerbuddies/bbsolarflare.mp3",
description: "<p>Hello Buddies! Sure, we've talked about losing power and such before. We've talked about space itself attacking us. We've even talked about the Sun before! But never all that in one episode, plus so much more! You see, Solar Flares are a real threat and if a powerful enough flare happened, it could fry our power grid. The good news is... well, we'll get to that in the episode. Learn all about the cause, the problems with predicting and what we can do to protect ourselves from Solar Flares! </p>",
image_url: "http://static.libsyn.com/p/assets/1/7/a/7/17a7ff750d23880b/BunkerBuddiesDoorLarge.jpg"
},
{
program_name: "Polygon's Quality Control",
authors: [
"Polygon",
"Justin McElroy"
],
feed_type: "audio/podcast",
title: "Firewatch",
pub_date: "2016-02-09T22:13:36.000Z",
source_link: "http://feedproxy.google.com/~r/polygonqualitycontrol/~3/-poKUqkFfe0/firewatch",
autio_download: "http://feeds.soundcloud.com/stream/246270263-polygons-quality-control-firewatch.mp3",
description: "test",
image_url: "http://i1.sndcdn.com/avatars-000106894675-fvuyds-original.png"
},
{
program_name: "Rose Buddies",
authors: [
"Griffin McElroy",
"Rachel McElroy"
],
feed_type: "audio/podcast",
title: "Episode 6: She's Just a Bird",
pub_date: "2016-02-09T15:33:13.000Z",
source_link: "http://rosebuddies.libsyn.com/episode-6-shes-just-a-bird",
autio_download: "http://traffic.libsyn.com/rosebuddies/RoseBuddies6.mp3",
description: "<p>After last week's totally thrilling cliffhanger, Griffin and Rachel return to discuss the brutal efficiency of Ben Higgins: The Axeman. Four women got the boot this week, and we're all like, yo Benny, where's the fire, man? Take your time. Live the moment. Feed the swimming pigs.</p>",
image_url: "http://static.libsyn.com/p/assets/2/1/e/3/21e3e5eeb4b9aa29/rosebuddies.jpg"
},
{
program_name: "Can I Pet Your Dog?",
authors: [
"Renee Colvert",
"Travis McElroy",
"Allegra Ringo"
],
feed_type: "audio/podcast",
title: "CIPYD 29: Theresa Thorn and You Are Dog Now",
pub_date: "2016-02-09T08:00:00.000Z",
source_link: "http://cipyd.libsyn.com/cipyd-29-theresa-thorn-and-you-are-dog-now",
autio_download: "http://traffic.libsyn.com/cipyd/CIPYD29.mp3",
description: "<p>Well friends, another Puppy Bowl is in the books! Of course, we pre-recorded this so we have no idea who won... ANYWAY! What we do know is that we have a great episode for you this week! In Dogs We Met This Week, Travis sort of met a mysterious museum dog! Allegra tells us all about Dalmations in this week's Mutt Minute. We are so excited to be joined by the amazing Theresa Thorn to hear all about her two amazing dogs and the time they scared the living crap out of her! Allegra walks us through some Cool Dog Tech and we talk about what kind of dogs we would be! See, didn't I tell you it was a good one!</p>",
image_url: "http://static.libsyn.com/p/assets/5/0/b/2/50b284d1f4ec9df8/cipydbig.png"
},
{
program_name: "Still Buffering",
authors: [
"Sydnee McElroy",
"Rileigh Smirl"
],
feed_type: "audio/podcast",
title: "Still Buffering: How to Valentine",
pub_date: "2016-02-09T02:04:40.000Z",
source_link: "http://stillbuffering.libsyn.com/still-buffering-how-to-valentine",
autio_download: "http://traffic.libsyn.com/stillbuffering/StillBuffValentines.mp3",
description: "test",
image_url: "http://static.libsyn.com/p/assets/2/4/8/2/2482984c3147a8b6/StillBuffSquare.jpg"
},
{
program_name: "MBMBam YouTube",
authors: [
"Griffin McElroy",
"Justin McElroy",
"Travis McElroy"
],
feed_type: "video/YouTube",
title: "Captain Jeffcoat w/ MBMBaM",
pub_date: "2016-02-08T22:44:53.000Z",
description: "test",
video_link: "https://www.youtube.com/v/04inD-E4S0g",
playlist_link: "https://www.youtube.com/playlist?list=UU6k_GngLDtxbkUlZOq6_h5g"
},
{
program_name: "MBMBam YouTube",
authors: [
"Griffin McElroy",
"Justin McElroy",
"Travis McElroy"
],
feed_type: "video/YouTube",
title: "Porn Desktop w/ MBMBaM",
pub_date: "2016-02-08T22:39:14.000Z",
description: "Gather 'round and hear the tale of the WORST PORN STORAGE SOLUTION EVER! Like, not a bit of it makes any sense. Brought to you by My Brother, My Brother and Me an advice show for the modern era. MBMBaM is available on iTunes and MaximumFun.org. Join us, won't you: http://MBMBaM.com/",
video_link: "https://www.youtube.com/v/UFB5Vl9wdj8",
playlist_link: "https://www.youtube.com/playlist?list=UU6k_GngLDtxbkUlZOq6_h5g"
},
{
program_name: "MBMBam YouTube",
authors: [
"Griffin McElroy",
"Justin McElroy",
"Travis McElroy"
],
feed_type: "video/YouTube",
title: "Presidential History w/ MBMBaM",
pub_date: "2016-02-08T22:28:49.000Z",
description: "So, you've just realized that you know nothing about American Presidential History? Don't worry! We'll tell you every thing you need to know. Mostly about Andrew Johnson. Brought to you by My Brother, My Brother and Me an advice show for the modern era. MBMBaM is available on iTunes and MaximumFun.org. Join us, won't you: http://MBMBaM.com/",
video_link: "https://www.youtube.com/v/MqWDfCG0Hfc",
playlist_link: "https://www.youtube.com/playlist?list=UU6k_GngLDtxbkUlZOq6_h5g"
},
{
program_name: "MBMBam YouTube",
authors: [
"Griffin McElroy",
"Justin McElroy",
"Travis McElroy"
],
feed_type: "video/YouTube",
title: "Old Man Robbery w/ MBMBaM",
pub_date: "2016-02-08T22:19:31.000Z",
description: "We did it folks, we have devised the PERFECT CRIME! How do you rob a bank? As a crying old man of course! Brought to you by My Brother, My Brother and Me an advice show for the modern era. MBMBaM is available on iTunes and MaximumFun.org. Join us, won't you: http://MBMBaM.com/",
video_link: "https://www.youtube.com/v/UKO3V_2kBgg",
playlist_link: "https://www.youtube.com/playlist?list=UU6k_GngLDtxbkUlZOq6_h5g"
},
{
program_name: "My Brother, My Brother and Me",
authors: [
"Griffin McElroy",
"Justin McElroy",
"Travis McElroy"
],
feed_type: "audio/podcast",
title: "MBMBaM 289: Ben Stiller's Museum Nights",
pub_date: "2016-02-08T16:01:11.000Z",
source_link: "http://mbmbam.libsyn.com/mbmbam-289-ben-stillers-museum-nights",
autio_download: "http://traffic.libsyn.com/mbmbam/MyBrotherMyBrotherandMe289.mp3",
description: "<p>Welcome, all, to our most fanciful episode yet! It's got everything: Extremely wrong-headed Super Bowl predictions, Travis' mushroom-tainted movie memories and a brief lesson on Mogwai rights. Come with us on a three-way mind voyage!</p> <p>Suggested talking points: The Hug Heard Round the World, Mushroom Movie Editions, A Very Terrible Towel, Office Traps, Pirate Jeffcoats, Emu President</p>",
image_url: "http://static.libsyn.com/p/assets/6/d/7/d/6d7d36d6929db515/MBMBAM_Update.jpg"
},
{
program_name: "Griffin's amiibo Corner",
authors: [
"Griffin McElroy",
"Polygon"
],
feed_type: "video/YouTube",
title: "Griffin's amiibo Corner - Episode 4: Link",
pub_date: "2016-02-05T18:15:10.000Z",
description: "We introduce a new segment on Griffin's amiibo Corner as we review Link, but please tell us if you do not like the new segment. Thank you for watching Griffin's amiibo Corner. Subscribe: http://goo.gl/qw3Ac7 Check out our full video catalog: http://goo.gl/Cqt2cn Visit our playlists: http://goo.gl/pM7TNe Like Polygon on Facebook: https://goo.gl/GmkOs4 Follow Polygon on Twitter: http://goo.gl/cQfqrq Read more at: http://www.polygon.com",
video_link: "https://www.youtube.com/v/1jct5FOG9AE",
playlist_link: "https://www.youtube.com/playlist?list=PLaDrN74SfdT5huM_hsSXESlFzdzY2oXzY"
},
{
program_name: "Shmanners",
authors: [
"Teresa McElroy",
"Travis McElroy"
],
feed_type: "audio/podcast",
title: "Conversation",
pub_date: "2016-02-05T08:00:00.000Z",
source_link: "http://shmanners.libsyn.com/conversation",
autio_download: "http://traffic.libsyn.com/shmanners/Shmanners3.mp3",
description: "<p>Sorry to interrupt, but we thought you might like to find out a little bit about conversational etiquette! The world of small talk can be a terrifying and dangerous place! How do you even begin to talk to someone at a business conference? What  about all those swear words I keep hearing about?! Yes, with body language, eye contact and word choice to worry about, why does anyone ever talk to anyone at all?! Because you have to to get by in the world, that's why! So come with us and let's walk through the ins and out of conversation together!</p>",
image_url: "http://static.libsyn.com/p/assets/c/d/8/b/cd8bfc0c019b3b01/Shmanners_AlbumArt_02.jpg"
},
{
program_name: "CoolGames Inc",
authors: [
"Griffin McElroy",
"Polygon",
"Nick Robinson"
],
feed_type: "audio/podcast",
title: "Episode 2: Cook For Cube",
pub_date: "2016-02-05T07:56:35.000Z",
source_link: "http://feedproxy.google.com/~r/CoolGamesInc/~3/5YF25dmoWHo/episode-2-cook-for-cube",
autio_download: "http://feeds.soundcloud.com/stream/245544917-coolgamesinc-episode-2-cook-for-cube.mp3",
description: "test",
image_url: "http://i1.sndcdn.com/avatars-000201647023-oe7cfg-original.jpg"
},
{
program_name: "Trends Like These",
authors: [
"Brent Black",
"Travis McElroy"
],
feed_type: "audio/podcast",
title: "Nobel Peace Prize, Iowa Caucus, Waferless Kit Kat, Fine Brothers, Return of Kings",
pub_date: "2016-02-04T08:00:00.000Z",
source_link: "http://trendslikethese.libsyn.com/nobel-peace-prize-iowa-caucus-waferless-kit-kat-fine-brothers-return-of-kings",
autio_download: "http://traffic.libsyn.com/trendslikethese/tlt2416.mp3",
description: "<p>Hey Cool Kids! Brent's traveling in our neighbor to the North, Canada! But don't worry, he didn't let all that poutine and free health care stop him from recording an episode! First, let's talk about the truth behind Trump's Nobel Prize nomination. Which brings us to the Iowa Caucus results! A British law student bit in to a Kit Kat to find a disturbing surprise! (Don't worry, it's not gross!) The Fine Bros. made a bit of a misstep it seems. Finally, let's all try to wrap our minds around the craziness and misogyny of Return of Kings and their weird clandestine meetings. </p>",
image_url: "http://static.libsyn.com/p/assets/9/5/6/1/9561e41021119714/TrendsLikeThese_Red_iTunes_2000x2000.jpg"
},
{
program_name: "Sawbones: A Marital Tour of Misguided Medicine",
authors: [
"Justin McElroy",
"Sydnee McElroy"
],
feed_type: "audio/podcast",
title: "Sawbones: Zika Virus",
pub_date: "2016-02-04T02:55:26.000Z",
source_link: "http://sawbones.libsyn.com/sawbones-zika-virus",
autio_download: "http://traffic.libsyn.com/sawbones/Sawbones122Zika.mp3",
description: "test",
image_url: "http://static.libsyn.com/p/assets/9/7/e/b/97ebad626b4d937f/Sawbones-logo-final.png"
},
{
program_name: "Things I Bought At Sheetz",
authors: [
"Justin McElroy",
"Dwight Slappe"
],
feed_type: "video/YouTube",
title: "Things I Bought At Sheetz: Elephant Ears",
pub_date: "2016-02-03T17:45:55.000Z",
description: "Things I Bought at Sheetz is a food review/quiz show wrought by Dwight Slappe and Justin McElroy. #TIBAS BUY STUFF!: http://www.society6.com/tibas FOLLOW US ON TWITTER: @sheetzshow",
video_link: "https://www.youtube.com/v/HfW5jCoifjY",
playlist_link: "https://www.youtube.com/playlist?list=PLfH4HJ9AAqVSstrhnbCECKmnyWps6w58E"
},
{
program_name: "Bunker Buddies",
authors: [
"Andie Bolt",
"Travis McElroy"
],
feed_type: "audio/podcast",
title: "Go Bag!",
pub_date: "2016-02-03T08:03:18.000Z",
source_link: "http://bunkerbuddies.libsyn.com/go-bag",
autio_download: "http://traffic.libsyn.com/bunkerbuddies/bbgobag.mp3",
description: "<p>Hey Buddies, is everything not GOOD? Have you had a powerful SCARE? Has the SHTF? Then just grab your Go Bag! What's that? You don't have a GO BAG?! But what about your essentials? What do you grab as you run out the door? Where's your collection of flashlights? Well, don't worry! Travis and Andie will walk you through everything you need to put together a bag that is good to go!</p>",
image_url: "http://static.libsyn.com/p/assets/1/7/a/7/17a7ff750d23880b/BunkerBuddiesDoorLarge.jpg"
},
{
program_name: "Rose Buddies",
authors: [
"Griffin McElroy",
"Rachel McElroy"
],
feed_type: "audio/podcast",
title: "Episode 5: Just Like Teen Mom",
pub_date: "2016-02-02T15:06:38.000Z",
source_link: "http://rosebuddies.libsyn.com/episode-5-just-like-teen-mom",
autio_download: "http://traffic.libsyn.com/rosebuddies/RoseBuddies5.mp3",
description: "<p><strong></strong>Rachel and Griffin discuss the events of a pretty big snoozer of an episode, including the heartbreaking dismissal of a flawless contestant. There's also a live Superwater Zero taste test, which, buddy, that's just good radio.</p>",
image_url: "http://static.libsyn.com/p/assets/2/1/e/3/21e3e5eeb4b9aa29/rosebuddies.jpg"
},
{
program_name: "Can I Pet Your Dog?",
authors: [
"Renee Colvert",
"Travis McElroy",
"Allegra Ringo"
],
feed_type: "audio/podcast",
title: "CIPYD 28: Alison Rosen and the Puppy Bowl",
pub_date: "2016-02-02T08:00:00.000Z",
source_link: "http://cipyd.libsyn.com/cipyd-28-alison-rosen-and-the-puppy-bowl",
autio_download: "http://traffic.libsyn.com/cipyd/CIPYD28.mp3",
description: "<p>Oh friends, have we got an episode for you! First, in Dogs We Meet This Week, we met a WHOLE LOT OF DOGS! The first ever CIPYD dog meet up was a huge success and we can't wait to tell you all about it! In Mutt Minute, learn all about the super-scruffy, super adorable Glen Amal Terrier!We are so excited to be joined this week by podcaster/awesome person Alison Rosen! Finally, it's that time of year again: THE PUPPY BOWL! There's a lot riding on this one folks!</p>",
image_url: "http://static.libsyn.com/p/assets/5/0/b/2/50b284d1f4ec9df8/cipydbig.png"
},
{
program_name: "Still Buffering",
authors: [
"Sydnee McElroy",
"Rileigh Smirl"
],
feed_type: "audio/podcast",
title: "How to Communication",
pub_date: "2016-02-02T02:24:58.000Z",
source_link: "http://stillbuffering.libsyn.com/how-to-communication",
autio_download: "http://traffic.libsyn.com/stillbuffering/StillBuffCommunication.mp3",
description: "test",
image_url: "http://static.libsyn.com/p/assets/2/4/8/2/2482984c3147a8b6/StillBuffSquare.jpg"
}
]
