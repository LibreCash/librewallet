'use strict';
var bankStatusCtrl = function($scope, libreService, $translate) {
    var bankAddress = libreService.bank.address,
        getContractData = libreService.methods.getContractData,
        toUnixtime = libreService.methods.toUnixtime,
        normalizeRate = libreService.methods.normalizeRate,
        hexToString = libreService.methods.hexToString,
        stateName = libreService.methods.getStateName,
        balanceBank = 0,
        translateStatus = [
          'LIBRE_LOCKED',
          'LIBRE_PROCESSING_ORDERS',
          'LIBRE_WAIT_ORACLES',
          'LIBRE_CALC_RATES',
          'LIBRE_REQUEST_RATES'
        ];

    if (globalFuncs.getDefaultTokensAndNetworkType().networkType != libreService.networkType) {
        $translate("LIBREBUY_networkFail").then((msg) => {
            $scope.notifier.danger(msg);
        });
        return;
    }

    for(let i=0; i < translateStatus.length; i++) {
      $translate(translateStatus[i]).then(txt => translateStatus[i] = txt);
    }

    ajaxReq.getBalance(bankAddress, function(balanceData) {
        balanceBank = etherUnits.toEther(balanceData.data.balance, 'wei');
    });

    $scope.ajaxReq = ajaxReq;

    var oracles = {},
    varsObject = {
        tokenAddress: {
            default: "LibreCash",
            translate: "VAR_tokenAddress",
            process: data => {
              $scope.tokenAddress = data[0];
              return data[0];
            }
        },
        buyRate: {
            default: "Buy Rate",
            translate: "VAR_buyRate",
            process: (data)=>`${normalizeRate(data)} LIBRE/ETH`
        },
        sellRate: {
            default: "Sell Rate",
            translate: "VAR_sellRate",
            process: (data)=>`${normalizeRate(data)} LIBRE/ETH`
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
            process: data => translateStatus[data[0]]
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
            process: (tokens) => `${Math.round((tokens / Math.pow(10, libreService.coeff.tokenDecimals)) * 100)/100} LIBRE`
        }
    };
    
    $scope.address = bankAddress;
    $scope.tokenAddress = libreService.token.address;
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

    function getData(varsObject){
        let promises = Object.keys(varsObject).map((key)=>getContractData(key));
        return Promise.all(promises);
    }

    function processData(bankData,varsObject) {
        return Promise.resolve(bankData.map(item => {
            let 
                varItem = varsObject[item.varName];
                
            return {
                data:varItem.process? varItem.process(item.data) : item.data[0],
                translate:varItem.translate,
                default:varItem.default
            };
        }));
    }

    function fillData(varsObject) {
        return getData(varsObject)
                .catch((e)=>console.log(e))
                .then((data)=>processData(data,varsObject))
                .then((data)=>{
                    console.log(data);
                    $scope.contractData = data;
                });
    }

    function oracleData(res) {
        let oracle = res.data;

        return Promise.resolve({
            address:oracle[oraclesStruct.address],
            name: hexToString(oracle[oraclesStruct.name]),
            type: hexToString(oracle[oraclesStruct.type]),
            updateTime: toUnixtime(oracle[oraclesStruct.updateTime]),
            waiting: oracle[oraclesStruct.waitQuery],
            rate: `${normalizeRate(oracle[oraclesStruct.rate])} Libre/ETH`
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
            for(let i=0; i<count;i++) oraclePromise.push(getOracle(i));
            return Promise.all(oraclePromise);
        })
        .then((result)=>{
            console.log(result);
            $scope.oracles = result;
        })
    }

    fillData(varsObject);
    fillOracles();

};
module.exports = bankStatusCtrl;