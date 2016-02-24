var rp = require('request-promise');
var parseString = require('xml2js').parseString;
var Promise = require('promise');

var googleApiKey = 'AIzaSyA12J9ITYBJmtdbs68gwWRWWEm0owoUliY';

var podcasts = [
  {url: 'http://mbmbam.libsyn.com/rss', program_name: 'My Brother, My Brother and Me', authors: ['Griffin McElroy', 'Justin McElroy', 'Travis McElroy']},
  {url: 'http://shmanners.libsyn.com/rss', program_name: 'Shmanners', authors: ['Teresa McElroy', 'Travis McElroy']},
  {url: 'http://sawbones.libsyn.com/rss', program_name: 'Sawbones: A Marital Tour of Misguided Medicine', authors: ['Justin McElroy', 'Sydnee McElroy']},
  {url: 'http://adventurezone.libsyn.com/rss', program_name: 'The Adventure Zone', authors: ['Clint McElroy', 'Griffin McElroy', 'Justin McElroy', 'Travis McElroy']},
  {url: 'http://bunkerbuddies.libsyn.com/rss', program_name: 'Bunker Buddies', authors: ['Andie Bolt', 'Travis McElroy']},
  {url: 'http://cipyd.libsyn.com/rss', program_name: 'Can I Pet Your Dog?', authors: ['Renee Colvert', 'Travis McElroy', 'Allegra Ringo']},
  {url: 'http://stillbuffering.libsyn.com/rss', program_name: 'Still Buffering', authors: ['Sydnee McElroy', 'Rileigh Smirl']},
  {url: 'http://trendslikethese.libsyn.com/rss', program_name: 'Trends Like These', authors: ['Brent Black', 'Travis McElroy']},
  {url: 'http://rosebuddies.libsyn.com/rss', program_name: 'Rose Buddies', authors: ['Griffin McElroy', 'Rachel McElroy']},
  {url: 'http://blart.libsyn.com/rss', program_name: 'Til Death Do Us Blart', authors: ['Tim Batt', 'Griffin McElroy', 'Justin McElroy', 'Travis McElroy', 'Guy Montgomery']},
  {url: 'http://interrobangcast.libsyn.com/rss', program_name: 'Interrobang with Travis and Tybee', authors: ['Travis McElroy', 'Tybee Diskin']},
  {url: 'http://feeds.feedburner.com/polygonqualitycontrol?format=xml', program_name: 'Polygon\'s Quality Control', authors: ['Polygon', 'Justin McElroy']},
  {url: 'http://feeds.feedburner.com/CoolGamesInc?format=xml', program_name: 'CoolGames Inc', authors: ['Griffin McElroy', 'Polygon', 'Nick Robinson']},
];

var youtubeSeries = [
  {playlist_id: 'PLfH4HJ9AAqVSstrhnbCECKmnyWps6w58E', program_name: 'Things I Bought At Sheetz', authors: ['Justin McElroy', 'Dwight Slappe']},
  {playlist_id: 'PLaDrN74SfdT6duuVl_8qxJ5eaaPHRX_ij', program_name: 'Monster Factory', authors: ['Griffin McElroy', 'Justin McElroy', 'Polygon']},
  {playlist_id: 'UU6k_GngLDtxbkUlZOq6_h5g', program_name: 'MBMBam YouTube', authors: ['Griffin McElroy', 'Justin McElroy', 'Travis McElroy']},
  {playlist_id: 'PLaDrN74SfdT5huM_hsSXESlFzdzY2oXzY', program_name: 'Griffin\'s amiibo Corner', authors: ['Griffin McElroy', 'Polygon']},
];

function createPodcastFeedPromise (podcast) {
  return new Promise(function(resolve, reject) {
    rp(podcast.url, function(err, response, body) {
      if (!err && response.statusCode === 200)
        parseString(body, function(err, result) {
          if (err) reject(err);
          else {
            var data = result.rss.channel[0];
            var today = new Date();
            var compDate = new Date(today.getFullYear() - 1, today.getMonth());
            podcast.feed_type = 'audio/podcast';
            podcast.image_url = data.image[0].url[0];
            podcast.episodes = data.item.filter(function(episode) {
              var pubDate = new Date(episode.pubDate[0]);
              return pubDate > compDate;
            }).slice(0, 1);
            console.log('Received data from ' + podcast.url);
            resolve(podcast);
          }
        });
    });
  });
}

function createYoutubeFeedPromise (youtubeSeries) {
  var url = 'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet%2CcontentDetails&maxResults=50&playlistId=' + youtubeSeries.playlist_id + '&key=' + googleApiKey;
  return new Promise(function(resolve, reject) {
    rp(url, function(err, response, body) {
      if (!err && response.statusCode === 200) {
        var today = new Date();
        var compDate = new Date(today.getFullYear() - 1, today.getMonth());
        var data = JSON.parse(body);
        youtubeSeries.feed_type = 'video/YouTube';
        youtubeSeries.episodes = data.items.filter(function(episode) {
          var pubDate = new Date(episode.snippet.publishedAt);
          return pubDate > compDate;
        }).sort(function(a, b) {
          var aPubDate = new Date(a.snippet.publishedAt);
          var bPubDate = new Date(b.snippet.publishedAt);
          if (aPubDate > bPubDate) return -1;
          if (bPubDate > aPubDate) return 1;
          return 0;
        }).slice(0,1);
        console.log('Received data from ' + youtubeSeries.program_name);
        resolve(youtubeSeries);
      }
    });
  });
}

function getMostRecent(req, res) {
  var podcastPromises = podcasts.map(function(podcast) {
    return createPodcastFeedPromise(podcast);
  });

  var youtubeSeriesPromises = youtubeSeries.map(function(youtubeSeries) {
    return createYoutubeFeedPromise(youtubeSeries);
  });

  var feeds = podcastPromises.concat(youtubeSeriesPromises);

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
    res.json(output);
  });
}

module.exports.mostRecent = getMostRecent;
