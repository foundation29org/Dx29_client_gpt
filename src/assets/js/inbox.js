$(document).ready(function(){
	/*$('.email-application').height( $(window).height() - $('.navbar').height() - 100 );
	$(window).resize(function(){
	    $('.email-application').height( $(window).height() - $('.navbar').height() - 100 );
	});*/

	if( $('.email-app-sidebar-content').length > 0 ){
		 $('.email-app-sidebar-content').perfectScrollbar();
	}

	if($('.email-app-list').length > 0){
		$('.email-app-list').perfectScrollbar();
	}

	if ($(window).width() < 768) {
        if( $('.email-app-mail-content').length > 0 ){
            $('.email-app-mail-content').addClass('hide-email-content');
        }
    }

    $( window ).resize(function() {
        if ($(window).width() < 768) {
            $('.email-app-mail-content').addClass('hide-email-content');
        }
        if ($(window).width() > 768) {
            $('.email-app-mail-content').removeClass('hide-email-content');
        }
    });

    $('.list-group-item').on('click',function(){
    	$('.email-app-mail-content').removeClass('hide-email-content');
    });

    $('.back-to-inbox').on('click', function(){
    	$('.email-app-mail-content').addClass('hide-email-content');
    });
});