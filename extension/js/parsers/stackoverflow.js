var values = {};
values.summary = document.getElementById("question-header").textContent.trim();
values.tags = [].slice.apply(document.querySelectorAll('.post-taglist [rel=tag]')).map(function(el) {
  return el.textContent.trim();
});
values;
