'use strict';
var bankStatusCtrl = async function($scope, libreService) {
    var bankAddress = libreService.bank.address,
        getBankDataAsync = libreService.methods.getBankDataAsync,
        normalizeUnixTime = libreService.methods.normalizeUnixTime,
        normalizeRate = libreService.methods.normalizeRate,
        hexToString = libreService.methods.hexToString,
        getStateName = libreService.methods.getStateName;

    $scope.ajaxReq = ajaxReq;

    var oracles = {},
    varsObject = {
        tokenAddress: {
            default: "LibreCash Contract",
            translate: "VAR_tokenAddress"
        },
        cryptoFiatRateBuy: {
            default: "Buy Tokens Rate",
            translate: "VAR_cryptoFiatRateBuy",
            process: normalizeRate
        },
        cryptoFiatRateSell: {
            default: "Sell Tokens Rate",
            translate: "VAR_cryptoFiatRateSell",
            process: normalizeRate
        },
        buyFee: {
            default: "Buy Fee",
            translate: "VAR_buyFee",
            process: function(data) {
                return "{0} %".replace("{0}", data / 100);
            }
        },
        sellFee: {
            default: "Sell Fee",
            translate: "VAR_sellFee",
            process: function(data) {
                return "{0} %".replace("{0}", data / 100);
            }
        },
        getBuyOrdersCount: {
            default: "Buy Orders Count",
            translate: "VAR_getBuyOrdersCount"
        },
        getSellOrdersCount: {
            default: "Sell Orders Count",
            translate: "VAR_getSellOrdersCount"
        },
        numEnabledOracles: {
            default: "Enabled Oracle Count",
            translate: "VAR_numEnabledOracles"
        },
        numReadyOracles: {
            default: "Ready Oracle Count",
            translate: "VAR_numReadyOracles"
        },
        countOracles: {
            default: "All Oracle Count",
            translate: "VAR_countOracles"
        },
        relevancePeriod: {
            default: "Emission Period in seconds",
            translate: "VAR_relevancePeriod"
        },
        queuePeriod: {
            default: "Queue Updating max Period in seconds",
            translate: "VAR_queuePeriod"
        },
        timeUpdateRequest: {
            default: "Time update requests were sent",
            translate: "VAR_timeUpdateRequest",
            process: normalizeUnixTime
        },
        contractState: {
            default: "State of the contract",
            translate: "VAR_contractState",
            process: getStateName
        }
    }
    
    $scope.address = bankAddress;
    $scope.oracles = oracles;

    var bankPromises = [];
    for (var prop in varsObject) {
        let bankPromise = getBankDataAsync(prop);
        bankPromises.push(bankPromise);
    } // for
    Promise.all(bankPromises).then(bankData => {
        bankData.forEach(data => {
            if (varsObject[data.varName].process != null) {
                data.data = varsObject[data.varName].process(data.data);
            } else {
                data.data = data.data[0];
            }
            varsObject[data.varName].data = data;
            console.log(data);
        });
    }).catch(e => {
        console.log(e);
    });

    $scope.contractData = varsObject;

    const 
        ORACLE_NAME = 0,
        ORACLE_TYPE = 1,
        ORACLE_UPDATE_TIME = 2,
        ORACLE_ENABLED = 3,
        ORACLE_WAITING = 4,
        ORACLE_RATE = 5,
        ORACLE_NEXT = 6;
    let curOracle = await getBankDataAsync("firstOracle");

    
    for (
        let curData = await getBankDataAsync("getOracleData", curOracle.data);
        ;
        curOracle.data[0] = curData.data[ORACLE_NEXT],
        curData = await getBankDataAsync("getOracleData", curOracle.data)
    ) {
        oracles[curOracle.data[0]] = {
            name: hexToString(curData.data[ORACLE_NAME]),
            type: hexToString(curData.data[ORACLE_TYPE]),
            updateTime: normalizeUnixTime(curData.data[ORACLE_UPDATE_TIME]),
            enabled: curData.data[ORACLE_ENABLED],
            waiting: curData.data[ORACLE_WAITING],
            rate: normalizeRate(curData.data[ORACLE_RATE])
        };
        if(+curData.data[ORACLE_NEXT] == 0) break;   
    }   
};
module.exports = bankStatusCtrl;