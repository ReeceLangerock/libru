//modal setup based off https://www.w3schools.com/howto/howto_css_modals.asp

var modal, btn, span;

$(document).ready(function() {
  modal = document.getElementById('myModal');

    console.log("modal");

  // Get the button that opens the modal
  buttons = document.querySelectorAll(".requestButton");
  buttons.forEach(button => button.addEventListener('click', display));

  // Get the <span> element that closes the modal
  span = document.getElementsByClassName("close")[0];

  // When the user clicks the button, open the modal
  function display() {
      modal.style.display = "block";
      modalBookReceiveIdValue.value = this.dataset.bookid;
      modalBookOwnerIdValue.value = this.dataset.bookownerid;
  }

  // When the user clicks on <span> (x), close the modal
  span.onclick = function() {
      modal.style.display = "none";
  }

  // When the user clicks anywhere outside of the modal, close it
  window.onclick = function(event) {
      if (event.target == modal) {
          modal.style.display = "none";
      }
    }
});
