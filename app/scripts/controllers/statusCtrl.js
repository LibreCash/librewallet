'use strict';
var statusCtrl = function($scope, libreService, $translate) {
    var bankAddress = libreService.bank.address,
        getContractData = libreService.methods.getContractData,
        toUnixtime = libreService.methods.toUnixtime,
        normalizeRate = libreService.methods.normalizeRate,
        hexToString = libreService.methods.hexToString,
        stateName = libreService.methods.getStateName,
        getLatestBlockData = libreService.methods.getLatestBlockData,
        balanceBank = 0,
        IS_DEBUG = libreService.IS_DEBUG,
        stateMsg = {},
        latestBlockTime = 0;

    $scope.loading = true;

    const ORACLE_ACTUAL = 10 * 60; // todo fix constant

    if (globalFuncs.getDefaultTokensAndNetworkType().networkType != libreService.networkType) {
        $translate("LIBREBUY_networkFail").then((msg) => {
            $scope.notifier.danger(msg);
        });
        return;
    }

    function updateLastBlockTime() {
        getLatestBlockData().then((blockData) => {
            latestBlockTime = parseInt(blockData.data.timestamp, 16);
        });
    }
    updateLastBlockTime();

    ajaxReq.getBalance(bankAddress, function(balanceData) {
        balanceBank = etherUnits.toEther(balanceData.data.balance, 'wei');
    });

    function applyScope() {
        if (!$scope.$$phase) $scope.$apply();
    }

    $scope.ajaxReq = ajaxReq;

    var oracles = {},
    varsObject = {
        tokenAddress: {
            default: "LibreCash",
            translate: "VAR_tokenAddress"
        },
        buyRate: {
            default: "Buy Rate",
            translate: "VAR_buyRate",
            process: (data)=>`${normalizeRate(data)} Libre/ETH`
        },
        sellRate: {
            default: "Sell Rate",
            translate: "VAR_sellRate",
            process: (data)=>`${normalizeRate(data)} Libre/ETH`
        },
        buyFee: {
            default: "Buy Fee",
            translate: "VAR_buyFee",
            process: (data) =>`${data/100} %`
        },
        sellFee: {
            default: "Sell Fee",
            translate: "VAR_sellFee",
            process: (data) =>`${data/100} %`
        },
        oracleCount: {
            default: "Oracle Count",
            translate: "VAR_countOracles"
        },
        requestPrice:{
           default:"Request price",
           translate: "VAR_requestPrice", // translate later
           process: (price) => `${etherUnits.toEther(price, 'wei')} ETH`
        },
        getState: {
            default: "State",
            translate: "VAR_contractState",
            process: (state) => stateMsg[stateName(state)]
        },
        requestTime:{
            default: "Request time",
            translate: "VAR_requestTime", //append later
            process: (timestamp)=> timestamp == 0 ? '-' : toUnixtime(timestamp)
        },
        calcTime: {
            default: "Calc time",
            translate: "VAR_calcTime", //append later
            process: (timestamp)=> timestamp == 0 ? '-' : toUnixtime(timestamp)
        },
        tokenBalance: {
            default: "Exchanger token balance",
            translate: "VAR_tokenBalance",
            process: (tokens) => `${tokens / Math.pow(10, libreService.coeff.tokenDecimals)} Libre`
        }
    };
    
    $scope.address = bankAddress;
    $scope.contractData = varsObject;

    for (var state in libreService.coeff.statesENUM) {
        $translate(`LIBRE_state${state}`).then(msg => {stateMsg[state] = msg});
    }

    const oraclesStruct = {
        address: 0,
        name: 1,
        type: 2,
        waitQuery: 3,
        updateTime: 4,
        callbackTime: 5,
        rate: 6,
    };

    function getData(varsObject){
        let promises = Object.keys(varsObject).map((key) => getContractData(key));
        return Promise.all(promises);
    }

    function processData(bankData, varsObject) {
        return Promise.resolve(bankData.map(item => {
            let 
                varItem = varsObject[item.varName];
                
            return {
                data: varItem.process ? varItem.process(item.data) : item.data[0],
                translate: varItem.translate,
                default: varItem.default
            };
        }));
    }

    function fillData(varsObject) {
        return getData(varsObject)
                .catch((e) => console.log(e))
                .then((data) => processData(data, varsObject))
                .then((data) => {
                    if (IS_DEBUG) console.log(data);
                    $scope.contractData = data;
                });
    }

    function oracleData(res) {
        let oracle = res.data;

        return Promise.resolve({
            address: oracle[oraclesStruct.address],
            name: hexToString(oracle[oraclesStruct.name]),
            type: hexToString(oracle[oraclesStruct.type]),
            waitQuery: oracle[oraclesStruct.waitQuery],
            updateTime: toUnixtime(oracle[oraclesStruct.updateTime]),
            callbackTime: toUnixtime(oracle[oraclesStruct.callbackTime]),
            waiting: oracle[oraclesStruct.waitQuery],
            outdated: oracle[oraclesStruct.waitQuery] &&
                        (+oracle[oraclesStruct.updateTime] + ORACLE_ACTUAL < latestBlockTime),
            rate: normalizeRate(oracle[oraclesStruct.rate])
        });
    }

    function getOracle(number) {
        return getContractData("getOracleData", [number]).then(oracleData);
    }

    function fillOracles() {
        getContractData("oracleCount")
        .then((res) => {
            let 
                count = res.data[0],
                oraclePromise = [];
            for (let i=0; i<count; i++) oraclePromise.push(getOracle(i));
            return Promise.all(oraclePromise);
        })
        .then((result) => {
            $scope.oracles = result;
            $scope.loading = false;
            applyScope();
            
        })
    }

    fillData(varsObject);
    fillOracles();

};
module.exports = statusCtrl;