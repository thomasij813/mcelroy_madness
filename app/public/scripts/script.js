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



})()
