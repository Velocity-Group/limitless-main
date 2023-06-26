const toggle = document.getElementById("toggleDark");
const body = document.querySelector("body");

toggle.addEventListener("click", function () {
  this.classList.toggle("bi-moon");
  if (this.classList.toggle("bi-brightness-high-fill")) {
    body.style.background = "#FFFFFF";
    body.style.color = "#000000";
    body.style.transition = "1s";
    ///p
    var b = document.getElementsByTagName("p");
    for (var i = 0; i < b.length; i++) {
      console.log(b[i]);
      b[i].removeAttribute("data-theme");
    }
    ///div
    var bg = document.getElementsByTagName("div");
    for (var i = 0; i < bg.length; i++) {
      console.log(bg[i]);
      bg[i].removeAttribute("data-theme");
    }
    ///button
    var btn = document.getElementsByTagName("button");
    for (var i = 0; i < btn.length; i++) {
      console.log(btn[i]);
      btn[i].removeAttribute("data-theme");
    }
    ///img
    var img = document.getElementsByTagName("img");
    for (var i = 0; i < img.length; i++) {
      console.log(img[i]);
      img[i].removeAttribute("data-theme");
    }
    ///a
    var a = document.getElementsByTagName("a");
    for (var i = 0; i < a.length; i++) {
      console.log(a[i]);
      a[i].removeAttribute("data-theme");
    }
  } else {
    body.style.background = "#000000";
    body.style.color = "#FFFFFF";
    ///p
    var b = document.getElementsByTagName("p");
    for (var i = 0; i < b.length; i++) {
      console.log(b[i]);
      b[i].setAttribute("data-theme", "dark");
    }
    ///div
    var bg = document.getElementsByTagName("div");
    for (var i = 0; i < bg.length; i++) {
      console.log(bg[i]);
      bg[i].setAttribute("data-theme", "dark");
    }

    ///buttton
    var btn = document.getElementsByTagName("button");
    for (var i = 0; i < btn.length; i++) {
      console.log(btn[i]);
      btn[i].setAttribute("data-theme", "dark");
    }
    ///img
    var img = document.getElementsByTagName("img");
    for (var i = 0; i < img.length; i++) {
      console.log(img[i]);
      img[i].setAttribute("data-theme", "dark");
    }
    ///a
    var a = document.getElementsByTagName("a");
    for (var i = 0; i < a.length; i++) {
      console.log(a[i]);
      a[i].setAttribute("data-theme", "dark");
    }

    body.style.transition = "1s";
  }
});


