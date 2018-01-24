'use strict';
var bankStatusCtrl = async function($scope) {
    var libreBank = nodes.nodeList.rin_ethscan.abiList.find(contract => contract.name == "LibreBank");
    var bankAddress = libreBank.address;
    var bankAbi = libreBank.abi;
    $scope.ajaxReq = ajaxReq;


// нужно рефакторнуть аби, чтобы оборащаться к нему, как сделано в ens
    var bankAbiRefactor = {};
    for (var i = 0; i < bankAbi.length; i++) bankAbiRefactor[bankAbi[i].name] = bankAbi[i];
// далее три функции из ens
    var normalise = function(name) {
        try {
            return uts46.toUnicode(name, { useStd3ASCII: true, transitional: false });
        } catch (e) {
            throw e;
        }
    };
    var getDataString = function(func, inputs) {
        var fullFuncName = ethUtil.solidityUtils.transformToFullName(func);
        var funcSig = ethFuncs.getFunctionSignature(fullFuncName);
        var typeName = ethUtil.solidityUtils.extractTypeName(fullFuncName);
        var types = typeName.split(',');
        types = types[0] == "" ? [] : types;
        return '0x' + funcSig + ethUtil.solidityCoder.encodeParams(types, inputs);
    };

    // ну и получаем инфу
    const rateMultiplier = 1000; // const from smart-contract
    var oracles = {},
    normalizeRate = function(data) {
        return data / rateMultiplier;
    },
    normalizeUnixTime = function(data) {
        var date = new Date(data * 1000);
        return date.toLocaleString();
    },
    varsObject = {
        tokenAddress: {
            default: "LibreCash Contract",
            translate: "VAR_tokenAddress"
        },
/*        cryptoFiatRate: {
            default: "Nominal Tokens Rate",
            translate: "VAR_cryptoFiatRate",
            process: normalizeRate
        },*/
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
            process: function(data) { 
                var states = ['REQUEST_UPDATE_RATES', 'CALC_RATE', 'PROCESS_ORDERS', 'ORDER_CREATION'];
                try {
                    return states[data];
                } catch(e) {
                    return e.message;
                }
            }
        }
    }
    
    $scope.address = bankAddress;
    $scope.oracles = oracles;

    // getting oracles
    function getBankData(bankAbiRefactor, varsObject, _var) {
        ajaxReq.getEthCall({ to: bankAddress, data: getDataString(bankAbiRefactor[_var], []) }, function(data) {
            if (data.error || data.data == '0x') {
                varsObject[_var].data = data;
            } else {
                var outTypes = bankAbiRefactor[_var].outputs.map(function(i) {
                    return i.type;
                });
                data.data = ethUtil.solidityCoder.decodeParams(outTypes, data.data.replace('0x', ''))[0];
                if (varsObject[_var].process != null) {
                    data.data = varsObject[_var].process(data.data);
                }
                varsObject[_var].data = data;
            }
        });
    }
    async function getBankDataAsync(bankAbiRefactor, _var, params = []) {
        return new Promise((resolve, reject) => {
            ajaxReq.getEthCall({
                to: bankAddress,
                data: getDataString(bankAbiRefactor[_var], params)
            }, function(data) {
                data.varName = _var;
                if (data.error || data.data == '0x') {
                    reject(data.message);
                } else {
                    var outTypes = bankAbiRefactor[_var].outputs.map(function(i) {
                        return i.type;
                    });
                    data.data = ethUtil.solidityCoder.decodeParams(outTypes, data.data.replace('0x', ''));
                    resolve(data);
                }
            });
        })
    }

/*    for (var prop in varsObject) {
        let dataVar = prop;
        getBankData(bankAbiRefactor, varsObject, dataVar);
        
    } // for */
    var bankPromises = [];
    for (var prop in varsObject) {
        let bankPromise = getBankDataAsync(bankAbiRefactor, prop);
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
    // getting oracles
    function hex2a(hexx) {
        var hex = hexx.toString();//force conversion
        var str = '';
        for (var i = 2; i < hex.length; i += 2) {
            if (hex.substr(i, 2) !== "00") {
                str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
            }
        }
        return str;
    }
    const 
        ORACLE_NAME = 0,
        ORACLE_TYPE = 1,
        ORACLE_UPDATE_TIME = 2,
        ORACLE_ENABLED = 3,
        ORACLE_WAITING = 4,
        ORACLE_RATE = 5,
        ORACLE_NEXT = 6;
    let curOracle = await getBankDataAsync(bankAbiRefactor, "firstOracle");
    /*let curData = await getBankDataAsync(bankAbiRefactor, "getOracleData", curOracle.data);
    curOracle.data[0] = curData.data[ORACLE_NEXT];
    console.log(curOracle);
        curData = await getBankDataAsync(bankAbiRefactor, "getOracleData", curOracle.data);
        console.log(curData);*/
    for (
        let curData = await getBankDataAsync(bankAbiRefactor, "getOracleData", curOracle.data);
        ;
        curOracle.data[0] = curData.data[ORACLE_NEXT],
        curData = await getBankDataAsync(bankAbiRefactor, "getOracleData", curOracle.data)
    ) {
        oracles[curOracle.data[0]] = {
            name: hex2a(curData.data[ORACLE_NAME]),
            type: hex2a(curData.data[ORACLE_TYPE]),
            updateTime: normalizeUnixTime(curData.data[ORACLE_UPDATE_TIME]),
            enabled: curData.data[ORACLE_ENABLED],
            waiting: curData.data[ORACLE_WAITING],
            rate: normalizeRate(curData.data[ORACLE_RATE])
        };
        if(+curData.data[ORACLE_NEXT] == 0) break;   
    }   
};
module.exports = bankStatusCtrl;