(function() {
  var currentAudioFile = undefined;

  function createAudio(link) {
    return {
      link: link,
      audio: new Audio(link),
    };
  }

  function toggleAudio(audioLink) {
    if (currentAudioFile === undefined || currentAudioFile.link !== audioLink) {
      if (currentAudioFile) {
        currentAudioFile.audio.pause();
      }
      currentAudioFile = createAudio(audioLink);
    }

    if (currentAudioFile.audio.paused) {
      currentAudioFile.audio.play();
    } else {
      currentAudioFile.audio.pause();
    }
  }

  function UIControlls() {
    function toggleIcon(element) {
      if (element.hasClass('fa-play')) {
        $('i').removeClass('fa-pause').addClass('fa-play');
        element.removeClass('fa-play').addClass('fa-pause');
      } else {
        element.removeClass('fa-pause').addClass('fa-play');
      }
    }

    $('.img_overlay').click(function() {
      var audioIcon = $(this).find('i');
      var audioLink = $(this).parents('li').attr('audio');
      toggleIcon(audioIcon);
      toggleAudio(audioLink);
    });

    $('.video_img_container').click(function() {
      var video_link = $(this).attr('link');
      $(this).replaceWith("<iframe src='" + video_link + "' frameborder='0' allowfullscreen/>")
    });
  }

  $.getJSON('/api/allrecent', function(data) {
    data.forEach(function(episode) {
      if (episode.feed_type === 'audio/podcast') {
        $('.program_list').append(
          "<li class='episode' audio='" + episode.audio_download + "'>" +
          "<div class='img_container'><img src='" + episode.image_url + "'/><div class='img_overlay'><i class='fa fa-play audio_icon'></i></div></div>" +
          "<div class='program_content'><div class='program_title'>" + episode.title + "</div><div class='program_date'>" + episode.disp_date + "</div></div></li>"
        )
      } else {
        $('.program_list').append(
          "<div class='video_img_container' link='" + episode.video_link + "'><img src='" + episode.image_url + "'/>" +
          "<div class='video_img_overlay'><i class='fa fa-play-circle-o'></i></div></div>"
        );
      }
    });
    UIControlls();
  });

})()
