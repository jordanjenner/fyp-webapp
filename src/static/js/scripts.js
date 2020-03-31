$(document).ready(function() {
  var csrftoken = getCookie('csrftoken')

  $("#search_button").click(function() {
    $('#search_button').prop('disabled', true)
    if ($('#info_dropdown').hasClass('expand')) {
      $('#info_dropdown').toggleClass('expand')

      setTimeout(function(){
        $('#info_dropdown').empty()
        $('#info_dropdown').removeClass('danger')
        $('#info_dropdown').removeClass('warning')
        $('#info_dropdown').removeClass('working')
        $('#info_dropdown').removeClass('success')
        analyse_address()
        $('#search_button').prop('disabled', false)
      }, 500)   
    } else {
      analyse_address()
      $('#search_button').prop('disabled', false)
    }
  })

  function analyse_address() {
    var address = $("#address_field").val()
    if (validate_address(address)) {
      $.post('/api/analyse-address/' + address + '/', {csrfmiddlewaretoken: csrftoken}).done(function(data){
        var percentage = Math.round(data.percentage*100)
        console.log(percentage)
        $('#info_dropdown').append('<div id="info_dropdown_body" class="row w-100 m-3 align-items-center justify-content-start flex-nowrap"></div>')
        $('#info_dropdown_body').append('<div id="info_percentage_col" class="mr-5 ml-4"></div>')
        $('#info_dropdown_body').append('<div id="info_flavour_text" class="flex-grow-1 m-2 info-text"></div>')
        $('#info_percentage_col').append('<p class="info-text percent">' + percentage + '%</p>')
        $('#info_flavour_text').append('<p class="m-0">Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.</p>')
        $('#info_dropdown').append('<div id="info_dropdown_footer" class="info-dropdown-footer row m-0 w-100 align-items-center justify-content-center"></div>')
        $('#info_dropdown_footer').append('<i class="fas fa-chevron-up fa-2x info-icon"></i>')
        if (percentage < 40) {
          $('#info_dropdown').toggleClass('success')
        } else if (percentage >= 40 && percentage < 75) {
          $('#info_dropdown').toggleClass('warning')
        } else if (percentage >= 75) {
          $('#info_dropdown').toggleClass('danger')
        }
        $('#address_field').addClass('search-bar-border-radius')
        $('#search_button').addClass('search-button-border-radius')
        $('#info_dropdown').toggleClass('expand')
      })
    } else {
      if (address.substring(0,3) == 'bc1') {
        $('#info_dropdown').append('<p class="info-text mt-2 mb-2 ml-2">Bech32 addresses not supported.</p>')
        $('#info_dropdown').toggleClass('danger')
        $('#address_field').addClass('search-bar-border-radius')
        $('#search_button').addClass('search-button-border-radius')
        $('#info_dropdown').toggleClass('expand')
        console.log("Bech32 Addresses not supported")
      } else {
        $('#info_dropdown').append('<p class="info-text mt-2 mb-2 ml-2">Address invalid.</p>')
        $('#info_dropdown').toggleClass('danger')
        $('#address_field').addClass('search-bar-border-radius')
        $('#search_button').addClass('search-button-border-radius')
        $('#info_dropdown').toggleClass('expand')
      }
    }
  }

  function validate_address(address) {
    if (
      (address.substring(0,1) == '1' || address.substring(0,1) == '3' || address.substring(0,3) == 'bc1') &&
      (address.length >= 26 && address.length <= 35) &&
      address.match("^[A-Za-z0-9]{26,35}$")
    ) {
      console.log(address.length)
      return true
    } else {
      console.log(address.length)
      return false
    }
  }

  function info_dropdown(reason) {
    if (reason == 'invalid_address') {

    }
  }

  function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie != '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = jQuery.trim(cookies[i]);
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) == (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
  } 
})