$(document).ready( function(){

    /********************************
    *           Customizer          *
    ********************************/
    var body = $('body'),
    default_bg_color = $('.app-sidebar').attr('data-background-color'),
    default_bg_image = $('.app-sidebar').attr('data-image');

    // Customizer toggle & close button click events  [Remove customizer code from production]
    $('.customizer-toggle').on('click',function(){
        $('.customizer').toggleClass('open');
    });
    $('.customizer-close').on('click',function(){
        $('.customizer').width('360px');
        $('.customizer-maximize').show();
        $('.customizer-minimize').hide();
        $('.customizer').removeClass('open');
    });
    if($('.customizer-content').length > 0){
        $('.customizer-content').perfectScrollbar({
            theme:"dark"
        });
    }

    $('.cz-compact-menu').on('click',function(){
        $('.nav-toggle').trigger('click');
        if($(this).prop('checked') === true){
            $('.app-sidebar').trigger('mouseleave');
        }
    });

    $('.cz-sidebar-width').on('change',function(){
        var $this = $(this),
        width_val = this.value,
        wrapper = $('.wrapper');

        if(width_val === 'small'){
            $(wrapper).removeClass('sidebar-lg').addClass('sidebar-sm');
        }
        else if(width_val === 'large'){
            $(wrapper).removeClass('sidebar-sm').addClass('sidebar-lg');
        }
        else{
            $(wrapper).removeClass('sidebar-sm sidebar-lg');
        }

    });

    //añadido

    $('.customizer-maximize').on('click',function(){
        $('.customizer-maximize').hide();
        $('.customizer-minimize').show();
        $('.customizer').width('100%');
    });

    $('.customizer-minimize').on('click',function(){
        $('.customizer-maximize').show();
        $('.customizer-minimize').hide();
        $('.customizer').width('360px');
    });

});
