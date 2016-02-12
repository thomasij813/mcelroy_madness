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
          return {
            program_name: program.program_name,
            authors: program.authors,
            feed_type: program.feed_type,
            title: episode.title[0],
            pub_date: new Date(episode.pubDate[0]),
            source_link: episode.link[0],
            autio_download: episode.enclosure[0].$.url,
            description: episode.description[0]
          };
        });
      else
        return program.episodes.map(function(episode) {
          return {
            program_name: program.program_name,
            authors: program.authors,
            feed_type: program.feed_type,
            title: episode.snippet.title,
            pub_date: new Date(episode.snippet.publishedAt),
            description: episode.snippet.description,
            video_link: 'https://www.youtube.com/watch?v=' + episode.snippet.resourceId.videoId,
            playlist_link: 'https://www.youtube.com/playlist?list=' + episode.snippet.playlistId,
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
            feedData.episodes = data.item.filter(function(episode) {
              var pubDate = new Date(episode.pubDate[0]);
              return pubDate > compDate;
            }).slice(0, 5);
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
        }).slice(0, 5);
        console.log('Received data from ' + feedData.program_name);
        resolve(feedData);
      }
    });
  });
}

module.exports = router;
