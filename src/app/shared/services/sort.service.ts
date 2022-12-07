import { Injectable } from '@angular/core';
@Injectable()
export class SortService {

    constructor() { }

    GetSortOrderNames(prop: string) {
        return function (a, b) {
            if (a[prop].indexOf('case-') != -1 && b[prop].indexOf('case-') != -1) {
                var resa = a[prop].split("case-");
                var resb = b[prop].split("case-");
                if (parseInt(resa[1]) < parseInt(resb[1])) {
                    return -1;
                } else if (parseInt(resa[1]) > parseInt(resb[1])) {
                    return 1;
                }
                return 0;

            } else {
                if (a[prop].toLowerCase() > b[prop].toLowerCase()) {
                    return 1;
                } else if (a[prop].toLowerCase() < b[prop].toLowerCase()) {
                    return -1;
                }
                return 0;
            }

        }
    }

    GetSortOrder(prop: string) {
        return function (a, b) {
            if (a[prop] > b[prop]) {
                return 1;
            } else if (a[prop] < b[prop]) {
                return -1;
            }
            return 0;
        }
    }

    GetSortOrderNumber(prop: string) {
        return function (a, b) {
            if (parseInt(a[prop]) < parseInt(b[prop])) {
                return 1;
            } else if (parseInt(a[prop]) > parseInt(b[prop])) {
                return -1;
            }
            return 0;
        }
    }

    GetSortOrderNumberPriority(prop1: string, prop2: string, prop3: string) {
        return function (a, b) {
            if (parseInt(a[prop1]) < parseInt(b[prop1])) {
                return 1;
            } else if (parseInt(a[prop1]) > parseInt(b[prop1])) {
                return -1;
            } else {
                if (parseInt(a[prop2]) < parseInt(b[prop2])) {
                    return 1;
                } else if (parseInt(a[prop2]) > parseInt(b[prop2])) {
                    return -1;
                } else {
                    if (parseInt(a[prop3]) < parseInt(b[prop3])) {
                        return 1;
                    } else if (parseInt(a[prop3]) > parseInt(b[prop3])) {
                        return -1;
                    }
                    return 0;
                }
            }

        }
    }

    GetSortOrderNumberLength(prop: string) {
        return function (a, b) {
            if (parseInt(a[prop].length) < parseInt(b[prop].length)) {
                return 1;
            } else if (parseInt(a[prop].length) > parseInt(b[prop].length)) {
                return -1;
            }
            return 0;
        }
    }

    GetSortOrderNumberInverse(prop: string) {
        return function (a, b) {
            if (parseInt(a[prop]) > parseInt(b[prop])) {
                return 1;
            } else if (parseInt(a[prop]) < parseInt(b[prop])) {
                return -1;
            }
            return 0;
        }
    }

    GetSortOrderInverse(prop: string) {
        return function (a, b) {
            if (a[prop] < b[prop]) {
                return 1;
            } else if (a[prop] > b[prop]) {
                return -1;
            }
            return 0;
        }
    }

    DateSort(prop: string) {
        return function (a, b) {
            if (new Date(b[prop]).getTime() > new Date(a[prop]).getTime()) {
                return 1;
            } else if (new Date(b[prop]).getTime() < new Date(a[prop]).getTime()) {
                return -1;
            }
            return 0;
        }
    }

    GetSortSymptoms() {
        var prop1 = "frequencyId";
        var prop2_1 = "myCase";
        var prop2_2 = "referenceCase";
        var prop3 = "name";
        return function (a, b) {
            if ((a[prop1]) > (b[prop1])) {
                return 1;
            } else if ((a[prop1]) < (b[prop1])) {
                return -1;
            } else {
                if (a[prop2_1] && a[prop2_2]) {
                    return -1;
                } else if (!a[prop2_1] || !a[prop2_2]) {
                    return 1;
                } else {
                    if ((a[prop3]) > (b[prop3])) {
                        return 1;
                    } else if ((a[prop3]) < (b[prop3])) {
                        return -1;
                    }
                    return 0;
                }
            }

        }
    }

