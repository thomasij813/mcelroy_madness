var express = require('express');
var rp = require('request-promise');
var parseString = require('xml2js').parseString;
var Promise = require('promise');

var googleApiKey = 'AIzaSyA12J9ITYBJmtdbs68gwWRWWEm0owoUliY';

var router = express.Router();

router.get('/', function(req, res) {
  var feeds = [
    createPodcastFeedPromise('http://mbmbam.libsyn.com/rss'),
    createPodcastFeedPromise('http://sawbones.libsyn.com/rss'),
    createPodcastFeedPromise('http://shmanners.libsyn.com/rss'),
    createPodcastFeedPromise('http://adventurezone.libsyn.com/rss'),
    createPodcastFeedPromise('http://bunkerbuddies.libsyn.com/rss'),
    createPodcastFeedPromise('http://cipyd.libsyn.com/rss'),
    createPodcastFeedPromise('http://stillbuffering.libsyn.com/rss'),
    createPodcastFeedPromise('http://trendslikethese.libsyn.com/rss'),
    createPodcastFeedPromise('http://rosebuddies.libsyn.com/rss'),
    createPodcastFeedPromise('http://blart.libsyn.com/rss'),
    createPodcastFeedPromise('http://feeds.feedburner.com/polygonqualitycontrol?format=xml'),
    createPodcastFeedPromise('http://feeds.feedburner.com/CoolGamesInc?format=xml'),
    createYoutubeFeedPromise('PLfH4HJ9AAqVSstrhnbCECKmnyWps6w58E', {program_name: 'Things I Bought At Sheetz', authors: ['Justin McElroy']}), //
    createYoutubeFeedPromise('PLaDrN74SfdT6duuVl_8qxJ5eaaPHRX_ij', {program_name: 'Monster Factory', authors: ['Griffin McElroy', 'Justin McElroy']}),
    createYoutubeFeedPromise('UU6k_GngLDtxbkUlZOq6_h5g', {program_name: 'MBMBam YouTube', authors: ['Griffin McElroy', 'Justin McElroy', 'Travis McElroy']}),
    createYoutubeFeedPromise('PLaDrN74SfdT5huM_hsSXESlFzdzY2oXzY', {program_name: 'Griffin\'s amiibo Corner', authors: ['Griffin McElroy']})
  ];

  Promise.all(feeds).then(function(dataArray) {
    console.log('all promises returned');
    res.json(dataArray);
  });
});

function createPodcastFeedPromise (url) {
  return new Promise(function(resolve, reject) {
    rp(url, function(err, response, body) {
      if (!err && response.statusCode === 200)
        parseString(body, function(err, result) {
          if (err) reject(err);
          else {
            var feedData = result.rss.channel[0];
            var output = {
              program_name: feedData.title[0],
              most_recent: feedData.item
            };
            console.log('Received data from ' + url);
            resolve(output);
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
        feedData.body = JSON.parse(body);
        console.log('Received data from ' + feedData.program_name);
        resolve(feedData);
      }
    });
  });
}

module.exports = router;
