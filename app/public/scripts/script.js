(function() {
  function toggleIcon(element) {
    if (element.hasClass('fa-play')) {
      $('i').removeClass('fa-pause').addClass('fa-play');
      element.removeClass('fa-play').addClass('fa-pause');
    } else {
      element.removeClass('fa-pause').addClass('fa-play');
    }
  }

  $('.img_overlay').click(function() {
    var audio_icon = $(this).find('i');
    toggleIcon(audio_icon);
  });


})()
