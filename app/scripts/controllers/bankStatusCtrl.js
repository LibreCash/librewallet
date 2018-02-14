'use strict';
var bankStatusCtrl = function($scope, libreService, $translate) {
    var bankAddress = libreService.bank.address,
        getBankDataAsync = libreService.methods.getBankDataAsync,
        normalizeUnixTime = libreService.methods.normalizeUnixTime,
        normalizeRate = libreService.methods.normalizeRate,
        hexToString = libreService.methods.hexToString,
        getStateName = libreService.methods.getStateName,
        balanceBank = 0;

    if (globalFuncs.getDefaultTokensAndNetworkType().networkType != libreService.networkType) {
        $translate("LIBREBUY_networkFail").then((msg) => {
            $scope.notifier.danger(msg);
        });
        return;
    }

    ajaxReq.getBalance(bankAddress, function(balanceData) {
        balanceBank = etherUnits.toEther(balanceData.data.balance, 'wei');
    });

    $scope.ajaxReq = ajaxReq;

    var oracles = {},
    varsObject = {
        tokenAddress: {
            default: "LibreCash Contract",
            translate: "VAR_tokenAddress"
        },
        buyRate: {
            default: "Buy Rate",
            translate: "VAR_buyRate",
            process: normalizeRate
        },
        sellRate: {
            default: "Sell Rate",
            translate: "VAR_sellRate",
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
        oracleCount: {
            default: "Oracle Count",
            translate: "VAR_countOracles"
        },
        requestPrice:{
           default:"Request price",
           translate: "VAR_requestPrice", // translate later
           process: (price) => etherUnits.toEther(price, 'wei')
        },
        getState: {
            default: "State",
            translate: "VAR_contractState",
            process: getStateName
        },
        requestTime:{
            default: "Request time",
            translate: "VAR_requestTime", //append later
            process: normalizeUnixTime
        },
        calcTime: {
            default: "Calc time",
            translate: "VAR_calcTime", //append later
            process: normalizeUnixTime
        },
        tokenBalance: {
            default: "Exchanger token balance",
            translate: "VAR_tokenBalance",
            process: (tokens) => tokens / Math.pow(10, libreService.coeff.tokenDecimals)
        }
    };
    
    $scope.address = bankAddress;

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
        });
    }).catch(e => {
        console.log(e);
    });

    $scope.contractData = varsObject;

    const oraclesStruct = {
        address:0,
        name:1,
        type:2,
        waitQuery:3,
        updateTime:4,
        callbackTime:5,
        rate:6,
    };


    function recursiveGetOracleData(number,limit) {
        getBankDataAsync("getOracleData", [number]).then((res) => {
            let oracle = res.data;
            console.log(oracle);

            oracles[oracle[oraclesStruct.address]] = {
                name: hexToString(oracle[oraclesStruct.name]),
                type: hexToString(oracle[oraclesStruct.type]),
                updateTime: normalizeUnixTime(oracle[oraclesStruct.updateTime]),
                waiting: oracle[oraclesStruct.waitQuery],
                rate: normalizeRate(oracle[oraclesStruct.rate])
            };

            number++;

            if (number < limit) {
                recursiveGetOracleData(number,limit);
            } else {
                $scope.oracles = oracles;
            }
        })
    }

    getBankDataAsync("oracleCount").then((res) => {
        let count = res.data[0];
        recursiveGetOracleData(1,count);
    });
};
module.exports = bankStatusCtrl;