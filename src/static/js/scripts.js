$(document).ready(function() {
  var csrftoken = getCookie('csrftoken')

  $("#search_button").click(function() {
    $('#search_button').prop('disabled', true)
    if ($('#info_dropdown').hasClass('expand')) {
      $('#info_dropdown').removeClass('expand')

      $('#info_dropdown').bind('transitionend', function(){
        $('#info_dropdown').empty()
        $('#info_dropdown').removeClass('danger')
        $('#info_dropdown').removeClass('warning')
        $('#info_dropdown').removeClass('working')
        $('#info_dropdown').removeClass('success')
        analyse_address()
        $('#search_button').prop('disabled', false)
        $('#info_dropdown').unbind('transitionend')
      })  
    } else {
      analyse_address()
      $('#search_button').prop('disabled', false)
    }
  })

  function loading_bar_width(percent) {
    $('#loading_bar').width('calc(' + percent + '% - 0px)')
    $('#loading_bar').css("background-size", "400% 400%")
  }

  function loading_bar_message(message, error=false) {
    $('#loading_bar').empty()
    if (error) {
      $('#loading_bar').removeClass('working')
      $('#loading_bar').addClass('error')
      $('#loading_bar').append('<p class="info-text">' + message + '</p>')
    } else {
      $('#loading_bar').removeClass('error')
      $('#loading_bar').addClass('working')
      $('#loading_bar').append('<p class="info-text">' + message + '</p>')
    }
  }

  async function remove_loading_bar() {
    await new Promise(r => setTimeout(r, 1500));
    $('#info_loading').slideUp(200, function() {
      $('#info_loading').hide()
    })
  }

  async function analyse_address() {
    var address = $("#address_field").val()
    $('#info_dropdown').addClass('working')
    if (validate_address(address)) {
      var analysis_complete = false
      var task_id = false

      $('#info_dropdown').append('<div id="info_loading" class="loading-div"></div>')
      $('#info_loading').append('<div id="loading_bar" class="loading-bar"></div>')

      $('#info_dropdown').append('<div id="info_dropdown_body" class="row w-100 m-3 align-items-center justify-content-start flex-nowrap"></div>')
      $('#info_dropdown_body').append('<div id="info_percentage_col" class=" text-center mr-5 ml-4"></div>')
      $('#info_dropdown_body').append('<div id="info_info_col" class="w-100 d-flex m-2 align-items-center flex-column"></div>')
      

      $('#info_dropdown').append('<a id="info_dropdown_footer" class="info-dropdown-footer row m-0 w-100 align-items-center justify-content-center"></a>')
      $('#info_dropdown_footer').append('<i class="fas fa-chevron-up fa-2x info-icon"></i>')
      $('#info_dropdown_footer').click(function(){              
        collapse_dropdown()
      })

      $('#info_loading').hide()

      while (!analysis_complete) {
        params = {csrfmiddlewaretoken: csrftoken, address: address}
        if (task_id != false) {
          params.task_id = task_id
        }

        data = await new Promise(r => {
          $.post('/api/analyse-address/', params).done(function(data){
            r(data)
          })        
        })
        console.log(data)
        $('#address_field').addClass('search-bar-border-radius')
        $('#search_button').addClass('search-button-border-radius')
        $('#info_dropdown').addClass('expand')      
        task_id = data.task_id
        $('#info_percentage_col').empty()
        $('#info_info_col').empty()
        $('#info_dropdown').removeClass('working')
        $('#info_dropdown').removeClass('danger')
        $('#info_dropdown').removeClass('warning')
        $('#info_dropdown').removeClass('success')

        if (data.update_state == "completed") {
          analysis_complete = true
          loading_bar_width(100)
          loading_bar_message("Completed")
          remove_loading_bar()
          task_id = false
        } 

        if (data.update_state == "rate_limited") {
          analysis_complete = true
          loading_bar_width(100)
          loading_bar_message("Rate Limit Active. Please Try Again Later", error=true)
          task_id = false
        }

        if (data.update_state == "address_created") {
          loading_bar_width(20)
          loading_bar_message("Creating Address")
          $('#info_loading').show()
        }

        
        if (data.update_state == "fetching_data") {
          loading_bar_width(40)
          loading_bar_message("Fetching Data")
          $('#info_loading').show()
        }
        
        if (data.update_state == "analysing") {
          loading_bar_width(60)
          loading_bar_message("Analysing")
          $('#info_loading').show()
        }
        
        if (data.update_state == "adding_run") {
          loading_bar_width(80)
          loading_bar_message("Adding Run")
          $('#info_loading').show()
        }

        if (data.runs.length > 0) {
          percentage = Math.round(data.runs[0].percentage)
          if (percentage > 99) {
            var probablilty = ''
            $('#info_dropdown').toggleClass('danger')
          } else if (percentage < 100 && percentage >= 80) {
            var probablilty = 'almost certainly '
            $('#info_dropdown').toggleClass('danger')
          } else if (percentage < 80 && percentage >= 60) {
            var probablilty = 'probably '
            $('#info_dropdown').toggleClass('warning')
          } else if (percentage < 60 && percentage >= 40) {
            var probablilty = 'possibly '
            $('#info_dropdown').toggleClass('warning')
          } else if (percentage < 40 && percentage >= 20) {
            var probablilty = 'unlikely to be '
            $('#info_dropdown').addClass('success')
          } else if (percentage < 20 && percentage > 0) {
            var probablilty = 'very unlikely to be '
            $('#info_dropdown').addClass('success')
          } else if (percentage == 0) {
            var probablilty = 'not '
            $('#info_dropdown').addClass('success')
          }

          $('#info_percentage_col').append('<p id="percent" class="info-text percent">' + percentage + '%</p>')
          $('#info_info_col').append('<div id="info_flavour_text" class="info-text"></div>')
          $('#info_flavour_text').append('<p class="m-0 text-uppercase info-flavour-text">This address is ' + probablilty + 'malicious.</p>')
          $('#info_info_col').append('<div id="info_history" class="w-100 m-2 info-text"></div>')
          $('#info_history').append('<table class="info-table info-text"><caption>Search History</caption><thead><tr><th scope="col">Percentage</th><th scope="col">Transactions</th><th scope="col">Date & Time (UTC/GMT)</th></tr></theah><tbody id="info_history_table"></tbody></table>')
          for (run of data.runs) {
            $('#info_history_table').append('<tr><td>' + run.percentage + '</td><td>' + run.transactions + '</td><td>' + run.date + '</td></tr>')
          }
              
        } else {
          $('#info_dropdown').addClass('working')
          $('#info_percentage_col').append('<p class="info-text info-flavour-text p-0 m-0">No Score</p>')
          $('#info_info_col').append('<div id="info_flavour_text" class="info-text"></div>')
          $('#info_flavour_text').append('<p class="m-0 text-uppercase info-flavour-text">We haven\'t seen this address before... Please wait while we gather more information.</p>')
        }
        await new Promise(r => setTimeout(r, 200));
      }
      

    } else {
      if (address.substring(0,3) == 'bc1') {
        $('#info_dropdown').append('<p class="info-text mt-2 mb-2 ml-2">Bech32 addresses not supported.</p>')
        $('#info_dropdown').removeClass('working')
        $('#info_dropdown').addClass('danger')
        $('#address_field').addClass('search-bar-border-radius')
        $('#search_button').addClass('search-button-border-radius')
        $('#info_dropdown').toggleClass('expand')
        console.log("Bech32 Addresses not supported")
      } else if (address.length == 0) {
        $('#info_dropdown').append('<p class="info-text mt-2 mb-2 ml-2">No address entered.</p>')
        $('#info_dropdown').removeClass('working')
        $('#info_dropdown').addClass('danger')
        $('#address_field').addClass('search-bar-border-radius')
        $('#search_button').addClass('search-button-border-radius')
        $('#info_dropdown').toggleClass('expand')
      } else {
        $('#info_dropdown').append('<p class="info-text mt-2 mb-2 ml-2">Address invalid.</p>')
        $('#info_dropdown').removeClass('working')
        $('#info_dropdown').addClass('danger')
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

  function collapse_dropdown() {
    $('#info_dropdown_footer').unbind('click')
    $('#info_dropdown').toggleClass('expand')

    $('#info_dropdown').bind('transitionend', function(){
      $('#info_dropdown').empty()
      $('#info_dropdown').removeClass('danger')
      $('#info_dropdown').removeClass('warning')
      $('#info_dropdown').removeClass('working')
      $('#info_dropdown').removeClass('success')
      $('#address_field').removeClass('search-bar-border-radius')
      $('#search_button').removeClass('search-button-border-radius')
      $('#info_dropdown').unbind('transitionend')
    });
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