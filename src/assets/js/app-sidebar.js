/*!
 =========================================================
 * Apex Angular 4 Bootstrap theme - V1.0
 =========================================================

 * Product Page: https://www.pixinvent.com/product/apex
 * Copyright 2017 Pixinvent Creative Studio (https://www.pixinvent.com)

 =========================================================
*/
 $(document).ready( function(){


    var $sidebar = $('.app-sidebar'),
    $sidebar_content = $('.sidebar-content'),
    $sidebar_img = $sidebar.data('image'),
    $sidebar_img_container = $('.sidebar-background'),
    $wrapper = $('.wrapper');

    $sidebar_content.perfectScrollbar();

    if( $sidebar_img_container.length !== 0 && $sidebar_img !== undefined ){
        $sidebar_img_container.css('background-image','url("' + $sidebar_img + '")');
    }

    if(!$wrapper.hasClass('nav-collapsed')){
        $sidebar_content.find('li.active').parents('li').addClass('open');
    }


    $sidebar_content.on('click', '.navigation li a',function(){
        var $this = $(this),
        listItem = $this.parent('li');

        if(listItem.hasClass('has-sub') && listItem.hasClass('open')){
            collapse(listItem);
        }
        else{
            if(listItem.hasClass('has-sub')){
                expand(listItem);
            }

            // If menu collapsible then do not take any action
            if ($sidebar_content.data('collapsible')) {
                return false;
            }
            // If menu accordion then close all except clicked once
            else {
                openListItems = listItem.siblings('.open');
                collapse(openListItems);
                listItem.siblings('.open').find('li.open').removeClass('open');
            }
        }
    });

    function collapse($listItem, callback) {
        var $subList = $listItem.children('ul');

        $subList.show().slideUp(200, function() {
            $(this).css('display', '');

            $(this).find('> li').removeClass('is-shown');

            $listItem.removeClass('open');

            if (callback) {
                callback();
            }
        });

    }

    function expand($listItem, callback) {
        var $subList = $listItem.children('ul');
        var $children = $subList.children('li').addClass('is-hidden');

        $listItem.addClass('open');

        $subList.hide().slideDown(200, function() {
            $(this).css('display', '');

            if (callback) {
                callback();
            }
        });



        setTimeout(function() {
            $children.addClass('is-shown');
            $children.removeClass('is-hidden');
        }, 0);
    }

    $('.logo-text').on('click',function(){

        var listItem = $sidebar_content.find('li.open.has-sub'),
        activeItem = $sidebar_content.find('li.active');

        if(listItem.hasClass('has-sub') && listItem.hasClass('open')){
            collapse(listItem);
            listItem.removeClass('open');
            if(activeItem.closest('li.has-sub')){
                openItem = activeItem.closest('li.has-sub');
                expand(openItem);
                openItem.addClass('open');
            }
        }
        else{
            if(activeItem.closest('li.has-sub')){
                openItem = activeItem.closest('li.has-sub');
                expand(openItem);
                openItem.addClass('open');
            }
        }
    });


    $('.nav-toggle').on('click',function(){
        var $this = $(this),
        toggle_icon= $this.find('.toggle-icon'),
        toggle = toggle_icon.attr('data-toggle');
        compact_menu_checkbox = $('.cz-compact-menu');

        if(toggle === 'expanded'){
          console.log('aaa');
          $( ".logo-img2" ).hide();
          $( ".logo-img" ).show();
            $wrapper.addClass('nav-collapsed');

            $('.nav-toggle').find('.toggle-icon').removeClass('ft-toggle-right').addClass('ft-toggle-left');
            toggle_icon.attr('data-toggle', 'collapsed');
            if(compact_menu_checkbox.length > 0){
                compact_menu_checkbox.prop('checked',true);
            }
        }
        else{
          console.log('dsf');
          $( ".logo-img" ).hide();
          $( ".logo-img2" ).show();
            $wrapper.removeClass('nav-collapsed menu-collapsed');

            $('.nav-toggle').find('.toggle-icon').removeClass('ft-toggle-left').addClass('ft-toggle-right');
            toggle_icon.attr('data-toggle', 'expanded');
            if(compact_menu_checkbox.length > 0){
                compact_menu_checkbox.prop('checked',false);
            }
        }
    });

    $sidebar.on('mouseenter', function() {
        if($wrapper.hasClass('nav-collapsed')){
            $( ".logo-img" ).hide();
            $( ".logo-img2" ).show();
            $wrapper.removeClass('menu-collapsed');
            var $listItem = $('.navigation li.nav-collapsed-open'),
            $subList = $listItem.children('ul');

            $subList.hide().slideDown(300, function() {
                $(this).css('display', '');
            });

            $listItem.addClass('open').removeClass('nav-collapsed-open');
        }
    }).on('mouseleave', function(event) {
        if($wrapper.hasClass('nav-collapsed')){
            $( ".logo-img2" ).hide();
            $( ".logo-img" ).show();
            $wrapper.addClass('menu-collapsed');
            var $listItem = $('.navigation li.open'),
            $subList = $listItem.children('ul');
            $listItem.addClass('nav-collapsed-open');

            $subList.show().slideUp(300, function() {
                $(this).css('display', '');
            });

            $listItem.removeClass('open');
        }
    });

    if ($(window).width() < 992) {
        $sidebar.addClass('hide-sidebar');
        $wrapper.removeClass('nav-collapsed menu-collapsed');
    }
    $( window ).resize(function() {
        if ($(window).width() < 992) {
            $sidebar.addClass('hide-sidebar');
            $wrapper.removeClass('nav-collapsed menu-collapsed');
        }
        if ($(window).width() > 992) {
            $sidebar.removeClass('hide-sidebar');
            if( $('.toggle-icon').attr('data-toggle') === 'collapsed' &&  $wrapper.not('.nav-collapsed menu-collapsed')){
                $wrapper.addClass('nav-collapsed menu-collapsed');
            }
        }
    });

    $(document).on('click', '.navigation li:not(.has-sub)', function(){
        if( $(window).width() < 992 ){
            $sidebar.addClass('hide-sidebar');
        }
    });

    $(document).on('click', '.logo-text', function(){
        if( $(window).width() < 992 ){
            $sidebar.addClass('hide-sidebar');
        }
    });


    $('.navbar-toggle').on('click',function(e){
        e.stopPropagation();
        $sidebar.toggleClass('hide-sidebar');
    });

    $('html').on('click', function (e) {
        if ($(window).width() < 992) {
            if (!$sidebar.hasClass('hide-sidebar') && $sidebar.has(e.target).length === 0) {
                $sidebar.addClass('hide-sidebar');
            }
        }
    });

    $('#sidebarClose').on('click', function(){
        $sidebar.addClass('hide-sidebar');
    });

    $('.noti-list').perfectScrollbar();
});
