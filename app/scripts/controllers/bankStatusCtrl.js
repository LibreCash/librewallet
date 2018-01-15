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
    function namehash(name) {
        name = ens.normalise(name);
        var node = Buffer.alloc(32);
        if (name && name != '') {
            var labels = name.split(".");
            for (var i = labels.length - 1; i >= 0; i--) {
                node = ethUtil.sha3(Buffer.concat([node, ethUtil.sha3(labels[i])]));
            }
        }
        return '0x' + node.toString('hex');
    }
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
        cryptoFiatRate: {
            default: "Nominal Tokens Rate",
            translate: "VAR_cryptoFiatRate",
            process: normalizeRate
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
    $scope.contractData = varsObject;
    $scope.address = bankAddress;
    $scope.oracles = oracles;

    // getting oracles
    function getBankData(bankAbiRefactor, varsObject, _var) {
        ajaxReq.getEthCall({ to: bankAddress, data: getDataString(bankAbiRefactor[_var], [namehash(_var)]) }, function(data) {
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
    async function getBankDataAsync(bankAbiRefactor, _var, param) {
        return new Promise((resolve, reject) => { 
            ajaxReq.getEthCall({ to: bankAddress, data: getDataString(bankAbiRefactor[_var], [param]) }, function(data) {
                if (data.error || data.data == '0x') {
                    reject(data.message);
                } else {
                    var outTypes = bankAbiRefactor[_var].outputs.map(function(i) {
                        return i.type;
                    });
                    data.data = ethUtil.solidityCoder.decodeParams(outTypes, data.data.replace('0x', ''));
                    resolve(data.data);
                }
            });
        })
    }

    for (var prop in varsObject) {
        let dataVar = prop;
        getBankData(bankAbiRefactor, varsObject, dataVar);
        
    } // for
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
    let curOracle = await getBankDataAsync(bankAbiRefactor, "firstOracle", 0);
    for (
        let curData = await getBankDataAsync(bankAbiRefactor, "getOracleData", curOracle);
        ;
        curOracle = curData[ORACLE_NEXT],
        curData = await getBankDataAsync(bankAbiRefactor, "getOracleData", curOracle)
    ) {
        oracles[curOracle] = {
            name: hex2a(curData[ORACLE_NAME]),
            type: hex2a(curData[ORACLE_TYPE]),
            updateTime: normalizeUnixTime(curData[ORACLE_UPDATE_TIME]),
            enabled: curData[ORACLE_ENABLED],
            waiting: curData[ORACLE_WAITING],
            rate: normalizeRate(curData[ORACLE_RATE])
        };
        if(+curData[ORACLE_NEXT] == 0) break;   
    }    
};
module.exports = bankStatusCtrl;