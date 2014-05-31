jQuery.fn.extend({
  slideRightShow: function(speed) {
    return this.each(function() {
        $(this).show('slide', {direction: 'right'}, +speed || 1000);
    });
  },
  slideLeftHide: function(speed) {
    return this.each(function() {
      $(this).hide('slide', {direction: 'left'}, +speed || 1000);
    });
  },
  slideRightHide: function(speed) {
    return this.each(function() {
      $(this).hide('slide', {direction: 'right'}, +speed || 1000);
    });
  },
  slideLeftShow: function(speed) {
    return this.each(function() {
      $(this).show('slide', {direction: 'left'}, +speed || 1000);
    });
  }
});
