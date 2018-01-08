'use strict';
var bankStatusCtrl = function($scope) {
    let libreData = nodes.nodeList.rin_ethscan.libre;
    let bankAbi = libreData.libreBank.abi,
        bankAddress = libreData.libreBank.address;


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
    var varsObject = {
        tokenAddress: {
            default: "LibreCash Contract",
            translate: "VAR_tokenAddress"
        },
        cryptoFiatRate: {
            default: "Nominal Tokens Rate",
            translate: "VAR_cryptoFiatRate"
        },
        cryptoFiatRateBuy: {
            default: "Buy Tokens Rate"
        },
        cryptoFiatRateSell: {
            default: "Sell Tokens Rate"
        },
        buyFee: {
            default: "Buy Fee"
        },
        sellFee: {
            default: "Sell Fee"
        },
        getBuyOrdersCount: {
            default: "Buy Orders Count"
        },
        getSellOrdersCount: {
            default: "Sell Orders Count"
        },
        numEnabledOracles: {
            default: "Enabled Oracle Count"
        },
        numReadyOracles: {
            default: "Ready Oracle Count"
        },
        countOracles: {
            default: "All Oracle Count"
        },
        relevancePeriod: {
            default: "Emission Period in seconds"
        },
        queuePeriod: {
            default: "Queue Updating max Period in seconds"
        },
        timeUpdateRequest: {
            default: "Time update requests were sent (unix time)"
        },
        contractState: {
            default: "State of the contract",
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

    for (var prop in varsObject) {
        let dataVar = prop;
        ajaxReq.getEthCall({ to: bankAddress, data: getDataString(bankAbiRefactor[dataVar], [namehash(dataVar)]) }, function(data) {
            if (data.error || data.data == '0x') {
                //if (!data.error)
                varsObject[dataVar].data = data;
            } else {
                var outTypes = bankAbiRefactor[dataVar].outputs.map(function(i) {
                    return i.type;
                });
                data.data = ethUtil.solidityCoder.decodeParams(outTypes, data.data.replace('0x', ''))[0];
                if (varsObject[dataVar].process != null) {
                    data.data = varsObject[dataVar].process(data.data);
                    //
                }
                varsObject[dataVar].data = data;
            }
        });
    } // for
    $scope.contractData = varsObject;

    $scope.address = bankAddress;
    
};
module.exports = bankStatusCtrl;