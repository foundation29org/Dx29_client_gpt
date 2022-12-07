import * as shape from 'd3-shape';

//Line Charts

export var lineChartView: any[] = [550, 400];

// options
export var lineChartShowXAxis = true;
export var lineChartShowYAxis = true;
export var lineChartGradient = false;
export var lineChartShowLegend = false;
export var lineChartShowXAxisLabel = true;
export var lineChartXAxisLabel = 'Date';
export var lineChartShowYAxisLabel = true;
export var lineChartYAxisLabel = 'Steps';

export var lineChartColorScheme = {
    domain: ['#009DA0', '#FF8D60', '#f9423a', '#AAAAAA']
};

// line, area
export var lineChartAutoScale = true;
export var lineChartLineInterpolation = shape.curveBasis;
