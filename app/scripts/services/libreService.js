'use strict';
var libreService = function(walletService) {
    var libreBank = nodes.nodeList.rin_ethscan.abiList.find(contract => contract.name == "LibreBank");
    var bankAddress = libreBank.address;
    var bankAbi = libreBank.abi;
    var bankAbiRefactor = {};    
    for (var i = 0; i < bankAbi.length; i++) bankAbiRefactor[bankAbi[i].name] = bankAbi[i];

    var libreCash = nodes.nodeList.rin_ethscan.abiList.find(contract => contract.name == "LibreCash");
    var cashAddress = libreCash.address;
    var cashAbi = libreCash.abi;
    var cashAbiRefactor = {};    
    for (var i = 0; i < cashAbi.length; i++) cashAbiRefactor[cashAbi[i].name] = cashAbi[i];

    const RATE_MULTIPLIER = 1000;
    const TOKEN_DECIMALS = 18;
    const GAS_EMISSION = 300000,
          GAS_REMISSION = 300000,
          GAS_APPROVE = 70000,
          GAS_WITHDRAW = 100000;

    var getDataString = function(func, inputs) {
        var fullFuncName = ethUtil.solidityUtils.transformToFullName(func);
        var funcSig = ethFuncs.getFunctionSignature(fullFuncName);
        var typeName = ethUtil.solidityUtils.extractTypeName(fullFuncName);
        var types = typeName.split(',');
        types = types[0] == "" ? [] : types;
        return '0x' + funcSig + ethUtil.solidityCoder.encodeParams(types, inputs);
    };

    function getDataCommon(address, abiRefactored, _var, process, transactionParams, processParam) {
        return new Promise((resolve, reject) => {
            ajaxReq.getEthCall({
                from: walletService.wallet == null ? null : walletService.wallet.getAddressString(),
                to: address,
                data: getDataString(abiRefactored[_var], transactionParams)
            }, function(data) {
                if (data.error || data.data == '0x') {
                    if (data.data == '0x') {
                        data.error = true;
                        data.message = "Possible error with network or the bank contract";
                    }
                } else {
                    var outTypes = abiRefactored[_var].outputs.map(function(i) {
                        return i.type;
                    });
                    data.data = ethUtil.solidityCoder.decodeParams(outTypes, data.data.replace('0x', ''));
                }
                process(data, processParam);
            });
        })
    }

    function getDataProcess(address, abiRefactored, _var, process, params = []) {
        return getDataCommon(address, abiRefactored, _var, process, params, "");
    }

    function getBankDataProcess(_var, process, params = []) {
        return getDataProcess(bankAddress, bankAbiRefactor, _var, process, params);
    }

    function getCashDataProcess(_var, process, params = []) {
        return getDataProcess(cashAddress, cashAbiRefactor, _var, process, params);
    }

    async function getDataAsync(address, abiRefactored, _var, params = []) {
        return new Promise((resolve, reject) => { 
            ajaxReq.getEthCall({
                from: walletService.wallet == null ? null : walletService.wallet.getAddressString(),
                to: address,
                data: getDataString(abiRefactored[_var], params)
            }, function(data) {
                data.varName = _var;
                if (data.error || data.data == '0x') {
                    if (data.data == '0x') {
                        data.error = true;
                        data.message = "Possible error with network or the bank contract";
                    }
                } else {
                    var outTypes = abiRefactored[_var].outputs.map(function(i) {
                        return i.type;
                    });
                    data.data = ethUtil.solidityCoder.decodeParams(outTypes, data.data.replace('0x', ''));
                }
                data.params = params;
                resolve(data);
            });
        })
    }

    async function getBankDataAsync(_var, params = []) {
        return getDataAsync(bankAddress, bankAbiRefactor, _var, params);
    }

    async function getCashDataAsync(_var, params = []) {
        return getDataAsync(cashAddress, cashAbiRefactor, _var, params);
    }

    function setScope(_scope, _value, _key) {
        _scope[_key] = _value.data[0];
    }

    function getDataScope(_scope, address, abiRefactored, _var, _key, params = []) {
        return getDataCommon(_scope, address, abiRefactored, _var, setScope, params, _key);
    }

    async function getBankDataScope(_scope, _var, _key, params = []) {
        return getDataScope(_scope, bankAddress, bankAbiRefactor, _var, _key, params);
    }

    async function getCashDataScope(_scope, _var, _key, params = []) {
        return getDataScope(_scope, cashAddress, cashAbiRefactor, _var, _key, params);
    }

    var normalizeUnixTime = function(data) {
        var date = new Date(data * 1000);
        return date.toLocaleString();
    },
    normalizeRate = function(data) {
        return data / RATE_MULTIPLIER;
    },
    hexToString = function(_hex) {
        var hex = _hex.toString();//force conversion
        var str = '';
        for (var i = 2; i < hex.length; i += 2) {
            if (hex.substr(i, 2) !== "00") {
                str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
            }
        }
        return str;
    },
    getStateName = function(data) { 
        var states = ['REQUEST_UPDATE_RATES', 'CALC_RATE', 'PROCESS_ORDERS', 'ORDER_CREATION'];
        try {
            return states[data];
        } catch(e) {
            return e.message;
        }
    },
    fillStateData = function(_data) { 
        try {
            var stateName = getStateName(_data.data[0]);
            _data.data.push(stateName);
            return _data;
        } catch(e) {
            return {error: true, message: e.message};
        }
    }

    var universalTxCallback = function(_scope, pendingVarName, opPrefix, translator, updater) {
        _scope[pendingVarName] = true;
        try {
            if (_scope.wallet == null) throw globalFuncs.errorMsgs[3];
            else if (!globalFuncs.isNumeric(_scope.tx.gasLimit) || parseFloat(_scope.tx.gasLimit) <= 0) throw globalFuncs.errorMsgs[8];
            ajaxReq.getTransactionData(_scope.wallet.getAddressString(), function(data) {
                try {
                    if (data.error) {
                        throw(data.msg);
                    }
                    var txData = uiFuncs.getTxData(_scope);
                    uiFuncs.generateTx(txData, function(rawTx) {
                        if (rawTx.isError) {
                            _scope[pendingVarName] = false;
                            _scope.notifier.danger(rawTx.error);
                            return;
                        }
                        _scope.rawTx = rawTx.rawTx;
                        _scope.signedTx = rawTx.signedTx;
                        console.log(_scope.signedTx);
                        uiFuncs.sendTx(_scope.signedTx, function(resp) {
                            if (resp.isError) {
                                _scope.notifier.danger(resp.error);
                                _scope[pendingVarName] = false;
                                return;
                            }
                            var checkTxLink = "https://www.myetherwallet.com?txHash=" + resp.data + "#check-tx-status";
                            var txHashLink = _scope.ajaxReq.blockExplorerTX.replace("[[txHash]]", resp.data);
                            var verifyTxBtn = _scope.ajaxReq.type != nodes.nodeTypes.Custom ? '<a class="btn btn-xs btn-info" href="' + txHashLink + '" class="strong" target="_blank" rel="noopener noreferrer">Verify Transaction</a>' : '';
                            var checkTxBtn = '<a class="btn btn-xs btn-info" href="' + checkTxLink + '" target="_blank" rel="noopener noreferrer"> Check TX Status </a>';
                            var completeMsg = '<p>' + globalFuncs.successMsgs[2] + '<strong>' + resp.data + '</strong></p><p>' + verifyTxBtn + ' ' + checkTxBtn + '</p>';
                            _scope.notifier.success(completeMsg, 0);
                            
                            _scope.wallet.setBalance(function() {
                                if (!_scope.$$phase) _scope.$apply();
                            });

                            var isCheckingTx = false,
                            checkingTx = setInterval(() => {
                                if (!_scope[pendingVarName]) {
                                    clearInterval(checkingTx);
                                    return;
                                }
                                if (isCheckingTx) return; // fixing doubling success messages
                                isCheckingTx = true;
                                ajaxReq.getTransactionReceipt(resp.data, async (receipt) => {
                                    if (receipt.error) {
                                        _scope[pendingVarName] = false;
                                        _scope.notifier.danger(receipt.msg);
                                    } else {
                                        if (receipt.data == null) {
                                            isCheckingTx = false;
                                            return; // next interval
                                        }
                                        _scope[pendingVarName] = false;
                                        if (receipt.data.status == "0x1") {
                                            _scope.notifier.success(await translator("LIBRE" + opPrefix + "_txOk"), 0);
                                            updater();
                                        } else {
                                            _scope.notifier.danger(await translator("LIBRE" + opPrefix + "_txFail"), 0);
                                        }
                                        _scope[pendingVarName] = false;
                                    }
                                    isCheckingTx = false;
                                });
                            }, 2000);
                        });
                    });
                } catch (e) {
                    _scope[pendingVarName] = false;
                    _scope.notifier.danger(e);
                }
            });
        } catch (e) {
            _scope[pendingVarName] = false;
            _scope.notifier.danger(e);
        }
    }


    return {
        bank: {
            address: bankAddress,
            abi: bankAbiRefactor
        },
        token: {
            address: cashAddress,
            abi: cashAbiRefactor
        },
        coeff: {
            rateMultiplier: RATE_MULTIPLIER,
            tokenDecimals: TOKEN_DECIMALS,
            gasEmission: GAS_EMISSION,
            gasRemission: GAS_REMISSION,
            gasApprove: GAS_APPROVE,
            gasWithdraw: GAS_WITHDRAW
        },
        methods: {
            getDataString: getDataString,
            getBankDataProcess: getBankDataProcess,
            getCashDataProcess: getCashDataProcess,
            getBankDataAsync: getBankDataAsync,
            getCashDataAsync: getCashDataAsync,
            getBankDataScope: getBankDataScope,
            getCashDataScope: getCashDataScope,
            normalizeUnixTime: normalizeUnixTime,
            normalizeRate: normalizeRate,
            hexToString: hexToString,
            getStateName: getStateName,
            fillStateData: fillStateData,
            universalTxCallback: universalTxCallback
        },
        networkType: "rinkeby"
    }
};
module.exports = libreService;