    GetSortSymptoms2() {
        var prop1 = "frequencyId";
        var prop2_1 = "myCase";
        var prop2_2 = "referenceCase";
        var prop3 = "name";
        return function (a, b) {
            if ((a[prop1]) == (b[prop1])) {
                if ((a[prop2_1] && a[prop2_2]) && (b[prop2_1] && b[prop2_2])) {
                    if ((a[prop3]).toLowerCase() > (b[prop3]).toLowerCase()) {
                        return 1;
                    } else if ((a[prop3]).toLowerCase() < (b[prop3]).toLowerCase()) {
                        return -1;
                    } else {
                        return 0;
                    }

                } else {
                    return 0;
                }
            } else {
                return 0;
            }

        }
    }

    GetSortTwoElements(prop1: string, prop2: string) {
        return function (a, b) {
            if (a[prop1] < b[prop1]) {
                return 1;
            } else if (a[prop1] > b[prop1]) {
                return -1;
            } else {
                if (a[prop2] < b[prop2]) {
                    return 1;
                } else if (a[prop2] > b[prop2]) {
                    return -1;
                } else {
                    return 0;
                }
            }

        }
    }

    GetSortFilesNcrType(prop: string) {
        return function (a, b) {
            if (a.ncrResults[prop] > b.ncrResults[prop]) {
                return 1;
            } else if (a.ncrResults[prop] < b.ncrResults[prop]) {
                return -1;
            }
            return 0;
        }
    }

    GetSortFilesNcrName(prop: string, lang: string) {
        return function (a, b) {
            if (a.origenFile[prop] == 'ncrresult.json') {
                if (lang == 'es') {
                    a.origenFile[prop] = 'Free Text'
                } else {
                    a.origenFile[prop] = 'Texto libre'
                }

            }
            if (a.origenFile[prop] > b.origenFile[prop]) {
                return 1;
            } else if (a.origenFile[prop] < b.origenFile[prop]) {
                return -1;
            }
            return 0;
        }
    }

    GetSortOtherFiles(prop: string) {
        return function (a, b) {
            if (a.origenFile[prop] > b.origenFile[prop]) {
                return 1;
            } else if (a.origenFile[prop] < b.origenFile[prop]) {
                return -1;
            }
            return 0;
        }
    }

    DateSortFiles(prop: string) {
        return function (a, b) {
            if (new Date(b.origenFile[prop]).getTime() > new Date(a.origenFile[prop]).getTime()) {
                return 1;
            } else if (new Date(b.origenFile[prop]).getTime() < new Date(a.origenFile[prop]).getTime()) {
                return -1;
            }
            return 0;
        }
    }

    GetSortTwoElementsLand(prop1: string, prop2: string) {
        return function (a, b) {
            if (a[prop1].id < b[prop1].id) {
                return -1;
            } else if (a[prop1].id > b[prop1].id) {
                return 1;
            } else {
                if (a[prop2] < b[prop2]) {
                    return -1;
                } else if (a[prop2] > b[prop2]) {
                    return 1;
                } else {
                    return 0;
                }
            }

        }
    }

    GetSortSymptomsLand() {
        var prop1 = "frequency";
        var prop2_1 = "hasDisease";
        var prop2_2 = "hasPatient";
        var prop3 = "name";
        return function (a, b) {
            if ((a[prop1].id) > (b[prop1].id)) {
                return 1;
            } else if ((a[prop1].id) < (b[prop1].id)) {
                return -1;
            } else {
                if (a[prop2_1] && a[prop2_2]) {
                    return -1;
                } else if (!a[prop2_1] || !a[prop2_2]) {
                    return 1;
                } else {
                    if ((a[prop3]) > (b[prop3])) {
                        return 1;
                    } else if ((a[prop3]) < (b[prop3])) {
                        return -1;
                    }
                    return 0;
                }
            }

        }
    }

    GetSortSymptoms2Land() {
        var prop1 = "frequency";
        var prop2_1 = "hasDisease";
        var prop2_2 = "hasPatient";
        var prop3 = "name";
        return function (a, b) {
            if ((a[prop1].id) == (b[prop1].id)) {
                if ((a[prop2_1] && a[prop2_2]) && (b[prop2_1] && b[prop2_2])) {
                    if ((a[prop3]).toLowerCase() > (b[prop3]).toLowerCase()) {
                        return 1;
                    } else if ((a[prop3]).toLowerCase() < (b[prop3]).toLowerCase()) {
                        return -1;
                    } else {
                        return 0;
                    }

                } else {
                    return 0;
                }
            } else {
                return 0;
            }

        }
    }

}
