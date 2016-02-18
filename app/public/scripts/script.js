(function() {
  $('.img_overlay').click(function() {
    var audio_icon = $(this).find('i');
    if (audio_icon.hasClass('fa-play')) {
      audio_icon.removeClass('fa-play');
      audio_icon.addClass('fa-pause');
    } else {
      audio_icon.removeClass('fa-pause');
      audio_icon.addClass('fa-play');
    }
  })
})()
