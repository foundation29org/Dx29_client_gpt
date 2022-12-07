// Define the tour!
var tour = {
    id: "demo-tour",
    showPrevButton: false,
    showNextButton: false,
    showCTAButton :false,
    steps: [

        {
            title: "",
            content: "Create the first patient",
            target: "newpatient",
            placement: "right"
        }
    ]
};
hopscotch.startTour(tour);

//	<button id="btnStartTour" class="btn btn-primary btn-raised">Start Tour</button>
$('#btnStartTour').on('click',function(e){
    hopscotch.startTour(tour);
});

// Start the tour!
